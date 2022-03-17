# CDS Change Log

> provide the `ChangeLog` best practice for SAP CAP nodejs runtime

[![node-test](https://github.com/Soontao/cds-change-log/actions/workflows/nodejs.yml/badge.svg)](https://github.com/Soontao/cds-change-log/actions/workflows/nodejs.yml)


## Get Started

`server.js`

```js
const cds = require('@sap/cds')
const { applyChangeLog } = require("cds-change-log")
applyChangeLog(cds)
module.exports = cds.server
```

`entity.cds`

```groovy
entity People : cuid, managed {
  Name : String(255);
  Age  : Integer;
}

// mark in entity and field elements level
// annotation in another place, you can put it into entity definition directly
annotate People with @cds.changelog.enabled {
  Age  @cds.changelog.enabled;
  Name @cds.changelog.enabled;
};
```

`create and update`

```js
let response = await axios.post("/sample/Peoples", { Name: "Theo Sun 2", Age: 39 })
const { ID } = response.data
await axios.patch(`/sample/Peoples(${ID})`, { Name: "Theo Sun 9", Age: 12 })
```

`generated change logs`

<details>
  <summary>Click to expand!</summary>
  
```js
[
  {
    ID: "595b3604-d7dd-434f-962c-1e70e92bd775",
    createdAt: "2022-03-17T04:20:41.402Z",
    createdBy: "anonymous",
    modifiedAt: "2022-03-17T04:20:41.402Z",
    modifiedBy: "anonymous",
    entityName: "People",
    entityKey: "0e926ff2-53ad-4cd9-9569-ad2147dad0bc",
    action: "Create",
    entityKeyInteger: null,
    Items: [
      {
        sequence: 0,
        Parent_ID: "595b3604-d7dd-434f-962c-1e70e92bd775",
        attributeKey: "Name",
        attributeNewValue: "Theo Sun 2",
        attributeOldValue: null,
      },
      {
        sequence: 1,
        Parent_ID: "595b3604-d7dd-434f-962c-1e70e92bd775",
        attributeKey: "Age",
        attributeNewValue: "39",
        attributeOldValue: null,
      },
    ],
  },
  {
    ID: "55bca8b8-1e79-4c9b-8bc9-1a013bf3cf39",
    createdAt: "2022-03-17T04:20:41.461Z",
    createdBy: "anonymous",
    modifiedAt: "2022-03-17T04:20:41.461Z",
    modifiedBy: "anonymous",
    entityName: "People",
    entityKey: "0e926ff2-53ad-4cd9-9569-ad2147dad0bc",
    action: "Update",
    entityKeyInteger: null,
    Items: [
      {
        sequence: 0,
        Parent_ID: "55bca8b8-1e79-4c9b-8bc9-1a013bf3cf39",
        attributeKey: "Name",
        attributeNewValue: "Theo Sun 9",
        attributeOldValue: "Theo Sun 2",
      },
      {
        sequence: 1,
        Parent_ID: "55bca8b8-1e79-4c9b-8bc9-1a013bf3cf39",
        attributeKey: "Age",
        attributeNewValue: "12",
        attributeOldValue: "39",
      },
    ],
  },
]
```
</details>



### Custom Type Primary Key

> if you want to use `Integer` or other cds built-in type as primary key

`entity.cds`

```groovy
@cds.changelog.enabled
entity Order : managed {
  key ID     : Integer; // use Integer as key, not out-of-box UUID
      @cds.changelog.enabled
      Amount : Decimal;
};
```

```groovy
// remember using this file from your project root
using {cap.community.common.ChangeLog} from 'cds-change-log';

extend ChangeLog with {
  
  // add a new column 'entityKeyInteger' for integer key
  @cds.changelog.extension.entityKey
  @cds.changelog.extension.for.type : cds.Integer // this column will be used when entity use `Integer` as primary key
  entityKeyInteger : Integer;
  
};

```

### Mixin

> support associate to `ChangeLogs` in root entity

```groovy
using {cap.community.common} from 'cds-change-log';

@path : '/sample'
service SampleService {

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

}
```

## Features

- [x] single `CUD` OData requests 
- [x] multi `CUD` CQL
- [x] all `Update/Delete` CQL (without `where`)
- [x] aspect support
- [ ] localization support
- [x] custom type (e.g. Integer) key support
- [ ] multi primary key support
- [x] extension field support
- [ ] Samples
  - [ ] for fiori elements
  - [ ] rows to columns table records