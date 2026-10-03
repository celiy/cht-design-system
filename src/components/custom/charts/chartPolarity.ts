/**
 * The chart polarity module
 * This module is responsible for the chart polarity of the project.
 */

export type PolarAmounts = {
    value: number;
    valueNegative: number;
};

/**
 * Creates an empty polar amounts
 * @returns {PolarAmounts} The empty polar amounts
 */
export function emptyPolar(): PolarAmounts {
    return { value: 0, valueNegative: 0 };
}

/**
 * Adds a point into running totals
 * @param {PolarAmounts} target The target
 * @param {number} value The value
 * @param {number | undefined} valueNegative The negative value
 * @returns {PolarAmounts} The target
 */
export function addPolar(
    target: PolarAmounts,
    value: number,
    valueNegative?: number
): PolarAmounts {
    target.value += value;
    target.valueNegative += valueNegative ?? 0;

    return target;
}

/**
 * Gets the positive amount
 * @param {number} value The value
 * @returns {number} The positive amount
 */
export function positiveAmount(value: number): number {
    return value > 0 ? value : 0;
}

/**
 * Gets the negative amount
 * @param {number} value The value
 * @param {number} valueNegative The negative value
 * @returns {number} The negative amount
 */
export function negativeAmount(value: number, valueNegative = 0): number {
    if (valueNegative > 0) {
        return valueNegative;
    }

    return value < 0 ? Math.abs(value) : 0;
}

/**
 * Scales a value
 * @param {number} value The value
 * @param {number} valueNegative The negative value
 * @returns {number} The scaled value
 */
export function polarScale(value: number, valueNegative = 0): number {
    return Math.max(Math.abs(value), valueNegative, 0);
}
