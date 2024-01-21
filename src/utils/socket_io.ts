import { createServer } from 'http'
import { Server } from "socket.io"
import { app } from './api.js'
import { registerInitPrivateRoom } from '../event_handlers/private_room/init/init.js'
import { registerListenChatMessages } from '../event_handlers/private_room/listen_guess/listen_guess.js'
import { registerJoinPrivateRoom } from '../event_handlers/private_room/join/join.js'
import { registerDeleteRoom } from '../event_handlers/delete_room/delete_room.js'

const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: "https://example.com",
        methods: ['GET', 'POST']
    }
})

io.on('connection', (socket) => {
    console.log('SOCKET.IO: CONNECTED')
    socket.on('disconnect', () => {
        // player leave
        io.emit('player_leave', socket.id)
        console.log('PLAYER LEAVE'); 
        // change db
    })

    // listen to init_room request
    registerInitPrivateRoom(socket)
    registerListenChatMessages(socket)
    registerJoinPrivateRoom(socket)
    registerDeleteRoom(socket)
})


export { httpServer, io }