/**
 * Definitions of common functionalities related to unique identifiers.
 * @module
 */
import {Eq, fromEquals} from "fp-ts/Eq"
import * as T from "io-ts"
import {withMessage} from "./error"
import {MaxLengthString, MinLengthString, PatternString} from "./string"

/**
 * Represents the validation rules for {@link Identifier}.
 */
export const IdentifierT = withMessage(
    T.intersection([
        MinLengthString(1),
        MaxLengthString(20),
        PatternString(/^[a-zA-Z][a-zA-Z0-9_]*$/)
    ], "Identifier")
)

/**
 * Represents a unique identifier. It must be a character sequence of 1 to 20, starting with an
 * alphabet letter, followed by alphanumerical characters or "_".
 */
export type Identifier = T.TypeOf<typeof IdentifierT>

/**
 * Represents an object with an identifying property.
 *
 * @template T The type of the identifier.
 */
export interface Identifiable<T extends string | symbol> {

    /**
     * Represents the unique identifier of the object.
     *
     * @readonly
     */
    readonly id: T
}

/**
 * Creates an {@link Eq} object for identifying values by their identifiers.
 *
 * @template A The type of value to compare for equality.
 * @template B The type of the id property.
 * @returns {Eq<A>} An {@link Eq} object that compares values based on their identifiers.
 */
export const eqId = <A extends Identifiable<B>, B extends string>(): Eq<A> =>
    fromEquals((x, y) => x.id === y.id)
