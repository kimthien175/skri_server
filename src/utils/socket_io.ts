import { createServer } from 'http'
import { Server } from "socket.io"
import { app } from './api.js'
import { registerInitPrivateRoom } from '../event_handlers/private_room/init/init.js'
import { registerListenChatMessages } from '../event_handlers/private_room/listen_guess/listen_guess.js'
import { registerJoinPrivateRoom } from '../event_handlers/private_room/join.js'
import { registerDeleteRoomOnLeave } from '../event_handlers/delete_room_on_leave/delete_room.js'
import { SocketPackage } from '../types/socket_package.js'
import { onLeavingPrivateRoom } from '../event_handlers/private_room/disconnect.js'
import { onLeavingPublicRoom } from '../event_handlers/public_room/disconnect.js'

const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: "https://example.com",
        methods: ['GET', 'POST']
    }
})

io.on('connection', (socket) => {
    const socketPackage: SocketPackage = new SocketPackage(
        io,
        socket,
        ''// public room id: p_... private: room 0-9a-z
    );

    console.log('SOCKET.IO: CONNECTED')
    socket.on('disconnect', () => {
        console.log(`player ${socket.id} disconnected`);

        // TODO: remove this 'if' on production
        if (socketPackage.roomCode =='') throw Error('socket.disconnect: Unhandled usecase')
        console.log(`SocketIO.disconnect: roomCode: ${socketPackage.roomCode}`);
        
        if (socketPackage.roomCode.startsWith('p_'))
            onLeavingPublicRoom(socketPackage)
         else 
            onLeavingPrivateRoom(socketPackage) 
    })

    // listen to init_room request
    registerInitPrivateRoom(socketPackage)
    // registerListenChatMessages(socketPackage)
    registerJoinPrivateRoom(socketPackage)
    // registerDeleteRoomOnLeave(socketPackage)

    //registerLeaveRoom(socketPackage)
})


export { httpServer, io }