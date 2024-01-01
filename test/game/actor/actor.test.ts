import * as E from "fp-ts/Either"
import {pipe} from "fp-ts/function";
import {describe, expect, test} from "vitest"
import {AbstractActor, ActorId, ActorNameT} from "../../../src"

const TestContext = {
    actors: {
        "player": {
            id: "player",
            name: "Anna"
        }
    }
}

// mock AbstractActor
class TestActor extends AbstractActor {

    constructor(id: ActorId) {
        super(id)
    }
}

const PlayerId = "player" as ActorId

// tests
describe("AbstractActor", () => {

    const actor = new TestActor(PlayerId)

    describe("constructor", () => {

        test("should initialise properties correctly", () => {
            expect(actor.id).toBe(PlayerId)
        })
    })

    describe("name", () => {

        test("should return the name of the actor", () => {
            expect(actor.name.get(TestContext)).toMatchObject(E.of("Anna"))
        })

        test("should allow changing the name of the actor", () => {
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
