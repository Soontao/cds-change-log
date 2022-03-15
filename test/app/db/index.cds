using {
  cuid,
  managed
} from '@sap/cds/common';
using {cap} from '../../../src';

@cds.changelog.enabled
entity People : cuid, managed {
  @cds.changelog
  Name : String(255);
  @cds.changelog
  Age  : Integer;
}
