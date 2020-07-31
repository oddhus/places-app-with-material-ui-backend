const { v4: uuidv4} = require('uuid')

const HttpError = require('../models/http-error')

const DUMMY_PLACES = [{
  id: 'p1',
  title: 'Empire State Building',
  description: 'One of the most famous sky scrapers in the world',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Empire_State_Building_%28aerial_view%29.jpg',
  address: '20 W 34th St, New York, NY 10001, USA',
  location: {
      lat: 40.7484405,
      lng: -73.9878584
  },
  creatorId: 'u1'
}, {
  id: 'p2',
  title: 'Empire State Building',
  description: 'One of the most famous sky scrapers in the world',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Empire_State_Building_%28aerial_view%29.jpg',
  address: '20 W 34th St, New York, NY 10001, USA',
  location: {
      lat: 40.7484405,
      lng: -73.9878584
  },
  creatorId: 'u2'
}]

const getPlaceById = (req, res, next) => {
  const pid = req.params.pid
  const place = DUMMY_PLACES.find(p => p.id === pid)

  if(!place){
    return new HttpError("Could not find a place for provided id", 404)
  }

  res.json({place})
}

const getPlaceByUserId = (req, res, next) => {
  const uid = req.params.uid
  const place = DUMMY_PLACES.find(p => p.creatorId === uid)

  if(!place){
    return next(
      new HttpError("Could not find a place for the provided user id", 404)
    )
  }

  res.json({place})
}

const createPlace = (req, res, next) => {
  const { title, description, coordinates, address, creator } = req.body
  const createdPlace = {
    id: uuidv4(),
    title,
    description,
    location: coordinates,
    address,
    creator
  }
  DUMMY_PLACES.push(createdPlace)
  res.status(201).json({place: createdPlace})
}

exports.getPlaceById = getPlaceById
exports.getPlaceByUserId = getPlaceByUserId
exports.createPlace = createPlace