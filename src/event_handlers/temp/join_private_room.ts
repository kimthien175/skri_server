// import { Socket } from "socket.io";
// import { DefaultEventsMap } from "socket.io/dist/typed-events";
// import { db } from "../mongo.js";

// async function getRoom(roomCode: string): Promise<DBRoom>{
//     return (await db()).collection('privateRooms').findOne({code: roomCode})
// }

// function isDuplicated(players: Array<Player>): boolean{

// return true
// }

// export function registerJoinPrivateRoom(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
//     socket.on('join_private_room', async function (arg:JoiningPrivateRoomPackage,  callback) {
//         var result:ResponseJoiningPrivateRoom = Object({})
        
        
//         try {
//             var success: SucceededJoinPrivateRoomData = Object({})

//             var players = await getPlayers(arg.code)

//             if (arg.player.name ==''){
//                 // try to randomize without duplication
//                 do {

//                 } while(isDuplicated())
//             } else {

//             }
//             result.success = true

//         } catch (e:any){
//             console.log('JOIN PRIVATE ROOM ERROR')
//             result.success = false
//             result.data = e
//         }


//         callback(result)
//     })
// }

