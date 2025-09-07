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
  let releasePre = false
  let releaseDraft = false

  if (argReleaseType === 'draft') {
    releaseDraft = true
  } else if (argReleaseType === 'release') {
    // default settings
  } else if (argReleaseType === 'prerelease') {
    releasePre = true
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
  actionsCore.debug('context[' + JSON.stringify(context) + ']')
  // ------------------------------------
  // Create a release
  // doc: https://docs.github.com/en/rest/releases/releases#create-a-release
  //      https://octokit.github.io/rest.js/#repos-create-release
  actionsCore.info('Creating release...')
  actionsCore.info('releaseName[' + releaseName + ']')
  actionsCore.info('tagName[' + argVersionTag + ']')
  actionsCore.info('releaseDraft[' + releaseDraft + ']')
  actionsCore.info('releasePre[' + releasePre + ']')
  // create the release
  // https://docs.github.com/en/rest/reference/repos#create-a-release
  // POST /repos/{owner}/{repo}/releases
  // octokit.repos.createRelease()
  // https://octokit.github.io/rest.js/v18#repos-create-release
  // octokit.repos.createRelease()
  // NOTE: generate_release_notes requires GitHub API v3.9 or higher
  //       https://docs.github.com/en/rest/reference/repos#create-a-release
  //       https://github.blog/changelog/2022-11-09-generate-release-notes-via-api/
  //       https://octokit.github.io/rest.js/v18#repos-create-release
  repoOwner = context.repo.owner
  repoName = context.repo.repo
  commitSha = context.sha
  actionsCore.debug('repoOwner[' + repoOwner + ']')
  actionsCore.debug('repoName[' + repoName + ']')
  actionsCore.debug('commitSha[' + commitSha + ']')
  const createReleaseData = await octokit.repos.createRelease({
    owner: repoOwner,
    repo: repoName,
    target_commitish: commitSha,
    tag_name: argVersionTag,
    name: releaseName,
    draft: releaseDraft,
    prerelease: releasePre,
    generate_release_notes: true,
  })
  // setup return data
  var returnData = {
    exitCode: 0,
  }
  if (createReleaseData.status === 201) {
    actionsCore.info('Release created successfully')
    actionsCore.info('Release URL: ' + createReleaseData.data.html_url)
    actionsCore.setOutput('releaseUrl', createReleaseData.data.html_url)
    returnData.releaseUrl = createReleaseData.data.html_url
  } else {
    actionsCore.setFailed('Error creating release')
    returnData.exitCode = 1
  }
  // ------------------------------------
  actionsCore.debug('End ' + functionName)
  return returnData
  // ------------------------------------
}
// EOF
