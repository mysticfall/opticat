import * as T from "io-ts"
import {withMessage} from "io-ts-types"

export interface MinLengthString<N> {
    readonly MinLengthString: unique symbol
    readonly length: N
}

export const MinLengthString = <N extends number>(len: N) => withMessage(
    T.brand(
        T.string,
        (s): s is T.Branded<string, MinLengthString<N>> => len <= s.length,
        "MinLengthString"
    ),
    () => `Must be at least ${len} characters long.`
)

export interface MaxLengthString<N> {
    readonly MaxLengthString: unique symbol
    readonly length: N
}

export const MaxLengthString = <N extends number>(len: N) => withMessage(
    T.brand(
        T.string,
        (s): s is T.Branded<string, MaxLengthString<N>> => s.length <= len,
        "MaxLengthString"
    ),
    () => `Must be equal to or shorter than ${len} characters.`
)

export interface PatternString<R> {
    readonly PatternString: unique symbol
    readonly pattern: R
}

export const PatternString = <R extends RegExp>(pattern: RegExp) => T.brand(
    T.string,
    (s): s is T.Branded<string, PatternString<R>> => pattern.test(s),
    "PatternString"
)
