/* eslint-disable max-len */
import { ANNOTATE_CHANGELOG_EXTENSION_KEY_FOR_ASSOCIATION, ANNOTATE_CHANGELOG_EXTENSION_KEY_FOR_TYPE, ANNOTATE_CHANGELOG_EXTENSION_KEY_TARGET, ENTITIES } from "./constants";
import { extractKeyNamesFromEntity, isAssociationKey, isLocalizedEntityDef } from "./entity";
import { ChangeLogError } from "./error";
import { ElementDefinition, EntityDefinition } from "./type";

export type KeyMapping = Array<[changeLogElementKey: string, targetEntityKey: string]>;

/**
 * change log context
 */
export class ChangeLogContext {
  /**
   * change log model definition
   */
  #changeLogDef: EntityDefinition;

  /**
   * key mapping cache
   */
  #keyMappingCache: WeakMap<object, KeyMapping> = new WeakMap();

  constructor(changeLogDef: EntityDefinition) {
    this.#changeLogDef = changeLogDef;
  }

  public findKeyByType(type: string) {
    return Object
      .values(this.#changeLogDef?.elements ?? {})
      .filter((element: ElementDefinition) => element[ANNOTATE_CHANGELOG_EXTENSION_KEY_FOR_ASSOCIATION] !== true)
      .find((element: ElementDefinition) => (element?.[ANNOTATE_CHANGELOG_EXTENSION_KEY_FOR_TYPE]?.["="] === type))
      ?.name;
  }

  public findAssociationKeyByType(type: string) {
    return Object
      .values(this.#changeLogDef?.elements ?? {})
      .filter((element: ElementDefinition) => element[ANNOTATE_CHANGELOG_EXTENSION_KEY_FOR_ASSOCIATION] === true)
      .find((element: ElementDefinition) => (element?.[ANNOTATE_CHANGELOG_EXTENSION_KEY_FOR_TYPE]?.["="] === type))
      ?.name;
  }

  /**
   * find change log key name
   * 
   * @param targetEntityElement 
   * @returns 
   */
  public findKeyName(targetEntityElement: ElementDefinition) {
    if (ANNOTATE_CHANGELOG_EXTENSION_KEY_TARGET in targetEntityElement) {
      const changelogElementName = targetEntityElement[ANNOTATE_CHANGELOG_EXTENSION_KEY_TARGET];
      const changeLogElement = this.#changeLogDef.elements[changelogElementName];
      if (changeLogElement === undefined) {
        throw new ChangeLogError(`can not found element '${changelogElementName}' on entity '${ENTITIES.CHANGELOG}'`);
      }
      if (targetEntityElement.type !== changeLogElement.type) {
        throw new ChangeLogError(`element '${changelogElementName}' type should be '${targetEntityElement.type}'`);
      }
      return changelogElementName;
    }
    if (isAssociationKey(targetEntityElement)) {
      return this.findAssociationKeyByType(targetEntityElement.type);
    }
    return this.findKeyByType(targetEntityElement.type);
  }

  /**
   * extract a key mapping list from change log and target entity
   * 
   * @param targetEntityDef 
   * @returns 
   */
  public extractKeyMappingFromEntity(targetEntityDef: any): KeyMapping {
    if (!this.#keyMappingCache.has(targetEntityDef)) {
      const mapping: Array<[changeLogElementKey: string, targetEntityKey: string]> = [];
      const targetEntityKeyNames = extractKeyNamesFromEntity(targetEntityDef);
      for (const targetEntityKeyName of targetEntityKeyNames) {
        const targetEntityElementDef = targetEntityDef.elements[targetEntityKeyName];
        let changeLogEntityKeyName = this.findKeyName(targetEntityElementDef);
        // for locale (`Entity.texts`) entities
        if (changeLogEntityKeyName === undefined && isLocalizedEntityDef(targetEntityDef) && targetEntityKeyName === "locale") {
          changeLogEntityKeyName = "locale";
        }
        if (changeLogEntityKeyName === undefined) {
          throw new ChangeLogError(`not found proper column to store value of '${targetEntityDef.name}'.'${targetEntityKeyName}'`);
        }
        mapping.push([changeLogEntityKeyName, targetEntityKeyName]);
      }
      this.#keyMappingCache.set(targetEntityDef, mapping);
    }
    return this.#keyMappingCache.get(targetEntityDef) ?? [];
  }



}
