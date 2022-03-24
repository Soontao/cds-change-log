import type { AxiosInstance } from "axios";
import { ENTITIES } from "../src/constants";
import { CDS } from "../src/type";

/**
 * setup a global test user with HTTP basic auth
 * @param axios 
 * @returns 
 */
export const setupBasicAuth = (axios: any) => {
  axios.defaults.auth = {
    username: "Theo Sun",
  }
  return axios
}

export const setupIgnoreStatus = (axios: any) => {
  axios.defaults.validateStatus = () => true
  return axios
}

export const setupTest = (...path: Array<string>): AxiosInstance => {
  const cds = require("@sap/cds") as CDS
  const { axios } = cds.test(".").in(...path)
  return axios
}


export const queryChangeLogs = (where: { entityName: any, entityKey?: string, [key: string]: any }): Promise<Array<any>> => {
  const cds = require("@sap/cds")
  return cds.run(
    cds.ql.SELECT
      .from(ENTITIES.CHANGELOG, (c: any) => { c("*"), c.Items('*') })
      .where(where)
  )
}