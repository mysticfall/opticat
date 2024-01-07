import * as E from "fp-ts/Either"
import {pipe} from "fp-ts/function"
import * as O from "fp-ts/Option"
import {Option} from "fp-ts/Option"
import {describe, expect, test} from "vitest"
import {
    AbstractActorHolder,
    Actor,
    ActorData,
    ActorId,
    ActorName,
    ActorNameT,
    BaseActor,
    BaseGame,
    GameDescription,
    GameTitle
} from "../../src"

describe("BaseGame", () => {

    const PlayerId = "player" as ActorId

    class TestActorHolder extends AbstractActorHolder {

        findByData(data: ActorData): Option<Actor> {
            return O.of(new BaseActor(data.id))
        }
    }

    describe("info", () => {
        const game = new BaseGame({
            title: "life Is A Lemon" as GameTitle,
            description: "And I want my money back" as GameDescription
        }, new TestActorHolder(), {actors: {}})

        test("should return the game info specified in the constructor", () => {
            const {title, description} = game.info

            expect(title).toBe("life Is A Lemon")
            expect(description).toBe("And I want my money back")
        })
    })

    describe("world", () => {

        const game = new BaseGame({
            title: "Test Game" as GameTitle
        }, new TestActorHolder(), {
            actors: {
                [PlayerId]: {
                    id: PlayerId,
                    name: "Anna" as ActorName
                }
            }
        })

        test("should return the current world state", () => {
            const player = game.world.actors[PlayerId]

            expect(player).toBeDefined()
            expect(player.name).toBe("Anna")
        })
    })

    describe("update", () => {

        test("should allow updating the world state using a modifier function", () => {
            const game = new BaseGame({
                title: "Test Game" as GameTitle
            }, new TestActorHolder(), {
                actors: {
                    [PlayerId]: {
                        id: PlayerId,
                        name: "Anna" as ActorName
                    }
                }
            })

            const result = game.update(G => pipe(
                G.Do,
                E.bind("newName", () => ActorNameT.decode("Xanthias")),
                G.bind("player", () => game.actors.resolve(PlayerId)),
                G.update(({player, newName}) => player.name.set(newName))
            ))

            expect(result).toSatisfy<typeof result>(E.isRight)

            if (E.isRight(result)) {
                const {context} = result.right

                const player = context.actors[PlayerId]

                expect(player).toBeDefined()
                expect(player.name).toBe("Xanthias")
            }

            const player2 = game.world.actors[PlayerId]

            expect(player2).toBeDefined()
            expect(player2.name).toBe("Xanthias")
        })
    })
})
