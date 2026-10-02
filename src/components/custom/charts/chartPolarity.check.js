/**
 * Run: node cht-design-system/src/components/custom/charts/chartPolarity.check.js
 */
import assert from "node:assert/strict";
import { addPolar, emptyPolar, negativeAmount, polarScale, positiveAmount } from "./chartPolarity.ts";

const conjunto = addPolar(addPolar(emptyPolar(), 10, 4), 2, 1);
assert.equal(conjunto.value, 12);
assert.equal(conjunto.valueNegative, 5);

const signed = addPolar(addPolar(emptyPolar(), 20), -8);
assert.equal(signed.value, 12);
assert.equal(signed.valueNegative, 0);

assert.equal(positiveAmount(12), 12);
assert.equal(positiveAmount(-3), 0);
assert.equal(negativeAmount(-3), 3);
assert.equal(negativeAmount(10, 4), 4);
assert.equal(polarScale(-8, 4), 8);

console.log("chartPolarity.check: ok");
