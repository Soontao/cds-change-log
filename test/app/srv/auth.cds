namespace test.app.srv.auth;


using {People, } from '../db';
using {cap.community.common} from '../../../index.cds';

@path     : '/auth'
@requires : 'authenticated-user'
service AuthProjectedService {
  entity Peoples as projection on People;
}
