import * as Optic from "@fp-ts/optic"
import {Optional} from "@fp-ts/optic"
import * as E from "fp-ts/Either"
import {pipe} from "fp-ts/function"
import * as O from "fp-ts/Option"
import {describe, expect, it} from "vitest"
import {focus, Focusable, MissingDataErrorT, tryFocus} from "../../src"

type Item = {
    readonly name: string
}

type Context = {
    readonly items: ReadonlyArray<Item>
}

class ItemData implements Focusable<Context, Item> {

    constructor(
        readonly optic: Optional<Context, Item>
    ) {
    }

    static at(index: number): ItemData {
        return new ItemData(Optic.id<Context>().at("items").index(index))
    }
}

const allItems = {
    items: [{
        name: "item1"
    }, {
        name: "item2"
    }]
} as Context

describe("focus", () => {
    it("should return Right when the specified data exists in the context.", () => {
        const result = pipe(
            ItemData.at(0),
            focus<Context, Item>
        )(allItems)

        const name = pipe(
            result,
            O.fromEither,
            O.map(({name}) => name),
            O.toUndefined
        )

        expect(name).toBe("item1")
    })

    it("should return MissingDataError when the specified data doesn't exist.", () => {
        const result = pipe(
            ItemData.at(2),
            focus<Context, Item>
        )(allItems)

        const error = pipe(
            result,
            E.swap,
            O.fromEither,
            O.toUndefined
        )

        expect(MissingDataErrorT.is(error)).toBeTruthy()

        if (MissingDataErrorT.is(error)) {
            expect(error.message).toBe("The associated data could not be found.")
        }
    })

    it("should return an error with a custom message when the Show argument is provided.", () => {
        const result = pipe(
            allItems,
            focus<Context, Item>(
                ItemData.at(2),
                {
                    show: () => "the last user"
                }
            )
        )

        const error = pipe(
            result,
            E.swap,
            O.fromEither,
            O.toUndefined
        )

        expect(MissingDataErrorT.is(error)).toBeTruthy()

        if (MissingDataErrorT.is(error)) {
            expect(error.message).toBe("The data associated with the last user could not be found.")
        }
    })
})

describe("tryFocus", () => {
    it("should return Some when the specified data exists in the context.", () => {
        const result = pipe(
            ItemData.at(0),
            tryFocus<Context, Item>
        )(allItems)

        const name = pipe(
            result,
            O.map(({name}) => name),
            O.toUndefined
        )

        expect(name).toBe("item1")
    })

    it("should return None when the specified data doesn't exist.", () => {
        const result = pipe(
            ItemData.at(2),
            tryFocus<Context, Item>
        )(allItems)

        expect(O.isNone(result)).toBeTruthy()
    })
})
