/**
 * Check: chart model (alignment, stacking, domain, ranges) and curve paths.
 * Run: node cht-design-system/src/components/custom/charts/chartModel.check.mjs
 */
import assert from "node:assert/strict";
import {
    buildChartModel,
    categoriesInRange,
    chartUsesGroups,
    evenlySpacedIndexes,
    formatChartValue,
    seriesColor,
    spanDomain,
    stackSpans
} from "./chartModel.ts";
import { areaPath, linePath } from "./chartPaths.ts";

// Groups: case-insensitive, first-seen order, summed, aligned across series.
const grouped = buildChartModel([
    {
        label: "Desktop",
        items: [
            { group: "Chrome", value: 10 },
            { group: "Safari", value: 5 },
            { group: "chrome", value: 2 }
        ]
    },
    { label: "Mobile", items: [{ group: "Safari", value: 7, highlight: true }] }
]);

assert.deepEqual(
    grouped.categories.map((category) => category.short),
    ["Chrome", "Safari"]
);
assert.equal(grouped.series[0]?.cells[0]?.value, 12);
assert.equal(grouped.series[1]?.cells[0]?.present, false);
assert.equal(grouped.series[1]?.cells[1]?.highlight, true);
assert.equal(chartUsesGroups({ label: "x", items: [{ value: 1, date: new Date() }] }), false);
assert.equal(chartUsesGroups([{ label: "x", items: [{ value: 1, group: "a" }] }]), true);

// Dates: bucketed by month and sorted; a single series object is accepted.
const monthly = buildChartModel({
    label: "Vendas",
    items: [
        { date: new Date(2024, 2, 9), value: 3 },
        { date: new Date(2024, 0, 2), value: 1 },
        { date: new Date(2024, 0, 20), value: 4 }
    ]
});

assert.equal(monthly.categories.length, 2);
assert.equal(monthly.series[0]?.cells[0]?.value, 5);
assert.equal(monthly.categories[0]?.short, "Jan");

// Colors: explicit wins; others continue the palette from the base color.
assert.equal(seriesColor(0, undefined, "chart-3"), "chart-3");
assert.equal(seriesColor(1, undefined, "chart-3"), "chart-4");
assert.equal(seriesColor(1, "green-500", "chart-3"), "green-500");

// Stacking: diverging for negatives; expanded shares of the absolute total.
const signed = buildChartModel([
    { label: "A", items: [{ group: "x", value: 4 }] },
    { label: "B", items: [{ group: "x", value: -2 }] },
    { label: "C", items: [{ group: "x", value: 2 }] }
]);
const stacked = stackSpans(signed, "stacked");

assert.deepEqual(stacked[1]?.[0], { start: 0, end: -2 });
assert.deepEqual(stacked[2]?.[0], { start: 4, end: 6 });
assert.deepEqual(spanDomain(stacked), { min: -2, max: 6 });

const expanded = stackSpans(signed, "expanded");

assert.equal(expanded[2]?.[0]?.end, 0.75);
assert.deepEqual(spanDomain([[{ start: 0, end: 0 }]]), { min: 0, max: 1 });

// Helpers.
assert.deepEqual(evenlySpacedIndexes(3, 10), [0, 1, 2]);
assert.deepEqual(evenlySpacedIndexes(10, 4), [0, 3, 6, 9]);
assert.equal(formatChartValue(1234.5, "currency").replace(/\s/g, " "), "R$ 1.234,50");

const daily = buildChartModel(
    {
        label: "Diário",
        items: [
            { date: new Date(2024, 5, 1), value: 1 },
            { date: new Date(2024, 5, 20), value: 1 },
            { date: new Date(2024, 5, 28), value: 1 }
        ]
    },
    { bucket: "day" }
);

assert.deepEqual(categoriesInRange(daily.categories, "7d"), [2]);
assert.deepEqual(categoriesInRange(grouped.categories, "7d"), [0, 1]);

// Paths.
const points = [
    { x: 0, y: 10 },
    { x: 50, y: 20 },
    { x: 100, y: 5 }
];

assert.equal(linePath(points, "linear"), "M 0 10 L 50 20 L 100 5");
assert.equal(linePath(points.slice(0, 2), "step"), "M 0 10 L 25 10 L 25 20 L 50 20");
assert.ok(linePath(points, "smooth").includes(" C "));
assert.ok(areaPath(points, points.map((p) => ({ x: p.x, y: 100 })), "linear").endsWith(" Z"));

console.log("chartModel.check.mjs: ok");
