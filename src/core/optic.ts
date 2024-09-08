/**
 * Definitions of common functionalities related to the _Optic_ library from _fp-ts_.
 * @module
 */
import * as Optic from "@fp-ts/optic"
import {Optional} from "@fp-ts/optic"
import * as E from "fp-ts/Either"
import {Either} from "fp-ts/Either"
import {flow, pipe} from "fp-ts/function"
import * as O from "fp-ts/Option"
import {Option} from "fp-ts/Option"
import {Reader} from "fp-ts/Reader"
import {Show} from "fp-ts/Show"
import * as T from "io-ts"
import {BaseError, BaseErrorT} from "../common"

/**
 * Represents an interface that allows focusing on a subset of data within a given context.
 *
 * @template TContext The type of the context that this interface operates on.
 * @template TData The type of the subset of data being focused on within the `TContext`.
 *  Defaults to `unknown`.
 */
export interface Focusable<TContext, TData = unknown> {

    /**
     * Represents an {@link Optional} that focuses on `TData` in a given `TContext`.
     *
     * @readonly
     */
    readonly optic: Optional<TContext, TData>
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
 * Focuses on the data specified by the provided {@link Focusable} instance and returns either the data
 * if it exists or an error indicating missing data.
 *
 * @template TContext The type of the context in which to find the data.
 * @template TData The type of the data to be retrieved.
 * @template TSubject The type of the {@link Focusable} instance containing the optic to focus on the data.
 *
 * @param {TSubject} focusable The {@link Focusable} instance containing the optic to focus on the data.
 * @param {Show<TSubject>} [show] An optional display configuration for the {@link Focusable} instance
 * to customise error messages.
 *
 * @return {Reader<TContext, Either<MissingDataError, TData>>} A {@link Reader} containing either the data
 * or a {@link MissingDataError} if the data could not be found.
 */
export function get<
    TContext,
    TData = unknown,
    TSubject extends Focusable<TContext, TData> = Focusable<TContext, TData>
>(
    focusable: TSubject,
    show?: Show<TSubject>
): Reader<TContext, Either<MissingDataError, TData>> {

    return flow(
        Optic.getOrModify(focusable.optic),
        E.mapLeft(() => ({
            type: "MissingData",
            message: pipe(
                show,
                O.fromNullable,
                O.map(({show}) => show),
                O.ap(O.of(focusable)),
                O.getOrElse(() => "the data"),
                msg => `Failed to read ${msg}.`
            ),
            stack: new Error().stack
        }))
    )
}

/**
 * Tries to set focus on a given focusable element and returns an updated context with
 * an optional data element.
 *
 * @template TContext The type of the context in which to find the data.
 * @template TData The type of the data to be retrieved.
 *
 * @param {Focusable<TContext, TData>} focusable The focusable element which contains the context
 * and data to be manipulated.
 *
 * @return {Reader<TContext, Option<TData>>} A function that, when given a context, returns
 * an optional data element wrapped in a {@link Reader} monad.
 */
export function getOption<TContext, TData = unknown>(
    focusable: Focusable<TContext, TData>
): Reader<TContext, Option<TData>> {

    return Optic.getOption(focusable.optic)
}

/**
 * Replaces the value of a focusable object with the provided data.
 *
 * @template TContext The type of the context in which to find the data.
 * @template TData The type of the data to be retrieved.
 * @template TSubject The type of the {@link Focusable} instance containing the optic to focus on the data.
 *
 * @param focusable The focusable object whose value is to be replaced.
 * @param show An optional parameter to show the focusable object's details.
 *
 * @return A function that takes the new value and returns a {@link Reader} which either contains a
 *  {@link MissingDataError} or the updated context.
 */
export function replace<
    TContext,
    TData = unknown,
    TSubject extends Focusable<TContext, TData> = Focusable<TContext, TData>
>(
    focusable: TSubject,
    show?: Show<TSubject>
): (value: TData) => Reader<TContext, Either<MissingDataError, TContext>> {

    return value => flow(
        focusable.optic.setOptic(value),
        E.mapLeft(() => ({
            type: "MissingData",
            message: pipe(
                show,
                O.fromNullable,
                O.map(({show}) => show),
                O.ap(O.of(focusable)),
                O.getOrElse(() => "the data"),
                msg => `Failed to replace ${msg}.`
            ),
            stack: new Error().stack
        }))
    )
}

/**
 * Modifies the value within the given focusable context using the provided modifier function.
 *
 * @template TContext The type of the context in which to find the data.
 * @template TData The type of the data to be retrieved.
 * @template TSubject The type of the {@link Focusable} instance containing the optic to focus on the data.
 *
 * @param focusable The context and the data to be modified.
 * @param show Optional parameter to display information about the subject being modified.
 *
 * @return A function that takes a modifier function to alter the data and returns a {@link Reader}, which
 *         either contains the updated context or an {@link MissingDataError}.
 */
export function modify<
    TContext,
    TData = unknown,
    TSubject extends Focusable<TContext, TData> = Focusable<TContext, TData>
>(
    focusable: TSubject,
    show?: Show<TSubject>
): (modifier: (value: TData) => TData) => Reader<TContext, Either<MissingDataError, TContext>> {

    return modifier => context => pipe(
        focusable.optic.getOptic(context),
        E.map(modifier),
        E.flatMap(v => focusable.optic.setOptic(v)(context)),
        E.mapLeft(() => ({
            type: "MissingData",
            message: pipe(
                show,
                O.fromNullable,
                O.map(({show}) => show),
                O.ap(O.of(focusable)),
                O.getOrElse(() => "the data"),
                msg => `Failed to modify ${msg}.`
            ),
            stack: new Error().stack
        }))
    )
}
