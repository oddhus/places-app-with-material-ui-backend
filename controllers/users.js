const { v4: uuidv4} = require('uuid')
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error')

const USERS = [{
  id: 'u1',
  name: "Oddmund",
  image: "https://miro.medium.com/max/1200/1*mk1-6aYaf_Bes1E3Imhc0A.jpeg",
  places: 3,
  email: "o@o.com",
  password: "12345678"
}] 

const getUsers = (req, res, next) => {
  res.json(USERS)
}

const createNewUser = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed, please check your data", 422)
  }

  const { name, email, password } = req.body
  const hasUser = USERS.find(user => user.email === email)

  if (hasUser){
    throw new HttpError("Could not create user, email already exists", 422)
  }

  const newUser = {
    id: uuidv4(),
    name,
    email,
    password,
    places: 0,
  }

  USERS.push(newUser)
  res.status(201).json({user: newUser})
}

const loginUser = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body

  const user = USERS.find(user => user.email === email)
  const correctPassword = user.password === password

  if (!correctPassword) {
    throw new HttpError("Invalid password or email", 401)
  }

  res.json({message: "Logged in"})
}

exports.getUsers = getUsers
exports.createNewUser = createNewUser
exports.loginUser = loginUser