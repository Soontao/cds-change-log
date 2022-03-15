namespace test.app.srv.s1;

using {People} from '../db';


using {
  cuid,
  managed
} from '@sap/cds/common';

@path : '/sample'
service SampleService {

  entity Peoples         as projection on People;
  entity ProjectedPeople as projection on People;

  entity OtherEntity : cuid, managed {
    Name : String(255);
    Age  : Integer;
  }

}
