import { WithId } from "mongodb";
import { SocketPackage } from "../../types/socket_package.js";
import { privateRoomCollection } from "../../utils/db/collection.js";
import { mongoClient } from "../../utils/db/mongo.js";
import { Random } from "../../utils/random/random.js";

export function registerStartPrivateGame(socketPkg: SocketPackage) {
    socketPkg.socket.on('start_private_game', async function (gameSettings: RoomSettings, callback) {
        // return w=hat?
        var startGameResult: StartPrivateGameResponse = Object({})
        try{
            var pkg: StartPrivateGamePackage = Object({})
            var privateRoomCol = await privateRoomCollection();
            
            var roomDoc = await privateRoomCol.findOne({code: socketPkg.roomCode}) as WithId<Room> |null
            if (roomDoc ==null) throw Error('StartPrivateGame: null room')

            // randomize player id
            var playerTurnIndex = Math.floor(Math.random()* roomDoc.players.length)
            var chosenPlayer = roomDoc.players[playerTurnIndex]
            pkg.player_turn_id = chosenPlayer.id
            // randomize words
            pkg.word_options = Random.getWords(roomDoc.settings.word_count, roomDoc.settings.language)


            // prepare msg to call back
            var callbackMsg;

            // emit player turn

            // save to db
            await privateRoomCol.updateOne({ code: socketPkg.roomCode }, { settings: gameSettings })
        } catch (e: any){
            console.log('ERROR: start_private_game');
            console.log(e);
            startGameResult.success = false
            startGameResult.data = e
        }  finally{
            mongoClient.close()
        }
    })
}