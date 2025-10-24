import { SocketPackage } from "../types/socket_package.js";
import { Message, PlayerChatMessage, PlayerGuessRightMessage } from "../types/message.js";
import { Filter, ObjectId, UpdateFilter } from "mongodb";
import { getRunningState, ServerRoom } from "../types/room.js";
import { DrawState, PlayersPointData } from "../private/state/state.js";
import { io } from "../socket_io.js";
import { endDrawState } from "./end_draw_state.js";
import { Redis } from "../utils/redis.js";

export function registerListenGuessMessages(socketPkg: SocketPackage) {
    socketPkg.socket.on('player_guess', async function (guess: string, callback) {
        try {
            // verify player guess, send system message if player guess close or right
            // end state if all player guess rights
            const roomId = await Redis.getRoomId(socketPkg.socket.id)
            var _id: Filter<ServerRoom> = { _id: new ObjectId(roomId) }
            var room = await socketPkg.room.findOne(_id)
            if (room == null) throw Error('room not found')

            var state = getRunningState(room) as DrawState
            if (state.type != DrawState.TYPE || state.points[socketPkg.playerId as string] != null) throw Error('wrong DRAW state')

            var guessResult = checkGuessing(state.word as string, guess)

            var msg: Message

            // the first one guess right: 100, then second: 90, third: 80, and the rest: 70
            if (guessResult == GuessResult.right) {
                var point = grantPoint(state.points, socketPkg.playerId as string)

                state.points[socketPkg.playerId as string] = point

                var updatePkg: UpdateFilter<ServerRoom> =
                    DrawState.isEndState(state, room.players) ?
                        await endDrawState(socketPkg, room) :
                        { $set: {} }

                var playerScore = room.players[socketPkg.playerId as string].score

                updatePkg.$set = {
                    ...updatePkg.$set,
                    [`players.${socketPkg.playerId}.score`]: playerScore + point,
                    [`henceforth_states.${state.id}.points.${socketPkg.playerId}`]: point
                }

                msg = new PlayerGuessRightMessage(socketPkg.playerId as string, socketPkg.name, point)

                updatePkg.$push = {
                    ...updatePkg.$push,
                    messages: msg
                }

                await socketPkg.room.updateOne(_id, updatePkg)
                callback(guessResult)
                io.to(roomId).emit('guess_right', msg)
                return
            }

            //#region Guess wrong, just send the message
            msg = new PlayerChatMessage(socketPkg.playerId as string, socketPkg.name, guess)

            await socketPkg.room.updateOne(_id, { $push: { messages: msg } })
            callback(guessResult)
            socketPkg.socket.to(roomId).emit('player_chat', msg)
            //#endregion
        } catch (e) {
            console.log(`[PLAYER_GUESS]: ${e}`);
        }
    })
}

enum GuessResult {
    right = 'right',
    close = 'close',
    wrong = 'wrong'
}

const _CloseMistakesLimit = 2

function checkGuessing(word: string, guess: string): GuessResult {
    word = word.toLowerCase().trim()
    guess = guess.toLowerCase().trim()

    if (word == guess) return GuessResult.right

    if (Math.abs(word.length - guess.length) > _CloseMistakesLimit) return GuessResult.wrong


    // Dynamic programming but with cutoff
    const dp: number[] = [];
    for (let j = 0; j <= guess.length; j++) dp[j] = j;

    for (let i = 1; i <= word.length; i++) {
        let prev = dp[0];
        dp[0] = i;
        let minRow = dp[0];

        for (let j = 1; j <= guess.length; j++) {
            const temp = dp[j];
            if (word[i - 1] === guess[j - 1]) {
                dp[j] = prev;
            } else {
                dp[j] = 1 + Math.min(prev, dp[j], dp[j - 1]);
            }
            prev = temp;
            minRow = Math.min(minRow, dp[j]);
        }

        // stop early if already > maxMistakes
        if (minRow > _CloseMistakesLimit) {
            return GuessResult.wrong;
        }
    }

    const distance = dp[guess.length];

    if (distance <= _CloseMistakesLimit) return GuessResult.close;

    return GuessResult.wrong
}

function grantPoint(data: PlayersPointData, playerId: string): number {
    var players = Object.keys(data)
    if (players.length == 0) return 300

    if (players.length == 1) return 90
    if (players.length == 2) return 80
    return 70
}