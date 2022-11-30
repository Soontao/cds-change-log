
import cds from "@sap/cds";
import { ENTITIES } from "../src/constants";
import { setupTest } from "./utils";


describe("Auth Test Suite", () => {

  const axios = setupTest(__dirname, "./app")

  it('should support create data with (user name)', async () => {
    const response = await axios.post("/auth/Peoples", { Name: "Theo Sun", Age: 27 }, {
      auth: {
        username: 'random user',
        password: 'any'
      }
    })

    expect(response.status).toBe(201)

    const logs = await cds.run(SELECT.from(ENTITIES.CHANGELOG, (c: any) => { c['*'], c.Items('*') }).where({ entityKey: response.data.ID }))

    expect(logs).toHaveLength(1)

    expect(logs[0].actionBy).toBe("random user")
  });


});
