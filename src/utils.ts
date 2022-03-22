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


/**
 * utils for memorized (sync) **ONE-parameter** function
 * 
 * @param func 
 * @returns 
 */
export const memorized = <T extends (...args: any[]) => any>(func: T): T => {
  const cache = new WeakMap();

  // @ts-ignore
  return (arg0: any, ...args: any[]) => {
    if (!cache.has(arg0)) {
      cache.set(arg0, func(arg0, ...args));
    }
    return cache.get(arg0);
  };
};