const express = require('express')
const userController = express.Router()
const User = require('./user.schema')
const bcrypt = require('bcrypt')
const { COOKIE_OPTIONS } = require('../cookie/cookie.config')
const auth = require('../auth/auth.middleware')

userController.get('/', async (req, res) => {
    res.json(await User.find({}))
})

userController.get('/me', auth, async (req, res) => {
    res.json(await User.findById(req.user?.id))
})

userController.get('/:id', async (req, res) => {
    const { id } = req.params
    res.json(await User.findById(id))
})

userController.post('/', async (req, res, next) => {
    const { username, password } = req.body
    const user = await User.findOne({ username })
    if (user) res.status(409).json({ message: `Username ${username} is already taken` })
    try {
        const salt = await bcrypt.genSalt()
        const hashedPassword = await bcrypt.hash(password, salt)
        req.body.password = hashedPassword
        res.json(await User.create(req.body))
    } catch (e) {
        next(e)
    }
})

userController.patch('/:id', async (req, res) => {
    const { id } = req.params
    const { username, password } = req.body
    res.json(await User.findByIdAndUpdate(id,
        { username, password }
    ))
})

userController.delete('/:id', async (req, res) => {
    const { id } = req.params
    res.json(await User.findByIdAndDelete(id))
})

module.exports = userController