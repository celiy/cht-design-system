export const CHART_COLORS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"] as const;

export type ChartColor = (typeof CHART_COLORS)[number];

/**
 * CSS custom property for a color token (`chart-3`, `green-500`, `success`, …).
 *
 * @param color Token name without the `--color-` prefix
 * @returns `var(--color-…)`
 */
export function chartColorCssVar(color: string): string {
    return `var(--color-${color})`;
}

/**
 * Solid color along a series: index 0 is `color`, last index is `colorEnd`,
 * in-between bars mix the two (oklab). Tokens stay as CSS vars.
 */
export function chartMixCss(
    color: string,
    colorEnd: string | undefined,
    index: number,
    total: number
): string {
    const start = chartColorCssVar(color);

    if (!colorEnd || total <= 1 || index <= 0) {
        return start;
    }

    if (index >= total - 1) {
        return chartColorCssVar(colorEnd);
    }

    const t = index / (total - 1);
    const startPct = Number(((1 - t) * 100).toFixed(4));

    return `color-mix(in oklab, ${start} ${startPct}%, ${chartColorCssVar(colorEnd)})`;
}

/**
 * Inline background paint for bar fills (works with any theme token).
 */
export function chartPaintStyle(
    color: string,
    colorEnd?: string,
    index = 0,
    total = 1
): { backgroundColor: string } {
    return { backgroundColor: chartMixCss(color, colorEnd, index, total) };
}

/**
 * Tailwind background classes for a chart palette token.
 *
 * @param color Palette key
 * @returns Class map for `:class`
 */
export function chartColorBgClass(color: string): Record<string, boolean> {
    return {
        "bg-chart-1": color === "chart-1",
        "bg-chart-2": color === "chart-2",
        "bg-chart-3": color === "chart-3",
        "bg-chart-4": color === "chart-4",
        "bg-chart-5": color === "chart-5"
    };
}

/**
 * Tailwind border classes for a chart palette token.
 *
 * @param color Palette key
 * @returns Class map for `:class`
 */
export function chartColorBorderClass(color: string): Record<string, boolean> {
    return {
        "border-chart-1!": color === "chart-1",
        "border-chart-2!": color === "chart-2",
        "border-chart-3!": color === "chart-3",
        "border-chart-4!": color === "chart-4",
        "border-chart-5!": color === "chart-5"
    };
}
