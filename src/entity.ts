/* eslint-disable max-len */
import { ANNOTATE_CHANGELOG_ENABLED, CHANGELOG_NAMESPACE } from "./constants";

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
  return Object
    .entries(entityDef?.elements ?? [])
    .filter(([_, value]) => (value as any)?.key)
    .map(([key, _]) => key);
}

export function extractKeyElementsFromEntity(entityDef: any) {
  return Object
    .entries(entityDef?.elements ?? [])
    .filter(([_, value]) => (value as any)?.key)
    .map(([_, value]) => value);
}

const IGNORED_TYPES = ["@cds.Association", "cds.Composition"];


export function extractChangeAwareElements(entityDef: any): Array<string> {
  return Object
    .entries(entityDef?.elements)
    .filter((entry: any[]) =>
      entry[1]?.[ANNOTATE_CHANGELOG_ENABLED] === true &&
      entry[1]?.localized !== true &&
      !IGNORED_TYPES.includes(entry[1].type)
    )
    .map(([key]) => key);
}

export function isChangeLogInternalEntity(name: string = "") {
  return name.startsWith(CHANGELOG_NAMESPACE);
}
