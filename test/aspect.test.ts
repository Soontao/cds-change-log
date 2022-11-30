
import { setupTest } from "./utils";


describe("Aspect Test Suite", () => {

  const axios = setupTest(__dirname, "./app")

  it('should support aspect annotation', async () => {
    let response = await axios.post("/sample/Peoples", { Name: "Theo Sun 2", Age: 39, SourceSystem: "SS1" })
    expect(response.status).toBe(201)
    const { ID } = response.data
    expect(ID).not.toBeUndefined()

    response = await axios.patch(`/sample/Peoples(${ID})`, { Name: "Theo Sun 9", Age: 12, SourceSystem: "SS2" })
    expect(response.status).toBe(200)

    response = await axios.get(`/sample/ChangeLogs?$orderby=actionAt asc&$expand=Items&$filter=entityKey eq ${ID}`)

    expect(response.status).toBe(200)

    expect(response.data.value).toMatchObject([
      {
        entityName: "People",
        action: "Create",
        Items: [
          {
            sequence: 0,
            attributeKey: "SourceSystem",
            attributeNewValue: "SS1",
            attributeOldValue: null,
          },
          {
            sequence: 1,
            attributeKey: "Name",
            attributeNewValue: "Theo Sun 2",
            attributeOldValue: null,
          },
          {
            sequence: 2,
            attributeKey: "Age",
            attributeNewValue: "39",
            attributeOldValue: null,
          },
        ],
      },
      {
        entityName: "People",
        action: "Update",
        Items: [
          {
            sequence: 0,
            attributeKey: "SourceSystem",
            attributeNewValue: "SS2",
            attributeOldValue: "SS1",
          },
          {
            sequence: 1,
            attributeKey: "Name",
            attributeNewValue: "Theo Sun 9",
            attributeOldValue: "Theo Sun 2",
          },
          {
            sequence: 2,
            attributeKey: "Age",
            attributeNewValue: "12",
            attributeOldValue: "39",
          },
        ],
      },
    ])
  });


});
