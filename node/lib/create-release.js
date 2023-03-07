// BOF
// ------------------------------------
// Node.js built-in modules
// ------------------------------------
// None
// ------------------------------------
// External modules
// ------------------------------------
const actionsCore = require('@actions/core') // Microsoft's actions toolkit core
const github = require('@actions/github') // Microsoft's actions github toolkit
// ------------------------------------
// Internal modules
// ------------------------------------
// None
// ------------------------------------
// ------------------------------------
module.exports = async function createRelease(
  argApiToken,
  argVersionTagPrefix,
  argVersionTag,
  argReleaseType
) {
  const functionName = createRelease.name
  actionsCore.debug('Start ' + functionName)
  // Argument validation
  if (argReleaseType === null || argReleaseType === '') {
    actionsCore.setFailed('No release type specified')    
  }
  actionsCore.info('releaseType[' + argReleaseType + ']')
  if (argReleaseType === 'draft') {
    var releaseDraft = true
  } else if (argReleaseType === 'release') { 
    var releaseDraft = false
    var releasePre = false
  } else if (argReleaseType === 'prerelease') {
    var releaseDraft = false
    var releasePre = false
  } else {
    actionsCore.setFailed('Invalid release type specified')
    return
  }
  // setup release name
  var releaseName = argVersionTagPrefix + argVersionTag
  // setup release body

  // ------------------------------------
  const context = github.context
  const octokit = github.getOctokit(argApiToken)
  // ------------------------------------
  // Create a release
  // doc: https://docs.github.com/en/rest/releases/releases#create-a-release
  //      https://octokit.github.io/rest.js/#repos-create-release
  const createReleaseData = await octokit.repos.createRelease({
    owner: context.repo.owner,
    repo: context.repo,
    target_commitish: context.sha,
    tag_name: argVersionTag,
    name: releaseName,
    releaseDraft,
    releasePre,
    generate_release_notes: true
    }); 
  // setup return data
  var returnData = {
    exitCode: 0
  }
  // ------------------------------------
  actionsCore.debug('End ' + functionName)
  return returnData
  // ------------------------------------
}
// EOF