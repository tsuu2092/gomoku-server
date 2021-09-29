const express = require('express')
const authController = require('./auth/auth.controller')
const userController = require('./user/user.controller')
const appController = express.Router()

appController.get('/', (req, res) => {
    res.status(200).json(200)
})

appController.use('/users', userController)
appController.use('/auth', authController)
module.exports = appController