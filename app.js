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
const User = require('./core/user/user.schema')
const getKeyByValue = require('./helpers/getKeyByValue')
const { Board, X, O } = require('./board')


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
app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send(err)
})

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

    socket.on('requestJoinLobby', async ({ playerId }) => {
        sockets[socketId] = playerId
        // Force disconnect on first socket if a user connects with 2 sockets
        const playerInLobby = players[playerId]
        if (playerInLobby) {
            io.to(playerInLobby.socketId).emit('forceDisconnect')
            console.log('Forcing disconnect')
            return
        }
        // Init player data
        await joinLobby({ playerId })
    })

    socket.on('disconnect', () => {
        console.log(`Socket disconnected ${socketId}`)
        const playerId = sockets[socketId]
        leaveLobby({ playerId })
        // Remove from socket list
        delete sockets[socketId]
        // Allow second socket to join lobby if there is any
        const secondSocketId = getKeyByValue(sockets, playerId)
        if (secondSocketId) joinLobby({ playerId, otherSocketId: secondSocketId })
    })

    async function joinLobby({ playerId, otherSocketId = null }) {
        const player = await User.findById(playerId).lean()
        if (!player) return
        let targetSocketId = otherSocketId ?? socketId
        player._id = String(player._id)
        player.roomId = null
        player.socketId = targetSocketId
        players[playerId] = player
        io.to(targetSocketId).emit('joinLobby')
        console.log(`Player ${player.username} has join the lobby!`)
    }

    function leaveLobby({ playerId }) {
        const player = players[playerId]
        // Leave room
        leaveRoom({ playerId, roomId: player?.roomId })
        // Remove player from list
        console.log(`Player ${player?.username} has left the lobby!`)
        delete players[playerId]
    }

    function joinRoom({ playerId, roomId }) {
        if (roomId == null) return
        const room = rooms[roomId]
        if (!room) return
        const player = players[playerId]
        if (!player) return
        // Change data
        player.roomId = roomId
        room.players.push(player)

        // Event
        socket.join(roomId)
        socket.emit('joinRoom', { roomId })
        io.to(roomId).emit('playerJoinRoom', { roomId, player })
        io.to(roomId).emit('roomPlayersChanged', { players: room.players, board: null })
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
        room.ready = false
        room.players = room.players.filter(p => String(p._id) !== playerId)
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

    function createRoom({ playerId }) {
        const roomId = currentRoomId
        rooms[roomId] = { players: [] }
        joinRoom({ playerId, roomId })
        currentRoomId++
    }

    socket.on('createRoom', ({ playerId }) => {
        createRoom({ playerId })
    })

    socket.on('joinRoom', ({ roomId, playerId }) => {
        const room = rooms[roomId]
        if (!room) return
        if (room.players.length > 1) {
            socket.emit('joinRoomFailed', ({ message: "Room is already full!" }))
            return
        }
        joinRoom({ playerId, roomId })
    })

    socket.on('ready', ({ roomId }) => {
        const room = rooms[roomId]
        if (!room) return
        io.to(roomId).emit('ready')
    })

    socket.on('notReady', ({ roomId }) => {
        const room = rooms[roomId]
        if (!room) return
        io.to(roomId).emit('notReady')
    })

    socket.on('leaveRoom', ({ playerId, roomId }) => {
        leaveRoom({ playerId, roomId })
    })

    socket.on('startGame', ({ roomId }) => {
        const room = rooms[roomId]
        if (!room) return
        const players = room.players
        if (players.length < 2) return
        room.board = new Board({ player1: players[0]._id, player2: players[1]._id })
        if (room.board.xPlayer === players[0]._id) {
            io.to(players[0].socketId).emit('startGame', { stone: X })
            io.to(players[0].socketId).emit('yourTurn')
            io.to(players[1].socketId).emit('startGame', { stone: O })
        } else {
            io.to(players[1].socketId).emit('startGame', { stone: X })
            io.to(players[1].socketId).emit('yourTurn')
            io.to(players[0].socketId).emit('startGame', { stone: O })
        }
        console.log('Game started')
    })

    socket.on('move', async ({ playerId, r, c, roomId }) => {
        const room = rooms[roomId]
        if (!room) return
        const roomPlayers = room.players
        if (players.length < 2) return
        console.log(`Move from player ${playerId} at row ${r} column ${c} in room ${roomId}`)
        const { board } = room
        const stone = board.getCurrentStone()
        if (!board.addMove({ playerId, r, c })) return
        io.to(roomId).emit('move', { stone, r, c, })
        const socketId = board.currentTurn === roomPlayers[0]._id ? roomPlayers[0].socketId : roomPlayers[1].socketId

        const { winner, loser } = board
        if (winner && loser) {
            io.to(roomId).emit('playerWin', { playerId: winner, username: players[winner].username })
            await calculateElo({ winner, loser })
            io.emit('roomsChanged', { rooms })
            io.to(roomId).emit('roomPlayersChanged', { players: room.players })
            return
        }
        if (board.isDraw()) {
            io.to(roomId).emit('draw')
        }
        io.to(socketId).emit('yourTurn')
    })

    async function calculateElo({ winner, loser }) {
        const winnerPlayer = await User.findById(winner)
        const loserPlayer = await User.findById(winner)
        await User.findByIdAndUpdate(winner, { $inc: { elo: 10 } }, { new: true }).exec().then(doc => {
            console.log(doc)
            const player = players[winner]
            player.elo = doc.elo
        })
        await User.findByIdAndUpdate(loser, { $inc: { elo: -10 } }, { new: true }).exec().then(doc => {
            console.log(doc)
            const player = players[loser]
            player.elo = doc.elo
        })
    }
})
server.listen(PORT, () => {
    console.log(`✔ Server is running on http://localhost:${PORT}`)
})