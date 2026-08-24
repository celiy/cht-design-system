export const CHART_COLORS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"] as const;

export type ChartColor = (typeof CHART_COLORS)[number];

/**
 * CSS custom property for a chart palette token.
 *
 * @param color Palette key such as `"chart-3"`
 * @returns `var(--color-chart-n)`
 */
export function chartColorCssVar(color: ChartColor): string {
    return `var(--color-${color})`;
}

/**
 * Tailwind background classes for a chart palette token.
 *
 * @param color Palette key
 * @returns Class map for `:class`
 */
export function chartColorBgClass(color: ChartColor): Record<string, boolean> {
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
export function chartColorBorderClass(color: ChartColor): Record<string, boolean> {
    return {
        "border-chart-1!": color === "chart-1",
        "border-chart-2!": color === "chart-2",
        "border-chart-3!": color === "chart-3",
        "border-chart-4!": color === "chart-4",
        "border-chart-5!": color === "chart-5"
    };
}
