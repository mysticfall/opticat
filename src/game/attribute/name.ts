/**
 * Definitions of common types related to name.
 * @module
 */
import {Optional} from "@fp-ts/optic"
import * as T from "io-ts"
import {Decoder, Mixed} from "io-ts"
import {AbstractAttribute} from "./attribute"

/**
 * Represents the validation rules for {@link NamedData}.
 */
export const NamedDataT = (type: Mixed) => T.readonly(T.type({
    name: type
}), "NamedData")

/**
 * Represents an object data with a name.
 *
 * @template TName The type of the name property.
 */
export type NamedData<TName extends string = string> = {

    readonly name: TName
}

/**
 * Represents an object with a name.
 *
 * @template TName The type of the name attribute.
 * @template TData The type of the named object.
 * @template TContext The type of context associated with the named object.
 */
export interface Named<
    TName extends string = unknown & string,
    TData extends NamedData<TName> = unknown & NamedData<TName>,
    TContext = unknown
> {

    /**
     * The name attribute of the object.
     *
     * @readonly
     */
    readonly name: NameAttribute<TName, TData, TContext>
}

/**
 * An attribute that represents a name.
 *
 * @template TName The type of the name.
 * @template TData The type of the data associated with the name.
 * @template TContext The type of the context in which the named object exists.
 */
export class NameAttribute<
    TName extends string = unknown & string,
    TData extends NamedData<TName> = unknown & NamedData<TName>,
    TContext = unknown
> extends AbstractAttribute<"name", TData, TContext> {

    /**
     * The constant for the key for a name attribute in data.
     */
    static readonly NAME = "name"

    /**
     * Creates an instance the attribute.
     *
     * @param {Optional<TContext, TData>} optic An {@link Optional} that focuses on TData
     *  in a given TContext.
     * @param {Decoder<unknown, TName>} decoder Represents a decoder for converting unknown input into the
     *  corresponding data value typed as TName.
     */
    constructor(
        optic: Optional<TContext, TData>,
        protected readonly decoder: Decoder<unknown, TName>
    ) {
        super(NameAttribute.NAME, optic)
    }
}
