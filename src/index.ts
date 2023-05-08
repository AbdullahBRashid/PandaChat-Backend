import { Server } from 'socket.io'
import express from 'express'
import { createServer } from 'http'

// App initialization
const app = express()
const httpServer = createServer(app)


// CORS Handling
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    next()
})

// Create socket.io server
const io = new Server(httpServer, {
    cors: {
        origin: '*'
    }
})


// Express
app.get('/', (req, res) => {
    res.send('Hello World!');
});


// Listen to socket.io events
io.on('connection', (socket) => {
    console.log(`User ${socket.id} connected`);

    socket.on('message', (message) => {
        console.log(message);
        io.emit('message', message);
    })

    socket.on('disconnect', () => {
        console.log(`User ${socket.id} disconnected`);
    })
})

httpServer.listen(3000, () => {
    console.log('listening on *:3000');
})