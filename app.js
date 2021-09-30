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

const sockets = {}
const players = {}
const rooms = {}

let currentRoomId = 1

io.on('connection', socket => {
    const { id: socketId } = socket
    console.log(`Socket connected ${socketId}`)

    // Populate lobby data to the connected socket
    socket.on('requestRooms', () => {
        socket.emit('roomsChanged', { rooms })
    })

    socket.on('joinLobby', ({ player }) => {
        player.roomId = null
        player.socketId = socketId
        players[player._id] = player
        sockets[socketId] = player._id
        console.log(`Player ${player.username} has join the lobby!`)
    })

    socket.on('disconnect', () => {
        console.log(`Socket disconnected ${socketId}`)
        const playerId = sockets[socketId]
        leaveLobby({ playerId })
        // Remove from socket list
        delete sockets[socketId]
    })

    function leaveLobby({ playerId }) {
        const player = players[playerId]
        // Leave room
        leaveRoom({ playerId, roomId: player?.roomId })
        // Remove player from list
        console.log(`Player ${player?.username} has left the lobby!`)
        delete players[playerId]
    }

    function joinRoom({ player, roomId }) {
        if (roomId == null) return
        const room = rooms[roomId]
        if (!room) return

        // Change data
        players[player._id].roomId = roomId
        room.players.push(player)

        // Event
        socket.join(roomId)
        socket.emit('joinRoom', { roomId })
        io.to(roomId).emit('playerJoinRoom', { roomId, player })
        io.to(roomId).emit('roomPlayersChanged', { players: room.players })
        io.emit('roomsChanged', { rooms })

        console.log(`Player ${player.username} has entered room ${roomId}`)
    }

    function leaveRoom({ playerId, roomId }) {
        if (roomId == null) return
        const room = rooms[roomId]
        if (!room) return

        const player = players[playerId]

        // Change data
        if (player) player.roomId = null
        room.players = room.players.filter(p => p._id !== playerId)
        if (room.players.length === 0) {
            delete rooms[roomId]
        }

        // Event
        socket.leave(roomId)
        socket.emit('leaveRoom')
        io.to(roomId).emit('playerLeaveRoom', { playerId, username: player.username })
        io.to(roomId).emit('roomPlayersChanged', { players: room.players })
        io.emit('roomsChanged', { rooms })
        console.log(`Player ${player?.username} has left room ${roomId}`)
    }

    socket.on('createRoom', ({ player }) => {
        const roomId = currentRoomId
        rooms[roomId] = { players: [] }
        joinRoom({ player, roomId })
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
        joinRoom({ player, roomId })
    })

    socket.on('leaveRoom', ({ playerId, roomId }) => {
        leaveRoom({ playerId, roomId })
    })
})

server.listen(PORT, () => {
    console.log(`✔ Server is running on http://localhost:${PORT}`)
})