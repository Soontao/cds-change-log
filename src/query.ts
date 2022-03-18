/* eslint-disable max-len */

import { extractChangeAwareLocalizedElements, extractKeyNamesFromEntity } from "./entity";
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
export const buildLocalizedOriginalDataQuery = (entityDef: any, original: any) => {
  const cds = cwdRequire("@sap/cds");;
  const { ql: { SELECT } } = cds;
  const entityName = entityDef.name;

  const localizedChangeLogElements = extractChangeAwareLocalizedElements(entityDef);

  const keyNames = extractKeyNamesFromEntity(entityDef);

  const query = SELECT
    .one
    .from(`${entityName}.texts`)
    .columns(localizedChangeLogElements.map(ele => ele.name))
    .where(keyNames.reduce((acc: any, pk: string) => { acc[pk] = original[pk]; return acc; }, { locale: cds.context.locale }));
  return query;
};
