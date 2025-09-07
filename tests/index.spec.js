// BOF
const { group } = require("node:console");
const path = require("node:path");
// project directories
const dirRoot = path.normalize(__dirname + path.sep + "..");
const dirNode = path.resolve(dirRoot, "node");
const dirNodeModules = path.resolve(dirNode, "node_modules");
// test required modules
const { describe } = require("node:test")
// doc: https://www.chaijs.com/guide/styles/  ( BDD 'expect' assertion is being used vs the 'should' assertion style )
//      https://www.chaijs.com/api/bdd/
const expect = require(dirNodeModules + path.sep + "chai").expect
const proxyquire = require(dirNodeModules + path.sep + "proxyquire")
// ---------------------------------------------------
// ---------------------------------------------------
describe("index.js", async function () {
  // ---------------------------------------------------
  let moduleName = "index"
  let modulePath = path.resolve(dirNode, "lib", moduleName)

  beforeEach(() => {
    //
  });

  afterEach(() => {
    //
    proxyquire.preserveCache()
  });
  // ---------------------------------------------------
  // ---------------------------------------------------
  
  it("Should be a function", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies that the module exports a function
    // - This is a basic sanity check to ensure the module is structured correctly
    // ---------------------------------------------------
    // fixture inputs
    let requiredFile = modulePath
    // execute the test
    const result = require(requiredFile)
    console.log("result:[" + typeof result + "]")
    // Validate the test result
    expect(result).to.be.a("function")
  });

});
// EOF
