import { Query } from "./type";

/**
 * Extracts the entity name from a CQN query.
 * 
 * @param query - The CQN query
 * @returns The entity name, which could be a string or a ref object.
 */
export function extractEntityFromQuery(query: Query): any {
  return query?.INSERT?.into ?? query?.UPDATE?.entity ?? query?.DELETE?.from;
}
