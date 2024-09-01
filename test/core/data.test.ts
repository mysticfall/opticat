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

class ItemData implements DataDriven<Context, Item> {

    readonly codec = ItemT

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
        title: "item2" // Invalid item.
    }]
} as Context

describe("findData", () => {
    it("should return Right(Some) when the specified data exists in the context.", () => {
        const result = pipe(
            ItemData.at(0),
            findData<Context, Item>
        )(allItems)

        const name = pipe(
            result,
            O.fromEither,
            O.flatten,
            O.map(({name}) => name),
            O.toUndefined
        )

        expect(name).toBe("item1")
    })

    it("should return Right(None) when the specified data exists in the context.", () => {
        const result = pipe(
            ItemData.at(2),
            findData<Context, Item>
        )(allItems)

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
            allItems,
            findData<Context, Item>(ItemData.at(1)),
            E.swap,
            O.fromEither,
            O.toUndefined
        )

        expect(InvalidDataErrorT.is(error)).toBeTruthy()

        if (InvalidDataErrorT.is(error)) {
            expect(error.decoder).toBe(ItemT)

            expect(error.message).toSatisfy(
                (m: string) => m.startsWith("Invalid value undefined supplied to")
            )
        }
    })

    it("should return InvalidDataError with a custom message when the Show argument is provided.", () => {
        const error = pipe(
            allItems,
            findData<Context, Item>(
                ItemData.at(1),
                {
                    show: () => "the second item"
                }
            ),
            E.swap,
            O.fromEither,
            O.toUndefined
        )

        expect(InvalidDataErrorT.is(error)).toBeTruthy()

        if (InvalidDataErrorT.is(error)) {
            expect(error.decoder).toBe(ItemT)
            expect(error.message).toSatisfy((m: string) => m.startsWith("Invalid data for the second item"))
        }
    })
})

describe("getData", () => {

    it("should return the associated data when it exists.", () => {
        const result = pipe(
            ItemData.at(0),
            getData<Context, Item>
        )(allItems)

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
            allItems,
            getData<Context, Item>(ItemData.at(2)),
            E.swap,
            O.fromEither,
            O.toUndefined
        )

        expect(MissingDataErrorT.is(error)).toBeTruthy()

        if (MissingDataErrorT.is(error)) {
            expect(error.message).toSatisfy(
                (m: string) => m.startsWith("The associated data could not be found")
            )
        }
    })

    it("should return MissingDataError with a custom message when the Show argument is provided.", () => {
        const error = pipe(
            allItems,
            getData<Context, Item>(
                ItemData.at(2),
                {
                    show: () => "the last item"
                }
            ),
            E.swap,
            O.fromEither,
            O.toUndefined
        )

        expect(MissingDataErrorT.is(error)).toBeTruthy()

        if (MissingDataErrorT.is(error)) {
            expect(error.message).toSatisfy((m: string) => m.startsWith(
                "The data associated with the last item could not be found")
            )
        }
    })

    it("should return InvalidDataError when the specified data is invalid.", () => {
        const error = pipe(
            allItems,
            getData<Context, Item>(ItemData.at(1)),
            E.swap,
            O.fromEither,
            O.toUndefined
        )

        expect(InvalidDataErrorT.is(error)).toBeTruthy()

        if (InvalidDataErrorT.is(error)) {
            expect(error.decoder).toBe(ItemT)

            expect(error.message).toSatisfy(
                (m: string) => m.startsWith("Invalid value undefined supplied to")
            )
        }
    })

    it("should return InvalidDataError with a custom message when the Show argument is provided.", () => {
        const error = pipe(
            allItems,
            getData<Context, Item>(
                ItemData.at(1),
                {
                    show: () => "the second item"
                }
            ),
            E.swap,
            O.fromEither,
            O.toUndefined
        )

        expect(InvalidDataErrorT.is(error)).toBeTruthy()

        if (InvalidDataErrorT.is(error)) {
            expect(error.decoder).toBe(ItemT)

            expect(error.message).toSatisfy(
                (m: string) => m.startsWith("Invalid data for the second item")
            )
        }
    })
})
