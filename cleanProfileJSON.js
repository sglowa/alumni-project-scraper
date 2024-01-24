// this template object is a bit messy, perhaps i dont need it at all
// but it would be super good to have some way of validating the fields

import { fieldNotAvailableWarning } from './utils.js'
const numberOfJobsAfterMA = +process.env.NO_OF_JOBS_AFTER_MA
const numberOfJobsBeforeMA = +process.env.NO_OF_JOBS_BEFORE_MA

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

// i dont really need these but im using them as kind of types
const _eduFiltered = {
  ma_grad_year: '---',
  ma_grad_month: '---',
  ba_university: '---',
  ba_location: '---',
  ba_degree: '---',
  ba_grad_year: '---',
  phd: '---'
}

const _baData = {
  ba_university: '---',
  ba_location: '---',
  ba_degree: '---',
  ba_grad_year: '---'
}

const _personalData = {
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
  const parsedPersonalData = { ..._personalData }
  for (const key in parsedPersonalData) {
    parsedPersonalData[key] = profileJSON[key] || fieldNotAvailableWarning(key, 'N.A.')
  }

  // edu data
  const parsedEduData = { ..._eduFiltered }

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













  // ma data
  // schoolsJSONs, schoolsSelectors
  /*
    iterate through school selectors,
    ma will always have uva BUT
      case a) i put in ma @ uva in fields
      case b) i don't put it
    SchoolsSelectors all have school ids
      (those that dont need to be entered manually)
    so i iterate by ID...
    and if uva id is not in masters id list
    i do it automatically, from the top
      but what if there's a phd @ uva at the top ?
      that's okay i just need to give clear instructions that:
      'if school appears multiple times, give title excerpt to help distinguish'
      'you dont have to put ma @ uva in the fields IF its the most recent degree this alumnus received @ uva
        - meaning that, for example, they DO NOT have a phd'
    ? What if 2 MAs at Uva ? then you need too add urls and title excerpts for both
   */

  /* i need to get school degree info + school institution info
  i go through selectors, i iterate schools, get school that matches (selector and ) */ 
  try {
    schoolsSelectors.maSelectors.forEach((schoolSelector,i)=>{
        generateEduEntryFromSchoolSelector(schoolSelector, schoolsJSONs, profileJSON, i)
      }
    )            
  } catch (error) {
    
  }
  
  
  try {
    const uvaMa = profileJSON.education
      .find(i => (
        i.school?.objectUrn === 'urn:li:school:15451' &&
        (i.degreeName?.includes(maDegreeNameExcerpt) ?? true)
      ))
    if (!uvaMa) throw new Error('could not find')
    const endDate = uvaMa.timePeriod?.endDate
    parsedEduData.ma_grad_year = endDate?.year
    if (!parsedEduData.ma_grad_year) throw new Error('ma_grad_year empty')
    parsedEduData.ma_grad_month = endDate?.month ?? fieldNotAvailableWarning('ma_grad_month', 1)
  } catch (error) {
    console.error(error)
  }

  // ba data
  try {
    const baData = extractSchoolData(schoolJson)
    Object.assign(parsedEduData, baData)

    // find school that matches urn and [degreeExcerpt]
    const baSchool = profileJSON
      .education.reverse()
      .find(i => (
        i.schoolUrn?.split(':').pop() === parsedEduData.ba_urn_secondary &&
        (i.degreeName?.includes(baDegreeExcerpt) ?? true)
      ))

    const { fieldOfStudy, timePeriod } = baSchool
    parsedEduData.ba_degree = fieldOfStudy ?? fieldNotAvailableWarning('ba field of study', 'N.A.')
    parsedEduData.ba_grad_year = timePeriod?.endDate?.year ?? fieldNotAvailableWarning('ba grad year', 'N.A.')
  } catch (error) {
    console.error('could not fetch BA data')
    throw error
  }

  // jobs data
  let parsedJobData
  try {
    parsedJobData = filterJobs(profileJSON, parsedEduData, numberOfJobsBeforeMA, numberOfJobsAfterMA)
  } catch (error) {
    console.error('could not fetch job data')
    throw error
  }
  const parsedProfileData = { ...parsedPersonalData, ...parsedEduData, ...parsedJobData }
  return parsedProfileData
}

/**
 * Description
 * @param {import('./typedefs.js').SchoolSelectors} schoolSelector
 * @param {Object} schoolsJSONs
 * @param {Object} profileJSON
 * @param {number} i
 * @param {('ba'|'ma')} degreeType
 * @returns {any}
 */
function generateEduEntryFromSchoolSelector(schoolSelector, schoolsJSONs, profileJSON, i, degreeType) {
  const entityId = schoolSelector.schoolId // for UvA this is the 4081
  const degreeTitleExcerpt = schoolSelector.degreeTitleExcerpt
  const schoolJSON = schoolsJSONs.find(schoolJSON => {
    return schoolJSON.entiryUrn.includes(entityId)
  })
  const schoolData = extractSchoolData(schoolJSON)
  const eduEntry = profileJSON.education.find(eduEntry => {
    return (eduEntry.schoolUrn.includes(schoolData.school_id) &&
      `${eduEntry.degreeName}, ${eduEntry.fieldOfStudy}`.includes(degreeTitleExcerpt))
  }
  )
  const degreeData = extractDegreeData(eduEntry)
  const eduEntryData = { ...schoolData, ...degreeData }
  const eduEntryDataRenamedToColumnVals = {}
  for (const key in eduEntryData) {
    if (Object.hasOwnProperty.call(eduEntryData, key)) {
      const val = eduEntryData[key]
      eduEntryDataRenamedToColumnVals[`${degreeType}_${i + 1}_${key}`] = val
    }
  }
}

/**
 * Description
 * @param {Object} eduEntry this is the edu item from edu array from profile json 
 * @param {('ba'|'ma')} degreeType
 * @returns {import('./typedefs.js').DiplomaData} 
 */
function extractDegreeData(eduEntry, degreeType){
  /** @type {import('./typedefs.js').DiplomaData} */
  const degreeData = {}
  if (typeof schoolJson !== 'object') {
    console.error('argument is not an object, expecting education item from profile edu array')   
  }  
  degreeData.diploma_degree_field = eduEntry.fieldOfStudy ?? fieldNotAvailableWarning(`${degreeData} degree field N.A. : field of study`, 'N.A.')
  degreeData.diploma_grad_year = eduEntry.timePeriod?.endDate?.year ?? fieldNotAvailableWarning(`${degreeData} degree field N.A. : graduation year`, 'N.A.')
  degreeData.diploma_grad_month = eduEntry.timePeriod?.endDate?.month ?? fieldNotAvailableWarning(`${degreeData} degree field N.A. : graduation month`, 'N.A.')
  return degreeData
}

/**
 * Description
 * @param {Object} schoolJson dirty json with school data
 * @param {('ba'|'ma')}   
 * @returns {import('./typedefs.js').SchoolData} cleaned school data
 */
function extractSchoolData (schoolJson,degreeType) {
  /** @type {import('./typedefs.js').SchoolData} */
  const schoolData = {}
  if (typeof schoolJson !== 'object') {
    console.error('argument is not an object, (maybe parse school json first?)')
  }  
  schoolData.uni_name = schoolJson.name ?? fieldNotAvailableWarning(`${degreeType}university`, 'N.A.')
  schoolData.uni_location = schoolJson.headquarter?.country ?? fieldNotAvailableWarning(`${degreeType}location`, 'N.A.')
  schoolData.uni_entity_id = schoolJson.entityUrn?.split(':').pop() ?? fieldNotAvailableWarning(`${degreeType}urn_primary`, 'N.A.') // for linkedin search
  schoolData.uni_school_id = schoolJson.school?.split(':').pop() ?? fieldNotAvailableWarning(`${degreeType}urn_secondary`, 'N.A.') // for search in alumnus profile
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
  { ma_grad_year: maGradYear, ma_grad_month: maGradMonth },
  numberOfJobsBeforeMA,
  numberOfJobsAfterMA) {
  maGradMonth = parseInt(maGradMonth)
  maGradYear = parseInt(maGradYear)
  if (isNaN(maGradMonth)) throw new Error('month is not a number')
  if (isNaN(maGradYear)) throw new Error('year is not a number')

  const oldestJobAfterMaIndex = experience.find(job => {
    const startYear = job.timePeriod.startDate.year
    const startMonth = job?.timePeriod?.startDate?.month ?? 1
    const jobStartDate = new Date(startYear, startMonth - 1) // month index starts from 0
    const maDegreeEndDate = new Date(maGradYear, maGradMonth - 1)
    return jobStartDate < maDegreeEndDate
  }) - 1
  const jobsBeforeMa = experience.slice(oldestJobAfterMaIndex)
  const jobsAfterMa = experience.slice(0, oldestJobAfterMaIndex)

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
  let prevJobTitleColumnIndex = 0

  if (isNaN(jobsCap)) { throw new Error('jobs after MA cap is NaN. check your .env file') }
  for (let index = 0; index < jobsList.length; index++) {
    const job = jobsList[index]
    const company = job.companyName

    // check if same company, skip if job (ie company) cap reached
    const jobColumnIndex = company !== prevCompany
      ? prevJobColumnIndex++
      : prevJobColumnIndex

    if (jobColumnIndex > jobsCap) { break }

    // check if another position at same company
    const jobTitleColumnIndex = company === prevCompany
      ? prevJobTitleColumnIndex++
      : prevJobTitleColumnIndex = 1

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
      orderedJobs[`${columnName}_title${jobTitleColumnIndex}`] = jobTitle ?? fieldNotAvailableWarning('job title', 'N.A.')
      orderedJobs[`${columnName}_sector`] = sector ?? fieldNotAvailableWarning('job sector', 'N.A.')
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
