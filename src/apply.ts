import { ANNOTATE_CHANGELOG_ENABLED, CHANGELOG_NAMESPACE, ENTITIES } from "./constants";
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
 * @param cdsEntityName entity name
 * @param keyNames keys of entity
 * @param elementsKeys columns of entity
 * @param original original value in db, optional
 * @param change change value from requests, optional
 * @returns 
 */
const buildChangeLog = (cdsEntityName: string, keyNames: Array<string>, elementsKeys: Array<string>, original?: any, change?: any) => {
  let changeLogAction: string | undefined;
  if (original === undefined && change !== undefined) {
    changeLogAction = "Create"
  }
  if (original !== undefined && change === undefined) {
    changeLogAction = "Delete"
  }
  if (original !== undefined && change !== undefined) {
    changeLogAction = "Update"
  }


  if (changeLogAction === undefined) {
    throw new TypeError("require original data or change data at least")
  }

  return {
    cdsEntityName,
    cdsEntityKey: change?.[keyNames[0]] ?? original?.[keyNames[0]],
    changeLogAction,
    Items: elementsKeys
      .map(
        (key) => {
          let attributeNewValue = null;
          let attributeOldValue = null;
          switch (changeLogAction) {
            case "Create":
              attributeNewValue = defaultStringOrNull(change[key])
              break;
            case "Delete":
              attributeOldValue = defaultStringOrNull(original[key])
              break
            case "Update":
              attributeNewValue = defaultStringOrNull(change[key])
              attributeOldValue = defaultStringOrNull(original[key])
            default:
              break;
          }

          return {
            sequence: 0,
            attributeKey: key,
            attributeNewValue,
            attributeOldValue,
          }
        }
      )
      .filter(item => item.attributeNewValue !== item.attributeOldValue)
      .map((item, idx) => {
        item.sequence = idx
        return item
      })
  }
}

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
      db.prepend((srv: any) => {
        srv.on(
          ["CREATE", "UPDATE", "DELETE"],
          async function changeLogHandler(req: any, next: () => Promise<any>) {
            const { query } = req;

            const entityName = extractEntityNameFromQuery(query);
            if (entityName === undefined && isChangeLogInternalEntity(entityName)) {
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

            const keyNames = extractKeyNamesFromEntity(entityDef);

            const changeLogs: any[] = [];

            const findQuery = SELECT.from(entityName).columns(...keyNames, ...elementsKeys);
            const where = query?.DELETE?.where ?? query?.UPDATE?.where
            if (where !== undefined) { findQuery.where(where) }

            switch (req.event) {
              case "CREATE":
                const data: Array<any> = req.data instanceof Array ? req.data : [req.data];
                data.forEach(change => changeLogs.push(buildChangeLog(entityName, keyNames, elementsKeys, undefined, change)))
                break;
              case "DELETE":
                await db.foreach(findQuery, (original: any) => changeLogs.push(buildChangeLog(entityName, keyNames, elementsKeys, original)))
                break;
              case "UPDATE":
                await db.foreach(findQuery, (original: any) => changeLogs.push(buildChangeLog(entityName, keyNames, elementsKeys, original, req.data)))
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
