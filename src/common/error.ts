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
 *
 * @property {string} type The type of the error.
 * @property {string} message The error message.
 * @property {unknown} [details] Additional details about the error. This property is optional.
 */
export type BaseError = {
    readonly type: string
    readonly message: string
    readonly details?: unknown
}
