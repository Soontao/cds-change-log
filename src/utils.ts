import process from "process";

export const defaultStringOrNull = (...args: Array<any>) => {
  for (const arg of args) {
    if (arg !== undefined && arg !== null) {
      return String(arg);
    }
  }
  return null;
};

/**
 * require for current work directory
 * 
 * @param id 
 * @returns 
 */
export const cwdRequire = (id: string) => require(require.resolve(id, { paths: [process.cwd()] }));
