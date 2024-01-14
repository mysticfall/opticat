/**
 * Definitions of common functionalities related to the _Optic_ library from _fp-ts_.
 * @module
 */
import {Optional} from "@fp-ts/optic"

/**
 * Represents an abstract class for focusable objects.
 *
 * This class provides an {@link Optional} that allows accessing and modifying a property or element in a
 * given subject.
 *
 * @template TSubject The type of the subject on which the focus will be applied.
 * @template TFocus The type of the property or element that will be focused.
 */
export abstract class Focusable<TSubject, TFocus> {

    /**
     * Creates a new instance of the focusable object.
     */
    protected constructor(
        /**
         * Represents an {@link Optional} that focuses on TFocus in a given TSubject.
         *
         * @readonly
         */
        protected readonly optic: Optional<TSubject, TFocus>
    ) {
    }
}
