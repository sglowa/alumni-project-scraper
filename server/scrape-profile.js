import { reqFetchFromLinkedin } from './NodePythonChannel.js'
import { cleanProfileJSON } from './cleanProfileJSON.js'
import { saveToDatabase } from './database.js'

/**
 * scrapes data for particular alumnus profile, including location of the ba school
 * for alumuns profile consumes the url pathname only; for school its the full url
 * @param {string} profileUrlPathname the url pathname of the alumnus linkedin profile
 * @param {import('./typedefs.js').SchoolsSelectors} schoolsSelectors
 * @param {boolean} phd
 * @param {Function} clientRes callback sending a res to client
 * @returns {any}
 */
async function scrapeProfileMain (profileUrlPathname, schoolsSelectors, phd, clientRes) {
  const profileId = extractProfileId(profileUrlPathname)
  const schoolsWitohutId = []
  const schoolIds = new Set()
  for (const key in schoolsSelectors) {
    if (Object.hasOwnProperty.call(schoolsSelectors, key)) {
      schoolsSelectors[key] = schoolsSelectors[key].map(i => {
        const schoolId = extractSchoolId(i.url, schoolsWitohutId, schoolIds)
        const degreeTitleExcerpt = i.degreeTitleExcerpt
        const gradYear = i.gradYear
        return { schoolId, degreeTitleExcerpt, ...(gradYear ? { gradYear } : undefined) }
      })
    }
  }
  try {
    const { profileJSON, schoolsJSONs } = await reqFetchFromLinkedin(profileId, [...schoolIds])
    // now i need to map the fetched schools jsons to the school selectors
    // but i do it inside cleanProfileJSON fn
    const cleanedJSON = cleanProfileJSON({ profileJSON, schoolsJSONs, schoolsSelectors, phd })
    saveToDatabase(cleanedJSON)
    const resMsg = `${profileId} saved <br><br>
      ${schoolsWitohutId.length
        ? `couldn't fetch data for following schools, please add manually <br>
        ${schoolsWitohutId.join('<br>')}`
        : ''}`
    clientRes(resMsg)
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

/**
 * Extracts profile id from linkedin profile page url
 * @param {string} profileUrlPathname
 * @returns {string} a profile id used to fetch from linkedin's api
 */
function extractProfileId (profileUrlPathname) {
  // profileUrlPathname:  "/in/name-of-person-735866181/"
  const id = profileUrlPathname.match(/\/[^\/]+\/([^\/]+)\//)?.[1]
  return id
}

/**
 * Description
 * @param {string} schoolUrl url of school entity copied from linkedin profile page
 * @param {Array} [schoolsWitohutIdArray] array to which to add school urls from which ids could't be extracted
 *  (those are the schools that need to be entered manually)
 * @param {Set} [schoolIdsSet] Set to which to add school extracted ids
* @returns {any}
 */
function extractSchoolId (schoolUrl, schoolsWitohutIdArray, schoolIdsSet) {
  // schoolUrl : "https://www.linkedin.com/company/4081/"
  const id = schoolUrl.match(/\/([^\/]+)\/$/)?.[1] ?? undefined
  if (id === undefined) {
    console.warn(`couldn't extract school id from ${schoolUrl}`)
    schoolsWitohutIdArray?.push(schoolUrl)
  } else {
    schoolIdsSet?.add(id)
  }
  return id
}

export { scrapeProfileMain }
