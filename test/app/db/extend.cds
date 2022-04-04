// remember using this file from your project root
using {People} from './index.cds';
using {cap.community.common.ChangeLog} from '../../../index.cds';


extend People with {
  @cds.changelog.enabled
  Weight : Double;
};
