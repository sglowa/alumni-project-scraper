/**
@namespace typedefs
*/


/**
 * @typedef {Object} LinkedinTampermonkeyPayload
 * @property {string} profileUrlPathname profile url pathname
 * @property {SchoolsSelectors} schoolsSelectors
 * @property {boolean} phd
 */

/**
 * @typedef {Object} SchoolsSelectors
 * @property {Array<SchoolSelectors>} maSelectors
 * @property {Array<SchoolSelectors>} baSelectors
 */

/**
 * @typedef {Object} SchoolSelectors
 * @property {string} schoolId
 * @property {string} degreeTitleExcerpt
 */

/**
 * @typedef {Object} LinkedinFetchResponse
 * @property {string} profileId
 * @property {Object} profileJSON
 * @property {Array} schoolsJSONs
 */

/**
 * @typedef {Object} SchoolData this is data re school itself (as opposed to diploma)
 * @property {string} uni_name 
 * @property {string} uni_location
 * @property {string} uni_entity_id 
 * @property {string} uni_school_id
*/ 

/**
 * @typedef {Object} DiplomaData this is data re diploma itself (as opposed to school)
 * @property {string} diploma_grad_year 
 * @property {string} diploma_grad_month
 * @property {string} diploma_degree_field
 */

export default {}