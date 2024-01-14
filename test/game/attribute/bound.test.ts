import * as Optic from "@fp-ts/optic"
import * as E from "fp-ts/Either"
import {pipe} from "fp-ts/function"
import * as N from "fp-ts/number"
import * as O from "fp-ts/Option"
import {Option} from "fp-ts/Option"
import {PositiveInt} from "io-ts-numbers"
import {describe, expect, it} from "vitest"
import {AbstractBoundAttribute, BoundAttributeOptions, Range} from "../../../src"

type Character = {
    readonly name: string
    readonly age: number
}

type TestContext = {
    readonly player: Character
}

const withAge = (age: number): TestContext => ({
    player: {name: "Anna", age: age as PositiveInt}
})

describe("AbstractBoundAttribute", () => {

    const toPlayer = Optic.id<TestContext>().at("player")

    class AgeAttribute extends AbstractBoundAttribute<"age", Character, TestContext> {
        constructor(options?: BoundAttributeOptions<PositiveInt>) {
            super("age", toPlayer, options)
        }

        protected readonly decoder = PositiveInt

        protected readonly ord = N.Ord
    }

    const age = new AgeAttribute()

    const minorAge = new AgeAttribute({
        range: {
            max: 17 as PositiveInt
        }
    })

    const adultAge = new AgeAttribute({
        range: {
            min: 18 as PositiveInt
        }
    })

    const teenAge = new AgeAttribute({
        range: {
            min: 10 as PositiveInt,
            max: 19 as PositiveInt
        }
    })

    describe("get", () => {
        it("should retrieve the attribute from the context and keep it within the specified range", () => {
            expect(age.get(withAge(41))).toMatchObject(E.of(41))

            expect(minorAge.get(withAge(5))).toMatchObject(E.of(5))
            expect(minorAge.get(withAge(24))).toMatchObject(E.of(17))

            expect(teenAge.get(withAge(5))).toMatchObject(E.of(10))
            expect(teenAge.get(withAge(16))).toMatchObject(E.of(16))
            expect(teenAge.get(withAge(24))).toMatchObject(E.of(19))

            expect(adultAge.get(withAge(14))).toMatchObject(E.of(18))
            expect(adultAge.get(withAge(35))).toMatchObject(E.of(35))
        })
    })

    describe("set", () => {
        it("should update the attribute in the context after clamping the value within the specified range", () => {
            expect(pipe(
                withAge(40),
                age.set(45)
            )).toEqual(E.of(
                withAge(45)
            ))

            expect(pipe(
                withAge(5),
                minorAge.set(7)
            )).toEqual(E.of(
                withAge(7)
            ))
            expect(pipe(
                withAge(5),
                minorAge.set(19)
            )).toEqual(E.of(
                withAge(17)
            ))

            expect(pipe(
                withAge(14),
                teenAge.set(9)
            )).toEqual(E.of(
                withAge(10)
            ))
            expect(pipe(
                withAge(14),
                teenAge.set(16)
            )).toEqual(E.of(
                withAge(16)
            ))
            expect(pipe(
                withAge(14),
                teenAge.set(21)
            )).toEqual(E.of(
                withAge(19)
            ))

            expect(pipe(
                withAge(35),
                adultAge.set(15)
            )).toEqual(E.of(
                withAge(18)
            ))
            expect(pipe(
                withAge(35),
                adultAge.set(40)
            )).toEqual(E.of(
                withAge(40)
            ))
        })
    })

    describe("setRaw", () => {
        it("should update the attribute in the context after clamping the value within the specified range", () => {
            expect(pipe(
                withAge(40),
                age.setRaw(45)
            )).toEqual(E.of(
                withAge(45)
            ))

            expect(pipe(
                withAge(5),
                minorAge.setRaw(7)
            )).toEqual(E.of(
                withAge(7)
            ))
            expect(pipe(
                withAge(5),
                minorAge.setRaw(19)
            )).toEqual(E.of(
                withAge(17)
            ))

            expect(pipe(
                withAge(14),
                teenAge.setRaw(9)
            )).toEqual(E.of(
                withAge(10)
            ))
            expect(pipe(
                withAge(14),
                teenAge.setRaw(16)
            )).toEqual(E.of(
                withAge(16)
            ))
            expect(pipe(
                withAge(14),
                teenAge.setRaw(21)
            )).toEqual(E.of(
                withAge(19)
            ))

            expect(pipe(
                withAge(35),
                adultAge.setRaw(15)
            )).toEqual(E.of(
                withAge(18)
            ))
            expect(pipe(
                withAge(35),
                adultAge.setRaw(40)
            )).toEqual(E.of(
                withAge(40)
            ))
        })
    })

    describe("modify", () => {
        it("should update the attribute in the context after clamping the value within the specified range", () => {
            expect(pipe(
                withAge(40),
                age.modify(v => v + 5)
            )).toEqual(E.of(
                withAge(45)
            ))

            expect(pipe(
                withAge(5),
                minorAge.modify(v => v + 2)
            )).toEqual(E.of(
                withAge(7)
            ))
            expect(pipe(
                withAge(5),
                minorAge.modify(v => v + 14)
            )).toEqual(E.of(
                withAge(17)
            ))

            expect(pipe(
                withAge(14),
                teenAge.modify(v => v - 5)
            )).toEqual(E.of(
                withAge(10)
            ))
            expect(pipe(
                withAge(14),
                teenAge.modify(v => v + 2)
            )).toEqual(E.of(
                withAge(16)
            ))
            expect(pipe(
                withAge(14),
                teenAge.modify(v => v + 7)
            )).toEqual(E.of(
                withAge(19)
            ))

            expect(pipe(
                withAge(35),
                adultAge.modify(v => v - 20)
            )).toEqual(E.of(
                withAge(18)
            ))
            expect(pipe(
                withAge(35),
                adultAge.modify(v => v + 5)
            )).toEqual(E.of(
                withAge(40)
            ))
        })
    })

    describe("modifyRaw", () => {
        it("should update the attribute in the context after clamping the value within the specified range", () => {
            expect(pipe(
                withAge(40),
                age.modifyRaw(v => v + 5)
            )).toEqual(E.of(
                withAge(45)
            ))

            expect(pipe(
                withAge(5),
                minorAge.modifyRaw(v => v + 2)
            )).toEqual(E.of(
                withAge(7)
            ))
            expect(pipe(
                withAge(5),
                minorAge.modifyRaw(v => v + 14)
            )).toEqual(E.of(
                withAge(17)
            ))

            expect(pipe(
                withAge(14),
                teenAge.modifyRaw(v => v - 5)
            )).toEqual(E.of(
                withAge(10)
            ))
            expect(pipe(
                withAge(14),
                teenAge.modifyRaw(v => v + 2)
            )).toEqual(E.of(
                withAge(16)
            ))
            expect(pipe(
                withAge(14),
                teenAge.modifyRaw(v => v + 7)
            )).toEqual(E.of(
                withAge(19)
            ))

            expect(pipe(
                withAge(35),
                adultAge.modifyRaw(v => v - 20)
            )).toEqual(E.of(
                withAge(18)
            ))
            expect(pipe(
                withAge(35),
                adultAge.modifyRaw(v => v + 5)
            )).toEqual(E.of(
                withAge(40)
            ))
        })
    })

    describe("getRange", () => {
        it("should return the range option specified in the constructor argument by default", () => {
            const context = withAge(12)

            expect(age.getRange(context)).satisfies(O.isNone)

            expect(minorAge.getRange(context)).toEqual(O.of({
                max: 17 as PositiveInt
            }))
        })

        class OneYearApart extends AgeAttribute {

            override getRange(context: TestContext): Option<Range<PositiveInt>> {
                const {age} = context.player

                return O.of({min: (age - 1) as PositiveInt, max: (age + 1) as PositiveInt})
            }
        }

        it("determine the range within which the attribute should be clamped", () => {
            const context = withAge(24)
            const newAge = new OneYearApart()

            expect(pipe(
                context,
                newAge.set(20)
            )).toEqual(E.of(
                withAge(23)
            ))
            expect(pipe(
                context,
                newAge.set(27)
            )).toEqual(E.of(
                withAge(25)
            ))
        })
    })
})
