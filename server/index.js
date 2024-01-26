import 'dotenv/config'

import express from 'express'

import bodyParser from 'body-parser'

import { scrapeProfileMain } from './scrape-profile.js'
import { init as pythonInit } from './NodePythonChannel.js'

const port = process.env.PORT_EXPRESS_SERVER || 3212

pythonInit()

const app = express()
app.use(bodyParser.text({ type: 'text/plain' }))
app.post('/parse-url', (req, res) => {
  // make sure payload matches the paramateres of scrapeProfileMain

  /** @type {import('./typedefs.js').LinkedinTampermonkeyPayload} */
  const payload = JSON.parse(req.body)
  console.log(payload)
  const { profileUrlPathname, schoolsSelectors, phd } = payload
  scrapeProfileMain(profileUrlPathname, schoolsSelectors, phd, msg => res.send(msg))
})
app.get('/', (req, res) => {
  res.send('hello world')
})

// add also get localhost:port/exportCSV - to dl csv
// add also get localhost:port/cleanDB - to cleanDB
app.listen(port, () => {
  console.log(`Server is Listening on ${port}`)
})
