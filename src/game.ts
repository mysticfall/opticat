/**
 * Definitions of common types related to game.
 * @module
 */
import * as T from "io-ts"
import {Actor, ActorData} from "./actor"
import {MaxLengthString, MinLengthString} from "./common"
import {World, WorldData} from "./world"

/**
 * Represents the validation rules for {@link GameTitleT}.
 */
export const GameTitleT = T.intersection([
    MinLengthString(1),
    MaxLengthString(100)
], "GameTitle")

/**
 * Represents the title of a game, which must be between 1 and 100 characters long.
 */
export type GameTitle = T.TypeOf<typeof GameTitleT>

/**
 * Represents the validation rules for {@link GameDescription}.
 */
export const GameDescriptionT = T.intersection([
    MinLengthString(20),
    MaxLengthString(200)
], "GameDescription")

/**
 * Represents the description of a game, which must be between 20 and 200 characters long.
 */
export type GameDescription = T.TypeOf<typeof GameDescriptionT>

/**
 * Represents the validation rules for {@link GameInfo}.
 */
export const GameInfoT = T.readonly(T.intersection([
    T.type({
        title: GameTitleT
    }),
    T.partial({
        description: GameDescriptionT
    })
]), "GameInfo")

/**
 * Represents the game information.
 *
 * @property {GameTitle} title The title of the game.
 * @property {GameDescription} [description] The description of the game (optional).
 */
export type GameInfo = {

    readonly title: GameTitle

    readonly description?: GameDescription
}

/**
 * A class that represents a game. It provides everything required to run a game without storing mutable data,
 * like the world state, or user preference settings.
 *
 * @template TInfo The type of game information.
 * @template TActorData The type of actor data.
 * @template TWorldData The type of world data.
 * @template TActor The type of actor.
 * @template TWorld The type of world.
 */
export class Game<
    TInfo extends GameInfo = unknown & GameInfo,
    TActorData extends ActorData = unknown & ActorData,
    TWorldData extends WorldData<TActorData> = unknown & WorldData<TActorData>,
    TActor extends Actor<TActorData, TWorldData> = unknown & Actor<TActorData, TWorldData>,
    TWorld extends World<TActorData, TWorldData, TActor> = unknown & World<TActorData, TWorldData, TActor>
> implements Game<TInfo, TActorData, TWorldData, TActor> {

    /**
     * Creates a new instance of the constructor.
     *
     * @param {TInfo} info Basic information about the game.
     * @param {TWorld} world Implementation of {@link World} that provides access to the world state.
     */
    constructor(
        readonly info: TInfo,
        readonly world: TWorld
    ) {
    }
}
