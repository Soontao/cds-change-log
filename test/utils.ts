import { cwdRequireCDS } from "cds-internal-tool";
import { ENTITIES } from "../src/constants";

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


export { setupTest } from "cds-internal-tool";

export const queryChangeLogs = (where: { entityName: any, entityKey?: string, [key: string]: any }): Promise<Array<any>> => {
  const cds = cwdRequireCDS()
  return cds.run(
    cds.ql.SELECT
      .from(ENTITIES.CHANGELOG, (c: any) => { c("*"), c.Items('*') })
      .where(where)
  )
}
