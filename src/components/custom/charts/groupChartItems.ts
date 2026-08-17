import { monthNamesLong, monthNamesShort } from "@shared/constants/DateStrings";

export type ChartItem = {
    value: number;
    date?: Date;
    group?: string;
};

export type ChartSeries = {
    label: string;
    color?: string;
    displayAs: "currency" | "sum";
    items: ChartItem[];
};

export type ChartPoint = {
    value: number;
    label: string;
    dateLong: string;
    dateShort: string;
    date?: Date;
};

/**
 * True when any item carries a `group` key, which selects generic grouping
 * instead of date sorting.
 *
 * @param items Chart value items
 * @returns True when group mode should be used
 */
export function chartUsesGroups(items: ChartItem[]): boolean {
    return items.some((item) => typeof item.group === "string" && item.group.length > 0);
}

/**
 * Aggregate values by group. Keys are case-insensitive; the first-seen label
 * and first-seen order are preserved.
 *
 * @param items Chart value items
 * @param seriesLabel Series name copied onto each point
 * @returns Aggregated points in first-appearance order
 */
export function groupChartItems(items: ChartItem[], seriesLabel: string): ChartPoint[] {
    const grouped = new Map<string, { label: string; value: number }>();
    const order: string[] = [];

    for (const item of items) {
        const raw = item.group ?? "";
        const key = raw.toLowerCase();

        if (!grouped.has(key)) {
            grouped.set(key, { label: raw, value: 0 });
            order.push(key);
        }

        const entry = grouped.get(key);

        if (!entry) {
            continue;
        }

        entry.value += item.value;
    }

    return order.map((key) => {
        const entry = grouped.get(key);
        const label = entry?.label ?? key;

        return {
            value: entry?.value ?? 0,
            label: seriesLabel,
            dateLong: label,
            dateShort: label
        };
    });
}

/**
 * Aggregate values by calendar month and sort chronologically.
 *
 * @param items Chart value items
 * @param seriesLabel Series name copied onto each point
 * @returns Aggregated monthly points
 */
export function groupChartItemsByDate(items: ChartItem[], seriesLabel: string): ChartPoint[] {
    const grouped = new Map<string, number>();

    for (const item of items) {
        if (item.date == null) {
            continue;
        }

        const date = new Date(item.date);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const currentValue = grouped.get(key) ?? 0;

        grouped.set(key, currentValue + item.value);
    }

    return [...grouped.entries()]
        .sort((a, b) => {
            const aParts = a[0].split("-");
            const bParts = b[0].split("-");
            const aYear = Number(aParts[0] ?? 0);
            const aMonth = Number(aParts[1] ?? 0);
            const bYear = Number(bParts[0] ?? 0);
            const bMonth = Number(bParts[1] ?? 0);

            return new Date(aYear, aMonth).getTime() - new Date(bYear, bMonth).getTime();
        })
        .map(([key, value]) => {
            const parts = key.split("-");
            const month = Number(parts[1] ?? 0);
            const monthIndex = Math.min(Math.max(month, 0), 11);

            return {
                dateLong: monthNamesLong[monthIndex] ?? "",
                dateShort: monthNamesShort[monthIndex] ?? "",
                value,
                label: seriesLabel
            };
        });
}
