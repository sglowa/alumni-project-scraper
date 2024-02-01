import { __dirname } from '../utils.js'
import path from 'path'
import { JSONFilePreset } from 'lowdb/node'

const db = await JSONFilePreset(path.join(__dirname, './alumni_db.json'), [])

async function saveToDatabase (profileData) {
  await db.read()
  console.log('profile data queued for database', profileData)
  await db.update((arr) => arr.push(profileData))
  console.log('saved to database!')
}

export { saveToDatabase }
