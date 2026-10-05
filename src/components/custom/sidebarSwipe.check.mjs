/**
 * Check: Sidebar swipe axis lock and teleport rebase.
 * Run: node cht-design-system/src/components/custom/sidebarSwipe.check.mjs
 */
import assert from "node:assert/strict";
import {
    closedSidebarPeekPx,
    nextHorizontalDrag,
    openSidebarDragPx,
    shouldCloseSidebarOnSwipeEnd,
    shouldOpenSidebarOnSwipeEnd,
    shouldRebaseTouchOrigin,
    TOUCH_CLOSE_X_THRESHOLD,
    TOUCH_OPEN_X_THRESHOLD,
    TOUCH_START_X_THRESHOLD,
    TOUCH_START_Y_THRESHOLD
} from "./sidebarSwipe.ts";

assert.equal(shouldRebaseTouchOrigin(0, 0, 2, 2), false);
assert.equal(shouldRebaseTouchOrigin(0, 0, 0, -61.9), true);

assert.equal(nextHorizontalDrag(true, 0), true);
assert.equal(nextHorizontalDrag(true, TOUCH_START_Y_THRESHOLD + 1), false);
assert.equal(nextHorizontalDrag(false, 0), false);
assert.equal(nextHorizontalDrag(false, 2), false);

assert.equal(shouldCloseSidebarOnSwipeEnd(true, -(TOUCH_CLOSE_X_THRESHOLD + 1)), true);
assert.equal(shouldCloseSidebarOnSwipeEnd(true, -10), false);
assert.equal(shouldCloseSidebarOnSwipeEnd(false, -80), false);

assert.equal(shouldOpenSidebarOnSwipeEnd(true, TOUCH_OPEN_X_THRESHOLD + 1), true);
assert.equal(shouldOpenSidebarOnSwipeEnd(true, 10), false);
assert.equal(shouldOpenSidebarOnSwipeEnd(false, 80), false);

assert.equal(closedSidebarPeekPx(true, TOUCH_OPEN_X_THRESHOLD), 0);
assert.equal(closedSidebarPeekPx(true, 72), 22);
assert.equal(closedSidebarPeekPx(false, 72), 0);

assert.equal(openSidebarDragPx(true, -10), 0);
assert.equal(openSidebarDragPx(true, -TOUCH_START_X_THRESHOLD), 0);
assert.equal(openSidebarDragPx(true, -(TOUCH_START_X_THRESHOLD + 12)), -12);
assert.equal(openSidebarDragPx(false, -80), 0);

console.log("sidebarSwipe.check.mjs: ok");
