import { Query } from "./type";


/**
 * @scope request
 * @param query 
 * @returns 
 */
export function extractEntityFromQuery(query: Query): any {
  return query?.INSERT?.into ?? query?.UPDATE?.entity ?? query?.DELETE?.from;
}
