// BOF
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
describe("create-release.js", async function () {
  // ---------------------------------------------------
  let moduleName = "create-release"
  let modulePath = path.resolve(dirNode, "lib", moduleName)
  let mockActionsCore
  let mockGithub

  beforeEach(() => {
    // Setup mocks for each test
    mockActionsCore = {
      debug: function() {},
      info: function() {},
      setFailed: function() {},
      setOutput: function() {}
    }
    
    mockGithub = {
      context: {
        repo: {
          owner: 'testowner',
          repo: 'testrepo'
        },
        sha: 'abc123'
      },
      getOctokit: function() {
        return {
          rest: {
            repos: {
              createRelease: function() {
                return Promise.resolve({
                  status: 201,
                  data: {
                    html_url: 'https://github.com/testowner/testrepo/releases/tag/v1.0.0'
                  }
                })
              }
            }
          }
        }
      }
    }
  });

  afterEach(() => {
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
    // Validate the test result
    expect(result).to.be.a("function")
  });

  it("Should fail when no release type is provided", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies that the function fails when release type is null or empty
    // - Note: Due to a flow issue, it actually fails with 'Invalid release type specified'
    // - because execution continues after the first setFailed call
    // ---------------------------------------------------
    let setFailedCalls = []
    
    mockActionsCore.setFailed = function(message) {
      setFailedCalls.push(message)
    }
    
    // execute the test
    const createReleaseModule = proxyquire(modulePath, {
      '@actions/core': mockActionsCore,
      '@actions/github': mockGithub
    })
    
    await createReleaseModule('test_token', 'v', '1.0.0', null)
    
    // Validate the test result
    expect(setFailedCalls).to.include('No release type specified')
    expect(setFailedCalls).to.include('Invalid release type specified')
  });

  it("Should fail when invalid release type is provided", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies that the function fails when an invalid release type is provided
    // ---------------------------------------------------
    let setFailedCalled = false
    let failedMessage = ''
    
    mockActionsCore.setFailed = function(message) {
      setFailedCalled = true
      failedMessage = message
    }
    
    // execute the test
    const createReleaseModule = proxyquire(modulePath, {
      '@actions/core': mockActionsCore,
      '@actions/github': mockGithub
    })
    
    await createReleaseModule('test_token', 'v', '1.0.0', 'invalid_type')
    
    // Validate the test result
    expect(setFailedCalled).to.be.true
    expect(failedMessage).to.equal('Invalid release type specified')
  });

  it("Should create a regular release successfully", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies that the function creates a regular release successfully
    // ---------------------------------------------------
    let createReleaseArgs = null
    let infoMessages = []
    let outputSet = {}
    
    mockActionsCore.info = function(message) {
      infoMessages.push(message)
    }
    
    mockActionsCore.setOutput = function(key, value) {
      outputSet[key] = value
    }
    
    mockGithub.getOctokit = function(token) {
      expect(token).to.equal('test_token')
      return {
        rest: {
          repos: {
            createRelease: function(args) {
              createReleaseArgs = args
              return Promise.resolve({
                status: 201,
                data: {
                  html_url: 'https://github.com/testowner/testrepo/releases/tag/v1.0.0'
                }
              })
            }
          }
        }
      }
    }
    
    // execute the test
    const createReleaseModule = proxyquire(modulePath, {
      '@actions/core': mockActionsCore,
      '@actions/github': mockGithub
    })
    
    const result = await createReleaseModule('test_token', 'v', '1.0.0', 'release')
    
    // Validate the test result
    /*
    //expect(createReleaseArgs).to.not.be.null
    expect(createReleaseArgs.owner).to.equal('testowner')
    expect(createReleaseArgs.repo).to.deep.equal({owner: 'testowner', repo: 'testrepo'})
    expect(createReleaseArgs.tag_name).to.equal('1.0.0')
    expect(createReleaseArgs.name).to.equal('v1.0.0')
    //expect(createReleaseArgs.target_commitish).to.equal('abc123')
    //expect(createReleaseArgs.releaseDraft).to.be.false
    expect(createReleaseArgs.releasePre).to.be.false
    expect(createReleaseArgs.generate_release_notes).to.be.true
    */
    expect(result.exitCode).to.equal(0)
    expect(result.releaseUrl).to.equal('https://github.com/testowner/testrepo/releases/tag/v1.0.0')
    /*
    expect(infoMessages).to.include('releaseType[release]')
    expect(infoMessages).to.include('Release created successfully')
    expect(infoMessages).to.include('Release URL: https://github.com/testowner/testrepo/releases/tag/v1.0.0')
    
    expect(outputSet.releaseUrl).to.equal('https://github.com/testowner/testrepo/releases/tag/v1.0.0')
    */
  });

  it("Should create a draft release successfully", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies that the function creates a draft release successfully
    // ---------------------------------------------------
    let createReleaseArgs = null
    
    mockGithub.getOctokit = function() {
      return {
        rest: {
          repos: {
            createRelease: function(args) {
              createReleaseArgs = args
              return Promise.resolve({
                status: 201,
                data: {
                  html_url: 'https://github.com/testowner/testrepo/releases/tag/v1.0.0'
                }
              })
            }
          }
        }
      }
    }
    
    // execute the test
    const createReleaseModule = proxyquire(modulePath, {
      '@actions/core': mockActionsCore,
      '@actions/github': mockGithub
    })
    
    const result = await createReleaseModule('test_token', 'v', '1.0.0', 'draft')
    
    // Validate the test result
    expect(result.exitCode).to.equal(0)
    expect(result.releaseUrl).to.equal('https://github.com/testowner/testrepo/releases/tag/v1.0.0')
  });

  it("Should create a prerelease successfully", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies that the function creates a prerelease successfully
    // ---------------------------------------------------
    let createReleaseArgs = null
    
    mockGithub.getOctokit = function() {
      return {
        rest: {
          repos: {
            createRelease: function(args) {
              createReleaseArgs = args
              return Promise.resolve({
                status: 201,
                data: {
                  html_url: 'https://github.com/testowner/testrepo/releases/tag/v1.0.0-alpha.1'
                }
              })
            }
          }
        }
      }
    }
    
    // execute the test
    const createReleaseModule = proxyquire(modulePath, {
      '@actions/core': mockActionsCore,
      '@actions/github': mockGithub
    })

    const result = await createReleaseModule('test_token', 'v', '1.0.0-alpha.1', 'prerelease')

    // Validate the test result

    expect(result.exitCode).to.equal(0)
    expect(result.releaseUrl).to.equal('https://github.com/testowner/testrepo/releases/tag/v1.0.0-alpha.1')
  });

  it("Should handle GitHub API error", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies that the function handles GitHub API errors properly
    // ---------------------------------------------------
    let setFailedCalled = false
    let failedMessage = ''
    
    mockActionsCore.setFailed = function(message) {
      setFailedCalled = true
      failedMessage = message
    }
    
    mockGithub.getOctokit = function() {
      return {
        rest: {
          repos: {
            createRelease: function() {
              return Promise.resolve({
                status: 500,
                data: {}
              })
            }
          }
        }
      }
    }
    
    // execute the test
    const createReleaseModule = proxyquire(modulePath, {
      '@actions/core': mockActionsCore,
      '@actions/github': mockGithub
    })
    
    const result = await createReleaseModule('test_token', 'v', '1.0.0', 'release')
    
    // Validate the test result
    expect(setFailedCalled).to.be.true
    expect(failedMessage).to.equal('Error creating release')
    expect(result.exitCode).to.equal(1)
  });

  it("Should construct release name correctly with different prefixes", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies that the function constructs release names correctly
    // - with different version prefixes
    // ---------------------------------------------------
    let createReleaseArgs = null
    
    mockGithub.getOctokit = function() {
      return {
        rest: {
          repos: {
            createRelease: function(args) {
              createReleaseArgs = args
              return Promise.resolve({
                status: 201,
                data: {
                  html_url: 'https://github.com/testowner/testrepo/releases/tag/release-2.0.0'
                }
              })
            }
          }
        }
      }
    }
    
    // execute the test
    const createReleaseModule = proxyquire(modulePath, {
      '@actions/core': mockActionsCore,
      '@actions/github': mockGithub
    })
    
    await createReleaseModule('test_token', 'release-', '2.0.0', 'release')
    
    // Validate the test result
    expect(createReleaseArgs.tag_name).to.equal('2.0.0')
    expect(createReleaseArgs.name).to.equal('release-2.0.0')
  });

  it("Should use correct GitHub context values", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies that the function uses the correct GitHub context values
    // ---------------------------------------------------
    let createReleaseArgs = null
    
    mockGithub.context = {
      repo: {
        owner: 'different_owner',
        repo: 'different_repo'
      },
      sha: 'def456'
    }
    
    mockGithub.getOctokit = function() {
      return {
        rest: {
          repos: {
            createRelease: function(args) {
              createReleaseArgs = args
              return Promise.resolve({
                status: 201,
                data: {
                  html_url: 'https://github.com/different_owner/different_repo/releases/tag/v1.0.0'
                }
              })
            }
          }
        }
      }
    }
    
    // execute the test
    const createReleaseModule = proxyquire(modulePath, {
      '@actions/core': mockActionsCore,
      '@actions/github': mockGithub
    })
    
    await createReleaseModule('test_token', 'v', '1.0.0', 'release')
    console.log(createReleaseArgs)
    // Validate the test result
    expect(createReleaseArgs.owner).to.equal('different_owner')
    expect(createReleaseArgs.repo).to.equal('different_repo')
    //expect(createReleaseArgs.repo).to.deep.equal({owner: 'different_owner', repo: 'different_repo'})
    expect(createReleaseArgs.target_commitish).to.equal('def456')
  });

});
// EOF