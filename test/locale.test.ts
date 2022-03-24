
import { queryChangeLogs, setupIgnoreStatus, setupTest } from "./utils";


describe('Locale Test Suite', () => {
  const axios = setupTest(__dirname, "./app")
  setupIgnoreStatus(axios)

  it('should support use another key', async () => {
    let response = await axios.post("/sample/Books", { Name: "The Old Man and the Sea", Price: 88.12 }, {
      headers: {
        'Accept-Language': 'en'
      }
    })

    const entityKey = response.data.ID

    expect(response.status).toBe(201)

    response = await axios.post(`/sample/Books(${entityKey})/texts`, { Name: "老人与海", locale: "zh_CN" })
    expect(response.status).toBe(201)


    response = await axios.patch(`/sample/Books(${entityKey})/texts(ID=${entityKey},locale='zh_CN')`, { Name: "老人与海 (New)" })
    expect(response.status).toBe(200)
    response = await axios.delete(`/sample/Books(${entityKey})`)
    expect(response.status).toBe(204)

    const logs = await queryChangeLogs({ entityName: { in: ["Book", "Book.texts"] }, entityKey, })

    expect(logs).toHaveLength(5)

    expect(logs).toMatchObject([
      {
        entityName: "Book",
        locale: "en",
        action: "Create",
        actionBy: "anonymous",
        Items: [
          {
            sequence: 0,
            attributeKey: "Name",
            attributeNewValue: "The Old Man and the Sea",
            attributeOldValue: null,
          },
          {
            sequence: 1,
            attributeKey: "Price",
            attributeNewValue: "88.12",
            attributeOldValue: null,
          },
        ],
      },
      {
        entityName: "Book.texts",
        locale: "zh_CN",
        action: "Create",
        actionBy: "anonymous",
        Items: [
          {
            sequence: 0,
            attributeKey: "Name",
            attributeNewValue: "老人与海",
            attributeOldValue: null,
          },
        ],
      },
      {
        entityName: "Book.texts",
        locale: "zh_CN",
        action: "Update",
        actionBy: "anonymous",
        Items: [
          {
            sequence: 0,
            attributeKey: "Name",
            attributeNewValue: "老人与海 (New)",
            attributeOldValue: "老人与海",
          },
        ],
      },
      {
        entityName: "Book.texts",
        locale: "zh_CN",
        action: "Delete",
        actionBy: "anonymous",
        Items: [
          {
            sequence: 0,
            attributeKey: "Name",
            attributeNewValue: null,
            attributeOldValue: "老人与海 (New)",
          },
        ],
      },
      {
        entityName: "Book",
        locale: "en",
        action: "Delete",
        actionBy: "anonymous",
        Items: [
          {
            sequence: 0,
            attributeKey: "Name",
            attributeNewValue: null,
            attributeOldValue: "The Old Man and the Sea",
          },
          {
            sequence: 1,
            attributeKey: "Price",
            attributeNewValue: null,
            attributeOldValue: "88.12",
          },
        ],
      },
    ])

  });

});
