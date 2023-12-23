import {describe, expect, it} from "vitest"
import {MinLengthString} from "../../src"
import {PathReporter} from "io-ts/PathReporter"

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
