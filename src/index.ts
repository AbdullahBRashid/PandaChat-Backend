// Import modules

import express from 'express'
import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
import { createServer } from 'http'
import { router } from './routes'
import dotenv from 'dotenv'

dotenv.config()

let secret: string

if (process.env.TOKEN_SECRET) {
    secret = process.env.TOKEN_SECRET
} else {
    throw new Error('SECRET not found in .env file')
}

// App initialization
const app = express()
const httpServer = createServer(app)


// CORS Handling
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    next()
})

// Body parser
app.use(express.json())


// Create socket.io server
const io = new Server(httpServer, {
    cors: {
        origin: '*'
    }
})


// Express routing
app.use('/', router)


// Listen to socket.io events
io.on('connection', (socket) => {
    
    // Join room
    socket.on('join', (data) => {
        if (!data.token || !data.toUserName || typeof(data.token) !== 'string' || typeof(data.toUserName) !== 'string') {
            socket.emit('error', 'invalid data')
            return
        }

        let username = jwt.verify(data.token, secret)
        console.log(username)

        // socket.join(username)
        console.log(`User ${data.username} joined room ${data.room}`)
    })

    // Leave room
    socket.on('leave', (data) => {
        socket.leave(data.room)
        console.log(`User ${data.username} left room ${data.room}`)
    })

})

// Start server
httpServer.listen(3000, () => {
    console.log('listening on *:3000');
})