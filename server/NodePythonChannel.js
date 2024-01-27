import { PythonShell } from 'python-shell'
import path from 'path'
import { __dirname } from '../utils.js'

const pythonScriptPath = path.join(__dirname, 'python/linkedInApi.py')

const options = {
  mode: 'json',
  pythonOptions: ['-u'],
  args: [],
  ...(!!process.env.PYTHON_PATH && { pythonPath: process.env.PYTHON_PATH })
}

let pythonReady = false
let pyshell

function init () {
  pyshell = new PythonShell(pythonScriptPath, options)

  const callback = msg => {
    console.log('receiving message', msg)
    if (msg.initSuccess) {
      pythonReady = true
      // pyshell.removeListener('message', callback)
    }
  }
  pyshell.on('message', callback)
  pyshell.on('error', err => console.error(err))
  pyshell.on('stderr', err => console.error(err))
  pyshell.on('pythonError', err => console.error(err))
  pyshell.send({ login: process.env.LINKEDIN_LOGIN, password: process.env.LINKEDIN_PASS, command: 'start' })
}

/**
 * Description
 * @param {string} profileId
 * @param {Array} schoolIds each item contains 'schoolId' and 'degreeTitleExcerpt' props
 * @returns {Promise<import('./typedefs.js').LinkedinFetchResponse>} resolves to profile and school jsons fetched by python script
 */
function reqFetchFromLinkedin (profileId, schoolIds) {
  schoolIds = typeof schoolIds === 'string'
    ? [schoolIds]
    : (() => {
        try {
          return [...schoolIds]
        } catch (e) {
          console.log('schoolIds is not iterable')
          throw e
        }
      })()
  return new Promise((resolve, reject) => {
    if (!pythonReady) reject(new Error('python not ready'))

    const callback = (payload) => {
      if (payload.profileId === profileId) {
        pyshell.removeListener('message', callback)
        resolve(payload)
      }
    }

    pyshell.once('message', callback)
    pyshell.send({ profileId, schoolIds, command: 'fetch' })

    setTimeout(() => {
      pyshell.removeListener('message', callback)
      reject(new Error(`timeout on: ${profileId}`))
    }, 45000)
  })
}

export { reqFetchFromLinkedin, init }
