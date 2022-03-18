
export function extractEntityNameFromQuery(query: any): string {
  return query?.INSERT?.into ?? query?.UPDATE?.entity ?? query?.DELETE?.from;
}
