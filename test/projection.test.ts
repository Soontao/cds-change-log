
import { setupIgnoreStatus, setupTest } from "./utils";


describe("Projection Test Suite", () => {

  const axios = setupTest(__dirname, "./app")

  setupIgnoreStatus(axios)

  it('should support connect to service', async () => {
    const { data } = await axios.get("/sample/$metadata")
    expect(data).toMatch(/ProjectedPeople/)
  });

  it('should support query data', async () => {
    const response = await axios.get("/sample/ProjectedPeople")
    expect(response.status).toBe(200)
    expect(response.data.value).toHaveLength(0)
  });

  it('should support create data', async () => {
    const response = await axios.post("/sample/ProjectedPeople", { Name: "Theo Sun", Age: 27 })
    expect(response.status).toBe(201)
  });


  it('should support update data', async () => {
    let response = await axios.post("/sample/ProjectedPeople", { Name: "Theo Sun 2", Age: 39 })
    expect(response.status).toBe(201)
    const { ID } = response.data
    expect(ID).not.toBeUndefined()

    response = await axios.patch(`/sample/ProjectedPeople(${ID})`, { Name: "Theo Sun 9", Age: 12 })
    expect(response.status).toBe(200)


    response = await axios.get(`/sample/ChangeLogs?$orderby=createdAt asc&$expand=Items&$filter=cdsEntityKey eq ${ID}`)

    expect(response.status).toBe(200)

    expect(response.data.value).toMatchObject([
      {
        modifiedBy: "anonymous",
        cdsEntityName: "People",
        changeLogAction: "Create",
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
        cdsEntityName: "People",
        changeLogAction: "Update",
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
    let response = await axios.post("/sample/ProjectedPeople", { Name: "Theo Sun", Age: 27 })
    expect(response.status).toBe(201)

    const { ID } = response.data
    expect(ID).not.toBeUndefined()
    response = await axios.delete(`/sample/ProjectedPeople(${ID})`)
    expect(response.status).toBe(204)

    response = await axios.get(`/sample/ChangeLogs?$expand=Items&$filter=cdsEntityKey eq ${ID}`)
    expect(response.status).toBe(200)
    expect(response.data.value).toHaveLength(2)
  });


});
