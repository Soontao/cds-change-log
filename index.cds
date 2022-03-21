namespace cap.community.common;

using {
  cuid,
  managed,
} from '@sap/cds/common';

/**
 * Common String Type
 */
type CommonString : String(255);

/**
 * **ChangeLog Action**, mapped by CQL event
 */
type Action : String enum {
  Create;
  Update;
  Delete;
};


/**
 * the `ChangeLog` table, used to store change log data
 */
@readonly
@cds.autoexpose
entity ChangeLog : cuid {

  /**
   * root entity (Database Table Entity) name, not
   * view/projection
   *
   * it will be raw CDS Entity Name (with namespace), will not
   * save the projection/view data
   */
  entityName : CommonString not null;

  /**
   * default key storage for common model
   */
  @cds.changelog.extension.entityKey
  @cds.changelog.extension.for.type :         cds.UUID
  entityKey  : UUID;
  /**
   * locale
   */
  locale     : String(14);
  /**
   * changed action
   */
  action     : Action not null;
  /**
   * log at timestamp
   */
  actionAt   : cds.Timestamp @cds.on.insert : $now;
  /**
   * log by user id
   */
  actionBy   : String(255)   @cds.on.insert : $user;

  /**
   * details of changed value
   *
   * it will be empty if no value changed or there is no
   * annotated elements
   */
  Items      : Composition of many ChangeLog.Item
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
