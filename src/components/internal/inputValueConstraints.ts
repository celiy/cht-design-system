/**
 * The input value constraints module
 * This module is responsible for max-length clipping and regex accept filters of the project.
 */

/**
 * Whether `value` is allowed by `pattern`. Empty values always pass so the
 * field can be cleared. Invalid regex sources are treated as no filter.
 *
 * @param value Candidate string
 * @param pattern RegExp or source string
 * @returns True when the value may be kept
 */
export function matchesInputPattern(
    value: string,
    pattern: string | RegExp | null | undefined
): boolean {
    if (pattern == null || pattern === "") {
        return true;
    }

    if (value === "") {
        return true;
    }

    try {
        const re = pattern instanceof RegExp ? pattern : new RegExp(pattern);

        return re.test(value);
    } catch {
        return true;
    }
}

/**
 * Clips to `maxSize` then rejects values that fail `pattern` (returns `previous`).
 *
 * @param raw Incoming field value
 * @param previous Last accepted value
 * @param options Constraints
 * @returns Value to keep in the field
 */
export function constrainInputValue(
    raw: string,
    previous: string,
    options: { maxSize?: number | null; pattern?: string | RegExp | null }
): string {
    let value = raw;
    const maxSize = options.maxSize;

    if (maxSize != null && maxSize > 0 && value.length > maxSize) {
        value = value.slice(0, maxSize);
    }

    if (!matchesInputPattern(value, options.pattern)) {
        return previous;
    }

    return value;
}
