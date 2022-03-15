import { ANNOTATE_CHANGELOG_ENABLED, CHANGELOG_NAMESPACE, ENTITIES } from "./constants";


export function isChangeLogEnabled(def: any) {
  if (def !== undefined) {
    return ANNOTATE_CHANGELOG_ENABLED in def && def[ANNOTATE_CHANGELOG_ENABLED] === true
  }
  return false
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
    .filter(([key, value]) => (value as any)?.key)
    .map(([key, value]) => key)
}

export function isChangeLogInternalEntity(name: string = '') {
  return name.startsWith(CHANGELOG_NAMESPACE)
}

export function extractEntityNameFromQuery(query: any): string {
  return query?.INSERT?.into
}

/**
 * apply change log 
 * 
 * @param cds cds facade
 */
export function applyChangeLog(cds: any) {
  const { INSERT } = cds.ql
  cds.on("served", async () => {
    const db = await cds.connect.to("db")
    if (ENTITIES.CHANGELOG in cds?.model?.definitions) {
      db.prepend((srv: any) => {
        srv.on(
          ['CREATE', 'UPDATE', 'DELETE'],
          async function changeLogHandler(req: any, next: Function) {
            const { query } = req;
            const executionResult = await next()

            const entityName = extractEntityNameFromQuery(query)
            if (isChangeLogInternalEntity(entityName)) {
              return executionResult
            }

            const entityDef = cds.model.definitions[entityName]
            if (!isChangeLogEnabled(entityDef)) {
              return executionResult
            }

            const keyNames = extractKeyNamesFromEntity(entityDef)


            switch (req.event) {
              case "CREATE":
                await db.run(
                  INSERT
                    .into(ENTITIES.CHANGELOG)
                    .entries({
                      cdsEntityName: entityDef.name,
                      cdsEntityKey: req.data[keyNames[0]],
                      changeLogAction: "Create",
                      ChangeItems: Object.entries(req.data).map(([key, value]) => ({
                        attributeKey: key,
                        attributeNewValue: String(value),
                        attributeOldValue: null,
                      }))
                    })
                )
                break;
              default:
                break;
            }

            return executionResult
          })
      })
    }

  });
}
