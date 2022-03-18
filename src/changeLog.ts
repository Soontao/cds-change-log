import { ACTIONS } from "./constants";
import { ChangeLogContext } from "./context";
import { defaultStringOrNull } from "./utils";


/**
 * build change log object from data
 * 
 * @internal
 * @private
 * @param entityDef entity def
 * @param keyNames keys of entity
 * @param elementsKeys columns of entity
 * @param original original value in db, optional
 * @param change change value from requests, optional
 * @returns 
 */
export const buildChangeLog = (
  entityDef: any,
  entityName: string,
  elementsKeys: Array<string>,
  context: ChangeLogContext,
  original?: any,
  change?: any
) => {

  if (original === undefined && change === undefined) {
    throw new TypeError("require original data or change data at least");
  }

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

  // support multi keys
  const keys = context
    .extractKeyMappingFromEntity(entityDef)
    .reduce((pre: any, cur) => {
      const [changeLogKeyName, targetEntityKeyName] = cur;
      pre[changeLogKeyName] = change?.[targetEntityKeyName] ?? original?.[targetEntityKeyName];
      return pre;
    }, {});

  return {
    ...keys,
    entityName,
    action,
    Items: elementsKeys
      .map(
        (key) => {
          let attributeNewValue = null;
          let attributeOldValue = null;
          switch (action) {
            case ACTIONS.Create:
              attributeNewValue = defaultStringOrNull(change[key]);
              break;
            case ACTIONS.Delete:
              attributeOldValue = defaultStringOrNull(original[key]);
              break;
            case ACTIONS.Update:
              attributeNewValue = defaultStringOrNull(change[key]);
              attributeOldValue = defaultStringOrNull(original[key]);
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
      })
  };
};

