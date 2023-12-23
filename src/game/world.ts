import {Mixed} from "io-ts"
import {ActorData, ActorDataHolder, ActorDataHolderT} from "./actor"

export const WorldDataT = (actorType: Mixed) => ActorDataHolderT(actorType)

export type WorldData<TActor extends ActorData = unknown & ActorData> = ActorDataHolder<TActor>
