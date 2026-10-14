/**
 * The chart model module
 * This module is responsible for turning chart series into aligned categories, stacks and scales of the project.
 */

import { CHART_COLORS } from "./chartColors.ts";

export type ChartDisplayAs = "currency" | "sum";

/** How dated items are bucketed into categories. */
export type ChartBucket = "month" | "day";

/** `none`: series side by side (bars) or overlapping (wave); `stacked`: summed; `expanded`: share of 100%. */
export type ChartStack = "none" | "stacked" | "expanded";

/** Time window kept from the last dated category (`all` keeps everything). */
export type ChartRange = "all" | "3m" | "1m" | "2s" | "7d";

export type ChartItem = {
    value: number;
    /** Places the item on a time axis (bucketed by month or day). */
    date?: Date | string | number;
    /** Places the item on a category axis, in first-seen order (case-insensitive). */
    group?: string;
    /** Theme/Tailwind token that overrides the series color for this item. */
    color?: string;
    /** Stable id forwarded to click events. */
    id?: string;
    /** Draws the item with a dashed outline (bars). */
    highlight?: boolean;
};

export type ChartSeries = {
    /** Stable key; defaults to `label`. */
    key?: string;
    label: string;
    /** Theme/Tailwind token (`chart-1`, `green-500`, `success`, ...). */
    color?: string;
    displayAs?: ChartDisplayAs;
    items: ChartItem[];
};

/** One series, or several drawn together (side by side, overlapping or stacked). */
export type ChartData = ChartSeries | ChartSeries[];

export type ChartCategory = {
    key: string;
    short: string;
    long: string;
    /** Bucket start for dated categories. */
    time?: number;
};

export type ChartCell = {
    value: number;
    /** False when the series has no item in this category. */
    present: boolean;
    color?: string;
    id?: string;
    highlight: boolean;
};

export type ChartModelSeries = {
    key: string;
    label: string;
    color: string;
    displayAs: ChartDisplayAs;
    cells: ChartCell[];
};

export type ChartModel = {
    categories: ChartCategory[];
    series: ChartModelSeries[];
};

/** Extent of one cell along the value axis after stacking. */
export type ChartSpan = {
    start: number;
    end: number;
};

export type ChartDomain = {
    min: number;
    max: number;
};

const RANGE_DAYS: Record<Exclude<ChartRange, "all" | "3m" | "1m">, number> = {
    "2s": 14,
    "7d": 7
};

/**
 * Wraps a single series into a list.
 * @param data One series, a list or nothing
 * @returns The series list
 */
export function normalizeChartData(data: ChartData | null | undefined): ChartSeries[] {
    if (!data) {
        return [];
    }

    return Array.isArray(data) ? data : [data];
}

/**
 * Whether the items use `group` (category axis) instead of `date` (time axis).
 * @param data The chart data
 * @returns True when any item has a group
 */
export function chartUsesGroups(data: ChartData | null | undefined): boolean {
    return normalizeChartData(data).some((series) =>
        series.items.some((item) => typeof item.group === "string" && item.group.length > 0)
    );
}

/**
 * Color of a series: its own token, otherwise `base` for the first series and the next
 * chart palette entries for the others.
 * @param index Series index
 * @param explicit Token set on the series
 * @param base Token used by the first series
 * @returns The color token
 */
export function seriesColor(index: number, explicit: string | undefined, base = "chart-3"): string {
    if (explicit) {
        return explicit;
    }

    if (index === 0) {
        return base;
    }

    const start = Math.max(0, (CHART_COLORS as readonly string[]).indexOf(base));

    return CHART_COLORS[(start + index) % CHART_COLORS.length] ?? base;
}

function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function monthShort(date: Date): string {
    const raw = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date);

    return capitalize(raw.replace(".", ""));
}

function monthLong(date: Date): string {
    return capitalize(new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(date));
}

function dateCategory(raw: Date | string | number, bucket: ChartBucket): ChartCategory | null {
    const date = new Date(raw);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    const year = date.getFullYear();
    const month = date.getMonth();

    if (bucket === "month") {
        return {
            key: `${year}-${month}`,
            short: monthShort(date),
            long: `${monthLong(date)} ${year}`,
            time: new Date(year, month, 1).getTime()
        };
    }

    const day = date.getDate();

    return {
        key: `${year}-${month}-${day}`,
        short: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        long: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
        time: new Date(year, month, day).getTime()
    };
}

function categoryOf(item: ChartItem, useGroups: boolean, bucket: ChartBucket): ChartCategory | null {
    if (useGroups) {
        const label = item.group ?? "";

        return label ? { key: label.toLowerCase(), short: label, long: label } : null;
    }

    return item.date == null ? null : dateCategory(item.date, bucket);
}

/**
 * Builds the aligned model: one shared category list and, per series, one cell per
 * category (values summed when several items fall in the same category).
 * @param data The chart data
 * @param options Bucket for dated items and the color of the first series
 * @returns The chart model
 */
export function buildChartModel(
    data: ChartData | null | undefined,
    options: { bucket?: ChartBucket; color?: string } = {}
): ChartModel {
    const list = normalizeChartData(data);
    const useGroups = chartUsesGroups(list);
    const bucket = options.bucket ?? "month";
    const categories = new Map<string, ChartCategory>();
    const sums = list.map(() => new Map<string, ChartCell>());

    list.forEach((series, seriesIndex) => {
        const cells = sums[seriesIndex];

        for (const item of series.items) {
            const category = categoryOf(item, useGroups, bucket);

            if (!category || !cells) {
                continue;
            }

            if (!categories.has(category.key)) {
                categories.set(category.key, category);
            }

            const cell = cells.get(category.key);

            if (!cell) {
                cells.set(category.key, {
                    value: Number(item.value) || 0,
                    present: true,
                    color: item.color,
                    id: item.id,
                    highlight: Boolean(item.highlight)
                });
                continue;
            }

            cell.value += Number(item.value) || 0;
            cell.color ??= item.color;
            cell.id ??= item.id;
            cell.highlight ||= Boolean(item.highlight);
        }
    });

    let ordered = [...categories.values()];

    if (!useGroups) {
        ordered.sort((a, b) => (a.time ?? 0) - (b.time ?? 0));

        const years = new Set(ordered.map((category) => new Date(category.time ?? 0).getFullYear()));

        if (bucket === "month" && years.size > 1) {
            ordered = ordered.map((category) => ({
                ...category,
                short: `${category.short}/${String(new Date(category.time ?? 0).getFullYear()).slice(-2)}`
            }));
        }
    }

    return {
        categories: ordered,
        series: list.map((series, index) => ({
            key: series.key ?? series.label ?? `series-${index}`,
            label: series.label,
            color: seriesColor(index, series.color, options.color),
            displayAs: series.displayAs ?? "sum",
            cells: ordered.map(
                (category) =>
                    sums[index]?.get(category.key) ?? { value: 0, present: false, highlight: false }
            )
        }))
    };
}

/**
 * Stacks the model. Positive and negative values stack apart (diverging), so negatives grow
 * down from zero. `expanded` turns each category into shares of its absolute total.
 * @param model The chart model
 * @param stack The stack mode
 * @returns Spans indexed by series, then category
 */
export function stackSpans(model: ChartModel, stack: ChartStack): ChartSpan[][] {
    if (stack === "none") {
        return model.series.map((series) =>
            series.cells.map((cell) => ({ start: 0, end: cell.value }))
        );
    }

    const spans: ChartSpan[][] = model.series.map(() => []);

    model.categories.forEach((_, categoryIndex) => {
        let positive = 0;
        let negative = 0;

        model.series.forEach((series, seriesIndex) => {
            const value = series.cells[categoryIndex]?.value ?? 0;
            const column = spans[seriesIndex];

            if (!column) {
                return;
            }

            if (value >= 0) {
                column.push({ start: positive, end: positive + value });
                positive += value;
            } else {
                column.push({ start: negative, end: negative + value });
                negative += value;
            }
        });

        const total = positive - negative;

        if (stack !== "expanded") {
            return;
        }

        for (const column of spans) {
            const span = column[categoryIndex];

            if (span) {
                span.start = total === 0 ? 0 : span.start / total;
                span.end = total === 0 ? 0 : span.end / total;
            }
        }
    });

    return spans;
}

/**
 * Value range covering every span and zero. Never empty.
 * @param spans Spans by series
 * @param indexes Category indexes to consider (all when omitted)
 * @returns The domain
 */
export function spanDomain(spans: ChartSpan[][], indexes?: number[]): ChartDomain {
    let min = 0;
    let max = 0;

    for (const column of spans) {
        const picked = indexes ? indexes.map((index) => column[index]) : column;

        for (const span of picked) {
            if (!span) {
                continue;
            }

            min = Math.min(min, span.start, span.end);
            max = Math.max(max, span.start, span.end);
        }
    }

    return max === min ? { min, max: min + 1 } : { min, max };
}

/**
 * Position of a value inside the domain, from 0 (min) to 1 (max).
 * @param value The value
 * @param domain The domain
 * @returns The ratio
 */
export function domainRatio(value: number, domain: ChartDomain): number {
    return (value - domain.min) / (domain.max - domain.min);
}

/**
 * Formats a value for tooltips and labels.
 * @param value The value
 * @param displayAs Currency or plain number
 * @returns The formatted value
 */
export function formatChartValue(value: number, displayAs: ChartDisplayAs = "sum"): string {
    if (displayAs === "currency") {
        return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    return value.toLocaleString("pt-BR");
}

/**
 * Picks at most `max` indexes spread evenly over `total`, always keeping the ends.
 * @param total Number of items
 * @param max Maximum to keep
 * @returns The kept indexes, ascending
 */
export function evenlySpacedIndexes(total: number, max: number): number[] {
    if (total <= 0) {
        return [];
    }

    if (total <= max) {
        return Array.from({ length: total }, (_, index) => index);
    }

    if (max < 2) {
        return [total - 1];
    }

    const picked = new Set<number>([0, total - 1]);
    const step = (total - 1) / (max - 1);

    for (let index = 1; index < max - 1; index += 1) {
        picked.add(Math.round(index * step));
    }

    return [...picked].sort((a, b) => a - b);
}

/**
 * Indexes of the dated categories inside the range, counted back from the last one.
 * Categories without a time (groups) are always kept.
 * @param categories The categories
 * @param range The range
 * @returns The kept indexes
 */
export function categoriesInRange(categories: ChartCategory[], range: ChartRange): number[] {
    const all = categories.map((_, index) => index);
    const last = categories[categories.length - 1];

    if (range === "all" || last?.time == null) {
        return all;
    }

    const start = new Date(last.time);

    if (range === "3m" || range === "1m") {
        start.setMonth(start.getMonth() - (range === "3m" ? 3 : 1));
    } else {
        start.setDate(start.getDate() - RANGE_DAYS[range]);
    }

    return all.filter((index) => (categories[index]?.time ?? 0) >= start.getTime());
}
