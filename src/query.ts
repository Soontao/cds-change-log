/* eslint-disable max-len */

import { CQN } from "./type";

/**
 * @scope request
 * @param query 
 * @returns 
 */
export function extractEntityFromQuery(query: CQN): any {
  return query?.INSERT?.into ?? query?.UPDATE?.entity ?? query?.DELETE?.from;
}
