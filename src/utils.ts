import { cwdRequire } from "cds-internal-tool";

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

export { cwdRequire };

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
    if (cache === undefined) {
      if (typeof arg0 === "object") {
        cache = new WeakMap();
      } else {
        cache = new Map();
      }
    }
    if (!cache.has(arg0)) {
      cache.set(arg0, func(arg0));
    }
    return cache.get(arg0);
  };
};

export const get = (object: any, path: string) => {
  if (path?.length > 0) {
    for (const part of path.split(".")) {
      if (object?.[part] !== undefined) {
        object = object[part];
      } else {
        return undefined;
      }
    }
  }
  return object;
};
