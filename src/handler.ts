/* eslint-disable max-len */
import { buildChangeLog } from "./changeLog";
import { ENTITIES } from "./constants";
import { ChangeLogContext } from "./context";
import { extractChangeAwareElements, extractKeyNamesFromEntity, isChangeLogEnabled, isChangeLogInternalEntity } from "./entity";
import { ChangeLogError } from "./error";
import { extractEntityNameFromQuery } from "./query";


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

    let changeLogs: any[] = [];

    const insertions: Array<Promise<void>> = [];

    const saveChangeLog = (log: any) => {
      changeLogs.push(log);
      if (changeLogs.length > 100) {
        insertions.push(db.run(INSERT.into(ENTITIES.CHANGELOG).entries(...changeLogs)).then(() => undefined));
        changeLogs = [];
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
        data.forEach(change => saveChangeLog(buildChangeLog(entityDef, context, undefined, change)));
        break;
      case "DELETE":
        await db.foreach(originalDataQuery, (original: any) => saveChangeLog(buildChangeLog(entityDef, context, original)));
        break;
      case "UPDATE":
        await db.foreach(originalDataQuery, (original: any) => saveChangeLog(buildChangeLog(entityDef, context, original, req.data)));
        break;
      default:
        break;
    }

    if (changeLogs.length > 0) {
      insertions.push(INSERT.into(ENTITIES.CHANGELOG).entries(...changeLogs));
    }

    if (insertions.length > 0) {
      await Promise.all(insertions);
    }

    return next();
  };
}
