
import { setupIgnoreStatus, setupTest } from "./utils";


describe("Demo Test Suite", () => {

  const axios = setupTest(__dirname, "./app")

  setupIgnoreStatus(axios)

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



});
