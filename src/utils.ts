import process from "process";

/**
 * return null if strings are `null`/`undefined`
 * 
 * @param args 
 * @returns 
 */
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
 * @param func a function which only have one parameter
 * @returns 
 */
export const memorized = <T extends (arg0: any) => any>(func: T): T => {
  let cache: WeakMap<any, any>;

  // @ts-ignore
  return function (arg0: any) {
    if (typeof arg0 === "object") {
      cache = new WeakMap();
    } else {
      cache = new Map();
    }
    if (!cache.has(arg0)) {
      cache.set(arg0, func(arg0));
    }
    return cache.get(arg0);
  };
};