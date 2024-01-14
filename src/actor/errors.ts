// noinspection JSUnusedGlobalSymbols

/**
 * Definitions of errors related to actor.
 * @module
 */
import * as T from "io-ts"
import {BaseError, BaseErrorT} from "../common"

/**
 * Represents the validation rules for {@link UnknownActorError}.
 */
export const UnknownActorErrorT = T.intersection([
    T.readonly(T.type({
        type: T.literal("UnknownActorError")
    })),
    BaseErrorT
], "UnknownActorError")

/**
 * Represents an error that occurs when the specified actor cannot be found.
 */
export type UnknownActorError = {
    readonly type: "UnknownActor"
} & BaseError
