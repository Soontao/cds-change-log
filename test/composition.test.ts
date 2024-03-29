
import { setupTest } from "./utils";


describe("Composition Test Suite", () => {

  const cds = require("@sap/cds")
  const axios = setupTest(__dirname, "./app")

  it('should support deep creation for composition', async () => {
    let response = await axios.post("/sample/Addresses", {
      Name: "Theo Sun Address",
      details: [{
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
    ])

  });


});
