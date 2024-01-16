import { createServer } from 'http'
import { Server } from "socket.io"
import { app } from './api.js'
import { getLastestRoomSettings, initRoom } from './mongo.js'

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
    // socket.on('msg', (arg, callback) => {
    //     console.log(arg)
    //     callback('got it')
    // })

    // listen to init_room request
    socket.on('init_room', async function (roomOwnerName, callback) {
        var result = Object({})

        // init ownerName if empty
        if (roomOwnerName == '') {
            result.room_owner_name = 'random name'

            // ownerName stays in result
            // init room in db
            result.room = await initRoom(result.room_owner_name)
        } else {
            // ownerName in roomOwnerName parameter
            // init room in db
            result.room = await initRoom(roomOwnerName)
        }

        var roomSetting = await getLastestRoomSettings();
        result.room_settings = roomSetting;


        callback(result)

    });
})



export { httpServer, io }