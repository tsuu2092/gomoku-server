const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const { JWT_SECRET } = require('./jwt.config')

dotenv.config()
const jwtService = {
    sign: (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '15d' }),
    verify: (token) => jwt.verify(token, JWT_SECRET)
}

module.exports = jwtService