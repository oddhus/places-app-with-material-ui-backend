const express = require('express')
const { body } = require('express-validator')

const router = express.Router()

const usersControllers = require('../controllers/users')

router.get('/', usersControllers.getUsers)

router.post('/signup',
  [
    body('name').isLength({min: 2}),
    body('email').normalizeEmail().isEmail(),
    body('password').isLength({min: 8}),
  ],
  usersControllers.createNewUser)

router.post('/signin', usersControllers.loginUser)

module.exports = router