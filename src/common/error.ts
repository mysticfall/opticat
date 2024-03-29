/**
 * Definitions of common functionalities related to errors.
 * @module
 */
import * as T from "io-ts"

/**
 * Represents the validation rules for {@link BaseError}.
 */
export const BaseErrorT = T.readonly(T.intersection([
    T.type({
        type: T.string,
        message: T.string
    }),
    T.partial({
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
