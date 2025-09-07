// BOF
// ------------------------------------
const packageName = '@@NPM_PACKAGE_NAME@@'
const packageVersion = '@@NPM_PACKAGE_VERSION@@'
// ------------------------------------
// Node.js built-in modules
// ------------------------------------
// None
// ------------------------------------
// External modules
// ------------------------------------
const actionsCore = require('@actions/core') // Microsoft's actions toolkit
const semver = require('semver') // Node's semver package
// ------------------------------------
// Internal modules
// ------------------------------------
const createRelease = require('./create-release.js')
// ------------------------------------
// Main
// ------------------------------------
module.exports = async function main() {
  try {
    // ------------------------------------
    // ------------------------------------
    actionsCore.startGroup('Initialize')
    actionsCore.info(
      'package[' + packageName + ']' + ' version[' + packageVersion + ']'
    )
    // NOTE: inputs and outputs are defined in action.yml metadata file
    const argApiToken = actionsCore.getInput('apiToken')
    const envApiToken = process.env.GITHUB_TOKEN // doc: https://nodejs.org/dist/latest-v8.x/docs/api/process.html#process_process_env
    // Ensure we have a usable API token
    var apiToken = null
    if (
      argApiToken !== null &&
      argApiToken !== '' &&
      argApiToken !== undefined
    ) {
      actionsCore.debug('API token input provided')
      apiToken = argApiToken
    } else if (
      envApiToken !== null &&
      envApiToken !== '' &&
      envApiToken !== undefined
    ) {
      actionsCore.debug('Environment API token found')
      apiToken = envApiToken
    } else {
      actionsCore.setFailed('No API token found')
    }
    actionsCore.setSecret(apiToken) // ensure we do not log sensitive data
    // semver version to use for the tag
    const argVersionTag = actionsCore.getInput('versionTag')
    if (argVersionTag === null || argVersionTag === '') {
      actionsCore.setFailed('No version tag specified')
    }
    // version prefix to use for the tag
    const argVersionPrefix = actionsCore.getInput('versionPrefix')
    if (argVersionPrefix !== null && argVersionPrefix !== '') {
      actionsCore.debug('versionPrefix[' + argVersionPrefix + ']')
    } else {
      actionsCore.setFailed('No version prefix specified')
    }

    actionsCore.endGroup()
    // ------------------------------------
    // ------------------------------------
    actionsCore.startGroup('Validate')
    if (semver.valid(argVersionTag) !== null) {
      actionsCore.info('versionTag[' + argVersionTag + ']')
    } else {
      actionsCore.setFailed('Invalid version tag [' + argVersionTag + ']')
    }

    actionsCore.endGroup()
    // ------------------------------------
    // ------------------------------------
    actionsCore.startGroup('Creation')
    createRelease(apiToken, argVersionPrefix, argVersionTag, 'release')
    actionsCore.endGroup()
    // ------------------------------------
    // ------------------------------------
  } catch (error) {
    // Should any error occur, the action will fail and the workflow will stop
    // Using the actions toolkit (core) package to log a message and set exit code
    actionsCore.setFailed(error.message)
  }
}
// EOF
