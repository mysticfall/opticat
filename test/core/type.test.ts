import * as E from "fp-ts/Either"
import {Decoder} from "io-ts"
import {PositiveInt} from "io-ts-numbers"
import {describe, expect, it} from "vitest"
import {InvalidDataErrorT, Typed, validate} from "../../src"

class TestData<T> implements Typed<T> {

    constructor(readonly codec: Decoder<unknown, T>) {
    }
}

describe("validate", () => {

    const testNumber = validate(new TestData(PositiveInt))

    it("should return Right when the given input is a valid data type.", () => {
        const result = testNumber(1)

        expect(E.isRight(result)).toBeTruthy()

        if (E.isRight(result)) {
            expect(result.right).toBe(1)
        }
    })

    it("should return Left(InvalidDataError) when the given input is not a valid data type.", () => {
        const result = testNumber(-10)

        expect(E.isLeft(result)).toBeTruthy()

        if (E.isLeft(result)) {
            const error = result.left

            expect(InvalidDataErrorT.is(error)).toBeTruthy()
            expect(error.decoder).toBe(PositiveInt)
            expect(error.message).toSatisfy((m: string) =>
                m.startsWith("Invalid type for the data: Invalid value -10 supplied to")
            )
        }
    })

    it("should return an error with a custom message when the Show argument is provided.", () => {
        const result = validate(
            new TestData(PositiveInt),
            {
                show: () => "age"
            }
        )(-10)

        expect(E.isLeft(result)).toBeTruthy()

        if (E.isLeft(result)) {
            const error = result.left

            expect(InvalidDataErrorT.is(error)).toBeTruthy()
            expect(error.decoder).toBe(PositiveInt)
            expect(error.message).toSatisfy((m: string) =>
                m.startsWith("Invalid type for age: Invalid value -10 supplied to")
            )
        }
    })
})
