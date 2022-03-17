namespace test.app.srv.s1;

using {
  People,
  Order
} from '../db';
using {cap.community.common} from '../../../index.cds';


using {
  cuid,
  managed
} from '@sap/cds/common';

@path : '/sample'
service SampleService {

  entity Peoples         as projection on People;
  entity ProjectedPeople as projection on People;
  entity ChangeLogs      as projection on common.ChangeLog;
  entity Orders          as projection on Order;

  @readonly
  view PeopleWithChangeLog as
    select from People
    mixin {
      changeLogs : Association to many common.ChangeLog
                     on  People.ID             = changeLogs.entityKey
                     and changeLogs.entityName = 'People'
    }
    into {
      *,
      changeLogs
    };

  entity OtherEntity : cuid, managed {
    Name : String(255);
    Age  : Integer;
  }

}
