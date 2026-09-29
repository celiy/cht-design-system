/**
 * Run: node cht-design-system/src/components/internal/floatingPanelPlacement.check.js
 */
import { shouldPositionAbove } from "./floatingPanelPlacement.js";

function assert(cond, msg) {
    if (!cond) {
        throw new Error(msg);
    }
}

// Default (prefer below): only flip above when below is tight and above has room.
assert(!shouldPositionAbove(400, 400, 200, false), "default: equal space → below");
assert(shouldPositionAbove(400, 100, 200, false), "default: below tight → above");
assert(!shouldPositionAbove(100, 400, 200, false), "default: above tight → below");

// Prefer above: stay above when it fits; flip below when above is tighter.
assert(shouldPositionAbove(400, 400, 200, true), "preferAbove: fits → above");
assert(shouldPositionAbove(400, 100, 200, true), "preferAbove: below tight → above");
assert(!shouldPositionAbove(100, 400, 200, true), "preferAbove: above tight → below");
assert(shouldPositionAbove(150, 100, 200, true), "preferAbove: neither fits, above larger");

console.log("floatingPanelPlacement.check: ok");
