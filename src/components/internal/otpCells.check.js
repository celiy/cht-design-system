/**
 * Run: node cht-design-system/src/components/otpCells.check.js
 */
import assert from "node:assert/strict";
import {
    applyOtpBackspace,
    applyOtpChar,
    applyOtpPaste,
    cellsFromValue,
    otpInputFieldIndexes
} from "./otpCells.ts";

assert.deepEqual(
    otpInputFieldIndexes([
        { type: "input" },
        { type: "colon" },
        { type: "input" },
        { type: "dash" },
        { type: "input" }
    ]),
    [0, 2, 4]
);

let next = applyOtpChar(["", "", "", ""], 0, "A", 4);
assert.deepEqual(next.values, ["A", "", "", ""]);
assert.equal(next.focus, 1);

next = applyOtpChar(next.values, next.focus, "B", 4);
assert.deepEqual(next.values, ["A", "B", "", ""]);
assert.equal(next.focus, 2);

next = applyOtpChar(["A", "B", "", ""], 1, "X", 4);
assert.deepEqual(next.values, ["A", "X", "", ""]);
assert.equal(next.focus, 2);

next = applyOtpBackspace(["A", "B", "", ""], 1, 4);
assert.deepEqual(next.values, ["A", "", "", ""]);
assert.equal(next.focus, 0);

next = applyOtpBackspace(["A", "", "", ""], 1, 4);
assert.deepEqual(next.values, ["A", "", "", ""]);
assert.equal(next.focus, 0);

next = applyOtpBackspace(["A", "B", "C", "D"], 0, 4);
assert.deepEqual(next.values, ["B", "C", "D", ""]);
assert.equal(next.focus, 0);

next = applyOtpPaste(["", "", "", ""], 0, "ABCD", [null, null, null, null]);
assert.deepEqual(next.values, ["A", "B", "C", "D"]);
assert.equal(next.focus, 3);

next = applyOtpPaste(["", "", "", "", ""], 0, "abcd", [null, null, null, null, null]);
assert.deepEqual(next.values, ["a", "b", "c", "d", ""]);
assert.equal(next.focus, 4);

next = applyOtpPaste(["A", "B", "C", "D"], 2, "FF", [null, null, null, null]);
assert.deepEqual(next.values, ["A", "B", "F", "F"]);
assert.equal(next.focus, 3);

next = applyOtpPaste(["A", "B", "", ""], 2, "FF", [null, null, null, null]);
assert.deepEqual(next.values, ["A", "B", "F", "F"]);
assert.equal(next.focus, 3);

const digit = /^[0-9]$/;
next = applyOtpPaste(["", "", "", ""], 0, "A1B2", [digit, digit, digit, digit]);
assert.deepEqual(next.values, ["1", "2", "", ""]);

assert.deepEqual(cellsFromValue("AB12", 4), ["A", "B", "1", "2"]);
assert.deepEqual(cellsFromValue("AB", 4), ["A", "B", "", ""]);
assert.deepEqual(cellsFromValue("ABCDEF", 4), ["A", "B", "C", "D"]);
assert.deepEqual(cellsFromValue("", 4), ["", "", "", ""]);

console.log("otpCells.check: ok");
