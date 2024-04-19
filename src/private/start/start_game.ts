// import { WithId } from "mongodb";
// import { SocketPackage } from "../../types/socket_package.js";
// import { Mongo } from "../../utils/db/mongo.js";
// import { Random } from "../../utils/random/random.js";

// export function registerStartPrivateGame(socketPkg: SocketPackage) {
//     socketPkg.socket.on('start_private_game', async function (gameSettings: RoomSettings) {
//         // return w=hat?
//         var startGameResult: StartPrivateGameResponse = Object({})
//         await Mongo.connect();
//         try {
//             var pkg: StartPrivateGameState = Object({})
//             pkg.type = 'start_private_game'
//             pkg.started_at = new Date()


//             var roomDoc = await Mongo.privateRooms().findOne({ code: socketPkg.roomCode }) as WithId<Room> | null
//             if (roomDoc == null) throw Error('StartPrivateGame: null room')

//             // randomize player id
//             var playerTurnIndex = Math.floor(Math.random() * roomDoc.players.length)
//             var chosenPlayer = roomDoc.players[playerTurnIndex]
//             pkg.player_id = chosenPlayer.id

//             // create white list
//             var white_list = roomDoc.players.map((player) => player.id)
//             white_list.splice(white_list.indexOf(pkg.player_id), 1)

//             // randomize words
//             pkg.word_options = await Random.getWords(roomDoc.settings.word_count, roomDoc.settings.language, roomDoc.settings.word_mode as WordMode)

//             // save to db
//             await Mongo.privateRooms().updateOne({ code: socketPkg.roomCode }, { $set: { settings: gameSettings, state: pkg, white_list } })

//             socketPkg.io.to(socketPkg.roomCode).emit('start_private_game', pkg)
//         } catch (e: any) {
//             console.log('ERROR: start_private_game');
//             console.log(e);
//             startGameResult.success = false
//             startGameResult.data = e
//         }
//     })
// }