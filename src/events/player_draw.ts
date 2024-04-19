import { Collection } from "mongodb";
import { SocketPackage } from "../types/socket_package.js";

export function registerPlayerDraw(socketPkg: SocketPackage) {
    socketPkg.socket.on('draw:temp', (data) => {
        socketPkg.socket.to(socketPkg.roomCode).emit('draw:temp', data);
        console.log(data);
    });

    socketPkg.socket.on('draw:down', async (data) => {
        // save to db
        await (socketPkg.room as Collection<Document>).updateOne({ code: socketPkg.roomCode }, {
            $push:{
                draw: {current: {down: data}}
            }
        })


        socketPkg.socket.to(socketPkg.roomCode).emit('draw:down_current', data);
    })

    socketPkg.socket.on('draw:update_current', (data) => {
        socketPkg.socket.to(socketPkg.roomCode).emit('draw:update_current', data);
        // save to db
    })

    socketPkg.socket.on('draw:clear', (_) => {
        socketPkg.socket.to(socketPkg.roomCode).emit('draw:clear');
    })
}