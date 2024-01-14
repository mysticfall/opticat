import * as E from "fp-ts/Either"
import {pipe} from "fp-ts/function";
import {describe, expect, it} from "vitest"
import {ActorId, ActorName, ActorNameT, BaseActor} from "../../../src"

const PlayerId = "player" as ActorId

const TestContext = {
    actors: {
        [PlayerId]: {
            id: PlayerId,
            name: "Anna" as ActorName
        }
    }
}

describe("AbstractActor", () => {

    const actor = new BaseActor(PlayerId)

    describe("constructor", () => {
        it("should initialise properties correctly", () => {
            expect(actor.id).toBe(PlayerId)
        })
    })

    describe("name", () => {
        it("should return the name of the actor", () => {
            expect(actor.name.get(TestContext)).toMatchObject(E.of("Anna"))
        })

        it("should allow changing the name of the actor", () => {
            const newName = "Xanthias"

            const result = pipe(
                E.Do,
                E.bind("name", () => ActorNameT.decode(newName)),
                E.bindW("context", ({name}) => pipe(
                    TestContext,
                    actor.name.set(name)
                )),
                E.map(({context}) => context)
            )

            expect(result).satisfies(E.isRight)

            if (E.isRight(result)) {
                expect(result.right.actors[PlayerId].name).toBe(newName)
            }
        })
    })
})
