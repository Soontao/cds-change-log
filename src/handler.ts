/* eslint-disable max-len */
import { buildChangeLog } from "./changeLog";
import { ENTITIES } from "./constants";
import { ChangeLogContext } from "./context";
import { extractChangeAwareElements, extractKeyNamesFromEntity, isChangeLogEnabled, isChangeLogInternalEntity } from "./entity";
import { ChangeLogError } from "./error";
import { extractEntityFromQuery } from "./query";


export function createChangeLogHandler(cds: any, db: any) {

  const { INSERT, SELECT } = cds.ql;
  const context = new ChangeLogContext(cds.model.definitions[ENTITIES.CHANGELOG]);

  return async function changeLogHandler(req: any, next: () => Promise<any>) {
    const { query } = req;

    const entity = extractEntityFromQuery(query); // it could be entityName or ref objects
    const entityName = typeof entity === "string" ? entity : entity.ref[0]; // TODO: warning when other cases
    
    if (entityName === undefined || isChangeLogInternalEntity(entityName)) {
      return next();
    }

    const entityDef = cds.model.definitions[entityName];
    if (entityDef === undefined || !isChangeLogEnabled(entityDef)) {
      return next();
    }

    const entityChangeLogElementKeys = extractChangeAwareElements(entityDef).map(ele => ele.name);

    const entityPrimaryKeys = extractKeyNamesFromEntity(entityDef);

    if (entityPrimaryKeys.length === 0) {
      throw new ChangeLogError(`entity '${entityName}' must have at least one primary key for change log`);
    }

    let queuedChangeLogs: Array<any> = [];

    const batches: Array<Promise<void>> = [];

    /**
     * queue change log to an in memory queue, and perform batch insert later
     * 
     * @param log 
     */
    const queueChangeLog = async (log: any) => {
      queuedChangeLogs.push(log);
      if (queuedChangeLogs.length >= 100) { await saveChangeLog(); }
    };

    /**
     * save change log to the database
     */
    const saveChangeLog = async () => {
      if (queuedChangeLogs.length > 0) {
        const [...tmpChangeLogs] = queuedChangeLogs;
        queuedChangeLogs = [];
        batches.push(
          db
            .run(INSERT.into(ENTITIES.CHANGELOG).entries(...tmpChangeLogs))
            .then(() => undefined)
        );
      }
    };

    // query for UPDATE/DELETE
    const originalDataQuery = SELECT.from(entity).columns(...entityPrimaryKeys, ...entityChangeLogElementKeys);

    const where = query?.DELETE?.where ?? query?.UPDATE?.where;

    // if there have `where` condition on inbound query, copy it to original data query
    if (where !== undefined) { originalDataQuery.where(where); }

    switch (req.event) {
      case "CREATE":
        const data: Array<any> = req.data instanceof Array ? req.data : [req.data];
        data.forEach(change => queueChangeLog(buildChangeLog(entityDef, context, undefined, change)));
        break;
      case "DELETE":
        await db.foreach(originalDataQuery, (original: any) => queueChangeLog(buildChangeLog(
          entityDef,
          context,
          original,
          undefined,
        )));
        break;
      case "UPDATE":
        await db.foreach(originalDataQuery, (original: any) => queueChangeLog(buildChangeLog(
          entityDef,
          context,
          original,
          req.data,
        )));
        break;
      default:
        break;
    }

    await saveChangeLog();

    if (batches.length > 0) { await Promise.all(batches); }

    return next();
  };
}
