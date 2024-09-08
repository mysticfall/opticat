/**
 * Definitions of common functionalities related to defining and validating types.
 * @module
 */
import * as E from "fp-ts/Either"
import {Either} from "fp-ts/Either"
import {flow, pipe} from "fp-ts/function"
import * as O from "fp-ts/Option"
import {Reader} from "fp-ts/Reader"
import {Show} from "fp-ts/Show"
import * as T from "io-ts"
import {Decoder} from "io-ts"
import {PathReporter} from "io-ts/PathReporter"
import {BaseError, BaseErrorT} from "../common"

/**
 * Interface representing a typed structure with a codec for handling data of the specified type.
 *
 * @template T The type of the data.
 */
export interface Typed<T> {

    /**
     * Represents a codec for decoding data of type `T`.
     *
     * @readonly
     */
    readonly codec: Decoder<unknown, T>
}

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
    readonly decoder: Decoder<unknown, unknown>
} & BaseError

/**
 * Validates data using a codec associated with the given object.
 *
 * @template TData The type of the data to be validated.
 * @template TSubject The type of the object containing the codec for validating the data.
 *
 * @param {Typed<TData>} typed The object containing the codec for validating the data.
 * @param {Show<TSubject>} [show] An optional display configuration for the {@link Typed} instance
 * to customise error messages.
 *
 * @return {Reader<unknown, Either<InvalidDataError, T>>} A {@link Reader} monad which either contains
 * an {@link InvalidDataError} or the validated data.
 */
export function validate<TData, TSubject extends Typed<TData> = Typed<TData>>(
    typed: TSubject,
    show?: Show<TSubject>
): Reader<unknown, Either<InvalidDataError, TData>> {

    return flow(typed.codec.decode, E.mapLeft(e => {
        const details = PathReporter.report(E.left(e))

        return ({
            type: "InvalidData",
            message: pipe(
                show,
                O.fromNullable,
                O.map(({show}) => show),
                O.ap(O.of(typed)),
                O.getOrElse(() => "the data"),
                msg => `Invalid type for ${msg}: ${details.join(" ")}`
            ),
            decoder: typed.codec,
            stack: new Error().stack,
            details: details
        })
    }))
}
