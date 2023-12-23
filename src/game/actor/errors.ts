// noinspection JSUnusedGlobalSymbols

/**
 * Definitions of errors related to actor.
 * @module
 */
import * as T from "io-ts"
import {BaseError, BaseErrorT} from "../../common"

/**
 * Represents the validation rules for {@link AttributeAccessError}.
 */
export const UnknownActorErrorT = T.intersection([
    T.readonly(T.type({
        type: T.literal("UnknownActorError")
    })),
    BaseErrorT
], "UnknownActorError")

/**
 * Represents an error that occurs when the specified attribute cannot be accessed. Potential causes can be
 * a non-existent attribute holder, or missing attribute key.
 */
export type UnknownActorError = {
    readonly type: "UnknownActor"
} & BaseError
