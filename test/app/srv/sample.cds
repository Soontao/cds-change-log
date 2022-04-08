namespace test.app.srv.s1;

using {
  People,
  Order,
  PeopleOrderForProduct,
  Order3,
  Book,
  Address,
  Form
} from '../db';
using {cap.community.common} from '../../../index.cds';


using {
  cuid,
  managed
} from '@sap/cds/common';

@path : '/sample'
service SampleService {

  entity Peoples                as projection on People;
  entity ProjectedPeople        as projection on People;
  entity ChangeLogs             as projection on common.ChangeLog;
  entity Orders                 as projection on Order;
  entity Orders3                as projection on Order3;
  entity PeopleOrderForProducts as projection on PeopleOrderForProduct;
  entity Books                  as projection on Book;
  entity Addresses              as projection on Address;

  @fiori.draft.enabled
  entity Forms                  as projection on Form;


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
