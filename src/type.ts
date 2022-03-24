

/**
 * entity definition type
 */
export interface EntityDefinition extends Definition {
  elements: Array<ElementDefinition>;
  keys: Array<ElementDefinition>;
  isAssociation?: boolean;
}


/**
 * element definition type
 */
export interface ElementDefinition extends Definition {
  parent: EntityDefinition;
  key: boolean;
}


export interface Definition {
  kind: string;
  type: string;
  name: string;
  [annotationKey: string]: any;
}

export interface CDS {
  model: {
    definitions: {
      [key: string]: Definition;
    }
  }
}

/**
 * CQN query type
 */
export type CQN = any
