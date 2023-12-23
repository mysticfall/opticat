import {Either} from "fp-ts/Either"
import * as T from "io-ts"
import {MaxLengthString, MinLengthString} from "../common"
import {ActorData, ActorHolder} from "./actor"
import {WorldData} from "./world"

export const GameTitle = T.intersection([
    MinLengthString(1),
    MaxLengthString(100)
], "GameTitle")

export type GameTitle = T.TypeOf<typeof GameTitle>

export const GameDescription = T.intersection([
    MinLengthString(20),
    MaxLengthString(200)
], "GameDescription")

export type GameDescription = T.TypeOf<typeof GameDescription>

export const GameInfo = T.readonly(T.intersection([
    T.type({
        title: GameTitle
    }),
    T.partial({
        description: GameDescription
    })
]), "GameInfo")

export type GameInfo = T.TypeOf<typeof GameInfo>

export interface Game<
    TActor extends ActorData = unknown & ActorData,
    TWorld extends WorldData<TActor> = unknown & WorldData<TActor>
> {
    readonly info: GameInfo

    readonly actors: ActorHolder<TActor>

    get world(): TWorld

    update(updater: (context: TWorld) => Either<Error, TWorld>): Either<Error, void>
}
