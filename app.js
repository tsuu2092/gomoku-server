require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()
const server = require('http').Server(app)
const morgan = require('morgan')
const mongoose = require('mongoose')
const socketio = require('socket.io')
const cookieParser = require('cookie-parser')
const appController = require('./core/app.controller')


const PORT = process.env.PORT || 3000
const MONGO_URI = process.env.MONGO_URI

app.use(morgan('dev'))
app.use(cors({ credentials: true, origin: true }))
app.options("*", cors())
app.use(express.json())
app.use(express.urlencoded({
    extended: true,
}))
app.use(cookieParser())
app.use('/', appController)

mongoose.connect(MONGO_URI).then(() => {
    console.log(`✔ Connected to MongoDB`)
}).catch(console.log)

const io = socketio(server, { cors: { origin: "*" } })
const rooms = {}
let currentRoomId = 1
io.on('connection', socket => {
    const { id } = socket
    console.log(`Socket connected ${id}`)

    socket.emit('lobbyChanged', { rooms })

    socket.on('disconnect', () => {
        console.log(`Socket disconnected ${id}`)
    })

    socket.on('createRoom', ({ player }) => {
        const roomId = currentRoomId
        rooms[roomId] = { players: [player] }
        socket.join(roomId)
        socket.emit('joinRoom', { roomId })
        io.emit('lobbyChanged', { rooms })
        currentRoomId++
    })

    socket.on('joinRoom', ({ roomId, player }) => {
        console.log(roomId)
        const room = rooms[roomId]
        if (!room) return
        if (room.players.length > 1) {
            socket.emit('joinRoomFailed', ({ message: "Room is already full!" }))
            return
        }
        room.players.push(player)
        socket.join(roomId)
        socket.emit('joinRoom', { roomId })
        io.to(roomId).emit('playerJoinRoom', { roomId, player })
        io.emit('lobbyChanged', { rooms })
    })

    socket.on('leaveRoom', ({ player, roomId }) => {
        socket.leave(roomId)
        socket.emit('leaveRoom')
        io.to(roomId).emit('playerLeaveRoom', { player })
        const room = rooms[roomId]
        if (!room) return
        console.log(room.players)
        room.players = room.players.filter(p => p._id !== player._id)
        if (room.players.length === 0) {
            delete rooms[roomId]
        }
        io.emit('lobbyChanged', { rooms })
    })
})

server.listen(PORT, () => {
    console.log(`✔ Server is running on http://localhost:${PORT}`)
})