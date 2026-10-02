export type PolarAmounts = {
    value: number;
    valueNegative: number;
};

export function emptyPolar(): PolarAmounts {
    return { value: 0, valueNegative: 0 };
}

/** Fold a point into running totals. `valueNegative` is the down-bar; `value` stays signed or up-bar. */
export function addPolar(
    target: PolarAmounts,
    value: number,
    valueNegative?: number
): PolarAmounts {
    target.value += value;
    target.valueNegative += valueNegative ?? 0;

    return target;
}

export function positiveAmount(value: number): number {
    return value > 0 ? value : 0;
}

export function negativeAmount(value: number, valueNegative = 0): number {
    if (valueNegative > 0) {
        return valueNegative;
    }

    return value < 0 ? Math.abs(value) : 0;
}

export function polarScale(value: number, valueNegative = 0): number {
    return Math.max(Math.abs(value), valueNegative, 0);
}
