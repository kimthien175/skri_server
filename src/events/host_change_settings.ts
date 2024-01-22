import { SocketPackage } from "../types/socket_package";

export function registerChangeSettings(socketPkg: SocketPackage) {
    socketPkg.socket.on('change_settings', function (setting) {
        console.log(setting);
        socketPkg.socket.to(socketPkg.roomCode).emit('change_settings', setting)
    })
}
