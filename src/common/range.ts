/**
 * Definitions of common functionalities related to the range of values in a given type.
 * @module
 */
import * as E from "fp-ts/Either"
import {flow, pipe} from "fp-ts/function"
import {Ord} from "fp-ts/Ord"
import * as T from "io-ts"
import {Errors, Type} from "io-ts"

/**
 * Represents the validation rules for {@link Range}.
 */
export const RangeT = <T>(type: Type<T>, ord: Ord<T>) => {
    const rawType = T.readonly(T.partial({
        min: type,
        max: type
    }))

    return new T.Type<T.TypeOf<typeof rawType>>(
        "Range",
        (v: unknown): v is T.TypeOf<typeof rawType> => rawType.is(v) &&
            (v.min === undefined || v.max === undefined || ord.compare(v.min, v.max) <= 0),
        (i, context) => pipe(
            rawType.validate(i, context),
            E.chain(v => E.fromPredicate<T.TypeOf<typeof rawType>, Errors>(
                ({min, max}) =>
                    min === undefined || max === undefined || ord.compare(min, max) <= 0,
                () => [{
                    value: i,
                    context: context,
                    message: `The max value(${v.max}) should be equal to or greater than the min value(${v.min}).`
                }]
            )(v))
        ),
        v => v
    )
}

/**
 * Represents a range of values, optionally bounded by minimum and/or maximum values.
 *
 * @template TValue The type of values in the range.
 */
export interface Range<TValue> {

    /**
     * The minimum value for this range.
     *
     * @readonly
     */
    readonly min?: TValue

    /**
     * The maximum value for this range.
     *
     * @readonly
     */
    readonly max?: TValue
}

/**
 * Returns a function that clamps the given value within the specified range.
 *
 * @param {Range<T>} range The range within which the value should be clamped.
 * @param {Ord<T>} ord The ordering used to compare the values.
 * @returns {(v: T) => T} A function that takes a value and returns its clamped value within the range.
 */
export function clamp<T>(range: Range<T>, ord: Ord<T>): (v: T) => T {

    const {min, max} = range

    return flow(
        v => ord.compare(v, min ?? v) >= 0 ? v : min ?? v,
        v => ord.compare(v, max ?? v) <= 0 ? v : max ?? v
    )
}
