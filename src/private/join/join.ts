// import { Mongo } from "../../utils/db/mongo.js";
// import { SocketPackage } from "../../types/socket_package.js";
// import { addPlayerToExistingRoom } from "../../utils/add_player_to_room.js";

// export function registerJoinPrivateRoom(socketPkg: SocketPackage) {
//     socketPkg.socket.on('join_private_room', async function (arg: RequestJoinRoom, callback) {
//         var result: ResponseJoinRoom = Object({})
//         try {
//             result.data = await addPlayerToExistingRoom(socketPkg, arg );

//             // process by state
//             // switch ((result.data as RoomAndNewPlayer).room.currentRound?.state){

//             // }

//         } catch (e: any){
//             console.log(`join_private_room: ${socketPkg.socket.id} ${arg.code}`)
//             console.log(e)
//             result.success = false
//             result.data = e
//         } finally{
//             callback(result)
//         }
//         // set up player





//         // await Mongo.connect();d
//         // try {
//         //     result.success = true
//         //     result.data = await addPlayerToExistingRoom(socketPkg, Mongo.privateRooms(), arg);
//         // } catch (e: any) {
//         //     console.log(e);
//         //     result.success = false
//         //     result.data = e
//         // } finally {
//         //     callback(result)
//         // }
//     });
// }