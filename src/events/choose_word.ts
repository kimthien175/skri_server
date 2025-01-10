// import { Collection } from "mongodb";
// import { SocketPackage } from "../types/socket_package.js";

// export function registerChooseWord(socketPkg: SocketPackage) {
//     socketPkg.socket.on('choose_word', async (word) => {
//         var state: DrawState = Object({})
//         state.type = 'draw_state'
//         state.player_id = socketPkg.socket.id
//         state.started_at = new Date()
//         state.word = word

//         // store to db
//         await (socketPkg.room as Collection<Document>).updateOne({ code: socketPkg.roomCode }, { $push: { words: word }, $set: { state } })

//         // emit
//         socketPkg.io.to(socketPkg.roomCode).emit('choose_word', state)
//     });
// }