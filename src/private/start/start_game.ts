import { SocketPackage } from "../../types/socket_package";
import { privateRoomCollection } from "../../utils/db/collection";

export function registerStartPrivateGame(socketPkg: SocketPackage) {
    socketPkg.socket.on('start_private_game', async function (gameSettings, callback) {
        
        try{
            // save to db
            await privateRoomCollection()

            // emit player turn
        } catch{

        }


    })
}