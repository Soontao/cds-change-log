// remember using this file from your project root
using {People} from './index.cds';
using {cap.community.common.ChangeLog} from '../../../index.cds';


extend People with {
  @cds.changelog.enabled
  Weight : Double;
};

extend ChangeLog with {
  
  // add a new column 'entityKeyInteger' for integer key
  @cds.changelog.extension.entityKey
  @cds.changelog.extension.for.type : cds.Integer
  entityKeyInteger : Integer;
  
};
