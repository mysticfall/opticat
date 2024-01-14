import {Optional} from "@fp-ts/optic"
import {Either} from "fp-ts/Either"
import * as T from "io-ts"
import {NonNegativeInt} from "io-ts-numbers"
import {withMessage} from "io-ts-types"
import {AbstractAttribute} from "./attribute"
import {AttributeAccessError, InvalidAttributeError, ReadOnlyAttributeError} from "./errors"

export const Health = withMessage(
    NonNegativeInt,
    (i) => `Health should be a non-negative integer: ${i}.`
)

export type Health = T.TypeOf<typeof Health>

export const DamageableDataT = T.readonly(T.type({
    health: Health
}), "DamageableData")

export type DamageableData = {

    readonly health: Health
}

export interface Damageable<TContext = unknown> {

    readonly health: HealthAttribute<TContext>
}

export class HealthAttribute<TContext = unknown>
    extends AbstractAttribute<"health", DamageableData, TContext> {

    static readonly NAME = "health"

    protected readonly decoder = Health

    constructor(optic: Optional<TContext, DamageableData>) {
        super(HealthAttribute.NAME, optic)
    }
}

export function damage<TContext>(
    target: Damageable<TContext>,
    amount: Health
): (context: TContext) =>
    Either<AttributeAccessError | InvalidAttributeError | ReadOnlyAttributeError, TContext> {

    return target.health.modifyRaw(v => v - amount)
}
