
import cds from "@sap/cds";
import { ENTITIES } from "../src/constants";
import { setupIgnoreStatus, setupTest } from "./utils";


describe("Multi Change Test Suite", () => {

  const axios = setupTest(__dirname, "./app")

  setupIgnoreStatus(axios)

  it('should support insert multi values', async () => {

    const { req: { data: results } } = await cds.run(INSERT.into("People").entries({ Name: "people001", Age: 99 }, { Name: "people001", Age: 25 }))

    const changeLogs = await cds.run(
      SELECT
        .from(ENTITIES.CHANGELOG, (c: any) => { c("*"), c.Items('*') })
        .where({ entityKey: { in: results.map((result: any) => result.ID) } })
    )
    expect(changeLogs).toHaveLength(2)

    expect(changeLogs).toMatchObject([
      {
        entityName: "People",
        action: "Create",
        Items: [
          {
            sequence: 0,
            attributeKey: "Name",
            attributeNewValue: "people001",
            attributeOldValue: null,
          },
          {
            sequence: 1,
            attributeKey: "Age",
            attributeNewValue: "99",
            attributeOldValue: null,
          },
        ],
      },
      {
        entityName: "People",
        action: "Create",
        Items: [
          {
            sequence: 0,
            attributeKey: "Name",
            attributeNewValue: "people001",
            attributeOldValue: null,
          },
          {
            sequence: 1,
            attributeKey: "Age",
            attributeNewValue: "25",
            attributeOldValue: null,
          },
        ],
      },
    ])
  });

  it('should support delete multi value', async () => {

    await cds.run(DELETE.from("People"))

    const result = await cds.run(SELECT.one.from("People").columns("count(1) as total"))

    expect(result?.total ?? result?.TOTAL).toBe(0)
  });




});
