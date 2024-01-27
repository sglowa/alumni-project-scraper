import { execSync } from 'child_process'
import { platform } from 'os'
import { resolve, join } from 'path'
// eslint-disable-next-line camelcase
import { __dirname } from './utils.js'

function installDependencies () {
  // Determine the appropriate package manager based on the platform
  const packageManager = platform() === 'win32' ? 'pip' : 'pip3'

  // Get the absolute path to the directory containing this script
  const scriptDirectory = resolve(__dirname)

  // Install dependencies using the requirements.txt file
  try {
    execSync(`${packageManager} install -r ${join(scriptDirectory, 'python_requirements.txt')}`)
    console.log('Dependencies installed successfully.')
  } catch (error) {
    console.error('Failed to install dependencies. Please check the error message.')
  }
}
installDependencies()
