import { reqFetchFromLinkedin } from './NodePythonChannel.js'
import { cleanProfileJSON } from './cleanProfileJSON.js'
import { saveToDatabase } from './database.js'

/**
 * scrapes data for particular alumnus profile, including location of the ba school
 * for alumuns profile consumes the url pathname only; for school its the full url
 * @param {string} profileUrlPathname the url pathname of the alumnus linkedin profile
 * @param {string} schoolUrl the url of the alumnus' ba school
 * @returns {any}
 */
async function scrapeProfileMain (profileUrlPathname, schoolUrl, clientRes) {
  const profileId = extractProfileId(profileUrlPathname)
  const schoolId = extractSchoolId(schoolUrl)
  try {
    const { profileJSON, schoolJSON } = await reqFetchFromLinkedin(profileId, schoolId)
    const cleanedJSON = cleanProfileJSON(profileJSON, schoolJSON)
    saveToDatabase(cleanedJSON)
    clientRes(`${profileId} saved successfully`)
  } catch (error) {
    clientRes(error.message)
    console.error(error)
  }
}
// run python script, get json from stdout
// clean json
// filter irrelevant
// filter jobs
// save to database
// maybe i shouldnt do it as a class idk, but it looks pretty clean this way.
// but no this doesnt make sense, theres only one order i will use it in, no point making it into class

function extractProfileId (profileUrlPathname) {
  // profileUrlPathname:  "/in/name-of-person-735866181/"
  const id = profileUrlPathname.match(/\/[^\/]+\/([^\/]+)\//)[1]
  return id
}

function extractSchoolId (schoolUrl) {
  // schoolUrl : "https://www.linkedin.com/company/4081/"
  const id = schoolUrl.match(/\/([^\/]+)\/$/)[1]
  return id
}

export { scrapeProfileMain }
