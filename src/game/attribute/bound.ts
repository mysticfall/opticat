/**
 * Definitions of common types related to bound attribute.
 * @module
 */
import {Optional} from "@fp-ts/optic"
import * as E from "fp-ts/Either"
import {Either} from "fp-ts/Either"
import {pipe} from "fp-ts/function"
import * as O from "fp-ts/Option"
import {Option} from "fp-ts/Option"
import {Ord} from "fp-ts/Ord"
import {clamp, Range} from "../../common"
import {AbstractAttribute, Attribute, AttributeOptions} from "./attribute"
import {AttributeAccessError, ReadOnlyAttributeError} from "./errors"

/**
 * Represents an attribute whose value is bound between a specific range.
 *
 * @template TValue The type of the attribute value.
 * @template TContext The type of the context object.
 */
export interface BoundAttribute<TContext = unknown, TValue = unknown>
    extends Attribute<TContext, TValue> {

    /**
     * Retrieves the range associated with the given context.
     *
     * @param {TContext} context The context to retrieve the range from.
     * @returns {Option<Range<TValue>>} An optional range associated with the given context.
     */
    getRange(context: TContext): Option<Range<TValue>>
}

/**
 * Represents the options for a bound attribute.
 *
 * @template T The type of value for the attribute.
 * @property {Range<T>} range The range of valid values for the attribute.
 */
export type BoundAttributeOptions<T> = {
    range?: Range<T>
} & AttributeOptions

/**
 * Represents an abstract bound attribute that can be used to access a specific property
 * of data within a context.
 *
 * @template TName The type of the attribute name, which should be a string and a key of TData.
 * @template TData The type of the data associated with the attribute.
 * @template TContext The type of the context in which the attribute is used.
 */
export abstract class AbstractBoundAttribute<
    TName extends string & keyof TData,
    TData = unknown,
    TContext = unknown
> extends AbstractAttribute<TName, TData, TContext>
    implements BoundAttribute<TData[TName], TContext> {

    /**
     * Represents the order by which to compare attribute's potential values.
     *
     * @readonly
     */
    protected abstract readonly ord: Ord<TData[TName]>

    private readonly range: Option<Range<TData[TName]>>

    protected constructor(
        name: TName,
        optic: Optional<TContext, TData>,
        options?: AttributeOptions & BoundAttributeOptions<TData[TName]>
    ) {
        super(name, optic, options)

        this.range = pipe(options?.range, O.fromNullable)
    }

    /**
     * Retrieves the range from the specified context. It defaults to the range option specified
     * in the constructor argument.
     *
     * @param {TContext} context The context from which to retrieve the range.
     * @return {Option<Range<TData[TName]>>} The retrieved range, if available.
     */
    // @ts-expect-error "context" might be needed in overridden methods.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getRange(context: TContext): Option<Range<TData[TName]>> {
        return this.range
    }

    override get(context: TContext): Either<AttributeAccessError, TData[TName]> {

        return pipe(
            super.get(context),
            E.map(v => pipe(
                this.getRange(context),
                O.map(r => clamp(r, this.ord)(v)),
                O.getOrElse(() => v)
            ))
        )
    }

    override set(value: TData[TName]): (context: TContext) =>
        Either<AttributeAccessError | ReadOnlyAttributeError, TContext> {

        return context => pipe(
            this.getRange(context),
            O.map(r => clamp(r, this.ord)(value)),
            O.getOrElse(() => value),
            v => super.set(v)(context)
        )
    }
}
