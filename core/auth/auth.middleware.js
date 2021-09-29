const jwt = require('jsonwebtoken')
const { COOKIE_NAME } = require('../cookie/cookie.config')
const { JWT_SECRET } = require('../jwt/jwt.config')

function auth(req, res, next) {
    const cookies = req.cookies
    const authHeader = req.headers.authorization
    const token = cookies[COOKIE_NAME] || (authHeader && authHeader.split(' ')[1])
    if (token === null) return res.status(403).json({ message: 'Access denied.' })
    try {
        jwt.verify(token, JWT_SECRET, (err, payload) => {
            if (err) return res.sendStatus(403)
            req.user = payload
            next()
        })

    }
    catch (e) { res.status(400).json({ message: 'Invalid token.' }) }
}

module.exports = auth