import { SocketPackage } from "../types/socket_package.js";

export function registerPlayerDraw(socketPkg: SocketPackage){
    socketPkg.socket.on('draw:temp',(data)=>{
        socketPkg.socket.to(socketPkg.roomCode).emit('draw:temp',data);
        console.log(data);
    });

    socketPkg.socket.on('draw:current', (data)=>{
        socketPkg.socket.to(socketPkg.roomCode).emit('draw:current',data);
    })

    socketPkg.socket.on('draw:clear',(_)=>{
        socketPkg.socket.to(socketPkg.roomCode).emit('draw:clear');
    })
}