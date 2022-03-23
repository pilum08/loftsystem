const mongoose = require('mongoose')
require('dotenv').config()
let uri = process.env.uriDB

mongoose.Promise = global.Promise

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

mongoose.connection.on('connected', () => {
  console.log(`connection`)
})

mongoose.connection.on('error', (err) => {
  console.log('error: ' + err)
})

mongoose.connection.on('disconnected', () => {
  console.log('disconnected')
})

process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('app termination')
    process.exit(1)
  })
})