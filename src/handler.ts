/* eslint-disable max-len */
import { buildChangeLog } from "./change";
import { ENTITIES } from "./constants";
import { ChangeLogContext } from "./context";
import { extractChangeAwareElements, extractKeyNamesFromEntity } from "./entity";
import { ChangeLogError } from "./error";
import { extractEntityFromQuery } from "./query";
import { Query } from "./type";
import { cwdRequire } from "./utils";


export function createChangeLogHandler(cds: any, db: any) {

  const { INSERT, SELECT } = cds.ql;
  const context = new ChangeLogContext(cds.model);

  const compositions = cwdRequire("@sap/cds/libx/_runtime/common/composition");
  const { getFlatArray } = cwdRequire("@sap/cds/libx/_runtime/db/utils/deep");

  async function changeLogHandler(req: { query: Query, event: string, data?: any }) {
    const { query } = req;
    const entity = extractEntityFromQuery(query); // it could be entityName or ref objects
    const entityName = typeof entity === "string" ? entity : entity.ref[0]; // TODO: warning when other cases

    const entityDef = cds.model.definitions[entityName];

    const entityChangeLogElementKeys = extractChangeAwareElements(entityDef).map(ele => ele.name);

    const entityPrimaryKeys = extractKeyNamesFromEntity(entityDef);

    if (entityPrimaryKeys.length === 0) {
      throw new ChangeLogError(`entity '${entityName}' must have at least one primary key for change log`);
    }

    let queuedChangeLogs: Array<Array<any>> = [];

    const batches: Array<Promise<void>> = [];

    /**
     * queue change log to an in memory queue, and perform batch insert later
     *
     * @param log
     */
    const queueChangeLogs = (log: any) => {
      queuedChangeLogs.push(log);
      if (queuedChangeLogs.length >= 100) { saveChangeLog(); }
    };

    /**
     * save change log to the database
     */
    const saveChangeLog = () => {
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
    const originalDataQuery = SELECT
      .from(entity)
      .columns(...entityPrimaryKeys, ...entityChangeLogElementKeys);

    const where = query?.DELETE?.where ?? query?.UPDATE?.where;

    // if there have `where` condition on inbound query, copy it to original data query
    if (where !== undefined) { originalDataQuery.where(where); }

    switch (req.event) {
      case "CREATE":
        if (compositions.hasDeepInsert(cds.model, query)) {
          const insertions = compositions.getDeepInsertCQNs(cds.model, query);
          for (const insertion of insertions) {
            await changeLogHandler({ query: insertion, event: "CREATE" });
          };
        } else {
          (query.INSERT?.entries ?? []).forEach((change: any) => queueChangeLogs(buildChangeLog(entityDef, context, undefined, change)));
        }
        break;
      case "DELETE":
        if (compositions.hasDeepDelete(cds.model, query)) {
          const deletions = getFlatArray(await compositions.getDeepDeleteCQNs(cds.model, req)).filter((cqn: Query) => cqn !== query);
          for (const deletion of deletions) {
            await changeLogHandler({ query: deletion, event: "DELETE" });
          }
        }
        await db.foreach(originalDataQuery, (original: any) => queueChangeLogs(buildChangeLog(
          entityDef,
          context,
          original,
        )));
        break;
      case "UPDATE":
        await db.foreach(originalDataQuery, (original: any) => queueChangeLogs(buildChangeLog(
          entityDef,
          context,
          original,
          req.data
        )));
        break;
      default:
        break;
    }

    saveChangeLog();

    if (batches.length > 0) { await Promise.all(batches); }
  }

  return changeLogHandler;

}
