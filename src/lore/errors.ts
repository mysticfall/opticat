/**
 * Definitions of errors related to lore.
 * @module
 */
import * as T from "io-ts"
import {BaseError, BaseErrorT} from "../common"

/**
 * Represents the validation rules for {@link LoreParseError}.
 */
export const LoreParseErrorT = T.intersection([
    T.readonly(T.type({
        type: T.literal("LoreParse")
    })),
    BaseErrorT
], "LoreParseError")

/**
 * Represents an error that occurs when the specified lore data cannot be parsed.
 */
export type LoreParseError = {
    readonly type: "LoreParse"
} & BaseError
