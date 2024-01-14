import {describe, expect, it} from "vitest"
import {ActorId, eqId} from "../../src"

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
