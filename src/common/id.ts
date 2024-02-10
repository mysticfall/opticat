/**
 * Definitions of common functionalities related to unique identifiers.
 * @module
 */
import {Eq, fromEquals} from "fp-ts/Eq"

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
