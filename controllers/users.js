const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const HttpError = require('../models/http-error');
const User = require('../models/user');
const cloudinary = require('../util/cloudinary');

const getUsers = async (req, res, next) => {
  let users
  try {
    users = await User.find({}, '-password -imagePublicId')
  } catch (error) {
    return next(new HttpError('Fetching users failed, please try again later'), 500)
  }

  res.json({users: users.map(user => user.toObject({getters: true}))})
}

const createNewUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs passed, please check your data", 422))
  }

  const { name, email, password } = req.body

  let existingUser
  try {
    existingUser = await User.findOne({email})
  } catch (error) {
    return next(new HttpError('Signing up failed, please try again later', 500))
  }

  if (existingUser){
    return next(new HttpError("Could not create user, email already exists", 422))
  }

  let hashedPassword
  try {
    hashedPassword = await bcrypt.hash(password, 12)
  } catch (error) {
    return next(new HttpError('Signing up failed, please try again later', 500))
  }

  const createdUser = new User ({
    name,
    email,
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/User_font_awesome.svg/1200px-User_font_awesome.svg.png",
    password: hashedPassword,
    places: [],
    imagePublicId: ""
  })

  if (req.file) {
    try {
      const result = await cloudinary.uploadImage(req.file, "/users/")
      createdUser.image = result.url
      createdUser.imagePublicId = result.public_id
    } catch (error) {
      return next(new HttpError(error.message ? error.message : "Could not upload picture, signing up failed", 500))
    }
  }

  try {
    await createdUser.save()
  } catch (error) {
    return next(new HttpError('Signing up failed, please try again later', 500))
  }

  let token
  try {
    token = jwt.sign(
      {userId: createdUser.id, email: createdUser.email},
      process.env.JWT_SECRET,
      {expiresIn: '1h'}
    )
  } catch (error) {
    return next(new HttpError('Signing up failed, please try again later', 500))
  }

  res.status(201).json({userId: createdUser.id, email: createdUser.email, token})
}

const loginUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs passed, please check your data", 422)) 
  }

  const { email, password } = req.body

  let existingUser
  try {
    existingUser = await User.findOne({email})
  } catch (error) {
    return next(new HttpError('Signing in failed, please try again later', 500))
  }

  let isValidPassword
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password)
  } catch (error) {
    return next(new HttpError("Invalid inputs passed, please check your data", 422)) 
  }

  if (!isValidPassword) {
    return next(new HttpError("Invalid password or email", 401))
  }

  let token
  try {
    token = jwt.sign(
      {userId: existingUser.id, email: existingUser.email},
      process.env.JWT_SECRET,
      {expiresIn: '1h'}
    )
  } catch (error) {
    return next(new HttpError('Logging in failed, please try again later', 500))
  }

  res.status(200).json({userId: existingUser.id, email: existingUser.email, token})
}

exports.getUsers = getUsers
exports.createNewUser = createNewUser
exports.loginUser = loginUser