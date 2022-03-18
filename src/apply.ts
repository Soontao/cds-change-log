/* eslint-disable max-len */
import { ACTIONS, ENTITIES } from "./constants";
import { extractChangeAwareElements, extractKeyNamesFromEntity, isChangeLogEnabled, isChangeLogInternalEntity } from "./entity";
import { ChangeLogExtensionContext } from "./extension";
import { extractEntityNameFromQuery } from "./query";
import { defaultStringOrNull } from "./utils";



/**
 * build change log object from data
 * 
 * @internal
 * @private
 * @param entityDef entity def
 * @param keyNames keys of entity
 * @param elementsKeys columns of entity
 * @param original original value in db, optional
 * @param change change value from requests, optional
 * @returns 
 */
const buildChangeLog = (
  entityDef: any,
  entityName: string,
  elementsKeys: Array<string>,
  extension: ChangeLogExtensionContext,
  original?: any,
  change?: any
) => {

  let action: string | undefined;
  if (original === undefined && change !== undefined) {
    action = ACTIONS.Create;
  }
  if (original !== undefined && change === undefined) {
    action = ACTIONS.Delete;
  }
  if (original !== undefined && change !== undefined) {
    action = ACTIONS.Update;
  }


  if (action === undefined) {
    throw new TypeError("require original data or change data at least");
  }

  // support multi keys
  const keys = extension
    .extractKeyMappingFromEntity(entityDef)
    .reduce((pre: any, cur) => {
      const [changeLogKeyName, targetEntityKeyName] = cur;
      pre[changeLogKeyName] = change?.[targetEntityKeyName] ?? original?.[targetEntityKeyName];
      return pre;
    }, {});

  return {
    ...keys,
    entityName,
    action,
    Items: elementsKeys
      .map(
        (key) => {
          let attributeNewValue = null;
          let attributeOldValue = null;
          switch (action) {
            case ACTIONS.Create:
              attributeNewValue = defaultStringOrNull(change[key]);
              break;
            case ACTIONS.Delete:
              attributeOldValue = defaultStringOrNull(original[key]);
              break;
            case ACTIONS.Update:
              attributeNewValue = defaultStringOrNull(change[key]);
              attributeOldValue = defaultStringOrNull(original[key]);
            default:
              break;
          }

          return {
            sequence: 0,
            attributeKey: key,
            attributeNewValue,
            attributeOldValue,
          };
        }
      )
      .filter(item => item.attributeNewValue !== item.attributeOldValue)
      .map((item, idx) => {
        item.sequence = idx;
        return item;
      })
  };
};

/**
 * apply change log 
 * 
 * @param cds cds facade
 */
export function applyChangeLog(cds: any) {
  const { INSERT, SELECT } = cds.ql;
  cds.on("served", async () => {
    const db = await cds.connect.to("db");
    if (ENTITIES.CHANGELOG in cds?.model?.definitions) {
      const modelChangeLog = cds.model.definitions[ENTITIES.CHANGELOG];
      const extension = new ChangeLogExtensionContext(modelChangeLog);

      db.prepend((srv: any) => {
        srv.on(
          ["CREATE", "UPDATE", "DELETE"],
          async function changeLogHandler(req: any, next: () => Promise<any>) {
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
            if (elementsKeys.length === 0) {
              return next();
            }

            // TODO: check the target entity must have at least one key
            const entityPrimaryKeys = extractKeyNamesFromEntity(entityDef);

            const changeLogs: any[] = [];
            const findQuery = SELECT.from(entityName).columns(...entityPrimaryKeys, ...elementsKeys);
            const where = query?.DELETE?.where ?? query?.UPDATE?.where;

            if (where !== undefined) { findQuery.where(where); }

            switch (req.event) {
              case "CREATE":
                const data: Array<any> = req.data instanceof Array ? req.data : [req.data];
                data.forEach(change => changeLogs.push(buildChangeLog(entityDef, entityName, elementsKeys, extension, undefined, change)));
                break;
              case "DELETE":
                await db.foreach(findQuery, (original: any) => changeLogs.push(buildChangeLog(entityDef, entityName, elementsKeys, extension, original)));
                break;
              case "UPDATE":
                await db.foreach(findQuery, (original: any) => changeLogs.push(buildChangeLog(entityDef, entityName, elementsKeys, extension, original, req.data)));
                break;
              default:
                break;
            }

            if (changeLogs.length > 0) {
              return next()
                .then((result) => db.run(
                  INSERT
                    .into(ENTITIES.CHANGELOG)
                    .entries(...changeLogs)
                ).then(() => result));
            }
            return next();
          });
      });
    } else {
      // TODO: log that change log is not included in model
    }

  });
}
