/* eslint-disable max-len */
import { ENTITIES } from "./constants";
import { extractChangeLogAwareEntities } from "./entity";
import { createChangeLogHandler } from "./handler";


/**
 * apply change log to CAP nodejs runtime
 * 
 * just simply use the `@cds.changelog.enabled` on entity and elements to record the changed values to database
 * 
 * @param cds cds facade
 */
export function applyChangeLog(cds: any) {
  const logger = cds.log("changelog.apply");
  cds.on("served", async () => {
    if (ENTITIES.CHANGELOG in cds?.model?.definitions) {

      const db = await cds.connect.to("db");
      
      db.prepend((srv: any) => srv.on(
        ["CREATE", "UPDATE", "DELETE"],
        extractChangeLogAwareEntities(cds),
        createChangeLogHandler(cds, db)
      ));
      
    } else {
      logger.error(`applyChangeLog, but not include the entity`, ENTITIES.CHANGELOG);
    }
  });
}
