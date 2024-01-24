import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
export const __dirname = path.dirname(__filename)
export const fieldNotAvailableWarning = (fieldName, returnString) => {
  console.warn(`${fieldName} field not available`)
  return returnString
}
