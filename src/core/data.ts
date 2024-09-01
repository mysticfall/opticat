/**
 * Definitions of common types related to handling game data.
 * @module
 */
import * as E from "fp-ts/Either"
import {Either} from "fp-ts/Either"
import {flow} from "fp-ts/function"
import * as O from "fp-ts/Option"
import {Option} from "fp-ts/Option"
import {Reader} from "fp-ts/Reader"
import {ReadonlyRecord} from "fp-ts/ReadonlyRecord"
import {Show} from "fp-ts/Show"
import {focus, Focusable, MissingDataError, tryFocus} from "./optic"
import {InvalidDataError, Typed, validate} from "./type"

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
 * It is of type `Typed<TData>`, indicating that it is a type that describes the structure and behaviour of the data.
 *
 * @template TContext The type of the context in which the data resides.
 * @template TData The type of the data.
 */
export type DataDriven<TContext, TData> = Typed<TData> & Focusable<TContext, TData>

/**
 * Represents a container for data organized by a specific name and keyed entries.
 *
 * @template TName The name or category under which the data is organized.
 * @template TKey The key type used for identifying individual data entries.
 * @template TData The type of data being stored. Defaults to `unknown`.
 *
 * @property {ReadonlyRecord<TKey, TData>} [TName]
 *  The main property of the DataContainer, where the key is of type TName and the value is a
 *  {@link ReadonlyRecord} that maps `TKey` to `TData`.
 */
export type DataContainer<TName extends string, TKey extends string, TData = unknown> = {

    readonly [key in TName]: ReadonlyRecord<TKey, TData>
}

/**
 * Finds and returns data associated with the given subject in a context. This function performs
 * a validation on the focused data and returns the result encapsulated in a {@link Reader} monad.
 *
 * @template TContext The type of the context in which the data resides.
 * @template TData The type of the data to be retrieved.
 * @template TSubject The type of the subject associated with the data to be found and validated.
 *
 * @param {TSubject} subject The subject containing data that needs to be found and validated.
 * @param {Show<TSubject>} [show] Optional parameter to customise the validation and presentation
 *  of the subject.
 *
 * @return {Reader<TContext, Either<InvalidDataError, Option<TData>>>} The result of the data search
 *  and validation encapsulated in a {@link Reader} monad, which contains an {@link Either} for
 *  potential errors and an {@link Option} for the data presence.
 */
export function findData<
    TContext,
    TData,
    TSubject extends DataDriven<TContext, TData> = DataDriven<TContext, TData>
>(
    subject: TSubject,
    show?: Show<TSubject>
): Reader<TContext, Either<InvalidDataError, Option<TData>>> {

    return flow(
        tryFocus(subject),
        O.traverse(E.Applicative)(validate(subject, show))
    )
}

/**
 * Fetches the data associated with the given subject within a specific context.
 *
 * @template TContext The type of the context in which the data resides.
 * @template TData The type of the data to be retrieved.
 * @template TSubject The type of the subject associated with the data to be found and validated.
 *
 * @param {TSubject} subject The subject containing data that needs to be found and validated.
 * @param {Show<TSubject>} [show] Optional parameter to customise the validation and presentation
 *  of the subject.
 *
 * @returns {Reader<TContext, Either<MissingDataError | InvalidDataError, TData>>} A {@link Reader}
 *  that evaluates to {@link Either} the retrieved data or an error.
 */
export function getData<
    TContext,
    TData,
    TSubject extends DataDriven<TContext, TData> = DataDriven<TContext, TData>
>(
    subject: TSubject,
    show?: Show<TSubject>
): Reader<TContext, Either<MissingDataError | InvalidDataError, TData>> {

    return flow(
        focus<TContext, TData, TSubject>(subject, show),
        E.flatMap(validate(subject, show))
    )
}
