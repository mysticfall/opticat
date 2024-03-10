/**
 * Definitions of errors related to prompts.
 * @module
 */
import * as T from "io-ts"
import {BaseError, BaseErrorT} from "../common"

/**
 * Represents the validation rules for {@link PromptParseError}.
 */
export const PromptParseErrorT = T.intersection([
    T.readonly(T.type({
        type: T.literal("PromptParse")
    })),
    BaseErrorT
], "PromptParseError")

/**
 * Represents an error that occurs when the specified prompt text cannot be parsed.
 */
export type PromptParseError = {
    readonly type: "PromptParse"
} & BaseError
