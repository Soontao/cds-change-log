namespace cap.community.common;

using {
  cuid,
  managed
} from '@sap/cds/common';


type CommonString : String(255);

type ChangeLogAction : String enum {
  Create;
  Update;
  Delete;
};


entity ChangeLog : cuid, managed {
  cdsEntityName   : CommonString not null;
  cdsEntityKey    : UUID; // if the entity has multi key elements, concat them as key

  changeLogAction : ChangeLogAction not null;
  Items           : Composition of many ChangeLog.Item
                      on Items.Parent = $self;
}

entity ChangeLog.Item { // do not need the user info because header level has that
  key sequence          : Integer default 0;
  key Parent            : Association to ChangeLog;
      attributeKey      : CommonString not null;
      attributeNewValue : CommonString;
      attributeOldValue : CommonString;
}
