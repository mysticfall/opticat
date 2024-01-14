// noinspection DuplicatedCode

import * as Optic from "@fp-ts/optic"
import * as E from "fp-ts/Either"
import {pipe} from "fp-ts/function"
import {ReadonlyRecord} from "fp-ts/ReadonlyRecord"
import * as T from "io-ts"
import {PositiveInt} from "io-ts-numbers"
import {describe, expect, it} from "vitest"
import {AbstractAttribute, AttributeOptions} from "../../src"

type Character = {
    readonly name: string
    readonly age: number
}

type TestContext = {
    readonly players: ReadonlyRecord<string, Character>
}

const context: TestContext = {
    players: {
        anna: {name: "Anna", age: 41}
    }
}

describe("AbstractAttribute", () => {

    const toPlayer = Optic.id<TestContext>().at("players").key("anna")

    class NameAttribute extends AbstractAttribute<"name", Character, TestContext> {
        constructor(options?: AttributeOptions) {
            super("name", toPlayer, options)
        }

        protected readonly decoder = T.string
    }

    class AgeAttribute extends AbstractAttribute<"age", Character, TestContext> {
        constructor() {
            super("age", toPlayer)
        }

        protected readonly decoder = PositiveInt
    }

    const name = new NameAttribute()
    const age = new AgeAttribute()
    const readOnly = new NameAttribute({updatable: false})

    describe("constructor", () => {
        it("should initialize the 'name' property correctly", () => {
            expect(name.name).toBe("name")
            expect(age.name).toBe("age")
        })
    })

    describe("get", () => {
        it("should retrieve the correct attribute from the context", () => {
            expect(name.get(context)).toMatchObject(E.of("Anna"))
            expect(age.get(context)).toMatchObject(E.of(41))
        })

        it("should return Left with an AttributeAccessError when the attribute is not accessible", () => {
            const result = name.get({players: {}})

            expect(result).satisfies(E.isLeft)

            if (E.isLeft(result)) {
                const {type, message} = result.left

                expect(type).toBe("AttributeAccess")
                expect(message).toBe("Failed to access attribute \"name\": Missing key \"anna\".")
            }
        })
    })

    describe("set", () => {
        it("should update the attribute in the context", () => {
            const result = pipe(
                E.of(context),
                E.chain(name.set("Xanthias")),
                E.chain(age.set(45))
            )

            expect(result).satisfies(E.isRight)

            if (E.isRight(result)) {
                const player = result.right.players["anna"]

                expect(player.name).toBe("Xanthias")
                expect(player.age).toBe(45)
            }
        })

        it("should return Left with an AttributeAccessError when the attribute is not accessible", () => {
            const result = pipe(
                {
                    players: {}
                },
                name.set("Xanthias")
            )

            expect(result).satisfies(E.isLeft)

            if (E.isLeft(result)) {
                const {type, message} = result.left

                expect(type).toBe("AttributeAccess")
                expect(message).toBe("Failed to access attribute \"name\": Missing key \"anna\".")
            }
        })

        it("should return Left with a ReadOnlyAttributeError when the attribute is not updatable", () => {
            const result = pipe(
                context,
                readOnly.set("Xanthias")
            )

            expect(result).satisfies(E.isLeft)

            if (E.isLeft(result)) {
                const {type, message} = result.left

                expect(type).toBe("ReadOnlyAttribute")
                expect(message).toBe("Cannot modify a read-only attribute \"name\".")
            }
        })
    })

    describe("setRaw", () => {
        it("should return Right with the updated context when the argument is valid", () => {
            const result = pipe(
                E.of(context),
                E.chain(name.setRaw("Xanthias")),
                E.chain(age.setRaw(45))
            )

            expect(result).satisfies(E.isRight)

            if (E.isRight(result)) {
                const player = result.right.players["anna"]

                expect(player.name).toBe("Xanthias")
                expect(player.age).toBe(45)
            }
        })

        it("should return Left with an AttributeAccessError when the attribute is not accessible", () => {
            const result = pipe(
                {
                    players: {}
                },
                name.setRaw("Xanthias")
            )

            expect(result).satisfies(E.isLeft)

            if (E.isLeft(result)) {
                const {type, message} = result.left

                expect(type).toBe("AttributeAccess")
                expect(message).toBe("Failed to access attribute \"name\": Missing key \"anna\".")
            }
        })

        it("should return Left with an InvalidAttributeError when the argument is not valid", () => {
            const invalidName = pipe(
                context,
                name.setRaw(1234)
            )

            const invalidAge = pipe(
                context,
                age.setRaw(-30)
            )

            expect(invalidName).satisfies(E.isLeft)
            expect(invalidAge).satisfies(E.isLeft)

            if (E.isLeft(invalidName)) {
                const {type, message, details} = invalidName.left

                expect(type).toBe("InvalidAttribute")
                expect(message).toBe("Invalid value \"1234\" specified for attribute \"name\".")
                expect(details).includes("Invalid value 1234 supplied to : string")
            }

            if (E.isLeft(invalidAge)) {
                const {type, message, details} = invalidAge.left

                expect(type).toBe("InvalidAttribute")
                expect(message).toBe("Invalid value \"-30\" specified for attribute \"age\".")
                expect(details).includes("Invalid value -30 supplied to : PositiveInt/0: Positive")
            }
        })

        it("should return Left with a ReadOnlyAttributeError when the attribute is not updatable", () => {
            const result = pipe(
                context,
                readOnly.setRaw("Xanthias")
            )

            expect(result).satisfies(E.isLeft)

            if (E.isLeft(result)) {
                const {type, message} = result.left

                expect(type).toBe("ReadOnlyAttribute")
                expect(message).toBe("Cannot modify a read-only attribute \"name\".")
            }
        })
    })

    describe("modify", () => {
        it("should update the attribute in the context", () => {
            const result = pipe(
                E.of(context),
                E.chain(name.modify(n => `${n} Xanthias`)),
                E.chain(age.modify(a => a + 5))
            )

            expect(result).satisfies(E.isRight)

            if (E.isRight(result)) {
                const player = result.right.players["anna"]

                expect(player.name).toBe("Anna Xanthias")
                expect(player.age).toBe(46)
            }
        })

        it("should return Left with an AttributeAccessError when the attribute is not accessible", () => {
            const result = pipe(
                {
                    players: {}
                },
                name.modify(n => `${n} Xanthias`)
            )

            expect(result).satisfies(E.isLeft)

            if (E.isLeft(result)) {
                const {type, message} = result.left

                expect(type).toBe("AttributeAccess")
                expect(message).toBe("Failed to access attribute \"name\": Missing key \"anna\".")
            }
        })

        it("should return Left with a ReadOnlyAttributeError when the attribute is not updatable", () => {
            const result = pipe(
                context,
                readOnly.modify(n => `${n} Xanthias`)
            )

            expect(result).satisfies(E.isLeft)

            if (E.isLeft(result)) {
                const {type, message} = result.left

                expect(type).toBe("ReadOnlyAttribute")
                expect(message).toBe("Cannot modify a read-only attribute \"name\".")
            }
        })
    })

    describe("modifyRaw", () => {
        it("should return Right with the updated context when the argument is valid", () => {
            const result = pipe(
                E.of(context),
                E.chain(name.modifyRaw(n => `${n} Xanthias`)),
                E.chain(age.modifyRaw(a => a + 5))
            )

            expect(result).satisfies(E.isRight)

            if (E.isRight(result)) {
                const player = result.right.players["anna"]

                expect(player.name).toBe("Anna Xanthias")
                expect(player.age).toBe(46)
            }
        })

        it("should return Left with an AttributeAccessError when the attribute is not accessible", () => {
            const result = pipe(
                {
                    players: {}
                },
                name.modifyRaw(n => `${n} Xanthias`)
            )

            expect(result).satisfies(E.isLeft)

            if (E.isLeft(result)) {
                const {type, message} = result.left

                expect(type).toBe("AttributeAccess")
                expect(message).toBe("Failed to access attribute \"name\": Missing key \"anna\".")
            }
        })

        it("should return Left with an InvalidAttributeError when the modifier results in a invalid value", () => {
            const invalidName = pipe(
                E.of(context),
                E.chain(name.modifyRaw(() => 1234))
            )

            const invalidAge = pipe(
                E.of(context),
                E.chain(age.modifyRaw(() => -30))
            )

            expect(invalidName).satisfies(E.isLeft)
            expect(invalidAge).satisfies(E.isLeft)

            if (E.isLeft(invalidName)) {
                const {type, message, details} = invalidName.left

                expect(type).toBe("InvalidAttribute")
                expect(message).toBe("Invalid value \"1234\" specified for attribute \"name\".")
                expect(details).includes("Invalid value 1234 supplied to : string")
            }

            if (E.isLeft(invalidAge)) {
                const {type, message, details} = invalidAge.left

                expect(type).toBe("InvalidAttribute")
                expect(message).toBe("Invalid value \"-30\" specified for attribute \"age\".")
                expect(details).includes("Invalid value -30 supplied to : PositiveInt/0: Positive")
            }
        })

        it("should return Left with a ReadOnlyAttributeError when the attribute is not updatable", () => {
            const result = pipe(
                context,
                readOnly.modifyRaw(n => `${n} Xanthias`)
            )

            expect(result).satisfies(E.isLeft)

            if (E.isLeft(result)) {
                const {type, message} = result.left

                expect(type).toBe("ReadOnlyAttribute")
                expect(message).toBe("Cannot modify a read-only attribute \"name\".")
            }
        })
    })
})
