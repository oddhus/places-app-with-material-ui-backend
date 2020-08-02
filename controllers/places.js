const { v4: uuidv4} = require('uuid')
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');

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

const getPlaceById = async (req, res, next) => {
  const pid = req.params.pid

  let place
  try {
    place = await Place.findById(pid)
  } catch (err) {
    return next(new HttpError("Something went wrong, could not find a place", 500))
  }

  if(!place){
    return next(new HttpError("Could not find a place for provided id", 404))
  }

  res.json({place: place.toObject({getters: true})})
}

const getPlacesByUserId = async (req, res, next) => {
  const uid = req.params.uid

  let places
  try {
    places = await Place.find({creator: uid})
  } catch (error) {
    return next(new HttpError("Something went wrong, please try again later", 500))
  }

  if(!places || places.length === 0){
    return next(new HttpError("Could not find any places for the provided user id", 404))
  }

  res.json({places:  places.map(place => place.toObject({getter: true}))})
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

  const createdPlace = new Place ({
    title,
    description,
    address,
    location: coordinates,
    image: "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.ledgerinsights.com%2Fblockchain-proof-of-location%2F&psig=AOvVaw0SNZnVJn14uBMRk5negxIU&ust=1596441412795000&source=images&cd=vfe&ved=0CAIQjRxqFwoTCKimq_CF_OoCFQAAAAAdAAAAABAJ",
    creator
  })

  try {
    await createdPlace.save()
  } catch (err) {
    const error = new HttpError("Creating place failed. Please try again", 500)
    return next(error)
  }

  res.status(201).json({place: createdPlace})
}

const updatePlaceById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const pid = req.params.pid
  const { title, description } = req.body

  let place
   try {
    place = await Place.findById(pid)
  } catch (error) {
    return next(new HttpError('Something went wrong, could not update place', 500))
  }

  if(!place){
    return next(new HttpError("Could not find a place for the provided id", 404))
  }

  place.title = title
  place.description = description

  try {
    await place.save()
  } catch (error) {
    return next(new HttpError('Something went wrong, could not update place', 500))
  }

  res.status(200).json({place: place.toObject({getters: true})})
}

const deletePlaceById = async (req, res, next) => {
  const pid = req.params.pid

  let place
  try {
    place = await Place.findByIdAndDelete(pid)
  } catch (error) {
    return next(new HttpError('Something went wrong, could not delete place', 500))
  }

  if(!place){
    return next(new HttpError("Could not find a place to delete for the provided id", 404))
  }

  res.status(200).json({message: "Deleted place", place: place.toObject()})
}

exports.getPlaceById = getPlaceById
exports.getPlacesByUserId = getPlacesByUserId
exports.createPlace = createPlace
exports.updatePlaceById = updatePlaceById
exports.deletePlaceById = deletePlaceById