/**
 * Definitions of common types related to attribute.
 * @module
 */
import * as Optic from "@fp-ts/optic"
import {Optional} from "@fp-ts/optic"
import * as E from "fp-ts/Either"
import {Either} from "fp-ts/Either"
import {flow, pipe} from "fp-ts/function"
import {Reader} from "fp-ts/Reader"
import {Decoder} from "io-ts"
import {PathReporter} from "io-ts/PathReporter"
import {Focusable} from "../common"
import {AttributeAccessError, InvalidAttributeError, ReadOnlyAttributeError} from "./errors"

/**
 * Interface representing an attribute.
 *
 * @template TValue The type of the attribute value.
 * @template TContext The type of the context object.
 */
export interface Attribute<
    TValue = unknown,
    TContext = unknown
> {

    /**
     * The name of the attribute.
     *
     * @readonly
     */
    readonly name: string

    /**
     * Determines whether the attribute in the given context is updatable.
     *
     * @param {TContext} context The context to check for updatable capability.
     * @returns {boolean} `true` if the attribute is updatable, otherwise `false`.
     */
    isUpdatable(context: TContext): boolean

    /**
     * Retrieves the attribute value associated with the given context.
     *
     * @param {TContext} context The context from which to retrieve the value.
     * @return {Either<AttributeAccessError, TValue>} The result of the retrieval operation, which is either
     *  {@link AttributeAccessError} indicating a failure in accessing the attribute, or the attribute's value
     *  associated with the given context.
     */
    get(context: TContext): Either<AttributeAccessError, TValue>

    /**
     * Sets the value for the attribute in a given context and returns a new context.
     *
     * @param {TValue} value The value to set.
     * @return {Reader} A {@link Reader} that takes the context as input and returns either an error or
     *  the modified context. The possible error type is {@link AttributeAccessError},
     *  or {@link ReadOnlyAttributeError}.
     */
    set(value: TValue): Reader<
        TContext,
        Either<AttributeAccessError | ReadOnlyAttributeError, TContext>>

    /**
     * Sets the raw (unvalidated) value in the given context.
     *
     * @param {unknown} value The value to set.
     * @returns {Reader} A {@link Reader} that takes a context and returns either an error or the updated
     *  context with the modified attribute. The possible error type is {@link AttributeAccessError},
     *  {@link InvalidAttributeError}, or {@link ReadOnlyAttributeError}.
     */
    setRaw(value: unknown): Reader<
        TContext,
        Either<AttributeAccessError | InvalidAttributeError | ReadOnlyAttributeError, TContext>>

    /**
     * Modifies the attribute in a context using a given function that takes a value and returns a
     * modified value.
     *
     * @param {function} f The function that takes a value and returns a modified value.
     *                       The function should conform to the signature: `(value: TValue) => TValue`
     * @returns {Reader} A {@link Reader} that takes a context and returns either an error or the modified context.
     *  The possible error type is {@link AttributeAccessError}, or {@link ReadOnlyAttributeError}.
     */
    modify(f: (value: TValue) => TValue): Reader<
        TContext,
        Either<AttributeAccessError | ReadOnlyAttributeError, TContext>>

    /**
     * Modifies the attribute in a context using a given function that takes a value and returns an
     * unvalidated modified value.
     *
     * @param {function} f The function that takes a value and returns a raw modified value.
     *                       The function should conform to the signature: `(value: TValue) => TValue`
     * @returns {Reader} A {@link Reader} that takes a context and returns either an error or the modified context.
     *  The possible error type is {@link AttributeAccessError}, {@link InvalidAttributeError}, or
     *  {@link ReadOnlyAttributeError}.
     */
    modifyRaw(f: (value: TValue) => unknown): Reader<
        TContext,
        Either<AttributeAccessError | InvalidAttributeError | ReadOnlyAttributeError, TContext>>
}

/**
 * Represents the options for an attribute.
 *
 * @property {boolean} [updatable] Indicates whether the attribute is updatable.
 */
export type AttributeOptions = {
    readonly updatable?: boolean
}

/**
 * Represents an abstract attribute that can be used to access a specific property of data within a context.
 *
 * @template TName The name of the attribute, which should be a string and a valid key of TData.
 * @template TData The type of the data object that the attribute is associated with.
 * @template TContext The type of the context object that the attribute is used within.
 */
export abstract class AbstractAttribute<
    TName extends string & keyof TData,
    TData = unknown,
    TContext = unknown
> extends Focusable<TContext, TData[TName]> implements Attribute<TData[TName], TContext> {

    /**
     * Represents a decoder for converting unknown input into the corresponding typed data value.
     *
     * @readonly
     */
    protected readonly abstract decoder: Decoder<unknown, TData[TName]>

    private readonly updatable: boolean

    /**
     * Creates an instance of the attribute.
     *
     * @param {TName} name The name of the attribute.
     * @param {Optional<TContext, TData>} optic An {@link Optional} that focuses on TData
     *  in a given TContext.
     * @param {AttributeOptions} options Optional parameter for attribute options.
     */
    protected constructor(
        readonly name: TName,
        optic: Optional<TContext, TData>,
        options?: AttributeOptions
    ) {
        super(optic.compose(Optic.id<TData>().at(name)))

        this.updatable = options?.updatable ?? true

        // These methods are bound here to the instance to ensure that they maintain their "this" context
        // even when used as callbacks or passed to other functions. This is necessary because class methods
        // in JavaScript are not bound to the instance by default.
        this.get = this.get.bind(this)

        this.set = this.set.bind(this)
        this.setRaw = this.setRaw.bind(this)

        this.modify = this.modify.bind(this)
        this.modifyRaw = this.modifyRaw.bind(this)

        this.validate = this.validate.bind(this)

        this.isUpdatable = this.isUpdatable.bind(this)

        this.checkUpdatable = this.checkUpdatable.bind(this)
        this.toAttributeError = this.toAttributeError.bind(this)
    }

    // @ts-expect-error "context" might be needed in overridden methods.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isUpdatable(context: TContext): boolean {
        return this.updatable
    }

    private checkUpdatable(context: TContext): Either<ReadOnlyAttributeError, TContext> {
        return pipe(
            context,
            E.fromPredicate(c => this.isUpdatable(c), () => ({
                type: "ReadOnlyAttribute",
                message: `Cannot modify a read-only attribute "${this.name}".`
            }))
        )
    }

    private toAttributeError(e: readonly [Error, TContext]): AttributeAccessError {
        return ({
            type: "AttributeAccess",
            message: `Failed to access attribute "${this.name}": ${e[0].message}.`,
            details: e[0]
        })
    }

    get(context: TContext): Either<AttributeAccessError, TData[TName]> {

        return pipe(
            context,
            this.optic.getOptic,
            E.mapLeft(this.toAttributeError)
        )
    }

    /**
     * Validates a given value.
     *
     * @param {unknown} value The value to be validated.
     * @returns {Either<InvalidAttributeError, TData[TName]>} Either an error object or the validated value.
     */
    protected validate(value: unknown): Either<InvalidAttributeError, TData[TName]> {

        return pipe(
            value,
            this.decoder.decode,
            E.mapLeft(e => ({
                type: "InvalidAttribute",
                message: `Invalid value "${value}" specified for attribute "${this.name}".`,
                details: PathReporter.report(E.left(e))
            }))
        )
    }

    set(value: TData[TName]): Reader<
        TContext,
        Either<AttributeAccessError | ReadOnlyAttributeError, TContext>> {

        return flow(
            this.optic.setOptic(value),
            E.mapLeft(this.toAttributeError),
            E.chainW(this.checkUpdatable)
        )
    }

    setRaw(value: unknown): Reader<
        TContext,
        Either<AttributeAccessError | InvalidAttributeError | ReadOnlyAttributeError, TContext>> {

        return context => pipe(
            this.validate(value),
            E.chainW(v => pipe(context, this.set(v))),
            E.chainW(this.checkUpdatable)
        )
    }

    modify(f: (value: TData[TName]) => TData[TName]): Reader<
        TContext,
        Either<AttributeAccessError | ReadOnlyAttributeError, TContext>> {

        return (context: TContext) => pipe(
            this.get(context),
            E.map(f),
            E.chainW(v => this.set(v)(context)),
        )
    }

    modifyRaw(f: (value: TData[TName]) => unknown): Reader<
        TContext,
        Either<AttributeAccessError | InvalidAttributeError | ReadOnlyAttributeError, TContext>> {

        return context => pipe(
            this.get(context),
            E.map(f),
            E.chainW(this.validate),
            E.chainW(v => this.set(v)(context))
        )
    }
}
