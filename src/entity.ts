/* eslint-disable max-len */
import { ANNOTATE_CHANGELOG_ENABLED, CHANGELOG_NAMESPACE } from "./constants";

export function isChangeLogEnabled(def: any) {
  if (def !== undefined) {

    if (ANNOTATE_CHANGELOG_ENABLED in def && def[ANNOTATE_CHANGELOG_ENABLED] === true) {
      return true;
    }
    if (extractChangeAwareElements(def).length > 0) {
      return true;
    }
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
  return extractKeyElementsFromEntity(entityDef).map((ele: any) => ele.name);
}

export function extractKeyElementsFromEntity(entityDef: any) {
  return Object
    .entries(entityDef?.elements ?? [])
    .filter(([_, value]) => (value as any)?.key)
    .map(([_, value]) => value);
}

const IGNORED_TYPES = ["@cds.Association", "cds.Composition"];

export function isLocalizedAndChangeLogRelated(entityDef: any): boolean {
  return extractChangeAwareLocalizedElements(entityDef).length > 0;
}

export function extractChangeAwareLocalizedElements(entityDef: any): Array<any> {
  return Object
    .entries(entityDef?.elements)
    .filter((entry: any[]) =>
      entry[1]?.[ANNOTATE_CHANGELOG_ENABLED] === true &&
      entry[1]?.localized === true &&
      !IGNORED_TYPES.includes(entry[1].type)
    )
    .map(entry => entry[1]);
}

export function extractChangeAwareElements(entityDef: any): Array<any> {
  return Object
    .entries(entityDef?.elements)
    .filter((entry: any[]) =>
      entry[1]?.[ANNOTATE_CHANGELOG_ENABLED] === true &&
      entry[1]?.key !== true && // ignore key
      !IGNORED_TYPES.includes(entry[1].type)
    )
    .map(entry => entry[1]);
}

export function isChangeLogInternalEntity(name: string = "") {
  return name.startsWith(CHANGELOG_NAMESPACE);
}
