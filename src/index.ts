import { Server } from 'socket.io'
import express from 'express'
import { createServer } from 'http'

import { userJoin, checkIsInRoom, getUsername } from './functions'


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

    console.log('Connected', socket.id + "\n");

    socket.on("joinRoom", ({ username, room, password }) => {

        // Null checks
        if (username == '' || room == '' || password == '' || username == undefined || room == undefined || password == undefined || username == null || room == null || password == null) {
            socket.emit('roomFeedback', 'empty')
            console.log(`User ${username}:${socket.id} tried to join room ${room} with password ${password} but failed because of empty fields`)
            return;
        }

        // Check if room exists
        let isEntryAvailable = userJoin(socket.id, username, room, password);

        // If room exists, join it
        if (isEntryAvailable) {
            socket.join(room);
            socket.emit('roomFeedback', 'correct')
            io.to(room).emit('userJoined', `User ${username} joined room ${room}`);
            console.log(`User ${username}:${socket.id} joined room ${room} with password ${password}`);
        } else {
            socket.emit('roomFeedback', 'wrong')
        }
    });


    socket.on('disconnect', () => {
        io.emit('message', 'user disconnected '+ socket.id);
    })

    socket.on('message', ({room, message}) => {

        // Null checks
        if (room == '' || message == '' || room == undefined || message == undefined || room == null || message == null) {
            socket.emit('error', 'empty');
            return;
        }

        // Check if user is in room
        let isInRoom = checkIsInRoom(socket.id, room)

        // If user is not in room, return
        if (!isInRoom) {
            socket.emit('error', 'You are not in this room');
            return;
        }

        // Get username
        let username = getUsername(socket.id, room);

        // Compose and Send Message
        message = {
            username: username,
            message: message,
        };
        
        io.to(room).emit('message', message);
        console.log(message);
        
        
    })
})

httpServer.listen(3000, () => {
    console.log('listening on *:3000');
})