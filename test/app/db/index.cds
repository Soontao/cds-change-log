using {
  cuid,
  managed
} from '@sap/cds/common';
using {cap.community.common} from '../../../index.cds';
using customManaged from './common';
using from './extend';


entity People : cuid, managed, customManaged {
  Name       : String(255);
  Age        : Integer;
  changeLogs : Association to many common.ChangeLog
                 on  changeLogs.entityKey  = $self.ID
                 and changeLogs.entityName = 'People';
}


annotate People with {
  Age  @cds.changelog.enabled;
  Name @cds.changelog.enabled;
};


entity Order : managed {
  key ID     : Integer;
      @cds.changelog.enabled
      Amount : Decimal;
};

@cds.changelog.enabled
entity PeopleOrderForProduct {
      // store key to ChangeLog.entityKeyInteger
      @cds.changelog.extension.key.target : 'entityKeyInteger'
  key OrderID  : Integer;
      // store key to ChangeLog.entityKey
      @cds.changelog.extension.key.target : 'entityKey'
  key PeopleID : UUID;
      @cds.changelog.enabled
      Amount   : Decimal;
}

entity Order3 {
  key ID     : Decimal;
      @cds.changelog.enabled
      Amount : Decimal;
}

entity Order4 : cuid {
  @cds.changelog.enabled
  Items  : Association to many Order4Item
             on Items.order = $self;

  name   : localized String(255);
  Items2 : Composition of many {
             Value : Integer;
           }
}

entity Book : cuid {

  @cds.changelog.enabled
  Name  : localized String(255);
  @cds.changelog.enabled
  Price : Decimal;

}


entity Order4Item : cuid {
  @cds.changelog.enabled
  order  : Association to one Order4;
  @cds.changelog.enabled
  Amount : Decimal;
}

@cds.changelog.enabled
entity Address : cuid {
  @cds.changelog.enabled
  Name       : String(255);
  details    : Composition of many Address.Detail
                 on details.parent = $self;

  changeLogs : Association to many common.ChangeLog
                 on (
                       changeLogs.entityName = 'Address'
                   and changeLogs.entityKey  = $self.ID
                 )
}

@cds.changelog.enabled
@cds.changelog.to : [
  parent,
  $self,
]
entity Address.Detail : cuid {

  key parent     : Association to one Address;
      @cds.changelog.enabled
      Line1      : String(255);
      @cds.changelog.enabled
      Line2      : String(255);

      changeLogs : Association to many common.ChangeLog
                     on (
                           changeLogs.entityName = 'Address.Detail'
                       and changeLogs.entityKey  = $self.ID
                     )


}

@cds.changelog.enabled
entity Form : cuid {
  @cds.changelog.enabled
  f1 : String(255);
  @cds.changelog.enabled
  f2 : String(255);
  @cds.changelog.enabled
  f3 : Integer;
  @cds.changelog.enabled
  f4 : Decimal;
}
