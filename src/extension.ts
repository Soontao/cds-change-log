import { ANNOTATE_CHANGELOG_EXTENSION_KEY } from "./constants";



/**
 * extract extension key fields from `ChangeLog` entity
 * @param def 
 */
export function extractExtensionKeyFields(def: any): Array<any> {
  return Object
    .entries(def?.elements ?? [])
    .filter(([_, value]) => (value as any)[ANNOTATE_CHANGELOG_EXTENSION_KEY] === true)
    .map(([_, value]) => value);
}


export class ChangeLogExtensionContext {
  #def: any;

  constructor(def: any) {
    this.#def = def;
  }

  public findKeyByType(type: string) {
    return Object
      .entries(this.#def?.elements ?? {})
      .find(([_, element]) => (element as any)?.["@cds.changelog.extension.for.type"]?.["="] === type)
      ?.[0];
  }



}