
import { setupIgnoreStatus, setupTest } from "./utils";


describe("Composition Test Suite", () => {

  const cds = require("@sap/cds")
  const axios = setupTest(__dirname, "./app")

  setupIgnoreStatus(axios)

  it('should support deep creation for composition', async () => {
    let response = await axios.post("/sample/Addresses", {
      Name: "Theo Sun Address", details: [{
        Line1: 'Line1 Value',
        Line2: 'Line2 Value 2'
      }]
    })
    expect(response.status).toBe(201)
    const { ID } = response.data
    expect(ID).not.toBeUndefined()
    const results = await cds.run(cds.ql.SELECT.one.from('Address', (c: any) => { c("*"), c.changeLogs((cl: any) => { cl('*'), cl.Items('*') }) }).where({ ID }))

    expect(results).not.toBeNull()

    expect(results.changeLogs).toMatchObject([
      {
        entityName: "Address",
        entityKey: ID,
        entityRelation_UUID: null,
        locale: "en",
        action: "Create",
        actionBy: "anonymous",
        entityKeyInteger: null,
        Items: [
          {
            sequence: 0,
            attributeKey: "Name",
            attributeNewValue: "Theo Sun Address",
            attributeOldValue: null,
          },
        ],
      },
      {
        entityName: "Address.Detail",
        entityRelation_UUID: ID,
        locale: "en",
        action: "Create",
        actionBy: "anonymous",
        entityKeyInteger: null,
        Items: [
          {
            sequence: 0,
            attributeKey: "Line1",
            attributeNewValue: "Line1 Value",
            attributeOldValue: null,
          },
          {
            sequence: 1,
            attributeKey: "Line2",
            attributeNewValue: "Line2 Value 2",
            attributeOldValue: null,
          },
        ],
      },
    ])

  });


});
