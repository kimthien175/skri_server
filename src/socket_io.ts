import { createServer } from 'http'
import { Server } from "socket.io"
import { app } from './api.js'
import { registerInitPrivateRoom } from './event_handlers/init_private_room/init_private_room.js'

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
        console.log('DISCONNECTED')
    })

    // listen to init_room request
    registerInitPrivateRoom(socket)
})


export { httpServer, io }