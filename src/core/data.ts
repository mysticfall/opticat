/**
 * Definitions of common types related to handling game data.
 * @module
 */
import {Optional} from "@fp-ts/optic"
import * as E from "fp-ts/Either"
import {Either} from "fp-ts/Either"
import {pipe} from "fp-ts/function"
import * as O from "fp-ts/Option"
import {Option} from "fp-ts/Option"
import {Show} from "fp-ts/Show"
import * as T from "io-ts"
import {Type} from "io-ts"
import {PathReporter} from "io-ts/PathReporter"
import {BaseError, BaseErrorT} from "../common"

/**
 * Represents a data-driven subject with an optic and a codec.
 *
 * The `DataDriven` interface is a generic interface that defines a data-driven subject.
 * It consists of two readonly properties: `optic` and `codec`.
 *
 * The `optic` property represents an optic that allows for traversal and manipulation of data within a given context.
 * It is of type `Optional<TContext, TData>`, indicating that it is an optional traversal that might not always succeed.
 *
 * The `codec` property represents a type that specifies the encoding/decoding rules for the data.
 * It is of type `Type<TData>`, indicating that it is a type that describes the structure and behaviour of the data.
 *
 * @template TData The type of the data.
 * @template TContext The type of the context in which the data resides.
 */
export interface DataDriven<TData, TContext> {

    /**
     * Represents an optic that can be used for accessing the data associated with this subject.
     *
     * @readonly
     */
    readonly optic: Optional<TContext, TData>

    /**
     * Represents a codec for handling data of type `TData`.
     *
     * @readonly
     */
    readonly codec: Type<TData>
}

/**
 * Represents the validation rules for {@link MissingDataError}.
 */
export const MissingDataErrorT = T.intersection([
    T.readonly(T.type({
        type: T.literal("MissingData")
    })),
    BaseErrorT
], "MissingDataError")

/**
 * Represents an error that occurs when the associated data cannot be accessed.
 */
export type MissingDataError = {
    readonly type: "MissingData"
} & BaseError

/**
 * Represents the validation rules for {@link InvalidDataError}.
 */
export const InvalidDataErrorT = T.intersection([
    T.readonly(T.type({
        type: T.literal("InvalidData")
    })),
    BaseErrorT
], "InvalidDataError")

/**
 * Represents an error that occurs when the associated data has an invalid type.
 */
export type InvalidDataError = {
    readonly type: "InvalidData"
} & BaseError

/**
 * Finds data associated with the given subject in the provided context.
 *
 * @param {TContext} context - The context used for finding the data.
 * @param {Show<TSubject>} [show] - The show function used to describe the subject in error messages.
 *
 * @template TData The type of the data.
 * @template TContext The type of the context.
 * @template TSubject The type of the subject.
 *
 * @return {(subject: TSubject) => Either<InvalidDataError, Option<TData>>}
 *  The function that takes a subject and returns either the data or an {@link InvalidDataError}.
 */
export function findData<
    TData,
    TContext,
    TSubject extends DataDriven<TData, TContext> = DataDriven<TData, TContext>
>(
    context: TContext,
    show?: Show<TSubject>
): (subject: TSubject) => Either<InvalidDataError, Option<TData>> {

    const getError = (subject: TSubject) => pipe(
        show,
        O.fromNullable,
        O.map(({show}) => show),
        O.ap(O.of(subject)),
        O.map(msg => `${msg} has invalid data:`),
        O.getOrElse(() => "Invalid data:")
    )

    return subject => pipe(
        context,
        subject.optic.getOptic,
        O.fromEither,
        O.map(subject.codec.decode),
        O.sequence(E.Applicative),
        E.mapLeft(e => ({
            type: "InvalidData",
            message: [
                getError(subject),
                pipe(e, E.left, PathReporter.report)
            ].join(" "),
            details: e[0]
        }))
    )
}

/**
 * Retrieves data associated with the given subject in the provided context.
 *
 * @param {TContext} context - The context used for finding the data.
 * @param {Show<TSubject>} [show] - The show function used to describe the subject in error messages.
 *
 * @template TData The type of the data.
 * @template TContext The type of the context.
 * @template TSubject The type of the subject.
 *
 * @return {(subject: TSubject) => Either<InvalidDataError, Option<TData>>}
 *  The function that takes a subject and returns either the data or an error
 *  ({@link MissingDataError} when the data cannot be found, or {@link InvalidDataError} when invalid).
 */
export function getData<
    TData,
    TContext,
    TSubject extends DataDriven<TData, TContext> = DataDriven<TData, TContext>
>(
    context: TContext,
    show?: Show<TSubject>
): (subject: TSubject) => Either<MissingDataError | InvalidDataError, TData> {

    const getError = (subject: TSubject) => pipe(
        show,
        O.fromNullable,
        O.map(({show}) => show),
        O.ap(O.of(subject)),
        O.map(msg => `${msg} has invalid data:`),
        O.getOrElse(() => "Invalid data:")
    )

    return subject => pipe(
        subject,
        findData<TData, TContext, TSubject>(context, show),
        E.flatMap(E.fromOption<MissingDataError>(() => ({
            type: "MissingData",
            message: getError(subject)
        })))
    )
}
