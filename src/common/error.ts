/**
 * Definitions of common functionalities related to errors.
 * @module
 */
import {pipe} from "fp-ts/function"
import * as T from "io-ts"
import * as TS from "io-ts-types"
import {PathReporter} from "io-ts/PathReporter"
import {camelOrPascalToPlain} from "./string"

/**
 * Represents the validation rules for {@link BaseError}.
 */
export const BaseErrorT = T.readonly(T.intersection([
    T.type({
        type: T.string,
        message: T.string
    }),
    T.partial({
        stack: T.string,
        details: T.unknown
    })
]), "BaseError")

/**
 * Represents a common type for all known errors.
 */
export interface BaseError {

    /**
     * The type of the error
     *
     * @readonly
     */
    readonly type: string

    /**
     * The error message.
     *
     * @readonly
     */
    readonly message: string

    /**
     * Represents an optional stack trace or call stack information.
     *
     * @readonly
     */
    readonly stack?: string

    /**
     * Additional details about the error. This property is optional.
     *
     * @readonly
     */
    readonly details?: unknown
}

/**
 * Represents the validation rules for {@link IOError}.
 */
export const IOErrorT = T.intersection([
    T.readonly(T.type({
        type: T.literal("IO")
    })),
    BaseErrorT
], "IOError")

/**
 * An error that represents a general I/O problem.
 */
export type IOError = {
    readonly type: "IO"
} & BaseError

/**
 * Wraps a codec with an error message for validation errors.
 *
 * @param codec - The codec to wrap.
 * @param options - Optional configuration options.
 * @param options.name - The name to use in the error message. If not provided, the name of the codec will be used.
 * @param options.showDetails - Determines whether to include detailed error messages in the output. Defaults to true.
 *
 * @return A new codec that will produce error messages for validation errors.
 */
export function withMessage<C extends T.Mixed>(
    codec: C,
    options: { name?: string, showDetails?: boolean } = {},
): C {
    return TS.withMessage(
        codec,
        i => {
            const name = pipe(
                options?.name ?? codec.name,
                camelOrPascalToPlain
            )

            if (options?.showDetails === false) {
                return `"${i}" is an invalid ${name}.`
            }

            return `"${i}" is an invalid ${name}: ${PathReporter.report(codec.decode(i)).join(" ")}`;
        }
    )
}
