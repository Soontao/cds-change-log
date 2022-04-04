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
 * the structure to store the association/composition keys for
 * target entity
 */
type EntityRelationKeys : {

  @cds.changelog.extension.for.association
  @cds.changelog.extension.for.type : cds.UUID
  UUID    : cds.UUID;

  @cds.changelog.extension.for.association
  @cds.changelog.extension.for.type : cds.Integer
  Integer : cds.Integer;

}


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
  entityName       : CommonString not null;

  /**
   * default key storage for common model
   */
  @cds.changelog.extension.entityKey :              true
  @cds.changelog.extension.for.type  :              cds.UUID
  entityKey        : UUID;

  @cds.changelog.extension.entityKey
  @cds.changelog.extension.for.type  :              cds.Integer
  entityKeyInteger : Integer;

  /**
   * storage for entity associations
   */
  entityRelation   : EntityRelationKeys;
  /**
   * locale
   */
  locale           : String(14);
  /**
   * changed action
   */
  action           : Action not null;
  /**
   * log at timestamp
   */
  actionAt         : cds.Timestamp @cds.on.insert : $now;
  /**
   * log by user id
   */
  actionBy         : String(255)   @cds.on.insert : $user;

  /**
   * details of changed value
   *
   * it will be empty if no value changed or there is no
   * annotated elements
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
      /**
       * the old value which before change
       */
      attributeNewValue : CommonString;
      /**
       * the new value which after change
       */
      attributeOldValue : CommonString;
}


/**
 * a flat view to filter change attributes by entity and key
 */
view ChangeLogsItemsView as
  select from ChangeLog.Item {
    key sequence                      as ChangeSequence,
    key Parent.ID                     as LogID,
        Parent.action,
        Parent.actionAt,
        Parent.actionBy,
        Parent.locale,
        attributeKey,
        attributeNewValue,
        attributeOldValue,
        Parent.entityName,
        Parent.entityKey              as entityKeyUUID,
        Parent.entityKeyInteger,
        Parent.entityRelation.UUID    as relationKeyUUID,
        Parent.entityRelation.Integer as relationKeyInteger,
  };


annotate ChangeLogsItems with @(UI : {LineItem : [
  {
    Value                 : attributeKey,
    Label                 : 'i18n>attributeKey',
    ![@HTML5.CssDefaults] : {width : '10rem'},
  },
  {
    Value                 : attributeOldValue,
    Label                 : 'i18n>attributeOldValue',
    ![@HTML5.CssDefaults] : {width : '10rem'},
  },
  {
    Value                 : attributeNewValue,
    Label                 : 'i18n>attributeNewValue',
    ![@HTML5.CssDefaults] : {width : '10rem'},
  },
  {
    Value                 : actionBy,
    Label                 : 'i18n>actionBy',
    ![@HTML5.CssDefaults] : {width : '10rem'},
  },
  {
    Value                 : entityName,
    Label                 : 'i18n>actionBy',
    ![@HTML5.CssDefaults] : {width : '10rem'},
  },
  {
    Value                 : locale,
    Label                 : 'i18n>locale',
    ![@HTML5.CssDefaults] : {width : '10rem'},

  },
  {
    Value                 : ![action],
    Label                 : 'i18n>action',
    ![@HTML5.CssDefaults] : {width : '10rem'},
  },
  {
    Value                 : actionAt,
    Label                 : 'i18n>actionAt',
    ![@HTML5.CssDefaults] : {width : '10rem'},
  },
]});
