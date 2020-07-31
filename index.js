const express = require('express')
const bodyParser = require('body-parser')

const userRoutes = require('./routes/users')
const placeRoutes = require('./routes/places')
const HttpError = require('./models/http-error')

const app = express()
const port = 5000

app.use(bodyParser.json())

app.use('/api/users', userRoutes)
app.use('/api/places', placeRoutes)

app.use((req, res, next) => {
  throw new HttpError('Could not find the route', 404)
})

app.use((error, req, res, next) => {
  if (res.headerSent){
    return next(error)
  }
  res.status(error.code || 500)
  res.json({message: error.message || "An unkown message occured"})
})

app.get('/', (req, res) => res.send('Hello World!'))

app.listen(port, () => console.log(`Example app listening on port port!`))