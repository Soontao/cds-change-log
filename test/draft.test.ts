
import { queryChangeLogs, setupIgnoreStatus, setupTest } from "./utils";


describe("Draft Enabled Test Suite", () => {

  const axios = setupTest(__dirname, "./app")

  setupIgnoreStatus(axios)

  it('should support create records with draft enabled', async () => {
    let draftItemResponse = await axios.post("/sample/Forms", {}, {
      headers: {
        Accept: "application/json;charset=UTF-8;IEEE754Compatible=true"
      }
    })
    expect(draftItemResponse.status).toBe(201)
    expect(draftItemResponse.data).toMatchObject({
      HasActiveEntity: false,
      HasDraftEntity: false,
      IsActiveEntity: false
    })

    const { ID } = draftItemResponse.data;

    draftItemResponse = await axios.patch(`/sample/Forms(ID=${ID},IsActiveEntity=false)`, {
      f1: "value f1"
    })
    expect(draftItemResponse.status).toBe(200)


    // final save create
    draftItemResponse = await axios.post(`/sample/Forms(ID=${ID},IsActiveEntity=false)/test.app.srv.s1.SampleService.draftActivate`)
    expect(draftItemResponse.status).toBe(201)

    // go to edit mode
    draftItemResponse = await axios.post(`/sample/Forms(ID=${ID},IsActiveEntity=true)/test.app.srv.s1.SampleService.draftEdit`, {})

    expect(draftItemResponse.status).toBe(201)

    expect(draftItemResponse.data).toMatchObject({
      HasActiveEntity: true,
      HasDraftEntity: false,
      IsActiveEntity: false,
      ID
    })

    draftItemResponse = await axios.patch(`/sample/Forms(ID=${ID},IsActiveEntity=false)`, {
      f1: "value f1 updated",
      f2: "value f2",
      f3: 128,
      f4: 99.99,
    })
    expect(draftItemResponse.status).toBe(200)

    draftItemResponse = await axios.post(`/sample/Forms(ID=${ID},IsActiveEntity=false)/test.app.srv.s1.SampleService.draftActivate`)
    expect(draftItemResponse.status).toBe(201)

    const logs = await queryChangeLogs({
      entityName: "Form",
      entityKey: ID,
    })

    expect(logs).toHaveLength(2)
    expect(logs[0].Items).toHaveLength(1)
    expect(logs[0].action).toBe("Create")
    expect(logs[1].Items).toHaveLength(4)
    expect(logs[1].action).toBe("Update")


  });



});
