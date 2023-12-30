// const express = require('express')
import express from 'express'
// const bodyParser = require('body-parser')
import bodyParser from 'body-parser'
// const { scrapeProfileMain } = require('./scrape-profile')
import { scrapeProfileMain } from './scrape-profile.js'

const app = express()
app.use(bodyParser.text({ type: 'text/plain' }))
app.post('/parse-urls', (req, res) => {
  // make sure payload matches the paramateres of scrapeProfileMain
  const urlsPayload = JSON.parse(req.body)
  console.log(urlsPayload)
  scrapeProfileMain(urlsPayload[0], urlsPayload[1])
  res.send('received, yessir !')
})
app.get('/', (req, res) => {
  res.send('hello world')
})

// add also get localhost:port/exportCSV - to dl csv
// add also get localhost:port/cleanDB - to cleanDB
app.listen(3212, () => {
  console.log('Server is Listening on 3212')
})
