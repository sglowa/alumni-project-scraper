import { PythonShell } from 'python-shell'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const pythonScriptPath = path.join(__dirname, '../python/linkedInApi.py')

const options = {
  mode: 'json',
  pythonOptions: ['-u'],
  args: [],
  pythonPath: process.env.PYTHON_PATH
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
  pyshell.send({ login: 's9lowacki@gmail.com', password: '2351314', command: 'start' })
}

function reqFetchFromLinkedin (profileId, schoolId) {
  return new Promise((resolve, reject) => {
    if (!pythonReady) reject(new Error('python not ready'))

    const callback = (msg) => {
      if (msg.profileId === profileId) {
        pyshell.removeListener('message', callback)
        resolve(msg)
      }
    }

    pyshell.once('message', callback)
    pyshell.send({ profileId, schoolId, command: 'fetch' })

    setTimeout(() => {
      pyshell.removeListener('message', callback)
      reject(new Error(`timeout on: ${profileId}`))
    }, 20000)
  })
}

export { reqFetchFromLinkedin, init }
