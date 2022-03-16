using {
  cuid,
  managed
} from '@sap/cds/common';
using from '../../../index.cds';
using customManaged from './common';
using from './extend';


entity People : cuid, managed, customManaged {
  Name : String(255);
  Age  : Integer;
}


annotate People with @cds.changelog.enabled {
  Age  @cds.changelog.enabled;
  Name @cds.changelog.enabled;
};
