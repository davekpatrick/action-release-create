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
  let mockActionsCore
  let mockCreateRelease

  beforeEach(() => {
    // Setup mocks for each test
    mockActionsCore = {
      startGroup: function() {},
      endGroup: function() {},
      info: function() {},
      debug: function() {},
      setSecret: function() {},
      setFailed: function() {},
      setOutput: function() {},
      getInput: function() { return '' }
    }
    
    mockCreateRelease = function() {
      return Promise.resolve({ exitCode: 0, releaseUrl: 'https://github.com/test/repo/releases/tag/v1.0.0' })
    }
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

  it("Should fail when no API token is provided", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies that the function fails when no API token is provided
    // - Tests both input and environment token scenarios
    // ---------------------------------------------------
    let setFailedCalls = []
    
    mockActionsCore.getInput = function(name) {
      if (name === 'apiToken') return ''
      if (name === 'versionTag') return '1.0.0'  // Provide valid version so it doesn't fail on that
      if (name === 'versionPrefix') return 'v'  // Provide valid prefix so it doesn't fail on that
      return ''
    }
    
    mockActionsCore.setFailed = function(message) {
      setFailedCalls.push(message)
    }
    
    // Mock environment without GITHUB_TOKEN
    const originalToken = process.env.GITHUB_TOKEN
    process.env.GITHUB_TOKEN = ''
    
    // execute the test
    const indexModule = proxyquire(modulePath, {
      '@actions/core': mockActionsCore,
      './create-release.js': mockCreateRelease
    })
    
    await indexModule()
    
    // Restore environment
    if (originalToken) process.env.GITHUB_TOKEN = originalToken
    else delete process.env.GITHUB_TOKEN
    
    // Validate the test result
    expect(setFailedCalls).to.include('No API token found')
  });

  it("Should fail when no version tag is provided", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies that the function fails when no version tag is provided
    // - Note: The function actually fails with 'Invalid version tag []' because
    // - it continues execution after the first setFailed call
    // ---------------------------------------------------
    let setFailedCalls = []
    
    mockActionsCore.getInput = function(name) {
      if (name === 'apiToken') return 'ghp_test_token'  // Provide valid token so it doesn't fail on that
      if (name === 'versionTag') return ''
      if (name === 'versionPrefix') return 'v'  // Provide valid prefix so it doesn't fail on that
      return ''
    }
    
    mockActionsCore.setFailed = function(message) {
      setFailedCalls.push(message)
    }
    
    // execute the test
    const indexModule = proxyquire(modulePath, {
      '@actions/core': mockActionsCore,
      './create-release.js': mockCreateRelease
    })
    
    await indexModule()
    
    // Validate the test result
    expect(setFailedCalls).to.include('No version tag specified')
    expect(setFailedCalls).to.include('Invalid version tag []')
  });

  it("Should fail when no version prefix is provided", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies that the function fails when no version prefix is provided
    // ---------------------------------------------------
    let setFailedCalled = false
    let failedMessage = ''
    
    mockActionsCore.getInput = function(name) {
      if (name === 'apiToken') return 'ghp_test_token'
      if (name === 'versionTag') return '1.0.0'
      if (name === 'versionPrefix') return ''
      return ''
    }
    
    mockActionsCore.setFailed = function(message) {
      setFailedCalled = true
      failedMessage = message
    }
    
    // execute the test
    const indexModule = proxyquire(modulePath, {
      '@actions/core': mockActionsCore,
      './create-release.js': mockCreateRelease
    })
    
    await indexModule()
    
    // Validate the test result
    expect(setFailedCalled).to.be.true
    expect(failedMessage).to.equal('No version prefix specified')
  });

  it("Should fail when invalid version tag is provided", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies that the function fails when an invalid semver version tag is provided
    // ---------------------------------------------------
    let setFailedCalled = false
    let failedMessage = ''
    
    mockActionsCore.getInput = function(name) {
      if (name === 'apiToken') return 'ghp_test_token'
      if (name === 'versionTag') return 'invalid-version'
      if (name === 'versionPrefix') return 'v'
      return ''
    }
    
    mockActionsCore.setFailed = function(message) {
      setFailedCalled = true
      failedMessage = message
    }
    
    // execute the test
    const indexModule = proxyquire(modulePath, {
      '@actions/core': mockActionsCore,
      './create-release.js': mockCreateRelease
    })
    
    await indexModule()
    
    // Validate the test result
    expect(setFailedCalled).to.be.true
    expect(failedMessage).to.equal('Invalid version tag [invalid-version]')
  });

  it("Should use environment GITHUB_TOKEN when input token is not provided", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies that the function uses GITHUB_TOKEN environment variable
    // - when the apiToken input is not provided
    // ---------------------------------------------------
    let createReleaseCalled = false
    let createReleaseArgs = []
    
    mockActionsCore.getInput = function(name) {
      if (name === 'apiToken') return ''
      if (name === 'versionTag') return '1.0.0'
      if (name === 'versionPrefix') return 'v'
      return ''
    }
    
    mockCreateRelease = function(...args) {
      createReleaseCalled = true
      createReleaseArgs = args
      return Promise.resolve({ exitCode: 0, releaseUrl: 'https://github.com/test/repo/releases/tag/v1.0.0' })
    }
    
    // Set environment token
    const originalToken = process.env.GITHUB_TOKEN
    process.env.GITHUB_TOKEN = 'env_test_token'
    
    // execute the test
    const indexModule = proxyquire(modulePath, {
      '@actions/core': mockActionsCore,
      './create-release.js': mockCreateRelease
    })
    
    await indexModule()
    
    // Restore environment
    if (originalToken) process.env.GITHUB_TOKEN = originalToken
    else delete process.env.GITHUB_TOKEN
    
    // Validate the test result
    expect(createReleaseCalled).to.be.true
    expect(createReleaseArgs[0]).to.equal('env_test_token')
    expect(createReleaseArgs[1]).to.equal('v')
    expect(createReleaseArgs[2]).to.equal('1.0.0')
    expect(createReleaseArgs[3]).to.equal('release')
  });

  it("Should successfully create release with valid inputs", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies that the function successfully calls createRelease
    // - when all valid inputs are provided
    // ---------------------------------------------------
    let createReleaseCalled = false
    let createReleaseArgs = []
    let infoMessages = []
    
    mockActionsCore.getInput = function(name) {
      if (name === 'apiToken') return 'ghp_input_token'
      if (name === 'versionTag') return '2.1.0'
      if (name === 'versionPrefix') return 'v'
      return ''
    }
    
    mockActionsCore.info = function(message) {
      infoMessages.push(message)
    }
    
    mockCreateRelease = function(...args) {
      createReleaseCalled = true
      createReleaseArgs = args
      return Promise.resolve({ exitCode: 0, releaseUrl: 'https://github.com/test/repo/releases/tag/v2.1.0' })
    }
    
    // execute the test
    const indexModule = proxyquire(modulePath, {
      '@actions/core': mockActionsCore,
      './create-release.js': mockCreateRelease
    })
    
    await indexModule()
    
    // Validate the test result
    expect(createReleaseCalled).to.be.true
    expect(createReleaseArgs[0]).to.equal('ghp_input_token')
    expect(createReleaseArgs[1]).to.equal('v')
    expect(createReleaseArgs[2]).to.equal('2.1.0')
    expect(createReleaseArgs[3]).to.equal('release')
    expect(infoMessages).to.include('versionTag[2.1.0]')
  });

  it("Should handle errors from createRelease", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies that the function handles errors thrown by createRelease
    // ---------------------------------------------------
    let setFailedCalled = false
    let failedMessage = ''
    
    mockActionsCore.getInput = function(name) {
      if (name === 'apiToken') return 'ghp_test_token'
      if (name === 'versionTag') return '1.0.0'
      if (name === 'versionPrefix') return 'v'
      return ''
    }
    
    mockActionsCore.setFailed = function(message) {
      setFailedCalled = true
      failedMessage = message
    }
    
    mockCreateRelease = function() {
      throw new Error('GitHub API error')
    }
    
    // execute the test
    const indexModule = proxyquire(modulePath, {
      '@actions/core': mockActionsCore,
      './create-release.js': mockCreateRelease
    })
    
    await indexModule()
    
    // Validate the test result
    expect(setFailedCalled).to.be.true
    expect(failedMessage).to.equal('GitHub API error')
  });

});
// EOF
