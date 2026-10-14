/**
 * The chart paths module
 * This module is responsible for building SVG line and area paths for each curve type of the project.
 */

/** `smooth`: monotone cubic (never overshoots the data); `linear`: straight segments; `step`: steps at mid-points. */
export type ChartCurve = "smooth" | "linear" | "step";

export type PlotPoint = {
    x: number;
    y: number;
};

function linearSegments(points: PlotPoint[]): string {
    return points
        .slice(1)
        .map((point) => ` L ${point.x} ${point.y}`)
        .join("");
}

function stepSegments(points: PlotPoint[]): string {
    let d = "";

    for (let index = 1; index < points.length; index += 1) {
        const previous = points[index - 1];
        const current = points[index];

        if (!previous || !current) {
            continue;
        }

        const mid = (previous.x + current.x) / 2;

        d += ` L ${mid} ${previous.y} L ${mid} ${current.y} L ${current.x} ${current.y}`;
    }

    return d;
}

/**
 * Monotone cubic (Fritsch-Carlson). Symmetric, so a reversed point list draws the same
 * curve backwards, which lets areas close along a stacked lower edge.
 */
function smoothSegments(points: PlotPoint[]): string {
    const count = points.length - 1;
    const slopes: number[] = [];
    const tangents: number[] = [];

    for (let index = 0; index < count; index += 1) {
        const current = points[index];
        const next = points[index + 1];
        const dx = current && next ? next.x - current.x : 0;

        slopes.push(current && next && dx !== 0 ? (next.y - current.y) / dx : 0);
    }

    for (let index = 0; index <= count; index += 1) {
        const before = slopes[index - 1];
        const after = slopes[index];

        if (before === undefined || after === undefined) {
            tangents.push(before ?? after ?? 0);
            continue;
        }

        tangents.push(
            before === 0 || after === 0 || Math.sign(before) !== Math.sign(after)
                ? 0
                : (2 * before * after) / (before + after)
        );
    }

    let d = "";

    for (let index = 0; index < count; index += 1) {
        const current = points[index];
        const next = points[index + 1];

        if (!current || !next) {
            continue;
        }

        const dx = next.x - current.x;
        const c1y = current.y + ((tangents[index] ?? 0) * dx) / 3;
        const c2y = next.y - ((tangents[index + 1] ?? 0) * dx) / 3;

        d += ` C ${current.x + dx / 3} ${c1y} ${next.x - dx / 3} ${c2y} ${next.x} ${next.y}`;
    }

    return d;
}

function segments(points: PlotPoint[], curve: ChartCurve): string {
    if (curve === "linear") {
        return linearSegments(points);
    }

    if (curve === "step") {
        return stepSegments(points);
    }

    return smoothSegments(points);
}

/**
 * Open path through the points.
 * @param points Points in plot units
 * @param curve The curve type
 * @returns The SVG path
 */
export function linePath(points: PlotPoint[], curve: ChartCurve): string {
    const first = points[0];

    if (!first) {
        return "";
    }

    return `M ${first.x} ${first.y}${segments(points, curve)}`;
}

/**
 * Closed area between an upper and a lower edge (same x positions), both drawn with the
 * same curve so stacked layers share their borders exactly.
 * @param upper Upper edge, left to right
 * @param lower Lower edge, left to right
 * @param curve The curve type
 * @returns The SVG path
 */
export function areaPath(upper: PlotPoint[], lower: PlotPoint[], curve: ChartCurve): string {
    const top = linePath(upper, curve);
    const reversed = [...lower].reverse();
    const start = reversed[0];

    if (!top || !start) {
        return "";
    }

    return `${top} L ${start.x} ${start.y}${segments(reversed, curve)} Z`;
}
