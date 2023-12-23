import * as E from "fp-ts/Either"
import * as N from "fp-ts/number"
import * as ST from "fp-ts/string"
import * as T from "io-ts"
import {PathReporter} from "io-ts/PathReporter"
import {describe, expect, test} from "vitest"
import {clamp, Range, RangeT} from "../../src"

const NumberRange = RangeT(T.number, N.Ord)

const range: Range<string> = {min: "c", max: "f"}

describe("RangeT", () => {

    describe("is", () => {

        test("should check whether or not the given data matches the validations rules", () => {

            // check validation with max > min
            expect(NumberRange.is({min: 2, max: 3})).toBeTruthy()

            // check validation with max = min = undefined
            expect(NumberRange.is({})).toBeTruthy()

            // check validation with max = min
            expect(NumberRange.is({min: 2, max: 2})).toBeTruthy()

            // check validation with max < min
            expect(NumberRange.is({min: 3, max: 2})).toBeFalsy()
        })
    })

    describe("validate", () => {

        test("should validate that the given range follows the rules", () => {

            const valid = NumberRange.validate({min: 2, max: 3}, [])

            // validation for a valid range
            expect(valid).toMatchObject(E.of({min: 2, max: 3}))

            const invalid = NumberRange.validate({min: 3, max: 2}, [])

            // validation for an invalid range
            expect(E.isLeft(invalid)).toBeTruthy()

            const errors = PathReporter.report(invalid)

            expect(errors).toMatchObject([
                "The max value(2) should be equal to or greater than the min value(3)."
            ])
        })
    })
})

describe("clamp", () => {

    test("returns the same value when within the range", () => {
        const clamped = clamp(range, ST.Ord)
        expect(clamped("e")).toBe("e")
    })

    test("returns the minimum value when below the range", () => {
        const clamped = clamp(range, ST.Ord)
        expect(clamped("a")).toBe("c")
    })

    test("returns the maximum value when above the range", () => {
        const clamped = clamp(range, ST.Ord)
        expect(clamped("h")).toBe("f")
    })
})
