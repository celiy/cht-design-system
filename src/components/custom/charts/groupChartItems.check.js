/**
 * Run: node cht-design-system/src/components/custom/charts/groupChartItems.check.js
 */
import assert from "node:assert/strict";
import { groupChartItems, groupChartItemsByDate } from "./groupChartItems.ts";

const dual = groupChartItems(
    [
        { value: 10, valueNegative: 4, group: "Mai" },
        { value: 2, valueNegative: 1, group: "mai" }
    ],
    "Fluxo"
);

assert.equal(dual.length, 1);
assert.equal(dual[0]?.value, 12);
assert.equal(dual[0]?.valueNegative, 5);

const signed = groupChartItemsByDate(
    [
        { value: 20, date: new Date(2026, 4, 1) },
        { value: -8, date: new Date(2026, 4, 10) }
    ],
    "Saldo"
);

assert.equal(signed[0]?.value, 12);
assert.equal(signed[0]?.valueNegative, 0);

const years = groupChartItemsByDate(
    [
        { value: 1, date: new Date(2025, 0, 1) },
        { value: 2, date: new Date(2026, 0, 1) }
    ],
    "Anos"
);

assert.equal(years.length, 2);
assert.match(years[0]?.dateShort ?? "", /25/);
assert.match(years[1]?.dateShort ?? "", /26/);
assert.match(years[0]?.dateLong ?? "", /2025/);

console.log("groupChartItems.check: ok");
