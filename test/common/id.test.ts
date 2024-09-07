import {PathReporter} from "io-ts/PathReporter"
import {describe, expect, it} from "vitest"
import {ActorId, eqId, IdentifierT, ShowIdentifiable} from "../../src"

describe("IdentifierT", () => {
    describe("is", () => {
        it("should return true if the string is a valid variable name.", () => {
            expect(IdentifierT.is("camelCase")).toBeTruthy()
            expect(IdentifierT.is("camelCase1")).toBeTruthy()
            expect(IdentifierT.is("camelCase_")).toBeTruthy()
            expect(IdentifierT.is("PascalCase")).toBeTruthy()
            expect(IdentifierT.is("PascalCase2")).toBeTruthy()
            expect(IdentifierT.is("snake_case")).toBeTruthy()
            expect(IdentifierT.is("snake_case_3")).toBeTruthy()
            expect(IdentifierT.is("Mixed_case_3")).toBeTruthy()
            expect(IdentifierT.is("CONSTANT")).toBeTruthy()
        })

        it("should return false if the string is an invalid variable name.", () => {
            expect(IdentifierT.is("1variable")).toBeFalsy()
            expect(IdentifierT.is("variable 2")).toBeFalsy()
            expect(IdentifierT.is("_variable")).toBeFalsy()
            expect(IdentifierT.is("variable!")).toBeFalsy()
            expect(IdentifierT.is("variable:1")).toBeFalsy()
            expect(IdentifierT.is("variable+1")).toBeFalsy()
            expect(IdentifierT.is("$variable")).toBeFalsy()
        })
    })

    describe("decode", () => {
        it("should return an error message when the string is an invalid variable name.", () => {
            const result = IdentifierT.decode("1variablesssssssssssssss")
            const messages = PathReporter.report(result)

            expect(messages).toHaveLength(1)
            expect(messages[0]).toBe(`"1variablesssssssssssssss" is an invalid identifier: ` +
                `Must be equal to or shorter than 20 characters. ` +
                `Does not match the required pattern: "^[a-zA-Z][a-zA-Z0-9_]*$".`)
        })
    })
})

describe("eqId", () => {
    describe("equals", () => {
        it("should test the equality of the given identifiable objects.", () => {
            const player = {
                id: "player" as ActorId
            }

            const alias = {
                id: "player" as ActorId
            }

            const anna = {
                id: "anna" as ActorId
            }

            expect(eqId().equals(player, alias)).toBeTruthy()
            expect(eqId().equals(player, anna)).toBeFalsy()
        })
    })
})

describe("ShowIdentifiable", () => {
    it("should return the string representation of the identifiable object.", () => {

        const player = {
            id: "player"
        }

        const withoutType = new ShowIdentifiable()

        expect(withoutType.show(player)).toBe("player")

        const withType = new ShowIdentifiable("actor")

        expect(withType.show(player)).toBe("actor(id=player)")
    })
})
