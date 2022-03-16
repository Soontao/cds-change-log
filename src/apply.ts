import { ANNOTATE_CHANGELOG_ENABLED, CHANGELOG_NAMESPACE, ENTITIES } from "./constants";


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
  return Object.entries(entityDef?.elements).filter(([_, value]) => (value as any)?.[ANNOTATE_CHANGELOG_ENABLED] === true).map(([key]) => key)
}

export function isChangeLogInternalEntity(name: string = "") {
  return name.startsWith(CHANGELOG_NAMESPACE);
}

export function extractEntityNameFromQuery(query: any): string {
  return query?.INSERT?.into ?? query?.UPDATE?.entity;
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
            if (isChangeLogInternalEntity(entityName)) {
              return next();
            }

            const entityDef = cds.model.definitions[entityName];
            if (!isChangeLogEnabled(entityDef)) {
              return next();
            }

            const elementsKeys = extractChangeAwareElements(entityDef)

            if (elementsKeys.length === 0) {
              return next()
            }

            const keyNames = extractKeyNamesFromEntity(entityDef);

            const changeLogs: any[] = [];

            switch (req.event) {
              case "CREATE":
                changeLogs.push({
                  cdsEntityName: entityDef.name,
                  cdsEntityKey: req.data[keyNames[0]],
                  changeLogAction: "Create",
                  Items: elementsKeys.map((key, idx) => ({
                    sequence: idx,
                    attributeKey: key,
                    attributeNewValue: String(req.data[key]),
                    attributeOldValue: null,
                  }))
                })


                break;
              case "UPDATE":
                // query original values from database
                const original: [] = await db.run(
                  SELECT.from(entityName).where(query.UPDATE.where)
                )

                if (original.length > 0) {

                  original
                    .forEach((originalItem: any) => {
                      const localChangeLog = {
                        cdsEntityName: entityDef.name,
                        cdsEntityKey: originalItem[keyNames[0]],
                        changeLogAction: "Update",
                        Items: elementsKeys
                          .filter((key) => originalItem[key] !== req.data[key])
                          .map((key, idx) => ({
                            sequence: idx,
                            attributeKey: key,
                            attributeNewValue: String(req.data[key]),
                            attributeOldValue: String(originalItem[key]),
                          }))
                      }

                      if (localChangeLog.Items.length > 0) {
                        changeLogs.push(localChangeLog)
                      }
                    });

                }
                break;
              default:
                break;
            }

            if (changeLogs.length > 0) {
              return next()
                .then(() => db.run(
                  INSERT
                    .into(ENTITIES.CHANGELOG)
                    .entries(...changeLogs)
                ))
            }
            return next();
          });
      });
    }

  });
}
