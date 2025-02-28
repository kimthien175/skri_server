import { createServer } from "http";
import { Server } from "socket.io";
import { app } from "./utils/api.js";

import { SocketPackage } from "./types/socket_package.js";

import { registerInitPrivateRoom } from "./private/init/init.js";
import { onLeavingPrivateRoom } from "./private/disconnect.js";
import { registerJoinPrivateRoom } from "./private/join/join.js";
import { registerListenChatMessages } from "./events/player_chat.js";
import { registerChangeSettings } from "./events/host_change_settings.js";
//import { registerStartPrivateGame } from './private/start/start_game.js'
//import { registerChooseWord } from './events/choose_word.js'
import { registerPlayerDraw } from "./events/player_draw.js";
import { registerVoteKick } from "./events/vote_kick.js";
import { registerKick } from "./events/kick.js";
import { registerBan } from "./events/ban.js";

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "https://example.com",
    methods: ["GET", "POST"],
  },
  connectionStateRecovery: {},
});

io.on("connection", (socket) => {
  const socketPackage: SocketPackage = new SocketPackage(
    io,
    socket,
    // public room id: p_... private: room 0-9a-z
  );

  console.log("SOCKET.IO: CONNECTED");
  socket.on("disconnect", () => {
    console.log(`player ${socket.id} disconnected`);

    // TODO: remove this 'if' on production
    if (socketPackage.roomId == null) return;
    console.log(`SocketIO.disconnect: roomId: ${socketPackage.roomId}`);

    if (socketPackage.isPublicRoom) {
    }
    // onLeavingPublicRoom(socketPackage)
    else onLeavingPrivateRoom(socketPackage);
  });
  registerInitPrivateRoom(socketPackage);
  registerJoinPrivateRoom(socketPackage);
  registerListenChatMessages(socketPackage);
  registerChangeSettings(socketPackage);
  registerVoteKick(socketPackage);
  registerKick(socketPackage)
  registerBan(socketPackage)
  //registerStartPrivateGame(socketPackage)
  // registerChooseWord(socketPackage)
  //registerPlayerDraw(socketPackage)
});

export { httpServer, io };
