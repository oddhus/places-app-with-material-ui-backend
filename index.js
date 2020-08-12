require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const cors = require('cors')

const userRoutes = require('./routes/users')
const placeRoutes = require('./routes/places')
const HttpError = require('./models/http-error');

const app = express()
const port = 5000

app.use(bodyParser.json())
//app.use(cors())
app.options('*',cors())

app.use('/api/users', userRoutes)
app.use('/api/places', placeRoutes)

app.use((req, res, next) => {
  throw new HttpError('Could not find the route', 404)
})

app.use((error, req, res, next) => {
  if (res.headerSent){
    return next(error)
  }
  res.status(error.code || 500).json({message: error.message || "An unkown message occured"})
})

mongoose
  .connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@placesapp.wktbe.mongodb.net/places?retryWrites=true&w=majority`,
  { useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true 
  })
  .then(() => {
    app.listen(port, () => console.log(`Example app listening on port ${port}!`))
  })
  .catch((err) => {
    console.log(err)
  })