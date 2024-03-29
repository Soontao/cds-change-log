/* eslint-disable max-len */
import { cwdRequireCDS } from "cds-internal-tool";
import { ACTIONS } from "./constants";
import { ChangeLogContext } from "./context";
import { extractChangeAwareElements } from "./entity";
import { EntityDefinition } from "./type";
import { defaultStringOrNull } from "./utils";


/**
 * build change log object from data
 * 
 * @internal
 * @private
 * @param entityDef entity def
 * @param original original value in db, optional
 * @param change change value from requests, optional
 * @returns change log item
 */
export const buildChangeLog = (
  entityDef: EntityDefinition,
  context: ChangeLogContext,
  original?: any,
  change?: any,
): Array<any> => {

  if (original === undefined && change === undefined) {
    throw new TypeError("require original data or change data at least");
  }
  const cds = cwdRequireCDS();
  const defaultLocale = cds?.env?.i18n?.default_language ?? "en";

  // determine action by inbound changed value and original database value
  let action: string | undefined;
  if (original === undefined && change !== undefined) {
    action = ACTIONS.Create;
  }
  if (original !== undefined && change === undefined) {
    action = ACTIONS.Delete;
  }
  if (original !== undefined && change !== undefined) {
    action = ACTIONS.Update;
  }

  const entityElements = extractChangeAwareElements(entityDef);

  const entityName = entityDef.name;

  const keys = context.createKeyValuesForInstance(entityDef, original ?? change);

  // TODO: concern about key change in some cases

  // normal raw elements
  const Items = entityElements
    .filter(ele => action === ACTIONS.Update ? ele.name in change : true) // for update, if not put into payload, no update
    .map(
      (ele) => {
        const key = ele.name;

        let attributeNewValue = null;
        let attributeOldValue = null;
        switch (action) {
          case ACTIONS.Create:
            attributeNewValue = defaultStringOrNull(change?.[key]);
            break;
          case ACTIONS.Delete:
            attributeOldValue = defaultStringOrNull(original?.[key]);
            break;
          case ACTIONS.Update:
            attributeNewValue = defaultStringOrNull(change?.[key]);
            attributeOldValue = defaultStringOrNull(original?.[key]);
          default:
            break;
        }

        return {
          sequence: 0,
          attributeKey: key,
          attributeNewValue,
          attributeOldValue,
        };
      }
    )
    .filter(item => item.attributeNewValue !== item.attributeOldValue)
    .map((item, idx) => {
      item.sequence = idx;
      return item;
    });

  // TODO: check column keys
  return {
    locale: defaultLocale, // default locale
    ...keys, // if locale is key
    entityName,
    action,
    actionBy: cds.context?.user?.is?.("system-user") ? "system-user" : cds.context?.user?.id ?? "anonymous",
    actionAt: cds.context?.timestamp,
    Items
  };

};

