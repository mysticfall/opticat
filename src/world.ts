/**
 * Definitions of common types related to the game world.
 * @module
 */
import * as E from "fp-ts/Either"
import {Either} from "fp-ts/Either"
import {pipe} from "fp-ts/function"
import {Reader} from "fp-ts/Reader"
import {Mixed} from "io-ts"
import {Actor, ActorData, ActorDataHolder, ActorDataHolderT, ActorHolder} from "./actor"

/**
 * Represents the validation rules for {@link WorldData}.
 */
export const WorldDataT = (actorType: Mixed) => ActorDataHolderT(actorType)

/**
 * The WorldData class represents the data of the world in your game.
 * It is a generic class that can hold any type of actor data.
 *
 * @template TActorData - The type of actor data that the WorldData can hold.
 */
export type WorldData<TActorData extends ActorData = unknown & ActorData> = ActorDataHolder<TActorData>

/**
 * A utility type that contains functions that can be used to retrieve the world state (the context). The purpose of
 * this type is to provide a way to query or manipulate the world data by chaining (i.e. the "Do" comprehension
 * in _fp-ts_) other game APIs conforming to the form, `TContext => Either<Error, TContext>`.
 *
 * See {@link Game.get} for an example.
 *
 * @template TContext The type of the game world data.
 */
export type WorldDataBinder<TContext> = {

    readonly Do: Either<never, { readonly context: TContext }>

    bind: <N extends string, A extends { readonly context: TContext }, E2, B>(
        name: Exclude<N, keyof A>,
        f: (a: A) => (context: TContext) => Either<E2, B>
    ) => <E1>(ma: Either<E1, A>) => Either<E1 | E2, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>

    map: <A extends { readonly context: TContext }, B>(
        f: (a: A) => B
    ) => <E>(ma: Either<E, A>) => Either<E, B>
}

/**
 * A utility type that adds additional function to {@link WorldDataBinder} so that it can also be used to update
 * the world state (the context).
 *
 * See {@link Game.update} for an example.
 *
 * @template TContext The type of the game world data.
 */
export type WorldDataUpdater<TContext> = WorldDataBinder<TContext> & {

    update: <A extends { readonly context: TContext }, E2>(
        f: (a: A) => (context: TContext) => Either<E2, TContext>
    ) => <E1>(ma: Either<E1, A>) => Either<E1 | E2, A>
}

/**
 * The World class represents the game world and provides methods to interact with it.
 *
 * @template TActorData The type of actor data.
 * @template TWorldData The type of world data.
 * @template TActor The type of actor.
 */
export interface World<
    TActorData extends ActorData = unknown & ActorData,
    TWorldData extends WorldData<TActorData> = unknown & WorldData<TActorData>,
    TActor extends Actor<TActorData, TWorldData> = unknown & Actor<TActorData, TWorldData>
> {

    /**
     * Represents all actors existing in this world.
     *
     * @readonly
     */
    readonly actors: ActorHolder<TActorData, TWorldData, TActor>

    /**
     * Retrieve the world data using a mapper function. The function can be composed of smaller components in a
     * similar way chainable constructs in _fp-ts_ provide:
     *
     * @example
     *
     * world.get(W => pipe(
     *     W.Do,
     *     W.bind("actor", () => game.actors.resolve(id)),
     *     W.bind("name", ({actor}) => actor.name.get),
     *     W.map(({name}) => `Hello, ${name}!`)
     * ))(currentState)
     *
     * @template T The type of the return value.
     * @template E The type of error that can occur.
     * @param f - The mapper function that queries the game states using {@link WorldDataBinder}.
     * @returns {Reader<Either<E, T>>} {@link Reader} that takes the current world state and returns either the
     *  extracted data or an error.
     */
    get<T, E>(f: (g: WorldDataBinder<TWorldData>) => Either<E, T>): Reader<TWorldData, Either<E, T>>

    /**
     * Updates the world data using a modifier function. The function can be composed of smaller components in a
     * similar way chainable constructs in _fp-ts_ provide:
     *
     * @example
     *
     * world.update(W => pipe(
     *     W.Do,
     *     E.bind("id", () => ActorIdT.decode("player")),
     *     E.bind("newName", () => ActorNameT.decode("Xanthias")),
     *     W.bind("player", ({id}) => game.actors.resolve(id)),
     *     W.update(({player, newName}) => player.name.set(newName))
     * ))(currentState)
     *
     * @template T The type with a `context` property representing the world.
     * @template E The type of error that can occur during the update.
     * @template TWorldData The type of world data.
     * @param f - The modifier function that queries or manipulates the game states using {@link WorldDataUpdater}.
     * @returns {Reader<Either<E, TWorldData>>} {@link Reader} that takes a current world state and returns either
     *  the updated world state or an error.
     */
    update<T extends { readonly context: TWorldData }, E>(
        f: (g: WorldDataUpdater<TWorldData>) => Either<E, T>
    ): Reader<TWorldData, Either<E, TWorldData>>
}

/**
 * A base world class that implements the {@link World} interface.
 *
 * @template TActorData The type of actor data.
 * @template TWorldData The type of world data.
 * @template TActor The type of actor.
 */
export class BaseWorld<
    TActorData extends ActorData = unknown & ActorData,
    TWorldData extends WorldData<TActorData> = unknown & WorldData<TActorData>,
    TActor extends Actor<TActorData, TWorldData> = unknown & Actor<TActorData, TWorldData>
> implements World<TActorData, TWorldData, TActor> {

    constructor(
        readonly actors: ActorHolder<TActorData, TWorldData, TActor>
    ) {
        this.get = this.get.bind(this)
        this.update = this.update.bind(this)
    }

    private readonly _map: WorldDataBinder<TWorldData>["map"] = f => E.map(f)

    private readonly _bind: WorldDataBinder<TWorldData>["bind"] = (name, f) => ma => pipe(
        ma,
        E.chain(a => pipe(
            ma,
            E.map(f),
            E.chainW(f2 => f2(a.context)),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            E.map(v => Object.assign({}, a, {[name]: v}) as any)
        ))
    )

    private readonly _update: WorldDataUpdater<TWorldData>["update"] = f => ma => pipe(
        pipe(E.of(f), E.ap(ma)),
        E.ap(pipe(ma, E.map(({context}) => context))),
        E.flattenW,
        E.chainW(context => pipe(ma, E.map(a => ({...a, context: context}))))
    )

    get<T, E>(f: (g: WorldDataBinder<TWorldData>) => Either<E, T>): Reader<TWorldData, Either<E, T>> {
        return world => f({
            Do: E.of({context: world}),
            bind: this._bind,
            map: this._map
        })
    }

    update<T extends { readonly context: TWorldData }, E>(f: (
        g: WorldDataUpdater<TWorldData>) => Either<E, T>
    ): Reader<TWorldData, Either<E, TWorldData>> {
        return world => pipe(
            f({
                Do: E.of({context: world}),
                bind: this._bind,
                update: this._update,
                map: this._map
            }),
            E.map(({context}) => context)
        )
    }
}
