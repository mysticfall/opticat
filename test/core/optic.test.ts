import * as Optic from "@fp-ts/optic"
import {Optional} from "@fp-ts/optic"
import * as E from "fp-ts/Either"
import {pipe} from "fp-ts/function"
import * as O from "fp-ts/Option"
import * as A from "fp-ts/ReadonlyArray"
import {describe, expect, it} from "vitest"
import {Focusable, MissingDataErrorT} from "../../src"
import * as F from "../../src/core/optic"

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

describe("get", () => {
    it("should return Right when the specified data exists in the context.", () => {
        const result = pipe(
            ItemData.at(0),
            F.get<Context, Item>
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
            F.get<Context, Item>
        )(allItems)

        const error = pipe(
            result,
            E.swap,
            O.fromEither,
            O.toUndefined
        )

        expect(MissingDataErrorT.is(error)).toBeTruthy()

        if (MissingDataErrorT.is(error)) {
            expect(error.message).toBe("Failed to read the data.")
        }
    })

    it("should return an error with a custom message when the `show` argument is provided.", () => {
        const result = pipe(
            allItems,
            F.get<Context, Item>(
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
            expect(error.message).toBe("Failed to read the last user.")
        }
    })
})

describe("getOption", () => {
    it("should return Some when the specified data exists in the context.", () => {
        const result = pipe(
            ItemData.at(0),
            F.getOption<Context, Item>
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
            F.getOption<Context, Item>
        )(allItems)

        expect(O.isNone(result)).toBeTruthy()
    })
})

describe("replace", () => {
    it("should replace the focused element with the given data.", () => {
        const result = pipe(
            ItemData.at(0),
            F.replace<Context, Item>
        )({name: "new item"})(allItems)

        const names = pipe(
            result,
            O.fromEither,
            A.fromOption,
            A.flatMap(({items}) => items),
            A.map(({name}) => name)
        )

        expect(names).toMatchObject(["new item", "item2"])
    })

    it("should return MissingDataError when the specified data doesn't exist.", () => {
        const result = pipe(
            allItems,
            F.replace<Context, Item>(ItemData.at(2))({name: "new item"})
        )

        const error = pipe(
            result,
            E.swap,
            O.fromEither,
            O.toUndefined
        )

        expect(MissingDataErrorT.is(error)).toBeTruthy()

        if (MissingDataErrorT.is(error)) {
            expect(error.message).toBe("Failed to replace the data.")
        }
    })

    it("should return an error with a custom message when the `show` argument is provided.", () => {
        const result = pipe(
            allItems,
            F.replace<Context, Item>(
                ItemData.at(2),
                {
                    show: () => "the last user"
                }
            )({name: "new user"})
        )

        const error = pipe(
            result,
            E.swap,
            O.fromEither,
            O.toUndefined
        )

        expect(MissingDataErrorT.is(error)).toBeTruthy()

        if (MissingDataErrorT.is(error)) {
            expect(error.message).toBe("Failed to replace the last user.")
        }
    })
})

describe("modify", () => {
    it("should modify the focused element using the given function.", () => {
        const result = pipe(
            allItems,
            F.modify<Context, Item>(ItemData.at(0))(
                i => ({name: i.name.toUpperCase()})
            )
        )

        const names = pipe(
            result,
            O.fromEither,
            A.fromOption,
            A.flatMap(({items}) => items),
            A.map(({name}) => name)
        )

        expect(names).toMatchObject(["ITEM1", "item2"])
    })

    it("should return MissingDataError when the specified data doesn't exist.", () => {
        const result = pipe(
            allItems,
            F.modify<Context, Item>(ItemData.at(2))(
                i => ({name: i.name.toUpperCase()})
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
            expect(error.message).toBe("Failed to modify the data.")
        }
    })

    it("should return an error with a custom message when the `show` argument is provided.", () => {
        const result = pipe(
            allItems,
            F.modify<Context, Item>(
                ItemData.at(2),
                {
                    show: () => "the last user"
                }
            )(i => ({name: i.name.toUpperCase()}))
        )

        const error = pipe(
            result,
            E.swap,
            O.fromEither,
            O.toUndefined
        )

        expect(MissingDataErrorT.is(error)).toBeTruthy()

        if (MissingDataErrorT.is(error)) {
            expect(error.message).toBe("Failed to modify the last user.")
        }
    })
})
