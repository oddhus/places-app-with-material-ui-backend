const { validationResult } = require('express-validator');
const mongoose = require('mongoose')

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const cloudinary = require('../util/cloudinary');
const Place = require('../models/place');
const User = require('../models/user');

const getPlaceById = async (req, res, next) => {
  const pid = req.params.pid

  let place
  try {
    place = await Place.findById(pid, '-imagePublicId')
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

  let userWithPlaces
  try {
    userWithPlaces = await User.findById(uid).populate({path: 'places', select: '-imagePublicId'})
  } catch (error) {
    return next(new HttpError("Something went wrong, please try again later", 500))
  }

  if(!userWithPlaces || userWithPlaces.places.length === 0){
    return next(new HttpError("Could not find any places for the provided user id", 404))
  }

  res.json({places:  userWithPlaces.places.map(place => place.toObject({getters: true}))})
}



const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs passed, please check your data", 422))
  }

  const { title, description, address } = req.body
  const creator = req.userData.userId

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
    image: "https://www.sasaki.com/wp-content/uploads/2014/07/cities-blog-image.jpg",
    creator,
    imagePublicId: ""
  })

  let user
  try {
    user = await User.findById(creator)
  } catch (error) {
    return next(new HttpError('Creating place failed, please try again later'))
  }

  if(!user){
    return next(new HttpError('Could not find user for provided id', 404))
  }

  if (req.file) { /* Check if there is an image */
    try {
      const result = await cloudinary.uploadImage(req.file, "/places/")
      createdPlace.image = result.url
      createdPlace.imagePublicId = result.public_id
    } catch (error) {
      return next(new HttpError(error.message ? error.message : "Could not upload picture", 500))
    }
  }

  try {
    const session = await mongoose.startSession()
    session.startTransaction()
    await createdPlace.save({session})
    user.places.push(createdPlace)
    await user.save({session})
    session.commitTransaction()
  } catch (err) {
    const error = new HttpError("Creating place failed. Please try again", 500)
    return next(error)
  }

  res.status(201).json({place: createdPlace})
}

const updatePlaceById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs passed, please check your data", 422)) //res.status(400).json({ message: errors.array() });
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

  if(place.creator.toString() !== req.userData.userId){
    return next(new HttpError("You are not allowed to edit this place", 401))
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
    place = await Place.findById(pid).populate('creator')
  } catch (error) {
    return next(new HttpError('Something went wrong, could not delete place', 500))
  }

  if(!place){
    return next(new HttpError("Could not find a place to delete for the provided id", 404))
  }

  if(place.creator.id.toString() !== req.userData.userId){
    return next(new HttpError("You are not allowed to delete this place", 401))
  }

  if (place.imagePublicId){
    try {
      const result = await cloudinary.deleteImage(place.imagePublicId, "/places/")
    } catch (error) {
      console.log(error)
    }
  }

  try {
    const session = await mongoose.startSession()
    session.startTransaction()
    await place.deleteOne({session})
    place.creator.places.pull(place)
    await place.creator.save({session})
    session.commitTransaction()
  } catch (error) {
    return next(new HttpError('Something went wrong, could not delete place', 500))
  }

  res.status(200).json({message: "Deleted place"})
}

exports.getPlaceById = getPlaceById
exports.getPlacesByUserId = getPlacesByUserId
exports.createPlace = createPlace
exports.updatePlaceById = updatePlaceById
exports.deletePlaceById = deletePlaceById