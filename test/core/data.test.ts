import * as Optic from "@fp-ts/optic"
import {Optional} from "@fp-ts/optic"
import * as E from "fp-ts/Either"
import {pipe} from "fp-ts/function"
import * as O from "fp-ts/Option"
import * as T from "io-ts"
import {describe, expect, it} from "vitest"
import {DataDriven, findData, getData, InvalidDataErrorT, MissingDataErrorT} from "../../src"

type Context = {
    readonly items: ReadonlyArray<Item>
}

const ItemT = T.readonly(T.type({
    name: T.string
}), "Item")

type Item = T.TypeOf<typeof ItemT>

class ItemData implements DataDriven<Item, Context> {

    readonly codec = ItemT

    constructor(
        readonly optic: Optional<Context, Item>,
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
        title: "item2" // Invalid item.
    }]
} as Context

describe("findData", () => {

    it("should return Some when the specified data exists in the context.", () => {
        const result = pipe(
            ItemData.at(0),
            findData<Item, Context>(allItems)
        )

        const name = pipe(
            result,
            O.fromEither,
            O.flatten,
            O.map(({name}) => name),
            O.toUndefined
        )

        expect(name).toBe("item1")
    })

    it("should return None when the specified data exists in the context.", () => {
        const result = pipe(
            ItemData.at(2),
            findData<Item, Context>(allItems)
        )

        expect(E.isRight(result)).toBeTruthy()

        const item = pipe(
            result,
            O.fromEither,
            O.flatten
        )

        expect(O.isNone(item)).toBeTruthy()
    })

    it("should return InvalidDataError when the specified data is invalid.", () => {
        const error = pipe(
            ItemData.at(1),
            findData<Item, Context>(allItems),
            E.swap,
            O.fromEither,
            O.toUndefined
        )

        expect(InvalidDataErrorT.is(error)).toBeTruthy()
    })
})

describe("getData", () => {

    it("should return the associated data when it exists.", () => {
        const result = pipe(
            ItemData.at(0),
            getData<Item, Context>(allItems)
        )

        const name = pipe(
            result,
            E.map(({name}) => name),
            O.fromEither,
            O.toUndefined
        )

        expect(name).toBe("item1")
    })

    it("should return MissingDataError when the specified data doesn't exist.", () => {
        const error = pipe(
            ItemData.at(2),
            getData<Item, Context>(allItems),
            E.swap,
            O.fromEither,
            O.toUndefined
        )

        expect(MissingDataErrorT.is(error)).toBeTruthy()
    })

    it("should return InvalidDataError when the specified data is invalid.", () => {
        const error = pipe(
            ItemData.at(1),
            getData<Item, Context>(allItems),
            E.swap,
            O.fromEither,
            O.toUndefined
        )

        expect(InvalidDataErrorT.is(error)).toBeTruthy()
    })
})
