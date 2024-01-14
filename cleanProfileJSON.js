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

function cleanProfileJSON (dirtyJson, schoolJson, maDegreeNameExcerpt = '', baDegreeExcerpt = '', phd) {
  // personal data
  const parsedPersonalData = { ..._personalData }
  for (const key in parsedPersonalData) {
    parsedPersonalData[key] = dirtyJson[key] || fieldNotAvailableWarning(key, 'N.A.')
  }

  // edu data
  const parsedEduData = { ..._eduFiltered }

  // phd
  parsedEduData.phd = phd ? 'yes' : 'no'

  // ma data
  try {
    const uvaMa = dirtyJson.education
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
    const baData = getBaSchool(schoolJson)
    Object.assign(parsedEduData, baData)

    // find school that matches urn and [degreeExcerpt]
    const baSchool = dirtyJson
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
    parsedJobData = filterJobs(dirtyJson, parsedEduData, numberOfJobsBeforeMA, numberOfJobsAfterMA)
  } catch (error) {
    console.error('could not fetch job data')
    throw error
  }
  const parsedProfileData = { ...parsedPersonalData, ...parsedEduData, ...parsedJobData }
  return parsedProfileData
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
  const baData = { ..._baData }
  baData.ba_university = schoolJson.name ?? fieldNotAvailableWarning('ba_university', 'N.A.')
  baData.ba_location = schoolJson.headquarter?.country ?? fieldNotAvailableWarning('ba_location', 'N.A.')
  baData.ba_urn_primary = schoolJson.entityUrn?.split(':').pop() ?? fieldNotAvailableWarning('ba_urn_primary', 'N.A.') // for linkedin search
  baData.ba_urn_secondary = schoolJson.school?.split(':').pop() ?? fieldNotAvailableWarning('ba_urn_secondary', 'N.A.') // for search in alumnus profile
  return baData
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
