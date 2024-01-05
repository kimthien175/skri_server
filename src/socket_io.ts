import { createServer } from 'http'
import { Server } from "socket.io"
import { app } from './api'

const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: "https://example.com",
        methods: ['GET', 'POST']
    }
})

io.on('connection', (socket) => {
    console.log('SOCKET.IO: CONNECTED');
    socket.on('disconnect', () => {
        console.log('DISCONNECTED');
    });
    socket.on('msg', (arg, callback) => {
        console.log(arg)
        callback('got it')
    })
})



export { httpServer, io }