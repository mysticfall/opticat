/**
 * Definitions of common types related to actor.
 * @module
 */
import * as Optic from "@fp-ts/optic"
import * as E from "fp-ts/Either"
import {Either} from "fp-ts/Either"
import {flow} from "fp-ts/function"
import * as O from "fp-ts/Option"
import {Option} from "fp-ts/Option"
import * as A from "fp-ts/ReadonlyArray"
import * as R from "fp-ts/ReadonlyRecord"
import {ReadonlyRecord} from "fp-ts/ReadonlyRecord"
import * as T from "io-ts"
import {Mixed} from "io-ts"
import {Focusable, MaxLengthString, MinLengthString} from "../../common"
import {NameAttribute, Named, NamedData, NamedDataT} from "../attribute"
import {UnknownActorError} from "./errors"

/**
 * Represents the validation rules for {@link ActorId}.
 */
export const ActorIdT = T.intersection([
    MinLengthString(1),
    MaxLengthString(20)
], "ActorId")

/**
 * Represents the unique identifier of an actor, which must be a character sequence of length 1 to 20.
 */
export type ActorId = T.TypeOf<typeof ActorIdT>

/**
 * Represents the validation rules for {@link ActorName}.
 */
export const ActorNameT = T.intersection([
    MinLengthString(1),
    MaxLengthString(20)
], "ActorName")

/**
 * Represents the name of an actor, which must be a character sequence of length 1 to 20.
 */
export type ActorName = T.TypeOf<typeof ActorNameT>

/**
 * Represents the validation rules for {@link ActorData}.
 */
export const ActorDataT = T.intersection([
    T.readonly(T.type({
        id: ActorIdT
    })),
    NamedDataT(ActorNameT)
], "ActorData")

/**
 * Represents the data for an actor.
 *
 * @property {ActorId} id The identifier of the actor.
 * @property {NamedData<ActorName>} name The name of the actor.
 */
export type ActorData = {
    readonly id: ActorId
} & NamedData<ActorName>

/**
 * Represents the validation rules for {@link ActorDataHolder}.
 */
export const ActorDataHolderT = (type: Mixed = ActorDataT) => T.readonly(T.type({
    actors: T.readonly(T.record(ActorIdT, type))
}), "ActorDataHolder")

/**
 * Represents a holder for actor data.
 *
 * @template T The type of data associated with the actor.
 * @property {ReadonlyRecord<ActorId, T>} actors A read-only record containing all actors managed by
 *  this data holder.
 */
export type ActorDataHolder<T extends ActorData> = {

    readonly actors: ReadonlyRecord<ActorId, T>
}

/**
 * Interface representing an actor.
 *
 * @template TData The type of data associated with the actor.
 * @template TContext The type of context associated with the actor.
 */
export interface Actor<
    TData extends ActorData = unknown & ActorData,
    TContext extends ActorDataHolder<TData> = unknown & ActorDataHolder<TData>
> extends Named<ActorName, TData, TContext> {

    /**
     * Represents the identifier of an actor.
     *
     * @readonly
     */
    readonly id: ActorId
}

/**
 * Represents an abstract actor.
 *
 * @template TData The type of data associated with the actor.
 * @template TContext The type of context associated with the actor.
 */
export class BaseActor<
    TData extends ActorData = unknown & ActorData,
    TContext extends ActorDataHolder<TData> = unknown & ActorDataHolder<TData>
> extends Focusable<TContext, TData> implements Actor<TData, TContext> {

    readonly name: NameAttribute<ActorName, TData, TContext>

    /**
     * Constructor for creating an instance of the class.
     *
     * @param {ActorId} id - The identifier of the actor.
     */
    constructor(readonly id: ActorId) {
        super(Optic.id<TContext>().at("actors").key(id))

        this.name = new NameAttribute(this.optic, ActorNameT)
    }
}

export interface ActorHolder<
    TData extends ActorData = unknown & ActorData,
    TContext extends ActorDataHolder<TData> = unknown & ActorDataHolder<TData>,
    TActor extends Actor<TData, TContext> = unknown & Actor<TData, TContext>
> {
    find(predicate: (data: TData) => boolean): (context: TContext) => ReadonlyArray<TActor>

    findById(id: ActorId): (context: TContext) => Option<TActor>

    resolve(id: ActorId): (context: TContext) => Either<UnknownActorError, TActor>
}

export abstract class AbstractActorHolder<
    TData extends ActorData = unknown & ActorData,
    TContext extends ActorDataHolder<TData> = unknown & ActorDataHolder<TData>,
    TActor extends Actor<TData, TContext> = unknown & Actor<TData, TContext>
> implements ActorHolder<TData, TContext, TActor> {

    private readonly optic = Optic.id<TContext>().at("actors")

    constructor() {

        // These methods are bound here to the instance to ensure that they maintain their "this" context
        // even when used as callbacks or passed to other functions. This is necessary because class methods
        // in JavaScript are not bound to the instance by default.
        this.find = this.find.bind(this)
        this.findById = this.findById.bind(this)
        this.findByData = this.findByData.bind(this)
        this.resolve = this.resolve.bind(this)
    }

    find(predicate: (data: TData) => boolean): (context: TContext) => ReadonlyArray<TActor> {

        return flow(
            this.optic.getOptic,
            E.map(R.toEntries),
            A.fromEither,
            A.flatten,
            A.map(([, data]) => data),
            A.filter(predicate),
            A.filterMap(this.findByData)
        )
    }

    findById(id: ActorId): (context: TContext) => Option<TActor> {

        return flow(
            this.optic.key(id).getOptic,
            O.fromEither,
            O.chain(this.findByData)
        )
    }

    abstract findByData(data: TData): Option<TActor>

    resolve(id: ActorId): (context: TContext) => Either<UnknownActorError, TActor> {

        return flow(
            this.findById(id),
            E.fromOption(() => ({
                type: "UnknownActor",
                message: `Actor with the given id does not exist: "${id}".`
            }))
        )
    }
}
