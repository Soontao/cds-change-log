/* eslint-disable max-len */
import { ACTIONS, ANNOTATE_CHANGELOG_ENABLED, CHANGELOG_NAMESPACE, ENTITIES } from "./constants";
import { ChangeLogExtensionContext } from "./extension";
import { defaultStringOrNull } from "./utils";


export function isChangeLogEnabled(def: any) {
  if (def !== undefined) {
    return ANNOTATE_CHANGELOG_ENABLED in def && def[ANNOTATE_CHANGELOG_ENABLED] === true;
  }
  return false;
}

/**
 * extract key names from entity definition
 * 
 * @param entityDef 
 * @returns 
 */
export function extractKeyNamesFromEntity(entityDef: any) {
  // TODO: concern about multi key in single entity
  return Object
    .entries(entityDef?.elements ?? [])
    .filter(([_, value]) => (value as any)?.key)
    .map(([key, _]) => key);
}

export function extractChangeAwareElements(entityDef: any): Array<string> {
  return Object
    .entries(entityDef?.elements)
    .filter(([_, value]) => (value as any)?.[ANNOTATE_CHANGELOG_ENABLED] === true).map(([key]) => key);
}

export function isChangeLogInternalEntity(name: string = "") {
  return name.startsWith(CHANGELOG_NAMESPACE);
}

export function extractEntityNameFromQuery(query: any): string {
  return query?.INSERT?.into ?? query?.UPDATE?.entity ?? query?.DELETE?.from;
}


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
  keyNames: Array<string>,
  elementsKeys: Array<string>,
  extension: ChangeLogExtensionContext,
  original?: any,
  change?: any
) => {
  const keyName = keyNames[0];
  const keyType = entityDef.elements[keyName].type;
  
  // TODO: check key type is match between change and the field of 'ChangeLog' entity
  const changeLogKeyName = extension.findKeyByType(keyType);

  if (changeLogKeyName === undefined) {
    throw new TypeError(`${entityName}.${keyName} with type (${keyType}), which not have found a correct 'entityKey' element in 'ChangeLog' entity`);
  }

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

  return {
    entityName,
    [changeLogKeyName]: change?.[keyNames[0]] ?? original?.[keyNames[0]],
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

            const entityPrimaryKeys = extractKeyNamesFromEntity(entityDef);

            const changeLogs: any[] = [];
            const findQuery = SELECT.from(entityName).columns(...entityPrimaryKeys, ...elementsKeys);
            const where = query?.DELETE?.where ?? query?.UPDATE?.where;

            if (where !== undefined) { findQuery.where(where); }

            switch (req.event) {
              case "CREATE":
                const data: Array<any> = req.data instanceof Array ? req.data : [req.data];
                data.forEach(change => changeLogs.push(buildChangeLog(entityDef, entityName, entityPrimaryKeys, elementsKeys, extension, undefined, change)));
                break;
              case "DELETE":
                await db.foreach(findQuery, (original: any) => changeLogs.push(buildChangeLog(entityDef, entityName, entityPrimaryKeys, elementsKeys, extension, original)));
                break;
              case "UPDATE":
                await db.foreach(findQuery, (original: any) => changeLogs.push(buildChangeLog(entityDef, entityName, entityPrimaryKeys, elementsKeys, extension, original, req.data)));
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
