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


@cds.changelog.enabled
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

@cds.changelog.enabled
entity Order3 {
  key ID     : Decimal;
      @cds.changelog.enabled
      Amount : Decimal;
}

@cds.changelog.enabled
entity Order4 : cuid {
  @cds.changelog.enabled
  Items  : Association to many Order4Item
             on Items.order = $self;

  name   : localized String(255);
  Items2 : Composition of many {
             Value : Integer;
           }
}


@cds.changelog.enabled
entity Order4Item : cuid {
  @cds.changelog.enabled
  order  : Association to one Order4;
  @cds.changelog.enabled
  Amount : Decimal;
}
