/**
 * Self-check: the nested options panel stays inside the viewport.
 * Run: node cht-design-system/src/components/internal/nestedPanelPosition.check.mjs
 */
import assert from "node:assert/strict";
import { placeNestedPanel } from "./nestedPanelPosition.ts";

const viewport = { width: 836, height: 646 };

// Room on the right: opens to the right of the option.
assert.deepEqual(
    placeNestedPanel({ top: 100, left: 100, right: 300 }, { width: 200, height: 150 }, viewport),
    { top: 100, left: 296, maxWidth: 820 }
);

// No room on the right, room on the left: opens to the left.
assert.deepEqual(
    placeNestedPanel({ top: 100, left: 500, right: 700 }, { width: 300, height: 150 }, viewport),
    { top: 100, left: 196, maxWidth: 820 }
);

// No room on either side (the screenshot case): slides until the right edge fits.
const slid = placeNestedPanel(
    { top: 360, left: 130, right: 550 },
    { width: 330, height: 250 },
    viewport
);

assert.equal(slid.left + 330 <= viewport.width - 8, true);
assert.equal(slid.left >= 8, true);

// Would pass the bottom edge: moves up.
assert.equal(
    placeNestedPanel({ top: 600, left: 100, right: 300 }, { width: 200, height: 250 }, viewport)
        .top,
    646 - 8 - 250
);

// Wider than the viewport: capped and pinned to the margin.
assert.deepEqual(
    placeNestedPanel({ top: 10, left: 10, right: 50 }, { width: 2000, height: 100 }, viewport),
    { top: 10, left: 8, maxWidth: 820 }
);

console.log("nestedPanelPosition.check: ok");
