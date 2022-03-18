export class ChangeLogError extends Error {
  constructor(msg: string) {
    super(`CDS Change Log: ${msg}`);
  }
}
