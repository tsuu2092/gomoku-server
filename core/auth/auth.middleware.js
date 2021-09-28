const jwt = require('jsonwebtoken')
const { COOKIE_NAME } = require('../cookie/cookie.config')
const jwtService = require('../jwt/jwt.service')

function auth(req, res, next) {
    const cookies = req.cookies
    const authHeader = req.headers.authorization
    const token = cookies[COOKIE_NAME] || (authHeader && authHeader.split(' ')[1])
    if (token === null) return res.status(401).json({ message: 'Access denied.' })
    try {
        const payload = jwtService.verify(token)
        req.user = payload
        console.log(payload)
        next()
    }
    catch (e) { res.status(400).json({ message: 'Invalid token.' }) }
}

module.exports = auth