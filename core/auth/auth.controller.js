const express = require('express')
const bcrypt = require('bcrypt')
const authController = express.Router()
const User = require('../user/user.schema')
const { COOKIE_NAME, COOKIE_OPTIONS } = require('../cookie/cookie.config')
const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../jwt/jwt.config')
authController.post('/login', async (req, res, next) => {
    const { username, password } = req.body
    const user = await User.findOne({ username }).select('password')
    console.log(user)
    if (user === null) return res.status(400).json({ message: "Username and password do not match." })
    try {
        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return res.status(400).json({ message: "Username and password do not match." })
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '365d' })
        res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS)
        res.json({ token })
    } catch (e) {
        next(e)
    }

})

authController.post('/logout', async (req, res) => {
    res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS)
    res.json(200)
})

module.exports = authController