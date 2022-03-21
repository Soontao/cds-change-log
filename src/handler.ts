/* eslint-disable max-len */
import { buildChangeLog } from "./changeLog";
import { ENTITIES } from "./constants";
import { ChangeLogContext } from "./context";
import { extractChangeAwareElements, extractKeyNamesFromEntity, isChangeLogEnabled, isChangeLogInternalEntity } from "./entity";
import { ChangeLogError } from "./error";
import { createLocalizedDataQueryForOriginal, extractEntityNameFromQuery } from "./query";


export function createChangeLogHandler(cds: any, db: any) {

  const { INSERT, SELECT } = cds.ql;
  const context = new ChangeLogContext(cds.model.definitions[ENTITIES.CHANGELOG]);

  return async function changeLogHandler(req: any, next: () => Promise<any>) {
    const { query } = req;

    const entityName = extractEntityNameFromQuery(query);
    if (entityName === undefined || isChangeLogInternalEntity(entityName)) {
      return next();
    }

    const entityDef = cds.model.definitions[entityName];
    if (entityDef === undefined || !isChangeLogEnabled(entityDef)) {
      return next();
    }

    const targetEntityElements = extractChangeAwareElements(entityDef);

    const entityPrimaryKeys = extractKeyNamesFromEntity(entityDef);

    if (entityPrimaryKeys.length === 0) {
      throw new ChangeLogError(`entity '${entityName}' must have at least one primary key for change log`);
    }

    let changeLogPromises: Promise<any>[] = [];

    const batches: Array<Promise<void>> = [];

    /**
     * queue change log to an in memory queue, and perform batch insert later
     * 
     * @param log 
     */
    const queueChangeLog = async (log: any) => {
      changeLogPromises.push(log);
      if (changeLogPromises.length >= 100) { await saveChangeLog(); }
    };

    /**
     * save change log to the database
     */
    const saveChangeLog = async () => {
      if (changeLogPromises.length > 0) {
        const [...tmpPromises] = changeLogPromises;
        changeLogPromises = [];
        const changeLogEntries = await Promise.all(tmpPromises);
        batches.push(
          db
            .run(INSERT.into(ENTITIES.CHANGELOG).entries(...changeLogEntries))
            .then(() => undefined)
        );
      }
    };

    // query for UPDATE/DELETE
    const originalDataQuery = SELECT.from(entityName).columns(...entityPrimaryKeys, ...targetEntityElements.map(ele => ele.name));

    const where = query?.DELETE?.where ?? query?.UPDATE?.where;

    // if there have `where` condition on inbound query, copy it to original data query
    if (where !== undefined) { originalDataQuery.where(where); }

    switch (req.event) {
      case "CREATE":
        const data: Array<any> = req.data instanceof Array ? req.data : [req.data];
        data.forEach(change => queueChangeLog(buildChangeLog(entityDef, context, undefined, change)));
        break;
      case "DELETE":
        await db.foreach(originalDataQuery, (original: any) => queueChangeLog(
          buildChangeLog(
            entityDef,
            context,
            original,
            undefined,
            createLocalizedDataQueryForOriginal(entityDef, original))
        )
        );
        break;
      case "UPDATE":
        await db.foreach(originalDataQuery, (original: any) => queueChangeLog(
          buildChangeLog(
            entityDef,
            context,
            original,
            req.data,
            createLocalizedDataQueryForOriginal(entityDef, original)
          )
        ));
        break;
      default:
        break;
    }

    await saveChangeLog();

    if (batches.length > 0) { await Promise.all(batches); }

    return next();
  };
}
