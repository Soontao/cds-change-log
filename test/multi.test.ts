
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

  it('should support insert hugh volume (1000) entries', async () => {

    await cds.run(INSERT.into("People").entries(Array(1000).fill(0).map((_, idx) => ({ Name: `Person_Hugh_${idx}`, Age: idx }))))

  });


  it('should support multi keys', async () => {

    const OrderID = 99;
    const PeopleID = '2e77d3bb-9023-475c-95f6-9796b99ff9ff'
    let response = await axios.post("/sample/PeopleOrderForProducts", { OrderID, PeopleID, Amount: 2.33 })
    expect(response.status).toBe(201)

    response = await axios.patch(`/sample/PeopleOrderForProducts(OrderID=${OrderID},PeopleID=${PeopleID})`, { Amount: 8.88 })
    expect(response.status).toBe(200)

    const changeLogs = await cds.run(
      SELECT
        .from(ENTITIES.CHANGELOG, (c: any) => { c("*"), c.Items('*') })
        .where({ entityKey: PeopleID, entityKeyInteger: OrderID })
    )
    expect(changeLogs).toHaveLength(2)
    expect(changeLogs).toMatchObject([
      {
        entityName: "PeopleOrderForProduct",
        entityKey: "2e77d3bb-9023-475c-95f6-9796b99ff9ff",
        action: "Create",
        entityKeyInteger: 99,
        Items: [
          {
            sequence: 0,
            attributeKey: "Amount",
            attributeNewValue: "2.33",
            attributeOldValue: null,
          },
        ],
      },
      {
        entityName: "PeopleOrderForProduct",
        entityKey: "2e77d3bb-9023-475c-95f6-9796b99ff9ff",
        action: "Update",
        entityKeyInteger: 99,
        Items: [
          {
            sequence: 0,
            attributeKey: "Amount",
            attributeNewValue: "8.88",
            attributeOldValue: "2.33",
          },
        ],
      },
    ])

  });




});
