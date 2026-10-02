/**
 * Run: node cht-design-system/src/components/custom/charts/chartColors.check.js
 */
import assert from "node:assert/strict";
import { chartMixCss, chartPaintStyle } from "./chartColors.ts";

const solid = chartPaintStyle("green-500");
assert.equal(solid.backgroundColor, "var(--color-green-500)");

assert.equal(chartMixCss("red-500", "blue-500", 0, 3), "var(--color-red-500)");
assert.equal(
    chartMixCss("red-500", "blue-500", 1, 3),
    "color-mix(in oklab, var(--color-red-500) 50%, var(--color-blue-500))"
);
assert.equal(chartMixCss("red-500", "blue-500", 2, 3), "var(--color-blue-500)");
assert.equal(chartMixCss("red-500", undefined, 1, 3), "var(--color-red-500)");

const last = chartPaintStyle("red-500", "blue-500", 2, 3);
assert.equal(last.backgroundColor, "var(--color-blue-500)");

console.log("chartColors.check: ok");
