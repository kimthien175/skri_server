import { createServer } from 'http'
import { Server } from "socket.io"
import { app } from './api.js'
import { registerInitPrivateRoom } from '../event_handlers/private_room/init/init.js'
import { registerListenChatMessages } from '../event_handlers/private_room/listen_guess/listen_guess.js'
import { registerJoinPrivateRoom } from '../event_handlers/private_room/join/join.js'
import { registerDeleteRoomOnLeave } from '../event_handlers/delete_room_on_leave/delete_room.js'
import { registerLeaveRoom } from '../event_handlers/player_leave/player_leave.js'

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
        console.log(`player ${socket.id} disconnected`);
    })

    // listen to init_room request
    registerInitPrivateRoom(socket)
    registerListenChatMessages(socket)
    registerJoinPrivateRoom(socket)
    registerDeleteRoomOnLeave(socket)

    registerLeaveRoom(socket)
})


export { httpServer, io }