import {PathReporter} from "io-ts/PathReporter"
import {describe, expect, it} from "vitest"
import {MinLengthString, substitute} from "../../src"

describe("MinLengthString", () => {
    describe("is", () => {
        it("should return true if the length of the string is equal to the provided number.", () => {
            const minLength7String = MinLengthString(7)
            expect(minLength7String.is("ABCDEFG")).toBe(true)
        })

        it("should return true if the length of the string is more than the provided number.", () => {
            const minLength3String = MinLengthString(3)
            expect(minLength3String.is("Grey")).toBe(true)
        })

        it("should return false if the length of the string is less than the provided number.", () => {
            const minLength6String = MinLengthString(6)
            expect(minLength6String.is("Pink")).toBe(false)
        })
    })

    describe("validate", () => {
        it("should return a descriptive error when an invalid argument is given.", () => {
            const minLength5String = MinLengthString(5)

            const message = PathReporter.report(minLength5String.decode("Blue"))

            expect(message).toEqual(["Must be at least 5 characters long."])
        })
    })
})

describe("substitute", () => {

    const substitutions = {name: "John", job: "Developer"}

    const testReader = substitute(substitutions)

    it("should replace placeholders with the corresponding values from the substitutions object", () => {

        const result = testReader('{name} is a {job}')

        expect(result).toBe("John is a Developer")
    })

    it("should return the original text when there are no substitutions", () => {

        const substitutionsWithNoMatches = {name: "John", job: "Developer"}
        const testReaderWithNoMatches = substitute(substitutionsWithNoMatches)

        const resultWithNoMatches = testReaderWithNoMatches("This is a test")

        expect(resultWithNoMatches).toBe("This is a test")
    })
})
