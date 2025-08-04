import { RoomOptions, RoomSettings, RoomSystem } from "./type";
import { Message } from "./message";
import { GameState } from "../private/state/state";
import { ServerTicket } from "./ticket";
import { Player } from "./player";

export type StateStatus = {
  current_state_id: GameState["id"];
} & (
  | {
      command: "start";
      date?: Date;
    }
  | {
      command: "end";
      date: Date;
      next_state_id: GameState["id"];
    }
);

type ClassProperties<C> = {
  [Key in keyof C as C[Key] extends Function ? never : Key]: C[Key];
};

export interface ServerRoom {
  players: Player[];
  settings: RoomSettings;
  messages: Message[];
  status: StateStatus;
  henceforth_states: Record<GameState["id"], GameState>;
  outdated_states: GameState[];
  code: String;
  system: RoomSystem;
  round_white_list: string[];
  current_round: number;
  tickets?: ServerTicket[];
  used_words?: string[]
}

export function getRunningState(room: ServerRoom): GameState {
  if (room.status.command == "end")
    return room.henceforth_states[room.status.next_state_id];
  return room.henceforth_states[room.status.current_state_id];
}

export function getOutdatedState(room: ServerRoom): GameState {
  var outdatedState = room.henceforth_states[room.status.current_state_id];
  outdatedState.end_date = room.status.date;
  return outdatedState;
}

/** ful doc: including states*/
export interface PublicRoom extends ServerRoom {}

/**ful doc: including states*/
export interface PrivateRoom extends ServerRoom {
  host_player_id: String;
  options: RoomOptions;
}
