/**
 * Run: node cht-design-system/src/components/internal/floatingPanelPlacement.check.js
 */
import {
    clampPanelLeft,
    panelWidthConstraints,
    preferredPanelLeft,
    shouldPositionAbove
} from "./floatingPanelPlacement.js";

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

// Horizontal clamp uses the painted width, not the trigger width.
assert(clampPanelLeft(20, 100, 400, 8) === 20, "fits → keep preferred left");
assert(clampPanelLeft(300, 160, 390, 8) === 222, "overflows right → shift to maxLeft");
assert(clampPanelLeft(-40, 100, 400, 8) === 8, "overflows left → padding");
assert(clampPanelLeft(8, 400, 390, 8) === 8, "wider than viewport → padding");

assert(preferredPanelLeft(8, 80, 80) === 8, "same width → start");
assert(preferredPanelLeft(8, 80, 160) === 8, "wider panel → start");
assert(preferredPanelLeft(8, 300, 100) === 208, "narrower panel → end");

const unlocked = panelWidthConstraints(44, undefined, 200, 400, false);
assert(unlocked.lockWidth === false, "popover: content can grow");
assert(unlocked.minWidth === 0 && unlocked.maxWidth === 200, "popover: no anchor floor, cap applies");

const iconNoCap = panelWidthConstraints(34, undefined, undefined, 1062, false);
assert(iconNoCap.lockWidth === false && iconNoCap.minWidth === 0, "icon popover without maxWidthPx");

const locked = panelWidthConstraints(200, undefined, undefined, 800, true);
assert(locked.lockWidth === true && locked.width === 200, "select: lock to trigger");

const cappedWide = panelWidthConstraints(300, undefined, 200, 800, true);
assert(cappedWide.lockWidth === true && cappedWide.width === 200, "wide trigger + cap → 200");

const minFloor = panelWidthConstraints(80, 280, undefined, 800, true);
assert(minFloor.lockWidth === true && minFloor.width === 280, "minWidthPx floors locked width");

console.log("floatingPanelPlacement.check: ok");
