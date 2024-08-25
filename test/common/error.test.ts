import * as T from "io-ts"
import {NonEmptyString} from "io-ts-types"
import {PathReporter} from "io-ts/PathReporter"
import {describe, expect, it} from "vitest"
import {MinLengthString, PatternString, withMessage} from "../../src"

describe("withMessage", () => {
    it("should return a type definition that can validate values.", () => {
        const Number = withMessage(T.number)

        expect(Number.is(1)).toBeTruthy()
        expect(Number.is("string")).toBeFalsy()
    })

    it("should provide an intuitive error message when the validation fails.", () => {
        const Number = withMessage(T.number)

        const errors = PathReporter.report(Number.decode("abc"))

        expect(errors).toHaveLength(1)
        expect(errors[0]).toBe(`"abc" is an invalid number: Invalid value "abc" supplied to : number`)
    })

    it("should return a compact error message without details when the `showDetails` option is `false`.", () => {
        const Number = withMessage(T.number, {showDetails: false})

        const errors = PathReporter.report(Number.decode("abc"))

        expect(errors).toHaveLength(1)
        expect(errors[0]).toBe(`"abc" is an invalid number.`)
    })

    it("should show the name of the codec in plain words in the error message.", () => {
        const Required = withMessage(NonEmptyString, {showDetails: false})

        const errors = PathReporter.report(Required.decode(""))

        expect(errors).toHaveLength(1)
        expect(errors[0]).toBe(`"" is an invalid non empty string.`)
    })

    it("should allow overriding the codec name in the error message with the `name` option.", () => {
        const Required = withMessage(NonEmptyString, {name: "character name", showDetails: false})

        const errors = PathReporter.report(Required.decode(""))

        expect(errors).toHaveLength(1)
        expect(errors[0]).toBe(`"" is an invalid character name.`)
    })

    it("should list all validation failures from child codecs as details.", () => {
        const Required = withMessage(T.intersection([
            MinLengthString(2),
            PatternString(/^[A-Z]/)
        ], "ActorId"))

        const errors = PathReporter.report(Required.decode(""))

        expect(errors).toHaveLength(1)
        expect(errors[0]).toBe(
            `"" is an invalid actor id: Must be at least 2 characters long. ` +
            `Does not match the required pattern: "^[A-Z]".`)
    })
})
