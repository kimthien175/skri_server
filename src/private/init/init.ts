import { SocketPackage } from "../../types/socket_package.js";

import { Mongo, getLastestSpecs } from "../../utils/db/mongo.js";
import { Random } from "../../utils/random/random.js";
import { RoomRequestPackage, RoomResponse } from "../../types/type.js";
import { PrivateRoom } from "../../types/room.js";
import { NewHostMessage } from "../../types/message.js";
import { PrivatePreGameState } from "../state/state.js";
import { getNewRoomCode } from "../../utils/get_room_code.js";

export function registerInitPrivateRoom(socketPackage: SocketPackage) {
  socketPackage.socket.on(
    "init_private_room",
    async (requestPkg: RoomRequestPackage, callback) =>
      callback(
        await new Promise<RoomResponse<PrivateRoom>>(async function (resolve) {
          const socket = socketPackage.socket;
          await Mongo.connect();
          try {
            const player = requestPkg.player;
            //#region PLAYER
            player.id = socket.id;
            //player.ip = socket.handshake.address;
            if (player.name === "") {
              player.name = (await Random.getWords({word_count:1, language: requestPkg.lang}))[0];
            }
            //#endregion

            var pregame_state = new PrivatePreGameState();

            const room: PrivateRoom = {
              code: await getNewRoomCode(Mongo.privateRooms),
              host_player_id: player.id,
              players: [player],
              messages: [new NewHostMessage(player.id, player.name)],
              ...(await getLastestSpecs()),
              round_white_list: [player.id],
              current_round: 1,
              outdated_states: [],
              status: {
                current_state_id: pregame_state.id,
                command: "start",
                date: new Date(),
              },
              henceforth_states: { [pregame_state.id]: pregame_state },
              latest_draw_data: {
                current_step: null,
                past_steps: {},
                tail_id: 0
              }
            };

            // insert code to room
            var instertResult = await Mongo.privateRooms.insertOne(room);

            // modify socket package
            socketPackage.roomId = instertResult.insertedId.toString();
            socketPackage.name = player.name;
            socketPackage.isOwner = true;
            socketPackage.isPublicRoom = false;

            console.log(instertResult.insertedId.toString());

            // join room
            await socket.join(instertResult.insertedId.toString());
            console.log(room);
            resolve({
              success: true,
              data: {
                player,
                room: room as PrivateRoom,
              },
            });
          } catch (e: any) {
            console.log("INIT ROOM ERROR");
            console.log(e);
            resolve({
              success: false,
              data: e,
            });
          }
        })
      )
  );
}
