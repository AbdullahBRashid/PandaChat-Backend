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
    res.setHeader('Access-Control-Allow-Headers', '*')
    next()
})

// Body parser
app.use(express.json())


// Create socket.io server
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['*'],
    }
})


// Express routing
app.use('/', router)


// Listen to socket.io events
io.on('connection', (socket) => {
    console.log(`User ${socket.id} connected!`)
    
    // Join room
    socket.on('join', (data) => {
        if (!data.token || typeof(data.token) !== 'string') {
            socket.emit('error', 'invalid data')
            console.log('error')
            return
        }

        try {
            jwt.verify(data.token, secret)
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                socket.emit('error', 'JsonWebTokenError')
                console.log('error')
                return
            } else if (error instanceof jwt.TokenExpiredError) {
                socket.emit('error', 'TokenExpiredError')
                console.log('error')
                return
            }
        }

        let jwtData = JSON.stringify(jwt.verify(data.token, secret))
        console.log(jwtData)

        let username = JSON.parse(jwtData).username

        socket.join(username)
        console.log(`User ${username} joined!`)
    })

    // Leave room
    socket.on('disconnect', () => {
        console.log('user disconnected')
    })

    socket.on('message', (data) => {
        if (!data.token || typeof(data.token) !== 'string' || !data.message || typeof(data.message) !== 'string' || !data.toUser || typeof(data.toUser) !== 'string') {
            socket.emit('error', 'invalid data')
            console.log('error')
            return
        }


        try {
            jwt.verify(data.token, secret)
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                socket.emit('error', 'JsonWebTokenError')
                console.log('error')
                return
            } else if (error instanceof jwt.TokenExpiredError) {
                socket.emit('error', 'TokenExpiredError')
                console.log('error')
                return
            }
        }

        let jwtData = JSON.stringify(jwt.verify(data.token, secret))
        console.log(jwtData)

        let username = JSON.parse(jwtData).username
        socket.join(username)
        let toUser = data.toUser

        let message = {
            username: username,
            message: data.message
        }

        io.to(toUser).emit('message', message)
    })

})

// Start server
httpServer.listen(3000, () => {
    console.log('listening on *:3000');
})