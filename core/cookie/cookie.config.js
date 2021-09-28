const COOKIE_NAME = 'gomoku-token'
const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'none',
    maxAge: 15 * 86400 * 1000
}
module.exports = { COOKIE_NAME,COOKIE_OPTIONS }