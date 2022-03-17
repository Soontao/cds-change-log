
import { setupIgnoreStatus, setupTest } from "./utils";


describe('Key Test Suite', () => {
  const axios = setupTest(__dirname, "./app")
  setupIgnoreStatus(axios)

  it('should support use another key', async () => {
    await axios.post("/sample/Orders", { Amount: 99.99 })
  });

});