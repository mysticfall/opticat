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
import {Reader} from "fp-ts/Reader"
import * as A from "fp-ts/ReadonlyArray"
import * as R from "fp-ts/ReadonlyRecord"
import {ReadonlyRecord} from "fp-ts/ReadonlyRecord"
import * as T from "io-ts"
import {Mixed} from "io-ts"
import {NameAttribute, Named, NamedData, NamedDataT} from "../attribute"
import {Focusable, Identifiable, MaxLengthString, MinLengthString} from "../common"
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
 */
export interface ActorData extends Identifiable<ActorId>, NamedData<ActorName> {
}

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
 */
export interface ActorDataHolder<T extends ActorData> {

    /**
     * A read-only record containing all actors managed by this data holder.
     *
     * @readonly
     */
    readonly actors: ReadonlyRecord<ActorId, T>
}

/**
 * Interface providing methods to access and manipulate all properties and behaviors of a specific actor. Note that
 * this class is stateless, and should not contain any state of the associated actor that may change over time.
 *
 * @template TData The type of data associated with the actor.
 * @template TContext The type of context associated with the actor.
 */
export interface Actor<
    TData extends ActorData = unknown & ActorData,
    TContext extends ActorDataHolder<TData> = unknown & ActorDataHolder<TData>
> extends Identifiable<ActorId>, Named<ActorName, TData, TContext> {
}

/**
 * A base actor class with minimal properties. You can use it for simple games or extend it to add more properties
 * and behaviours to suit your needs.
 *
 * @template TData The type of data associated with the actor.
 * @template TContext The type of context associated with the actor.
 */
export class BaseActor<
    TData extends ActorData = unknown & ActorData,
    TContext extends ActorDataHolder<TData> = unknown & ActorDataHolder<TData>
> extends Focusable<TContext, TData> implements Actor<TData, TContext> {

    /**
     * The name attribute of the actor.
     *
     * @readonly
     */
    readonly name: NameAttribute<ActorName, TData, TContext>

    /**
     * Constructor for creating an instance of the class.
     *
     * @param {ActorId} id The unique identifier of the associated actor.
     */
    constructor(readonly id: ActorId) {
        super(Optic.id<TContext>().at("actors").key(id))

        this.name = new NameAttribute(this.optic, ActorNameT)
    }
}

/**
 * Interface representing a holder for actors.
 *
 * @template TData The type of data that the actors hold.
 * @template TContext The type of context that the actors hold.
 * @template TActor The type of actor.
 */
export interface ActorHolder<
    TData extends ActorData = unknown & ActorData,
    TContext extends ActorDataHolder<TData> = unknown & ActorDataHolder<TData>,
    TActor extends Actor<TData, TContext> = unknown & Actor<TData, TContext>
> {

    /**
     * Finds actors in the context based on the provided predicate function.
     *
     * @param {function} predicate A function that determines if an actor meets certain criteria. It takes a data
     *  object as input and returns a boolean value.
     * @return {Reader} A {@link Reader} that takes a context as input and returns an array of actors that satisfy
     *  the predicate. The returned array is read-only and cannot be modified.
     */
    find(predicate: (data: TData) => boolean): Reader<TContext, ReadonlyArray<TActor>>

    /**
     * Finds an actor by its unique identifier.
     *
     * @param {ActorId} id The ID of the actor to find.
     *
     * @return {Reader} {Reader} A {@link Reader} that accepts a context and returns an option of
     *  the found actor.
     */
    findById(id: ActorId): Reader<TContext, Option<TActor>>

    /**
     * Returns an actor based on the given id. Returns a function that takes a context object and returns either
     *  the resolved actor of type TActor, or an UnknownActorError if the actor could not be found.
     *
     * @param {ActorId} id The unique identifier of the actor to be resolved.
     * @returns {Reader} {Reader} A {@link Reader} that takes a context object and returns an {@link Either} monad.
     */
    get(id: ActorId): Reader<TContext, Either<UnknownActorError, TActor>>
}

/**
 * Represents an abstract class for holding actors.
 *
 * @template TData The type of actor data.
 * @template TContext The type of actor data holder.
 * @template TActor The type of actor.
 */
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
        this.get = this.get.bind(this)
    }

    find(predicate: (data: TData) => boolean): Reader<TContext, ReadonlyArray<TActor>> {

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

    findById(id: ActorId): Reader<TContext, Option<TActor>> {

        return flow(
            this.optic.key(id).getOptic,
            O.fromEither,
            O.chain(this.findByData)
        )
    }

    abstract findByData(data: TData): Option<TActor>

    get(id: ActorId): Reader<TContext, Either<UnknownActorError, TActor>> {

        return flow(
            this.findById(id),
            E.fromOption(() => ({
                type: "UnknownActor",
                message: `Actor with the given id does not exist: "${id}".`
            }))
        )
    }
}
