
import { setupIgnoreStatus, setupTest } from "./utils";


describe("Extension Fields Test Suite", () => {

  const axios = setupTest(__dirname, "./app")

  setupIgnoreStatus(axios)

  it('should support extend annotation', async () => {
    let response = await axios.post("/sample/Peoples", { Name: "Theo Sun 2", Age: 39, SourceSystem: "SS1", Weight: 75.1 })
    expect(response.status).toBe(201)
    const { ID } = response.data
    expect(ID).not.toBeUndefined()

    response = await axios.patch(`/sample/Peoples(${ID})`, { Name: "Theo Sun 9", Age: 12, SourceSystem: "SS2", Weight: 75.3 })
    expect(response.status).toBe(200)

    response = await axios.get(`/sample/ChangeLogs?$orderby=createdAt asc&$expand=Items&$filter=cdsEntityKey eq ${ID}`)

    expect(response.status).toBe(200)

    expect(response.data.value).toMatchObject([
      {
        cdsEntityName: "People",
        changeLogAction: "Create",
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
          {
            sequence: 3,
            attributeKey: "Weight",
            attributeNewValue: "75.1",
            attributeOldValue: null,
          },
        ],
      },
      {
        cdsEntityName: "People",
        changeLogAction: "Update",
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
          {
            sequence: 3,
            attributeKey: "Weight",
            attributeNewValue: "75.3",
            attributeOldValue: "75.1",
          },
        ],
      },
    ])
  });


});
