import type { AxiosInstance } from "axios";

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
  const cds = require("@sap/cds") as any
  const { axios } = cds.test(".").in(...path)
  return axios
}
