/**
 * Run: node cht-design-system/src/components/inputValueConstraints.check.js
 */
import assert from "node:assert/strict";
import { constrainInputValue, matchesInputPattern } from "./inputValueConstraints.ts";

assert.equal(matchesInputPattern("", /^[0-9]$/), true);
assert.equal(matchesInputPattern("5", /^[0-9]$/), true);
assert.equal(matchesInputPattern("a", /^[0-9]$/), false);
assert.equal(matchesInputPattern("5", "[0-9]"), true);
assert.equal(matchesInputPattern("ab", "("), true);

assert.equal(constrainInputValue("abcd", "abc", { maxSize: 3 }), "abc");
assert.equal(constrainInputValue("ab", "a", { maxSize: 8 }), "ab");
assert.equal(constrainInputValue("x", "", { pattern: /^[0-9]$/ }), "");
assert.equal(constrainInputValue("7", "", { maxSize: 1, pattern: /^[0-9]$/ }), "7");
assert.equal(constrainInputValue("77", "7", { maxSize: 1, pattern: /^[0-9]$/ }), "7");
assert.equal(constrainInputValue("a", "7", { maxSize: 1, pattern: /^[0-9]$/ }), "7");

console.log("inputValueConstraints.check: ok");
