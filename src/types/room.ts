import { RoomOptions, RoomSettings, RoomSystem } from "./type";
import { Message } from "./message";
import { GameState } from "../private/state/state";
import { ServerTicket } from "./ticket";
import { Player } from "./player";

export type StateStatus = {
  current_state_id: GameState["id"];
  date: Date
} & (
    | { command: "start" }
    | {
      command: "end";
      next_state_id: GameState["id"];
      bonus?: any
    }
  );

type ClassProperties<C> = {
  [Key in keyof C as C[Key] extends Function ? never : Key]: C[Key];
};

export interface ServerRoom {
  players: { [key: string]: Player };
  settings: RoomSettings;
  messages: Message[];
  status: StateStatus;
  henceforth_states: Record<GameState["id"], GameState>;
  outdated_states: GameState[];
  system: RoomSystem;
  current_round_done_players: { [id: string]: true };
  current_round: number;
  tickets: { [id: string]: ServerTicket };
  used_words?: string[]
  latest_draw_data: DrawData
}

export function getRunningState(room: ServerRoom): GameState {
  if (room.status.command == "end")
    return room.henceforth_states[room.status.next_state_id];
  return room.henceforth_states[room.status.current_state_id];
}

// export function getOutdatedState(room: ServerRoom): GameState {
//   var outdatedState = room.henceforth_states[room.status.current_state_id];
//   outdatedState.end_date = room.status.date;
//   return outdatedState;
// }

/** ful doc: including states*/
export interface PublicRoom extends ServerRoom {
  is_available: boolean
}

/**ful doc: including states*/
export interface PrivateRoom extends ServerRoom {
  code: String;
  host_player_id: string;
  options: RoomOptions;
}

export const messagesPageQuantity = 30;

export const RoomProjection
  = {
  _id: 1,
  host_player_id: 1,
  options: 1,
  players: 1,
  settings: 1,
  messages: { $slice: ["$messages", -messagesPageQuantity] },
  henceforth_states: 1,
  status: 1,
  code: 1,
  system: 1,
  current_round: 1,
  latest_draw_data: 1
}