import * as E from "fp-ts/Either"
import {Either} from "fp-ts/Either"
import {pipe} from "fp-ts/function"
import * as T from "io-ts"
import {MaxLengthString, MinLengthString} from "../common"
import {Actor, ActorData, ActorHolder} from "./actor"
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

export type GameDataBinder<TWorld> = {

    readonly Do: Either<never, { context: TWorld }>

    bind: <N extends string, A extends { context: TWorld }, E2, B>(
        name: Exclude<N, keyof A>,
        f: (a: A) => (context: TWorld) => Either<E2, B>
    ) => <E1>(ma: Either<E1, A>) => Either<E1 | E2, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>

    update: <A extends { context: TWorld }, E2>(
        f: (a: A) => (context: TWorld) => Either<E2, TWorld>
    ) => <E1>(ma: Either<E1, A>) => Either<E1 | E2, A>
}

export interface Game<
    TInfo extends GameInfo = unknown & GameInfo,
    TActorData extends ActorData = unknown & ActorData,
    TWorld extends WorldData<TActorData> = unknown & WorldData<TActorData>,
    TActor extends Actor<TActorData, TWorld> = unknown & Actor<TActorData, TWorld>
> {
    readonly info: TInfo

    readonly actors: ActorHolder<TActorData, TWorld, TActor>

    get world(): TWorld

    update<T extends { context: TWorld }, E>(
        f: (g: GameDataBinder<TWorld>) => Either<E, T>
    ): Either<E, T>
}

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

    private readonly _update: GameDataBinder<TWorld>["update"] = f => ma => pipe(
        pipe(E.of(f), E.ap(ma)),
        E.ap(pipe(ma, E.map(({context}) => context))),
        E.flattenW,
        E.chainW(context => pipe(ma, E.map(a => ({...a, context: context}))))
    )

    update<T extends { context: TWorld }, E>(f: (
        g: GameDataBinder<TWorld>) => Either<E, T>
    ): Either<E, T> {
        const result = f({
            Do: E.of({context: this.world}),
            bind: this._bind,
            update: this._update
        })

        if (E.isRight(result)) {
            this._world = result.right.context
        }

        return result
    }
}
