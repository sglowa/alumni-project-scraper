// this template object is a bit messy, perhaps i dont need it at all
// but it would be super good to have some way of validating the fields

function cleanProfileJSON (dirtyJson, schoolJson) {
  dirtyJson = JSON.parse(dirtyJson)
  schoolJson = JSON.parse(schoolJson)
  let cleanedProfileData = { ...destJSON }
  // personal data
  try {
    cleanedProfileData.firstName = dirtyJson.firstName
    cleanedProfileData.lastName = dirtyJson.lastName
    cleanedProfileData.location = dirtyJson.locationName
    cleanedProfileData.public_id = dirtyJson.public_id
  } catch (error) {
    throw new Error('could not fetch personal data')
  }
  // edu data
  // ma data
  try {
    const endDate = dirtyJson.education
      .find(i => (
        i.school.objectUrn === 'urn:li:school:15451'
      )).timePeriod.endDate

    cleanedProfileData.ma_grad_year = endDate.year
    cleanedProfileData.ma_grad_month = endDate.year
  } catch (error) {
    throw new Error('could not fetch MA data')
  }
  // ba data
  try {
    const baSchool = getBaSchool(schoolJson)
    cleanedProfileData = { ...cleanedProfileData, ...baSchool }
    const { fieldlOfStudy, timePeriod: { endDate: { year } } } = dirtyJson
      .education
      .find(i => (
        i.schoolUrn.split(':').pop() === cleanedProfileData.ba_urn_secondary
      ))
    cleanedProfileData.ba_degree = fieldlOfStudy
    cleanedProfileData.ba_grad_year = year
  } catch (error) {
    throw new Error('could not fetch BA data')
  }
  // jobs data
  try {
    const jobsFiltered = filterJobs(cleanedProfileData)
    cleanedProfileData = { ...cleanedProfileData, ...jobsFiltered }
  } catch (error) {
    throw new Error('could not fetch job data')
  }
  return cleanedProfileData
}

/**
 * Description
 * @param {Object} schoolJson dirty json with ba school data
 * @returns {Object} cleaned ba school data
 */
function getBaSchool (schoolJson) {
  if (typeof schoolJson !== 'object') {
    console.error('argument is not an object, (maybe parse school json first?)')
    return ''
  }
  const baSchool = {}
  baSchool.ba_university = schoolJson.name ?? 'ERR: not found'
  baSchool.ba_location = schoolJson.headquarter?.country ?? 'ERR: not found'
  baSchool.ba_urn_primary = schoolJson.entityUrn.split(':').pop() ?? 'ERR: not found' // for linkedin search
  baSchool.ba_urn_secondary = schoolJson.school.split(':').pop() ?? 'ERR: not found' // for search in alumnus profile
  return baSchool
}

/**
 * Description
 * @param {Object} profileJson (parsed) of the profile, must contain array of jobs to be filtered against the ma graduation year
 * @param {Object[]} profileJson.experience of the profile, must contain array of jobs to be filtered against the ma graduation year
 * @param {number} profileJson.ma_grad_year
 * @param {number} profileJson.ma_grad_month
 * @returns {Object} returns profile json with filtered jobs
 */
function filterJobs ({ experience, ma_grad_year: maGradYear, ma_grad_month: maGradMonth }) {
  // .title .company .sector
  const jobsFiltered = {
    jobBeforeMA_title: '', // The latest job title [before obtaing the MA degree]
    jobBeforeMA_company: '',
    jobBeforeMA_sector: '',
    job1_title: '', // The latest after obtaing the MA degree
    job1_company: '',
    job1_sector: '',
    job2_title: '',
    job2_company: '',
    job2_sector: '',
    job3_title: '',
    job3_company: '',
    job3_sector: ''
  }
  for (let i = 0; i < experience.length; i++) {
    const item = experience[i]
    const startYear = item.timePeriod.startDate.year
    const startMonth = item.timePeriod.startDate.month
    const jobStartDate = new Date(startYear, startMonth - 1) // month index starts from 0
    const maDegreeEndDate = new Date(maGradYear, maGradMonth - 1)
    let columnIndex = i + 1
    let shouldBreakLoop = false
    if (i > 2 && jobStartDate >= maDegreeEndDate) continue // only 3 most recent jobs after ma
    if (jobStartDate <= maDegreeEndDate) {
      columnIndex = 'BeforeMA'
      shouldBreakLoop = true
    }
    jobsFiltered[`job${columnIndex}_company`] = item.companyName
    jobsFiltered[`job${columnIndex}_title`] = item.title
    jobsFiltered[`job${columnIndex}_sector`] = item.industries.join(' & ')
    if (shouldBreakLoop) break
  }
  return jobsFiltered
}

const destJSON = {
  firstName: '',
  lastName: '',
  infix: '',
  public_id: '',
  location: '',
  ma_grad_year: '',
  ma_grad_month: '',
  ba_university: '',
  ba_location: '',
  ba_degree: '',
  ba_grad_year: '',
  jobBeforeMA_title: '', // The latest job title [before obtaing the MA degree]
  jobBeforeMA_company: '',
  jobBeforeMA_sector: '',
  job1_title: '', // The latest after obtaing the MA degree
  job1_company: '',
  job1_sector: '',
  job2_title: '',
  job2_company: '',
  job2_sector: '',
  job3_title: '',
  job3_company: '',
  job3_sector: '',
  phd: false
}

export { cleanProfileJSON }
