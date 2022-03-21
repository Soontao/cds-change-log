/* eslint-disable max-len */

export function extractEntityFromQuery(query: any): any {
  return query?.INSERT?.into ?? query?.UPDATE?.entity ?? query?.DELETE?.from;
}
