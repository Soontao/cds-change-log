/* eslint-disable max-len */
import { ANNOTATE_CHANGELOG_EXTENSION_KEY_FOR_ASSOCIATION, ANNOTATE_CHANGELOG_EXTENSION_KEY_FOR_TYPE, ANNOTATE_CHANGELOG_EXTENSION_KEY_TARGET, ENTITIES } from "./constants";
import { extractKeyNamesFromEntity, isLocalizedEntityDef } from "./entity";
import { ChangeLogError } from "./error";
import { ElementDefinition, EntityDefinition, LinkedCSN } from "./type";

export type KeyMapping = Array<[changeLogElementKey: string, targetEntityKey: string]>;

/**
 * change log context
 */
export class ChangeLogContext {
  /**
   * change log model definition
   */
  #changeLogDef: EntityDefinition;

  #model: LinkedCSN;

  /**
   * key mapping cache
   */
  #keyMappingCache: WeakMap<object, KeyMapping> = new WeakMap();

  constructor(model: LinkedCSN) {
    this.#changeLogDef = model.definitions[ENTITIES.CHANGELOG] as EntityDefinition;
    this.#model = model;
  }

  /**
   * Finds the key name on the change log entity for the given entity type. 
   * 
   * Searches the change log entity definition for a non-association element that has 
   * a type annotation matching the passed in type name. Returns the name of that element.
   */
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
   * find the key name on change log entity
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
    return this.findKeyByType(targetEntityElement.type);
  }

  /**
   * extract a key mapping list from change log and target entity
   * 
   * @param targetEntityDef 
   * @returns 
   */
  public extractKeyMappingFromEntity(targetEntityDef: EntityDefinition): KeyMapping {
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

  /**
   * create key pairs for giving instance data
   * 
   * @param entityDef 
   * @param value 
   * @returns 
   */
  public createKeyValuesForInstance(entityDef: EntityDefinition, value: any): any {
    return this
      .extractKeyMappingFromEntity(entityDef)
      .reduce((pre: any, cur) => {
        const [changeLogKeyName, targetEntityKeyName] = cur;
        pre[changeLogKeyName] = (value)?.[targetEntityKeyName]; // TODO: concern about when the key value is not existed
        return pre;
      }, {});
  }

}
