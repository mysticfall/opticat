import * as E from "fp-ts/Either";
import {pipe} from "fp-ts/function"
import * as O from "fp-ts/Option"
import {Option} from "fp-ts/Option"
import {describe, expect, it} from "vitest"
import {AbstractActorHolder, Actor, ActorData, ActorId, ActorName, ActorNameT, BaseActor, BaseWorld} from "../src"

describe("BaseWorld", () => {

    const PlayerId = "player" as ActorId

    class TestActorHolder extends AbstractActorHolder {

        findByData(data: ActorData): Option<Actor> {
            return O.of(new BaseActor(data.id))
        }
    }

    const actors = new TestActorHolder()
    const world = new BaseWorld(actors)

    describe("get", () => {
        it("should allow retrieving the world state using a modifier function", () => {

            const result = world.get(W => pipe(
                W.Do,
                W.bind("player", () => actors.get(PlayerId)),
                W.bind("name", ({player}) => player.name.get),
                W.map(({name}) => `Hello, ${name}!`)
            ))({
                actors: {
                    [PlayerId]: {
                        id: PlayerId,
                        name: "Anna" as ActorName
                    }
                }
            })

            expect(result).toSatisfy<typeof result>(E.isRight)

            if (E.isRight(result)) {
                const greeting = result.right

                expect(greeting).toBe("Hello, Anna!")
            }
        })
    })

    describe("update", () => {
        it("should allow updating the world state using a modifier function", () => {

            const result = world.update(W => pipe(
                W.Do,
                E.bind("newName", () => ActorNameT.decode("Xanthias")),
                W.bind("player", () => actors.get(PlayerId)),
                W.update(({player, newName}) => player.name.set(newName))
            ))({
                actors: {
                    [PlayerId]: {
                        id: PlayerId,
                        name: "Anna" as ActorName
                    }
                }
            })

            expect(result).toSatisfy<typeof result>(E.isRight)

            if (E.isRight(result)) {
                const player = result.right.actors[PlayerId]

                expect(player).toBeDefined()
                expect(player.name).toBe("Xanthias")
            }
        })
    })
})
