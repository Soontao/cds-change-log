import { CREATE, DELETE, DROP, INSERT, SELECT, UPDATE } from "cds-internal-tool/lib/types/cqn";


export type Query = Partial<DELETE & INSERT & UPDATE & SELECT & CREATE & DROP>
export type CQN = Query

export {
  AssociationDefinition,
  CDS,
  Definition,
  ElementDefinition,
  EntityDefinition,
  LinkedCSN,
  Logger,
  Service,
  TestFacade
} from "cds-internal-tool";
