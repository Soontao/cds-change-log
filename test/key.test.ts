
import cds from "@sap/cds";
import { ENTITIES } from "../src/constants";
import { setupIgnoreStatus, setupTest } from "./utils";


describe('Key Extension Test Suite', () => {
  const axios = setupTest(__dirname, "./app")
  setupIgnoreStatus(axios)

  it('should support use another key', async () => {
    const response = await axios.post("/sample/Orders", { ID: 1, Amount: 99.99 })
    expect(response.status).toBe(201)
    const logs = await cds.run(SELECT.from(ENTITIES.CHANGELOG, (c: any) => { c['*'], c.Items('*') }).where({ entityKeyInteger: 1 }))
    expect(logs).toHaveLength(1)

    expect(logs[0]).toMatchObject({
      entityName: "Order",
      entityKey: null,
      action: "Create",
      entityKeyInteger: 1,
      Items: [
        {
          sequence: 0,
          attributeKey: "Amount",
          attributeNewValue: "99.99",
          attributeOldValue: null,
        },
      ],
    })
  });

});