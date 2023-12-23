/**
 * Definitions of common types related to actor.
 * @module
 */
import * as Optic from "@fp-ts/optic"
import {Optional} from "@fp-ts/optic"
import {Either} from "fp-ts/Either"
import {Option} from "fp-ts/Option"
import {ReadonlyRecord} from "fp-ts/ReadonlyRecord"
import * as T from "io-ts"
import {Mixed} from "io-ts"
import {MaxLengthString, MinLengthString} from "../../common"
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
export abstract class AbstractActor<
    TData extends ActorData = unknown & ActorData,
    TContext extends ActorDataHolder<TData> = unknown & ActorDataHolder<TData>
> implements Actor<TData, TContext> {

    readonly name: NameAttribute<ActorName, TData, TContext>

    /**
     * Represents an {@link Optional} that focuses on TData in a given TContext.
     *
     * @readonly
     */
    protected readonly optic: Optional<TContext, TData>

    /**
     * Constructor for creating an instance of the class.
     *
     * @param {ActorId} id - The identifier of the actor.
     */
    protected constructor(readonly id: ActorId) {
        this.optic = Optic.id<TContext>().at("actors").key(id)

        this.name = new NameAttribute(this.optic, ActorNameT)
    }
}

export interface ActorHolder<
    TData extends ActorData = unknown & ActorData,
    TContext extends ActorDataHolder<TData> = unknown & ActorDataHolder<TData>
> {

    find(id: ActorId): (context: TContext) => Option<Actor<TData, TContext>>

    resolve(id: ActorId): (context: TContext) => Either<UnknownActorError, Actor<TData, TContext>>
}
