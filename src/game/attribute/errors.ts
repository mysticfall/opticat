// noinspection JSUnusedGlobalSymbols

/**
 * Definitions of errors related to attribute.
 * @module
 */
import * as T from "io-ts"
import {BaseError, BaseErrorT} from "../../common/error"

/**
 * Represents the validation rules for {@link AttributeAccessError}.
 */
export const AttributeAccessErrorT = T.intersection([
    T.readonly(T.type({
        type: T.literal("AttributeAccess")
    })),
    BaseErrorT
], "AttributeAccessError")

/**
 * Represents an error that occurs when the specified attribute cannot be accessed. Potential causes can be
 * a non-existent attribute holder, or missing attribute key.
 */
export type AttributeAccessError = {
    readonly type: "AttributeAccess"
} & BaseError

/**
 * Represents the validation rules for {@link InvalidAttributeError}.
 */
export const InvalidAttributeErrorT = T.intersection([
    T.readonly(T.type({
        type: T.literal("InvalidAttribute")
    })),
    BaseErrorT
], "InvalidAttributeError")

/**
 * Represents an error occurs when the attribute has either an invalid value or type.
 */
export type InvalidAttributeError = {
    readonly type: "InvalidAttribute"
} & BaseError

/**
 * Represents the validation rules for {@link ReadOnlyAttributeError}.
 */
export const ReadOnlyAttributeErrorT = T.intersection([
    T.readonly(T.type({
        type: T.literal("ReadOnlyAttribute")
    })),
    BaseErrorT
], "ReadOnlyAttributeError")

/**
 * Represents an error occurs when attempting to modify a read-only attribute.
 */
export type ReadOnlyAttributeError = {
    readonly type: "ReadOnlyAttribute"
} & BaseError

/**
 * Represents the validation rules for {@link AttributeError}.
 */
export const AttributeErrorT = T.union([
    AttributeAccessErrorT,
    InvalidAttributeErrorT,
    ReadOnlyAttributeErrorT
], "AttributeError")

/**
 * Represents an AttributeError, which can be one of the following types:
 * {@link AttributeAccessError}: Error thrown when the attribute cannot be accessed.
 * {@link InvalidAttributeError}: Error thrown when the attribute has an invalid value.
 * {@link ReadOnlyAttributeError}: Error thrown when attempting to modify a read-only attribute.
 */
export type AttributeError =
    AttributeAccessError
    | InvalidAttributeError
    | ReadOnlyAttributeError
