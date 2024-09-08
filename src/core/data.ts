/**
 * Definitions of common types related to handling game data.
 * @module
 */
import {ReadonlyRecord} from "fp-ts/ReadonlyRecord"
import {Focusable} from "./optic"
import {Typed} from "./type"

/**
 * Represents a data-driven subject with an optic and a codec.
 *
 * The `DataDriven` interface is a generic interface that defines a data-driven subject.
 * It consists of two readonly properties: `optic` and `codec`.
 *
 * The `optic` property represents an optic that allows for traversal and manipulation of data within a given context.
 * It is of type `Optional<TContext, TData>`, indicating that it is an optional traversal that might not always succeed.
 *
 * The `codec` property represents a type that specifies the encoding/decoding rules for the data.
 * It is of type `Typed<TData>`, indicating that it is a type that describes the structure and behaviour of the data.
 *
 * @template TContext The type of the context in which the data resides.
 * @template TData The type of the data.
 */
export type DataDriven<TContext, TData> = Typed<TData> & Focusable<TContext, TData>

/**
 * Represents a container for data organized by a specific name and keyed entries.
 *
 * @template TName The name or category under which the data is organized.
 * @template TKey The key type used for identifying individual data entries.
 * @template TData The type of data being stored. Defaults to `unknown`.
 *
 * @property {ReadonlyRecord<TKey, TData>} [TName]
 *  The main property of the DataContainer, where the key is of type TName and the value is a
 *  {@link ReadonlyRecord} that maps `TKey` to `TData`.
 */
export type DataContainer<TName extends string, TKey extends string, TData = unknown> = {

    readonly [key in TName]: ReadonlyRecord<TKey, TData>
}

/**
 * Represents an object that holds metadata of a specific type.
 *
 * @template T The type of metadata held by this object.
 */
export interface MetadataHolder<T> {

    readonly metadata: T
}
