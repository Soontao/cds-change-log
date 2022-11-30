
import { setupTest } from "./utils";


describe("Basic Test Suite", () => {

  const axios = setupTest(__dirname, "./app")

  it('should support connect to service', async () => {
    const { data } = await axios.get("/sample/$metadata")
    expect(data).toMatch(/Peoples/)
  });

  it('should support query data', async () => {
    const response = await axios.get("/sample/Peoples")
    expect(response.status).toBe(200)
    expect(response.data.value).toHaveLength(0)
  });

  it('should support create data', async () => {
    const response = await axios.post("/sample/Peoples", { Name: "Theo Sun", Age: 27 })
    expect(response.status).toBe(201)
  });


  it('should support update data', async () => {
    let response = await axios.post("/sample/Peoples", { Name: "Theo Sun 2", Age: 39 })
    expect(response.status).toBe(201)
    const { ID } = response.data
    expect(ID).not.toBeUndefined()

    response = await axios.patch(`/sample/Peoples(${ID})`, { Name: "Theo Sun 9", Age: 12 })
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
            attributeKey: "Name",
            attributeNewValue: "Theo Sun 2",
            attributeOldValue: null,
          },
          {
            sequence: 1,
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
            attributeKey: "Name",
            attributeNewValue: "Theo Sun 9",
            attributeOldValue: "Theo Sun 2",
          },
          {
            sequence: 1,
            attributeKey: "Age",
            attributeNewValue: "12",
            attributeOldValue: "39",
          },
        ],
      },
    ])
  });

  it('should support delete data', async () => {
    let response = await axios.post("/sample/Peoples", { Name: "Theo Sun", Age: 27 })
    expect(response.status).toBe(201)

    const { ID } = response.data
    expect(ID).not.toBeUndefined()
    response = await axios.delete(`/sample/Peoples(${ID})`)
    expect(response.status).toBe(204)

    response = await axios.get(`/sample/ChangeLogs?$orderby=actionAt asc&$expand=Items&$filter=entityKey eq ${ID}`)
    expect(response.status).toBe(200)
    expect(response.data.value).toHaveLength(2)

    expect(response.data.value).toMatchObject([
      {
        entityName: "People",
        action: "Create",
        Items: [
          {
            sequence: 0,
            attributeKey: "Name",
            attributeNewValue: "Theo Sun",
            attributeOldValue: null,
          },
          {
            sequence: 1,
            attributeKey: "Age",
            attributeNewValue: "27",
            attributeOldValue: null,
          },
        ],
      },
      {
        entityName: "People",
        action: "Delete",
        Items: [
          {
            sequence: 0,
            attributeKey: "Name",
            attributeNewValue: null,
            attributeOldValue: "Theo Sun",
          },
          {
            sequence: 1,
            attributeKey: "Age",
            attributeNewValue: null,
            attributeOldValue: "27",
          },
        ],
      },
    ])
  });

  it('should support mixin', async () => {
    const response = await axios.get(`/sample/PeopleWithChangeLog?$expand=changeLogs($expand=Items)`)
    expect(response.status).toBe(200)
  });


});
