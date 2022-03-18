
import { setupIgnoreStatus, setupTest } from "./utils";


describe('Exception Test Suite', () => {
  const axios = setupTest(__dirname, "./app")
  setupIgnoreStatus(axios)

  it('should support use another key', async () => {
    const response = await axios.post("/sample/Orders3", { ID: 1, Amount: 99.99 })
    expect(response.status).toBe(500)
    expect(response.data.error.message).toBe("CDS Change Log: not found proper column to store value of 'Order3'.'ID'")
  });

});
