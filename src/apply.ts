/* eslint-disable max-len */
import { ENTITIES } from "./constants";
import { extractChangeLogAwareEntities } from "./entity";
import { createChangeLogHandler } from "./handler";
import { CDS } from "./type";


/**
 * apply change log to CAP nodejs runtime
 * 
 * just simply use the `@cds.changelog.enabled` on entity and elements to record the changed values to database
 * 
 * @param cds cds facade
 */
export function applyChangeLog(cds: CDS) {
  const logger = cds.log("changelog.apply");
  cds.on("served", async () => {
    if (ENTITIES.CHANGELOG in cds?.model?.definitions) {

      const db = await cds.connect.to("db");
      
      db.prepend((srv) => srv.before(
        ["CREATE", "UPDATE", "DELETE"],
        extractChangeLogAwareEntities(cds),
        createChangeLogHandler(cds, db)
      ));
      
    } else {
      logger.error(`applyChangeLog, but not include the entity`, ENTITIES.CHANGELOG);
    }
  });
}
