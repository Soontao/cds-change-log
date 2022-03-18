
import cds from "@sap/cds";
import { ENTITIES } from "../src/constants";
import { setupIgnoreStatus, setupTest } from "./utils";


describe('Locale Test Suite', () => {
  const axios = setupTest(__dirname, "./app")
  setupIgnoreStatus(axios)

  it('should support use another key', async () => {
    let response = await axios.post("/sample/Books", { Name: "The Old Man and the Sea", Price: 88.12 }, {
      headers: {
        'Accept-Language': 'en'
      }
    })

    expect(response.status).toBe(201)

    response = await axios.patch(`/sample/Books(${response.data.ID})`, { Name: "老人与海" }, {
      headers: {
        'Accept-Language': 'zh_CN'
      }
    })
    expect(response.status).toBe(200)

    const logs = await cds.run(
      SELECT
        .from(ENTITIES.CHANGELOG, (c: any) => { c("*"), c.Items('*') })
        .where({ entityName: 'Book', entityKey: response.data.ID })
    )

    expect(logs).toHaveLength(2)

  });

});
