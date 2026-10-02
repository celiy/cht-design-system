/**
 * Run: node cht-design-system/src/components/internal/tooltipFollow.check.js
 */
import assert from "node:assert/strict";
import { followTooltipPosition, TOOLTIP_DEFAULT_OFFSET, TOOLTIP_VIEWPORT_PAD } from "./tooltipFollow.ts";

const roomy = followTooltipPosition(100, 200, 80, 40, 800, 600);
assert.equal(roomy.x, 100 - 40);
assert.equal(roomy.y, 200 - 40 - TOOLTIP_DEFAULT_OFFSET);

const nearTop = followTooltipPosition(100, 10, 80, 40, 800, 600);
assert.equal(nearTop.y, 10 + TOOLTIP_DEFAULT_OFFSET);

const nearRight = followTooltipPosition(780, 200, 80, 40, 800, 600);
assert.equal(nearRight.x, 800 - 80 - TOOLTIP_VIEWPORT_PAD);

const tiny = followTooltipPosition(4, 4, 400, 300, 200, 150);
assert.equal(tiny.x, TOOLTIP_VIEWPORT_PAD);
assert.equal(tiny.y, TOOLTIP_VIEWPORT_PAD);

console.log("tooltipFollow.check: ok");
