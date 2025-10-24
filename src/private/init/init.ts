import { getNewRoomCode, SocketPackage } from "../../types/socket_package.js";

import { Mongo, getLastestSpecs } from "../../utils/db/mongo.js";
import { Random } from "../../utils/random/random.js";
import { RoomRequestPackage, RoomResponse } from "../../types/type.js";
import { PrivateRoom } from "../../types/room.js";
import { NewHostMessage } from "../../types/message.js";
import { PrivatePreGameState } from "../state/state.js";
import { ObjectId } from "mongodb";
import { Redis } from "../../utils/redis.js";

export function registerInitPrivateRoom(socketPackage: SocketPackage<PrivateRoom>) {
  socketPackage.socket.on("init_private_room",
    async function (requestPkg: RoomRequestPackage, callback: (arg: RoomResponse<PrivateRoom>) => void) {
      const socket = socketPackage.socket;

      try {
        //await Mongo.connect();
        const player = requestPkg.player;

        //#region PLAYER
        player.id = new ObjectId().toString()
        player.socket_id = socket.id
        player.score = 0
        //player.ip = socket.handshake.address;
        if (player.name === "") {
          player.name = (await Random.getWords({ word_count: 1, language: requestPkg.lang }))[0];
        }
        //#endregion

        //#region MODIFY SOCKET PACKAGE
        socketPackage.name = player.name;
        //socketPackage.isOwner = true;
        socketPackage.playerId = player.id
        socketPackage.roomType = 'private'
        //#endregion

        var pregame_state = new PrivatePreGameState(player.id);
        pregame_state.start_date = new Date()

        const room: PrivateRoom = {
          code: await getNewRoomCode('private'),
          host_player_id: player.id,
          players: { [`${player.id}`]: player },
          messages: [new NewHostMessage(player.id, player.name, true)],
          ...(await getLastestSpecs()),
          current_round_done_players: {},
          current_round: 1,
          outdated_states: [],
          status: {
            current_state_id: pregame_state.id,
            command: "start",
            date: pregame_state.start_date,
          },
          henceforth_states: { [pregame_state.id]: pregame_state },
          latest_draw_data: {
            past_steps: {},
            black_list: {}
          },
          tickets: {}
        };

        // insert code to room
        var instertResult = await socketPackage.room.insertOne(room);
        await Redis.setRoomId(socketPackage.socket.id, instertResult.insertedId.toString())

        // join room
        await socket.join(instertResult.insertedId.toString());
        callback({
          success: true,
          player,
          room: room as PrivateRoom,
        });
      } catch (e: any) {
        console.log(`[INIT ROOM ERROR]: ${e}`);
        callback({
          success: false,
          reason: e.message,
        })
      }
    })
}
