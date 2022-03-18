import { ANNOTATE_CHANGELOG_EXTENSION_KEY_TARGET } from "./constants";
import { extractKeyNamesFromEntity } from "./entity";


export class ChangeLogExtensionContext {
  #changeLogDef: any;

  constructor(changeLogDef: any) {
    this.#changeLogDef = changeLogDef;
  }

  public findKeyByType(type: string) {
    return Object
      .entries(this.#changeLogDef?.elements ?? {})
      .find(([_, element]) => (element as any)?.["@cds.changelog.extension.for.type"]?.["="] === type)
      ?.[0];
  }

  /**
   * find change log key name
   * 
   * @param targetEntityElement 
   * @returns 
   */
  public findKeyName(targetEntityElement: any) {
    if (ANNOTATE_CHANGELOG_EXTENSION_KEY_TARGET in targetEntityElement) {
      const changelogElementName = targetEntityElement[ANNOTATE_CHANGELOG_EXTENSION_KEY_TARGET];
      const changeLogElement = this.#changeLogDef.elements[changelogElementName];
      if (changeLogElement === undefined) {
        // TODO: throw error not found target
      }
      if (targetEntityElement.type !== changeLogElement.type) {
        // TODO: throw error
      }
      return changelogElementName;
    }
    return this.findKeyByType(targetEntityElement.type);
  }

  public extractKeyMappingFromEntity(targetEntityDef: any) {
    // TODO: cache
    const mapping: Array<[changeLogElementKey: string, targetEntityKey: string]> = [];
    const targetEntityKeyNames = extractKeyNamesFromEntity(targetEntityDef);
    for (const targetEntityKeyName of targetEntityKeyNames) {
      const targetEntityElementDef = targetEntityDef.elements[targetEntityKeyName];
      const changeLogEntityKeyName = this.findKeyName(targetEntityElementDef);
      if (changeLogEntityKeyName === undefined) {
        // TODO: throw error
      }
      mapping.push([changeLogEntityKeyName, targetEntityKeyName]);
    }
    return mapping;
  }



}