const cds = require('@sap/cds')
const { applyChangeLog } = require("../../../src")
applyChangeLog(cds)
module.exports = cds.server
