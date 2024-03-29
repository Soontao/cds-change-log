/* eslint-disable max-len */
import { cwdRequireCDS } from "cds-internal-tool";
import { ANNOTATE_CHANGELOG_ENABLED, CHANGELOG_NAMESPACE } from "./constants";
import { CDS, Definition, ElementDefinition, EntityDefinition } from "./type";
import { memorized } from "./utils";

const IGNORED_TYPES = ["@cds.Association", "cds.Composition"];


/**
 * is raw entity (database table)
 * 
 * not projection/select entity
 * 
 * @param def
 */
export const isRawEntity = memorized((def: Definition): def is EntityDefinition => {
  if (def !== undefined && def?.kind === "entity" && def?.query === undefined && def?.projection === undefined) {
    return true;
  }
  return false;
});

/**
 * @scope server
 * @param def entity definition
 * @returns 
 */
export const isChangeLogEnabled = memorized((def: EntityDefinition) => {
  if (def !== undefined && !isChangeLogInternalEntity(def?.name)) {
    return extractChangeAwareElements(def).length > 0;
  }
  return false;
});

/**
 * extract key names from entity definition
 * 
 * @param entityDef 
 * @returns 
 */
export const extractKeyNamesFromEntity = memorized((entityDef: EntityDefinition) => {
  return extractKeyElementsFromEntity(entityDef).map((ele: any) => ele.name);
});

/**
 * @scope server
 * @param entityDef 
 * @returns 
 */
export const extractKeyElementsFromEntity = memorized((entityDef: EntityDefinition) => {
  return Object
    .entries(entityDef?.keys ?? {})
    .map(([_, value]) => value)
    .filter((value: any) => value?.isAssociation !== true);
});

/**
 * @scope server
 * @param entityDef 
 * @returns 
 */
export const isLocalizedAndChangeLogRelated = memorized((entityDef: EntityDefinition): boolean => {
  return extractChangeAwareLocalizedElements(entityDef).length > 0;
});

/**
 * giving entity is localized entity definition or not
 * 
 * @param entityDef
 */
export const isLocalizedEntityDef = memorized((entityDef: EntityDefinition) => {
  const cds = cwdRequireCDS();
  if (entityDef?.name?.length >= 6 && entityDef?.name?.endsWith(".texts")) {
    const rawEntityName = entityDef.name.substr(0, entityDef.name.length - 6);
    if (rawEntityName in cds.model?.definitions) {
      if (isLocalizedAndChangeLogRelated(cds.model.definitions?.[rawEntityName] as EntityDefinition)) {
        return true;
      }
    }
  }
  return false;
});

/**
 * 
 * @scope server
 * @param entityDef 
 * @returns 
 */
export const extractChangeAwareLocalizedElements = memorized((entityDef: EntityDefinition): Array<any> => {
  return extractChangeAwareElements(entityDef)
    .filter((elementDef) =>
      elementDef[ANNOTATE_CHANGELOG_ENABLED] === true &&
      elementDef.key !== true &&
      elementDef.localized === true &&
      !IGNORED_TYPES.includes(elementDef.type)
    );
});

/**
 * find all elements which annotated with `@cds.changelog.enabled`
 * 
 * @scope server
 * @param entityDef 
 * @returns 
 */
export const extractChangeAwareElements = memorized((entityDef: EntityDefinition) => {
  return Object
    .values(entityDef?.elements)
    .filter((elementDef) =>
      elementDef[ANNOTATE_CHANGELOG_ENABLED] === true &&
      elementDef.key !== true && // ignore key
      !IGNORED_TYPES.includes(elementDef.type)
    );
});

/**
 * @scope server
 * @param name entity name
 * @returns 
 */
export function isChangeLogInternalEntity(name: string = "") {
  return name.startsWith(CHANGELOG_NAMESPACE);
}

export function extractChangeLogAwareEntities(cds: CDS) {
  return Object
    .values(cds.model.definitions)
    .filter(isRawEntity)
    .filter((def: EntityDefinition) => isChangeLogEnabled(def) || isLocalizedEntityDef(def));
}

export const isAssociationKey = memorized((elementDef: ElementDefinition) => {
  return Object.values(elementDef.parent.keys).find(key => key?.keys?.find((innerKey: any) => innerKey.$generatedFieldName === elementDef.name) !== undefined) !== undefined;
});
