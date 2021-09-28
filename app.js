const express = require('express')
const cors = require('cors')
const app = express()
const server = require('http').Server(app)
const morgan = require('morgan')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const socketio = require('socket.io')
const cookieParser = require('cookie-parser') 
const appController = require('./core/app.controller')

const io = socketio(server, {
    cors: {
        origin: "*"
    }
})

dotenv.config()
const PORT = process.env.PORT || 3000
const MONGO_URI = process.env.MONGO_URI

app.use(morgan('dev'))
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({
    extended: true,
}))
app.use(cookieParser())
app.use('/', appController)


mongoose.connect(MONGO_URI).then(() => {
    console.log(`✔ Connected to MongoDB`)
}).catch(console.log)

io.on('connection', socket => {
    const { id } = socket
    console.log(`Socket connected ${id}`)

    socket.on('disconnect', () => {
        console.log(`Socket disconnected ${id}`)
    })
})

server.listen(PORT, () => {
    console.log(`✔ Server is running on http://localhost:${PORT}`)
})