import { createServer } from 'http'
import { Server } from "socket.io"
import { app } from './utils/api.js'

import { SocketPackage } from './types/socket_package.js'

import { registerInitPrivateRoom } from './private/init.js'
import { onLeavingPrivateRoom } from './private/disconnect.js'
import { registerJoinPrivateRoom } from './private/join.js'
import { registerListenGuessMessages } from './events/player_guess.js'
import { registerChangeSettings } from './events/host_change_settings.js'

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
        if (socketPackage.roomCode =='') return
        console.log(`SocketIO.disconnect: roomCode: ${socketPackage.roomCode}`);
        
        if (socketPackage.roomCode.startsWith('p_')){}
           // onLeavingPublicRoom(socketPackage)
         else 
            onLeavingPrivateRoom(socketPackage) 
    })

    registerInitPrivateRoom(socketPackage)
    registerJoinPrivateRoom(socketPackage)
    registerListenGuessMessages(socketPackage)
    registerChangeSettings(socketPackage)
})


export { httpServer, io }