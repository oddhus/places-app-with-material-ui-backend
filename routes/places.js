const express = require('express')
const { body } = require('express-validator')

const placesControllers = require('../controllers/places')

const router = express.Router()


router.get('/:pid', placesControllers.getPlaceById)

router.get('/user/:uid', placesControllers.getPlacesByUserId)

router.post('/', 
  [
    body('title').notEmpty(),
    body('description').isLength({min: 5}),
    body('address').notEmpty(),
  ]
  , placesControllers.createPlace)

router.patch('/:pid',
  [
    body('title').notEmpty(),
    body('description').isLength({min: 5}),
  ], 
  placesControllers.updatePlaceById)

router.delete('/:pid', placesControllers.deletePlaceById)


module.exports = router