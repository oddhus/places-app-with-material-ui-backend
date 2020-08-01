const { v4: uuidv4} = require('uuid')
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');

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
    throw new HttpError("Could not find a place for provided id", 404)
  }

  res.json({place})
}

const getPlacesByUserId = (req, res, next) => {
  const uid = req.params.uid
  const places = DUMMY_PLACES.filter(p => p.creatorId === uid)

  if(!places || places.length === 0){
    return next(
      new HttpError("Could not find any places for the provided user id", 404)
    )
  }

  res.json({places})
}

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, address, creator } = req.body

  let coordinates
  try {
    coordinates = await getCoordsForAddress(address)
  } catch (error) {
    return next(error)
  }

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

const updatePlaceById = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const pid = req.params.pid
  const { title, description } = req.body

  const placeIndex = DUMMY_PLACES.findIndex(p => p.id === pid)

  if(placeIndex < 0){
    throw new HttpError("Could not find a place for the provided id", 404)
  }

  const updatedPlace = { 
    ...DUMMY_PLACES[placeIndex],
    title,
    description
  }

  DUMMY_PLACES[placeIndex] = updatedPlace
  res.status(200).json({place: updatedPlace})
}

const deletePlaceById = (req, res, next) => {
  const pid = req.params.pid
  const placeIndex = DUMMY_PLACES.findIndex(p => p.id === pid)

  if(placeIndex < 0){
    throw new HttpError("Could not find a place for the provided id", 404)
  }

  DUMMY_PLACES.splice(placeIndex, 1)
  res.status(200).json({message: "Deleted place"})
}

exports.getPlaceById = getPlaceById
exports.getPlacesByUserId = getPlacesByUserId
exports.createPlace = createPlace
exports.updatePlaceById = updatePlaceById
exports.deletePlaceById = deletePlaceById