import { createServer } from "http";
import { Server } from "socket.io";
import { app } from "./utils/api.js";

import { SocketPackage } from "./types/socket_package.js";

import { registerInitPrivateRoom } from "./private/init/init.js";
import { onLeavingRoom } from "./private/disconnect.js";
import { registerJoinPrivateRoom } from "./private/join/join.js";
import { registerListenChatMessages } from "./events/player_chat.js";
import { registerChangeSettings } from "./events/host_change_settings.js";
import { registerStartPrivateGame } from './private/start/start_game.js'
import { registerPlayerDraw } from "./events/player_draw.js";
import { registerVoteKick } from "./events/vote_kick.js";
import { registerKick } from "./events/kick.js";
import { registerBan } from "./events/ban.js";
import { registerPickWord } from "./events/pick_word.js";
import { registerHint } from "./events/hint.js";
import { registerListenGuessMessages } from "./events/player_guess.js";
import { registerEndDrawState } from "./events/end_draw_state.js";
import { registerLikeDislike } from "./events/like_dislike.js";
import { registerLoadingMessages } from "./events/load_messages.js";
import { registerReloading } from "./events/reload.js";
import { registerJoinPublicMatch } from "./events/join_public_match.js";
import { PrivateRoom, PublicRoom } from "./types/room.js";

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "https://example.com",
    methods: ["GET", "POST"],
  },
  connectionStateRecovery: {},
});


io.on("connection", async (socket) => {
  const socketPackage: SocketPackage = new SocketPackage(socket)

  console.log("SOCKET.IO: CONNECTED");
  socket.on("disconnect", async () => {
    console.log(`player with socket ID ${socket.id} disconnected`);
    console.log(`SocketIO.disconnect: roomId: ${await socketPackage.getRoomId()}`);

    onLeavingRoom(socketPackage);
  });

  //#region PRIVATE ROOM
  var privateSocketPackage = socketPackage as unknown as SocketPackage<PrivateRoom>
  registerInitPrivateRoom(privateSocketPackage)
  registerJoinPrivateRoom(privateSocketPackage)
  registerStartPrivateGame(privateSocketPackage)
  registerBan(privateSocketPackage)
  //#endregion

  //#region PUBLIC ROOM
  registerJoinPublicMatch(socketPackage as unknown as SocketPackage<PublicRoom>)
  //#endregion

  registerListenChatMessages(socketPackage);
  registerChangeSettings(socketPackage);
  registerVoteKick(socketPackage);
  registerKick(socketPackage)
  registerPickWord(socketPackage)
  registerHint(socketPackage)
  registerPlayerDraw(socketPackage)
  registerListenGuessMessages(socketPackage)
  registerEndDrawState(socketPackage)
  registerLikeDislike(socketPackage)
  registerLoadingMessages(socketPackage)
  registerReloading(socketPackage)
});

export { httpServer, io };
