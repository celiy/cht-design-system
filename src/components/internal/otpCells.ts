/**
 * The OTP cell sequence module
 * This module is responsible for advancing, deleting, compacting, and pasting OTP cell values of the project.
 */

import { matchesInputPattern } from "./inputValueConstraints.ts";

export type OtpField = {
    type: string;
    pattern?: string;
};

/**
 * @param fields Field list including separators
 * @returns Indexes of `type === "input"` entries
 */
export function otpInputFieldIndexes(fields: readonly OtpField[]): number[] {
    const indexes: number[] = [];

    for (let i = 0; i < fields.length; i += 1) {
        if (fields[i]?.type === "input") {
            indexes.push(i);
        }
    }

    return indexes;
}

/**
 * Splits a joined OTP string into `length` cells (clip or pad).
 *
 * @param text Joined value from `value` / `modelValue`
 * @param length Cell count
 */
export function cellsFromValue(text: string, length: number): string[] {
    const next: string[] = [];
    const chars = [...String(text ?? "")];

    for (let i = 0; i < length; i += 1) {
        next.push(chars[i] ?? "");
    }

    return next;
}

function sized(values: readonly string[], length: number): string[] {
    const next = values.slice(0, length);

    while (next.length < length) {
        next.push("");
    }

    return next;
}

/**
 * Writes one character at `index` (overwrite) and focuses the next cell.
 *
 * @param values Current cell strings
 * @param index Cell index
 * @param char Accepted character
 * @param length Cell count
 */
export function applyOtpChar(
    values: readonly string[],
    index: number,
    char: string,
    length: number
): { values: string[]; focus: number } {
    const next = sized(values, length);

    if (index < 0 || index >= length) {
        return { values: next, focus: Math.max(0, Math.min(index, length - 1)) };
    }

    next[index] = char;
    const focus = index < length - 1 ? index + 1 : index;

    return { values: next, focus };
}

/**
 * Backspace: if the cell has a value, drop it and shift later cells left;
 * always move focus to the previous cell when possible.
 *
 * @param values Current cell strings
 * @param index Focused cell
 * @param length Cell count
 */
export function applyOtpBackspace(
    values: readonly string[],
    index: number,
    length: number
): { values: string[]; focus: number } {
    const next = sized(values, length);
    const safeIndex = Math.max(0, Math.min(index, Math.max(length - 1, 0)));
    const focus = safeIndex > 0 ? safeIndex - 1 : 0;

    if (length === 0) {
        return { values: [], focus: 0 };
    }

    const current = next[safeIndex] ?? "";

    if (current !== "") {
        const compacted = [...next.slice(0, safeIndex), ...next.slice(safeIndex + 1), ""];

        return { values: compacted.slice(0, length), focus };
    }

    return { values: next, focus };
}

/**
 * Pastes characters from `index` onward, skipping chars that fail that cell's pattern.
 * Focus moves to the cell after the last written one, or stays on the last cell if full.
 *
 * @param values Current cell strings
 * @param index Start cell
 * @param text Clipboard text
 * @param patterns Per-cell pattern
 */
export function applyOtpPaste(
    values: readonly string[],
    index: number,
    text: string,
    patterns: readonly (string | RegExp | null | undefined)[]
): { values: string[]; focus: number } {
    const length = patterns.length;
    const next = sized(values, length);

    if (length === 0) {
        return { values: [], focus: 0 };
    }

    let cursor = Math.max(0, Math.min(index, length - 1));
    let lastWritten = cursor;

    for (const char of text) {
        if (cursor >= length) {
            break;
        }

        const pattern = patterns[cursor];

        if (!matchesInputPattern(char, pattern) || char === "") {
            continue;
        }

        next[cursor] = char;
        lastWritten = cursor;
        cursor += 1;
    }

    const focus = cursor < length ? cursor : lastWritten;

    return { values: next, focus };
}
