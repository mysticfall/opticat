/**
 * Definitions of common functionalities related to the `string` data type.
 * @module
 */
import {pipe} from "fp-ts/function"
import {not} from "fp-ts/Predicate"
import {Reader} from "fp-ts/Reader"
import * as A from "fp-ts/ReadonlyArray"
import * as R from "fp-ts/ReadonlyRecord"
import {ReadonlyRecord} from "fp-ts/ReadonlyRecord"
import * as ST from "fp-ts/string"
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

/**
 * Converts a camel case or pascal case string to plain text.
 *
 * @param {string} text - The input string in camel case or pascal case.
 * @return {string} - The converted plain text.
 */
export function camelOrPascalToPlain(text: string): string {
    return pipe(
        text,
        ST.split(""),
        A.reduce(
            {currentWord: "", words: A.empty as ReadonlyArray<string>},
            ({currentWord, words}, char) => {
                if (char.toUpperCase() === char && currentWord !== "") {
                    return {
                        currentWord: char.toLowerCase(),
                        words: [...words, currentWord]
                    }
                }

                return {
                    currentWord: currentWord + char.toLowerCase(),
                    words
                }
            }
        ),
        ({currentWord, words}) => [...words, currentWord],
        A.map(ST.trim),
        A.filter(not(ST.isEmpty)),
        A.intercalate(ST.Monoid)(" ")
    )
}

/**
 * Returns a curried function that substitutes placeholders in a string with corresponding values from the
 * given substitutions object.
 *
 * @param {ReadonlyRecord<string, string>} substitutions - The object containing the placeholders
 *    and their corresponding values.
 * @returns {Reader} - A {@link Reader} that accepts a string and returns the substituted string.
 */
export function substitute(substitutions: ReadonlyRecord<string, string>): Reader<string, string> {

    const replacers = pipe(
        substitutions,
        R.toEntries,
        A.map(([key, value]) => {
            const pattern = new RegExp(["{", key, "}"].join(""), "g")

            return (t: string) => t.replaceAll(pattern, value)
        })
    )

    return text => pipe(
        replacers,
        A.reduce(text, (t, replace) => replace(t))
    )
}
