/**
 * Check: drawer drag-to-close gesture math.
 * Run: node cht-design-system/src/components/internal/drawerSwipe.check.mjs
 */
import assert from "node:assert/strict";
import {
    DRAWER_DRAG_SLOP_PX,
    DRAWER_FLING_PX_PER_MS,
    drawerClosedTransform,
    drawerDragOffset,
    drawerOffsetTransform,
    lockDrawerGesture,
    shouldCloseDrawer
} from "./drawerSwipe.ts";

assert.equal(drawerDragOffset("left", -40, 5), 40);
assert.equal(drawerDragOffset("left", 40, 5), 0);
assert.equal(drawerDragOffset("right", 40, 5), 40);
assert.equal(drawerDragOffset("right", -40, 5), 0);
assert.equal(drawerDragOffset("bottom", 5, 60), 60);
assert.equal(drawerDragOffset("bottom", 5, -60), 0);

assert.equal(lockDrawerGesture("bottom", 2, 4), null);
assert.equal(lockDrawerGesture("bottom", 2, DRAWER_DRAG_SLOP_PX + 2), "drag");
assert.equal(lockDrawerGesture("bottom", 2, -(DRAWER_DRAG_SLOP_PX + 2)), "ignore");
assert.equal(lockDrawerGesture("bottom", 30, 12), "ignore");
assert.equal(lockDrawerGesture("left", -20, 4), "drag");
assert.equal(lockDrawerGesture("left", 20, 4), "ignore");
assert.equal(lockDrawerGesture("left", -12, 30), "ignore");
assert.equal(lockDrawerGesture("right", 20, 4), "drag");
assert.equal(lockDrawerGesture("right", -20, 4), "ignore");

assert.equal(shouldCloseDrawer(80, 0, 56), true);
assert.equal(shouldCloseDrawer(30, 0, 56), false);
assert.equal(shouldCloseDrawer(30, DRAWER_FLING_PX_PER_MS + 0.1, 56), true);
assert.equal(shouldCloseDrawer(4, DRAWER_FLING_PX_PER_MS + 0.1, 56), false);

assert.equal(drawerOffsetTransform("left", 30), "translateX(-30px)");
assert.equal(drawerOffsetTransform("right", 30), "translateX(30px)");
assert.equal(drawerOffsetTransform("bottom", 30), "translateY(30px)");
assert.equal(drawerClosedTransform("left"), "translateX(min(-100%, 0px))");
assert.equal(drawerClosedTransform("bottom", 190), "translateY(max(100%, 190px))");

console.log("drawerSwipe.check.mjs: ok");
