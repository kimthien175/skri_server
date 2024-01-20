import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { privateRoomCollection } from "../../../utils/db/collection.js";
import { PushOperator } from "mongodb";
import { randomName } from "../../../utils/random_name.js";
import { storeMessage } from "../listen_guess/listen_guess.js";


export function registerJoinPrivateRoom(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
    socket.on('join_private_room', async function (arg: RequestJoinRoom, callback) {
        var result: ResponseJoinRoom = Object({})

        try {
            var successJoinRoom: SuccessJoinRoom = Object({})
            // modify player index
            arg.player.id = socket.id

            // modify player name
            if (arg.player.name == '') {
                arg.player.name = randomName();
            }
            successJoinRoom.player = arg.player

            // find and update
            var update: PushOperator<Player> = {
                $push: { players: arg.player }
            }

            var foundRoom = await (await privateRoomCollection()).findOneAndUpdate(
                { code: arg.code },
                update,
                { returnDocument: 'after' }
            )

            if (foundRoom == null) {
                throw new Error(`Can not find room with code ${arg.code}`)
            }

            await socket.join(arg.code)

            successJoinRoom.room = foundRoom as unknown as JoinRoomData

            result.success = true
            result.data = successJoinRoom
            console.log(`player ${arg.player.name} join room ${arg.code}`);

            // emit to room members
            var emit: NewPlayerEmit = {
                player: arg.player, 
                message: {
                    type: 'new_player', 
                    player_id: socket.id,
                    timestamp: new Date()
                }
            }
            successJoinRoom.room.messages.push(emit.message)

            socket.to(arg.code).emit('new_player_joined', emit)
            // store message to db
            storeMessage(arg.code, emit.message)
        } catch (e: any) {
            console.log(e);
            result.success = false
            result.data = e
        }

        callback(result)
    });
}