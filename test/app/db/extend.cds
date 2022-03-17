using {People} from './index.cds';
using {cap.community.common.ChangeLog} from '../../../index.cds';


extend People with {
  @cds.changelog.enabled
  Weight : Double;
};

extend ChangeLog with {

  @cds.changelog.extension.entityKey
  @cds.changelog.extension.for.type : Integer
  entityKeyInteger : Integer;
  
};
