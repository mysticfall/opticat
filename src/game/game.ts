/**
 * Definitions of common types related to game.
 * @module
 */
import * as E from "fp-ts/Either"
import {Either} from "fp-ts/Either"
import {pipe} from "fp-ts/function"
import * as T from "io-ts"
import {MaxLengthString, MinLengthString} from "../common"
import {Actor, ActorData, ActorHolder} from "./actor"
import {WorldData} from "./world"

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
 * A utility type that contains functions that can be used to retrieve the game state (the context). The purpose of
 * this type is to provide a way to query or manipulate the game data by chaining (i.e. the "Do" comprehension
 * in _fp-ts_) other game APIs conforming to the form, `TContext => Either<Error, TContext>`.
 *
 * See {@link Game.get} for an example.
 *
 * @template TContext The type of the game world data.
 */
export type GameDataBinder<TContext> = {

    readonly Do: Either<never, { context: TContext }>

    bind: <N extends string, A extends { context: TContext }, E2, B>(
        name: Exclude<N, keyof A>,
        f: (a: A) => (context: TContext) => Either<E2, B>
    ) => <E1>(ma: Either<E1, A>) => Either<E1 | E2, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>

    map: <A extends { context: TContext }, B>(
        f: (a: A) => B
    ) => <E>(ma: Either<E, A>) => Either<E, B>
}

/**
 * A utility type that adds additional function to {@link GameDataBinder} so that it can also be used to update
 * the game state (the context).
 *
 * See {@link Game.update} for an example.
 *
 * @template TContext The type of the game world data.
 */
export type GameDataUpdater<TContext> = GameDataBinder<TContext> & {

    update: <A extends { context: TContext }, E2>(
        f: (a: A) => (context: TContext) => Either<E2, TContext>
    ) => <E1>(ma: Either<E1, A>) => Either<E1 | E2, A>
}

/**
 * Interface representing a game with all related data and APIs to access or manipulate them. Note that this is
 * the only type that is *not* immutable, as it contains a reference to the current game state which may change
 * over time.
 *
 * @template TInfo The type of game information.
 * @template TActorData The type of actor data.
 * @template TWorld The type of world data.
 * @template TActor The type of actor.
 */
export interface Game<
    TInfo extends GameInfo = unknown & GameInfo,
    TActorData extends ActorData = unknown & ActorData,
    TWorld extends WorldData<TActorData> = unknown & WorldData<TActorData>,
    TActor extends Actor<TActorData, TWorld> = unknown & Actor<TActorData, TWorld>
> {

    /**
     * Basic information about the game.
     *
     * @readonly
     */
    readonly info: TInfo

    /**
     * Represents all actors this game provides.
     *
     * @readonly
     */
    readonly actors: ActorHolder<TActorData, TWorld, TActor>

    /**
     * Retrieves the instance of the current game states (i.e. the "context"). Note that this is the only immutable
     * property of this interface. When implementing the interface, it is recommended *not* to add any other
     * properties that expose mutable game data other than this attribute.
     *
     * @return {TWorld} The current game states.
     */
    get world(): TWorld

    /**
     * Retrieve the game data using a mapper function. The function can be composed of smaller components in a
     * similar way chainable constructs in _fp-ts_ provide:
     *
     * @example
     *
     * game.get(G => pipe(
     *     G.Do,
     *     G.bind("actor", () => game.actors.resolve(id)),
     *     G.bind("name", ({actor}) => actor.name.get),
     *     G.map(({name}) => `Hello, ${name}!`)
     * ))
     *
     * @template T The type of the return value.
     * @template E The type of error that can occur.
     * @param f - The mapper function that queries the game states using {@link GameDataBinder}.
     * @returns {Either<E, T>} Either the result of the update process or an error.
     */
    get<T, E>(f: (g: GameDataBinder<TWorld>) => Either<E, T>): Either<E, T>

    /**
     * Updates the game data using a modifier function. The function can be composed of smaller components in a
     * similar way chainable constructs in _fp-ts_ provide:
     *
     * @example
     *
     * game.update(G => pipe(
     *     G.Do,
     *     E.bind("id", () => ActorIdT.decode("player")),
     *     E.bind("newName", () => ActorNameT.decode("Xanthias")),
     *     G.bind("player", ({id}) => game.actors.resolve(id)),
     *     G.update(({player, newName}) => player.name.set(newName))
     * ))
     *
     * @template T The type with a `context` property representing the world.
     * @template E The type of error that can occur during the update.
     * @param f - The modifier function that queries or manipulates the game states using {@link GameDataUpdater}.
     * @returns {Either<E, T>} Either the result of the update process or an error.
     */
    update<T extends { context: TWorld }, E>(
        f: (g: GameDataBinder<TWorld>) => Either<E, T>
    ): Either<E, T>
}

/**
 * A base game class that implements the {@link Game} interface.
 *
 * @template TInfo The type of game information.
 * @template TActorData The type of actor data.
 * @template TWorld The type of world data.
 * @template TActor The type of actor.
 */
export class BaseGame<
    TInfo extends GameInfo = unknown & GameInfo,
    TActorData extends ActorData = unknown & ActorData,
    TWorld extends WorldData<TActorData> = unknown & WorldData<TActorData>,
    TActor extends Actor<TActorData, TWorld> = unknown & Actor<TActorData, TWorld>
> implements Game<TInfo, TActorData, TWorld, TActor> {

    private _world: TWorld

    constructor(
        readonly info: TInfo,
        readonly actors: ActorHolder<TActorData, TWorld, TActor>,
        initialWorld: TWorld) {

        this._world = initialWorld
    }

    get world(): TWorld {
        return this._world
    }

    private readonly _map: GameDataBinder<TWorld>["map"] = f => E.map(f)

    private readonly _bind: GameDataBinder<TWorld>["bind"] = (name, f) => ma => pipe(
        ma,
        E.chain(a => pipe(
            ma,
            E.map(f),
            E.chainW(f2 => f2(a.context)),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            E.map(v => Object.assign({}, a, {[name]: v}) as any)
        ))
    )

    private readonly _update: GameDataUpdater<TWorld>["update"] = f => ma => pipe(
        pipe(E.of(f), E.ap(ma)),
        E.ap(pipe(ma, E.map(({context}) => context))),
        E.flattenW,
        E.chainW(context => pipe(ma, E.map(a => ({...a, context: context}))))
    )

    get<T, E>(f: (g: GameDataBinder<TWorld>) => Either<E, T>): Either<E, T> {
        return f({
            Do: E.of({context: this.world}),
            bind: this._bind,
            map: this._map
        })
    }

    update<T extends { context: TWorld }, E>(f: (
        g: GameDataUpdater<TWorld>) => Either<E, T>
    ): Either<E, T> {
        const result = f({
            Do: E.of({context: this.world}),
            bind: this._bind,
            update: this._update,
            map: this._map
        })

        if (E.isRight(result)) {
            this._world = result.right.context
        }

        return result
    }
}
