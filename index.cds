namespace cap.community.common;

using {
  cuid,
  managed
} from '@sap/cds/common';

/**
 * common string type
 */
type CommonString : String(255);

/**
 * change log action, mapped by CQL event
 */
type Action : String enum {
  Create;
  Update;
  Delete;
};


entity ChangeLog : cuid, managed {
  // it will be raw entity name, will not save projection/view data
  entityName       : CommonString not null;

  @cds.changelog.storage.key     : {
    default : true,
    for     : {type : UUID}
  }
  // the mandatory key of reference key
  entityKey        : UUID;

  @cds.changelog.storage.key.for : {type : Integer}
  entityKeyInteger : Integer;
  /**
   * changed action
   */
  action           : Action not null;
  /**
   * detail of changed value
   */
  Items            : Composition of many ChangeLog.Item
                       on Items.Parent = $self;
}

entity ChangeLog.Item { // do not need the user info because header level has that
      /**
       * unique sequence for each change log
       */
  key sequence          : Integer default 0 not null;
      /**
       * change log root reference
       */
  key Parent            : Association to ChangeLog;
      /**
       * attribute key in CDS
       */
      attributeKey      : CommonString not null;
      attributeNewValue : CommonString;
      attributeOldValue : CommonString;
}
