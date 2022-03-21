/* eslint-disable max-len */

import { extractKeyNamesFromEntity } from "./entity";
import { cwdRequire } from "./utils";

export function extractEntityNameFromQuery(query: any): string {
  return query?.INSERT?.into ?? query?.UPDATE?.entity ?? query?.DELETE?.from;
}

/**
 * build localized original data query
 * 
 * @param entityDef entity definition
 * @param original original value
 * @returns
 */
export const createLocalizedDataQueryForOriginal = (entityDef: any, original: any) => async (): Promise<any | null> => {
  const cds = cwdRequire("@sap/cds");
  const { SELECT } = cds.ql;
  const keyNames = extractKeyNamesFromEntity(entityDef);
  const entityName = entityDef.name;
  const localizedTableForEntity = `${entityName}.texts`;
  if (localizedTableForEntity in cds.model) {
    const query = SELECT
      .one
      .from(localizedTableForEntity)
      .where(
        keyNames.reduce(
          (acc: any, pk: string) => { acc[pk] = original[pk]; return acc; },
          { locale: cds.context.locale }
        )
      );
    return cds.run(query);
  }
  return Promise.resolve(null);
};
