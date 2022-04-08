import type { AxiosInstance } from "axios";

// TODO: minimal CAP abstract type definition


export interface AssociationDefinition extends Definition {
  target: string;
  _target: EntityDefinition;
  is2one: boolean;
  is2many: boolean;
}

/**
 * entity definition type
 */
export interface EntityDefinition extends Definition {
  associations?: { [elementName: string]: AssociationDefinition };
  compositions?: { [elementName: string]: AssociationDefinition };
  elements: { [elementName: string]: ElementDefinition };
  keys: { [elementName: string]: ElementDefinition };
}

/**
 * element definition type
 */
export interface ElementDefinition extends Definition {
  parent: EntityDefinition;
  key: boolean;
  isAssociation?: boolean;
}

export interface Definition {
  kind: string;
  type: string;
  name: string;
  localized?: boolean;
  [annotationKey: string]: any;
}

type LogFunction = (...messages: Array<any>) => void

export interface Logger {
  trace: LogFunction;
  debug: LogFunction;
  info: LogFunction;
  warn: LogFunction;
  error: LogFunction;
}

export interface Service {

  prepend(cb: (srv: this) => void): void;

  before(cb: Function): void;
  before(event: string | Array<string>, cb: Function): void;
  before(event: string | Array<string>, entity: string | Definition | Array<Definition>, cb: Function): void;

  on(cb: Function): void;
  on(event: string | Array<string>, cb: Function): void;
  on(event: string | Array<string>, entity: string | Definition | Array<Definition>, cb: Function): void;

  after(cb: Function): void;
  after(event: string | Array<string>, cb: Function): void;
  after(event: string | Array<string>, entity: string | Definition | Array<Definition>, cb: Function): void;

}

type Methods = "get" | "post" | "patch" | "delete" | "put";

export interface TestFacade extends Pick<AxiosInstance, Methods> {
  axios: AxiosInstance
}

export interface LinkedCSN {

  $version: string;
  definitions: {
    [key: string]: Definition;
  };
  exports: (ns: string) => any;
  kind: "type";
  meta?: {
    creator?: string;
    flavor?: string;
  };
}

export interface CDS {
  on: (event: string, cb: Function) => void;
  log: (module: string) => Logger;
  connect: {
    to: (...args: Array<any>) => Promise<Service>;
  };
  model: LinkedCSN;
  test: (project: string) => { in: (...path: Array<string>) => TestFacade };
  ql: {
    SELECT: any;
    INSERT: any;
    UPDATE: any;
    DELETE: any;
  };
}

/**
 * CQN query type
 */
export type CQN = {
  SELECT: any,
  INSERT: any,
  UPDATE: any,
  DELETE: any,
}
