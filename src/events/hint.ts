import { ObjectId } from "mongodb";
import { SocketPackage } from "../types/socket_package";
import { DrawState } from "../private/state/state.js";
import { getRunningState } from "../types/room.js";


export function registerHint(socketPkg: SocketPackage) {
    socketPkg.socket.on("hint", async function (charIndex: number) {
        // save to db
        try {
            var _id = new ObjectId(socketPkg.roomId);
            var room = await socketPkg.room.findOne({ _id });

            if (room == null) throw Error("room not found");

            var state = getRunningState(room) as DrawState &
                Required<Pick<DrawState, "hint" | "word">>;
            if (
                state.type != DrawState.TYPE ||
                state.player_id != socketPkg.playerId ||
                state.hint[charIndex] != "_"
            ) {
                throw Error('hint error')
            }

            //save to db
            await socketPkg.room.updateOne(
                { _id },
                {
                    $set: {
                        [`henceforth_states.${state.id}.hint`]:
                            state.hint.substring(0, charIndex) + state.word[charIndex] + state.hint.substring(charIndex + 1),
                    },
                }
            );

            socketPkg.socket.to(socketPkg.roomId).emit("hint", charIndex, state.word[charIndex]);
        } catch (e: any) {
            console.log("[HINT]", e);
        }
    });
}
