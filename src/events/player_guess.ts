import { SocketPackage } from "../types/socket_package.js";
import { Message, PlayerChatMessage, PlayerGuessRightMessage } from "../types/message.js";
import { ObjectId } from "mongodb";
import { getRunningState } from "../types/room.js";
import { DrawState, PlayersPointData } from "../private/state/state.js";
import { io } from "../socket_io.js";

export function registerListenGuessMessages(socketPkg: SocketPackage) {
    socketPkg.socket.on('player_guess', async function (guess: string, callback) {
        try {
            // verify player guess, send system message if player guess close or right
            // end state if all player guess rights
            var _id = { _id: new ObjectId(socketPkg.roomId) }
            var room = await socketPkg.room.findOne(_id)

            if (room == null) throw Error('room not found')

            var state: DrawState = getRunningState(room) as DrawState
            if (state.type != DrawState.TYPE) throw Error('wrong state')

            var guessResult = checkGuessing(state.word as string, guess)

            if (state.points[socketPkg.playerId as string] != null) return

            var msg: Message

            // the first one guess right: 100, then second: 90, third: 80, and the rest: 70
            if (guessResult == GuessResult.right) {
                var point = grantPoint(state.points, socketPkg.playerId as string)
                var playerScore = room.players[socketPkg.playerId as string].score
                msg = new PlayerGuessRightMessage(socketPkg.playerId as string, socketPkg.name, point)

                await socketPkg.room.updateOne(_id, {
                    $set: {
                        [`players.${socketPkg.playerId}.score`]: playerScore != null ? playerScore + point : point,
                        [`henceforth_states.${state.id}.points.${socketPkg.playerId}`]: point
                    },
                    $push: {
                        messages: msg
                    }
                })
                callback(guessResult)
                io.to(socketPkg.roomId).emit('system_message', msg)
                return
            }

            msg = new PlayerChatMessage(socketPkg.playerId as string, socketPkg.name, guess)

            await socketPkg.room.updateOne(_id, { $push: { messages: msg } })
            callback(guessResult)
            socketPkg.socket.to(socketPkg.roomId).emit('player_chat', msg)
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
    if (players.length == 0) return 100

    if (players.length == 1) return 90
    if (players.length == 2) return 80
    return 70
}