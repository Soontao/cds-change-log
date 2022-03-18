/* eslint-disable max-len */
import { buildChangeLog } from "./changeLog";
import { ENTITIES } from "./constants";
import { ChangeLogContext } from "./context";
import { extractChangeAwareElements, extractKeyNamesFromEntity, isChangeLogEnabled, isChangeLogInternalEntity } from "./entity";
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

    const elementsKeys = extractChangeAwareElements(entityDef);

    // TODO: check the target entity must have at least one key
    const entityPrimaryKeys = extractKeyNamesFromEntity(entityDef);

    const changeLogs: any[] = [];
    // query for UPDATE/DELETE
    const originalDataQuery = SELECT.from(entityName).columns(...entityPrimaryKeys, ...elementsKeys);
    const where = query?.DELETE?.where ?? query?.UPDATE?.where;

    // if there have `where` condition on inbound query, copy it to original data query
    if (where !== undefined) { originalDataQuery.where(where); }

    switch (req.event) {
      case "CREATE":
        const data: Array<any> = req.data instanceof Array ? req.data : [req.data];
        data.forEach(change => changeLogs.push(buildChangeLog(entityDef, entityName, elementsKeys, context, undefined, change)));
        break;
      case "DELETE":
        await db.foreach(originalDataQuery, (original: any) => changeLogs.push(buildChangeLog(entityDef, entityName, elementsKeys, context, original)));
        break;
      case "UPDATE":
        await db.foreach(originalDataQuery, (original: any) => changeLogs.push(buildChangeLog(entityDef, entityName, elementsKeys, context, original, req.data)));
        break;
      default:
        break;
    }

    if (changeLogs.length > 0) {
      const insertions = INSERT.into(ENTITIES.CHANGELOG).entries(...changeLogs);
      return next().then((result) => db.run(insertions).then(() => result));
    }
    return next();
  };
}