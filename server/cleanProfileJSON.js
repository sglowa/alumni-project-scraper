// this template object is a bit messy, perhaps i dont need it at all
// but it would be super good to have some way of validating the fields

import { fieldNotAvailableWarning } from './utils.js'
const numberOfJobsAfterMA = +process.env.NO_OF_JOBS_AFTER_MA
const numberOfJobsBeforeMA = +process.env.NO_OF_JOBS_BEFORE_MA
const shouldCountPositionsAsSeparateJobs = +process.env.EACH_POSITION_AS_JOB === 1
  ? true
  : +process.env.EACH_POSITION_AS_JOB === 0
      ? false
      : (() => {
          console.warn('EACH_POSITION_AS_JOB is not 0/1, setting to default (true)')
          return true
        })()

/* const destJSON = {
  firstName: '---',
  lastName: '---',
  infix: '---',
  public_id: '---',
  location: '---',
  ma_grad_year: '---',
  ma_grad_month: '---',
  ba_university: '---',
  ba_location: '---',
  ba_degree: '---',
  ba_grad_year: '---',
  jobBeforeMA_title: '---', // The latest job title [before obtaing the MA degree]
  jobBeforeMA_company: '---',
  jobBeforeMA_sector: '---',
  job1_title: '---', // The latest after obtaing the MA degree
  job1_company: '---',
  job1_sector: '---',
  job2_title: '---',
  job2_company: '---',
  job2_sector: '---',
  job3_title: '---',
  job3_company: '---',
  job3_sector: '---',
  phd: '---'
} */

const _jobsSchema = (() => {
  const _jobsSchema = {}
  for (let i = 1; i <= numberOfJobsAfterMA; i++) {
    _jobsSchema[`jobAfterMA${i}_company`] = '---'
    _jobsSchema[`jobAfterMA${i}_sector`] = '---'
    _jobsSchema[`jobAfterMA${i}_title${shouldCountPositionsAsSeparateJobs ? '' : '1'}`] = '---'
  }
  for (let i = 1; i <= numberOfJobsBeforeMA; i++) {
    _jobsSchema[`jobBeforeMA${i}_company`] = '---'
    _jobsSchema[`jobBeforeMA${i}_sector`] = '---'
    _jobsSchema[`jobBeforeMA${i}_title${shouldCountPositionsAsSeparateJobs ? '' : '1'}`] = '---'
  }
  return _jobsSchema
})()

/* const _jobsFiltered = {
  jobBeforeMA_title: '---', // The latest job title [before obtaing the MA degree]
  jobBeforeMA_company: '---',
  jobBeforeMA_sector: '---',
  job1_title: '---', // The latest after obtaing the MA degree
  job1_company: '---',
  job1_sector: '---',
  job2_title: '---',
  job2_company: '---',
  job2_sector: '---',
  job3_title: '---',
  job3_company: '---',
  job3_sector: '---'
} */

const _personalDataSchema = {
  firstName: '---',
  lastName: '---',
  infix: '---',
  location: '---',
  public_id: '---'
}

/**
 * Description
 * @param {Object} object
 * @param {Object} object.profileJSON
 * @param {Array} object.schoolsJSONs
 * @param {import('./typedefs.js').SchoolsSelectors} object.schoolsSelectors
 * @param {bool} object.phd
 * @returns {any}
 */
function cleanProfileJSON ({ profileJSON, schoolsJSONs, schoolsSelectors, phd }) {
  // personal data
  const parsedPersonalData = { ..._personalDataSchema }
  for (const key in parsedPersonalData) {
    parsedPersonalData[key] = profileJSON[key] || fieldNotAvailableWarning(key, 'N.A.')
  }
  if (typeof parsedPersonalData.location === 'object') { // this could be more elegant but whatever
    parsedPersonalData.location = parsedPersonalData.location?.basicLocation?.countryCode
  }
  // edu data
  /** @type {import('./typedefs.js').eduDataRef} */
  let parsedEduData = {}

  // phd
  phd = typeof phd === 'boolean'
    ? phd
    : typeof phd === 'string'
      ? phd.toLowerCase() === 'true'
      : phd.toLowerCase() === 'false'
        ? false
        : undefined

  parsedEduData.phd = phd === undefined
    ? fieldNotAvailableWarning('phd', 'N.A.')
    : phd
      ? 'yes'
      : 'no'

  try {
    schoolsSelectors.maSelectors.forEach((schoolSelector, i) => {
      const eduEntryDataRenamedToColumnVals = generateEduEntryFromSchoolSelector(
        schoolSelector,
        schoolsJSONs,
        profileJSON.education,
        i,
        'ma')
      parsedEduData = { ...parsedEduData, ...eduEntryDataRenamedToColumnVals }
    })
    schoolsSelectors.baSelectors.forEach((schoolSelector, i) => {
      const eduEntryDataRenamedToColumnVals = generateEduEntryFromSchoolSelector(
        schoolSelector,
        schoolsJSONs,
        profileJSON.education.reverse(),
        i,
        'ba')
      parsedEduData = { ...parsedEduData, ...eduEntryDataRenamedToColumnVals }
    })
  } catch (error) {
    console.error(error)
  }

  // jobs data
  let parsedJobData
  try {
    parsedJobData = filterJobs(profileJSON, parsedEduData, numberOfJobsBeforeMA, numberOfJobsAfterMA)
  } catch (error) {
    console.error('could not fetch job data')
    throw error
  }
  const parsedJobDataReadyForExport = { ..._jobsSchema, ...parsedJobData }
  const parsedProfileData = { ...parsedPersonalData, ...parsedEduData, ...parsedJobDataReadyForExport }
  return parsedProfileData
}

/**
 * Extracts education information targeted by selector (url [and degree title excerpt])
 * @param {import('./typedefs.js').SchoolSelectors} schoolSelector
 * @param {Object} schoolsJSONs
 * @param {Array} education edu array from profileJson
 * @param {number} i
 * @param {('ba'|'ma')} degreeType
 * @returns {Object} returns selector matching and parsed edu data, per diploma
 */
function generateEduEntryFromSchoolSelector (schoolSelector, schoolsJSONs, education, i, degreeType) {
  const entityId = schoolSelector.schoolId // for UvA this is the 4081
  const degreeTitleExcerpt = schoolSelector.degreeTitleExcerpt
  const schoolJSON = schoolsJSONs.find(schoolJSON => {
    return schoolJSON.entityUrn.includes(entityId)
  })
  const schoolData = extractSchoolData(schoolJSON, degreeType)
  const eduEntry = education.find(eduEntry => {
    return (eduEntry.schoolUrn?.includes(schoolData.uni_school_id) &&
      `${eduEntry.degreeName}, ${eduEntry.fieldOfStudy}`.includes(degreeTitleExcerpt))
  }
  )
  const degreeData = extractDegreeData(eduEntry, degreeType)
  const eduEntryData = { ...schoolData, ...degreeData }
  const eduEntryDataRenamedToColumnVals = {}
  for (const key in eduEntryData) {
    if (Object.hasOwnProperty.call(eduEntryData, key)) {
      const val = eduEntryData[key]
      eduEntryDataRenamedToColumnVals[`${degreeType}_${i + 1}_${key}`] = val
    }
  }
  return eduEntryDataRenamedToColumnVals
}

/**
 * Description
 * @param {Object} eduEntry this is the edu item from edu array from profile json
 * @param {('ba'|'ma')} degreeType
 * @returns {import('./typedefs.js').DiplomaData}
 */
function extractDegreeData (eduEntry, degreeType) {
  /** @type {import('./typedefs.js').DiplomaData} */
  const degreeData = {}
  if (typeof eduEntry !== 'object') {
    console.error(`getting ${degreeType} school data : argument is not an object, expecting secelected ${degreeType} education item from profile edu array`)
  }
  degreeData.diploma_degree_field = eduEntry?.fieldOfStudy ?? fieldNotAvailableWarning(`${degreeType} degree field N.A. : field of study`, 'N.A.')
  degreeData.diploma_grad_year = eduEntry?.timePeriod?.endDate?.year ?? fieldNotAvailableWarning(`${degreeType} degree field N.A. : graduation year`, 'N.A.')
  degreeData.diploma_grad_month = eduEntry?.timePeriod?.endDate?.month ?? fieldNotAvailableWarning(`${degreeType} degree field N.A. : graduation month`, 'N.A.')
  return degreeData
}

/**
 * Description
 * @param {Object} schoolJson dirty json with school data
 * @param {('ba'|'ma')}
 * @returns {import('./typedefs.js').SchoolData} cleaned school data
 */
function extractSchoolData (schoolJson, degreeType) {
  /** @type {import('./typedefs.js').SchoolData} */
  const schoolData = {}
  if (typeof schoolJson !== 'object') {
    console.error(`getting ${degreeType} school data : argument is not an object, expecting JSON data for selected ${degreeType} school`)
  }
  schoolData.uni_name = schoolJson?.name ?? fieldNotAvailableWarning(`${degreeType}_university`, 'N.A.')
  schoolData.uni_location = schoolJson?.headquarter?.country ?? fieldNotAvailableWarning(`${degreeType}_location`, 'N.A.')
  schoolData.uni_entity_id = schoolJson?.entityUrn?.split(':').pop() ?? fieldNotAvailableWarning(`${degreeType}_urn_primary`, 'N.A.') // for linkedin search
  schoolData.uni_school_id = schoolJson?.school?.split(':').pop() ?? fieldNotAvailableWarning(`${degreeType}_urn_secondary`, 'N.A.') // for search in alumnus profile
  return schoolData
}
/**
 * * extracts company name, job titles and sectors for a given number of jobs before and after MA
 * @param {Object} profileJson
 * @param {Array} profileJson.experience
 * @param {Object} filteredEduData
 * @param {number} filteredEduData.ma_grad_year
 * @param {number} filteredEduData.ma_grad_month
 * @param {number} numberOfJobsBeforeMA
 * @param {number} numberOfJobsAfterMA
 * @returns {Object} returns a collection of job data
 */
function filterJobs (
  { experience },
  { ma_1_diploma_grad_year: maGradYear, ma_1_diploma_grad_month: maGradMonth },
  numberOfJobsBeforeMA,
  numberOfJobsAfterMA) {
  const maGradYearInt = parseInt(maGradYear)
  let maGradMonthInt = parseInt(maGradMonth)
  if (isNaN(maGradYearInt)) throw new Error('ma grad year is not a number')
  if (isNaN(maGradMonthInt)) {
    console.warn('ma grad month is not a number. Assuming June')
    maGradMonthInt = 6
  }

  // first meaning oldest, ie the first job they got after graduation
  const firstJobAfterMaIndex = experience.findIndex(job => {
    const startYear = job.timePeriod.startDate.year
    const startMonth = job?.timePeriod?.startDate?.month ?? 1
    const jobStartDate = new Date(startYear, startMonth - 1) // month index starts from 0
    const maDegreeEndDate = new Date(maGradYearInt, maGradMonthInt - 1)
    return jobStartDate < maDegreeEndDate
  })
  const jobsBeforeMa = experience.slice(firstJobAfterMaIndex)
  const jobsAfterMa = experience.slice(0, firstJobAfterMaIndex)

  const orderedJobsBeforeMa = orderJobs(jobsBeforeMa, numberOfJobsBeforeMA, 'jobBeforeMA')
  const orderedJobsAfterMa = orderJobs(jobsAfterMa, numberOfJobsAfterMA, 'jobAfterMA')

  return { ...orderedJobsAfterMa, ...orderedJobsBeforeMa }
}

/**
 * Get selection of jobs and job data
 *
 * @param {Array} jobsList Takes array of jobs to extract from
 * @param {number} jobsCap the number of jobs to include in returned collection
 * @param {string} columnPrefix the prefix given to the key of job entries in collection
 * @returns {Object}
 */
function orderJobs (jobsList, jobsCap, columnPrefix) {
  const orderedJobs = {}
  let prevCompany = ''
  let prevJobColumnIndex = 0
  let prevJobTitleColumnIndex = 1

  if (isNaN(+jobsCap)) { throw new Error(`'${columnPrefix} cap' is not a number.\n(check your .env file)\n${jobsCap}`) }
  for (let index = 0; index < jobsList.length; index++) {
    const job = jobsList[index]
    const company = job.companyName

    let jobColumnIndex
    let jobTitleColumnIndex
    if (shouldCountPositionsAsSeparateJobs) {
      jobColumnIndex = prevJobColumnIndex + 1
      jobTitleColumnIndex = ''
    } else {
      // check if same company, skip if job (ie company) cap reached
      jobColumnIndex = company === prevCompany
        ? prevJobColumnIndex
        : prevJobColumnIndex + 1

      // check if another position at same company
      jobTitleColumnIndex = company === prevCompany
        ? ++prevJobTitleColumnIndex
        : prevJobTitleColumnIndex = 1
    }

    if (jobColumnIndex > jobsCap) { break }

    // extract job and title
    const jobTitle = job.title
    const sector = typeof job.company?.industries === 'object'
      ? job.company?.industries?.join(' & ')
      : typeof job.company?.industries === 'string'
        ? job.company?.industries
        : null

    const columnName = '' + columnPrefix + jobColumnIndex
    if (jobColumnIndex !== prevJobColumnIndex) { // add company, title, sector to filteredJobs, return
      orderedJobs[`${columnName}_company`] = company ?? fieldNotAvailableWarning('job company', 'N.A.')
      orderedJobs[`${columnName}_sector`] = sector ?? fieldNotAvailableWarning('job sector', 'N.A.')
      orderedJobs[`${columnName}_title${jobTitleColumnIndex}`] = jobTitle ?? fieldNotAvailableWarning('job title', 'N.A.')
      prevJobColumnIndex = jobColumnIndex
      console.debug(`new job item added (new position at new company)
        company: ${company}
        title: ${jobTitle}
        sector: ${sector}
      `)
    } else if (jobTitleColumnIndex > 1) { // add sameCompanyX_diffPosition entry to filteredJobs, return
      orderedJobs[`${columnName}_title${jobTitleColumnIndex}`] = jobTitle ?? fieldNotAvailableWarning('job title', 'N.A.')
      console.debug(`new job item added (new position at same company)
        company: ${company}
        title: ${jobTitle}
        sector: ${sector}
      `)
    } else { // no item added
      console.warn(`job item not added !
        company: ${company}
        title: ${jobTitle}
        sector: ${sector}
      `)
    }
    prevCompany = company
  }
  return orderedJobs
}

export { cleanProfileJSON }
