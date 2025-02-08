import cryptoRandomString from "crypto-random-string";
import { Collection, WithId } from "mongodb";
import { ServerRoom } from "../types/room";

const codeLength = 4; // code including numeric chars or lowercase alphabet chars or both

export async function getNewRoomCode<T extends ServerRoom>(roomCollection: Collection<T>) {
    var _codeLength = codeLength
    var code: String
    var existingRoom: WithId<T> | null

    do {
        code = cryptoRandomString({ length: _codeLength, type: "alphanumeric" }).toLowerCase();
        existingRoom = await roomCollection.findOne({ code: code })
        _codeLength++
    } while (existingRoom != null)

    return code
}