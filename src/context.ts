/* eslint-disable max-len */
import { ANNOTATE_CHANGELOG_EXTENSION_KEY_FOR_ASSOCIATION, ANNOTATE_CHANGELOG_EXTENSION_KEY_FOR_TYPE, ANNOTATE_CHANGELOG_EXTENSION_KEY_TARGET, ANNOTATE_CHANGELOG_TO, ENTITIES } from "./constants";
import { extractKeyNamesFromEntity, isChangeLogEnabled, isLocalizedEntityDef } from "./entity";
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

  private resolveEntityByPath(target: string | Array<string>, context: EntityDefinition): Array<EntityDefinition> {
    const [part0, ...parts] = typeof target === "string" ? target.split(".") : target;

    let nextEntity = undefined;

    // TODO: only 2one association support
    if (context.associations !== undefined && part0 in context.associations) {
      nextEntity = context.associations[part0]._target;
    }
    if (context.compositions !== undefined && part0 in context.compositions) {
      nextEntity = context.compositions[part0]._target;
    }
    if (nextEntity === undefined) {
      throw new Error(`navigation '${part0}' is not existed on entity '${context.name}'`);
    }

    if (parts.length > 0) {
      const entities = this.resolveEntityByPath(parts, nextEntity);
      return [context, ...entities];
    }

    return [context, nextEntity];

  }

  /**
   * extract relation context for entity 
   * 
   * @param targetEntityDef 
   * @returns 
   */
  public extractRelContext(targetEntityDef: EntityDefinition): Array<{ context: string | null, entityName: string, expand?: string }> {
    // TODO: cache
    if (isChangeLogEnabled(targetEntityDef)) {
      
      if (ANNOTATE_CHANGELOG_TO in targetEntityDef) {
        let topics: Array<any> = targetEntityDef[ANNOTATE_CHANGELOG_TO];

        if (!(topics instanceof Array)) { topics = [topics]; }

        return topics.map(v => v["="]).map((name: string) => {
          if (name === "$self") {
            return {
              context: null,
              entityName: targetEntityDef.name,
            };
          }

          const entities = this.resolveEntityByPath(name, targetEntityDef);

          const path = entities.map(entity => entity.name).reverse().join("/");

          // TODO: check associations
          return {
            context: path,
            expand: name,
            entityName: entities.reverse()[0].name,
          };

        });

      }

      return [
        {
          context: null,
          entityName: targetEntityDef.name,
        }
      ];
    }

    return [];

  }


}
