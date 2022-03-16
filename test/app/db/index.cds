using {
  cuid,
  managed
} from '@sap/cds/common';
using {cap} from '../../../index.cds';

entity People : cuid, managed {
  Name : String(255);
  Age  : Integer;
}


annotate People with @cds.changelog.enabled {
  Age  @cds.changelog.enabled;
  Name @cds.changelog.enabled;
};
