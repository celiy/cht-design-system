/**
 * The Sidebar swipe-to-close module
 * This module is responsible for axis lock and origin rebase of the project.
 */

export const TOUCH_START_Y_THRESHOLD = 100;
export const TOUCH_START_X_THRESHOLD = 30;
export const TOUCH_CLOSE_X_THRESHOLD = 50;
export const TOUCH_OPEN_X_THRESHOLD = 50;
export const TOUCH_TELEPORT_PX = 48;

export function shouldRebaseTouchOrigin(
    lastX: number,
    lastY: number,
    x: number,
    y: number
): boolean {
    return Math.abs(x - lastX) > TOUCH_TELEPORT_PX || Math.abs(y - lastY) > TOUCH_TELEPORT_PX;
}

export function nextHorizontalDrag(xDrag: boolean, absY: number): boolean {
    if (!xDrag) {
        return false;
    }

    return absY <= TOUCH_START_Y_THRESHOLD;
}

export function shouldCloseSidebarOnSwipeEnd(xDrag: boolean, xOffset: number): boolean {
    return xDrag && xOffset < -TOUCH_CLOSE_X_THRESHOLD;
}

export function shouldOpenSidebarOnSwipeEnd(xDrag: boolean, xOffset: number): boolean {
    return xDrag && xOffset > TOUCH_OPEN_X_THRESHOLD;
}

export function openSidebarDragPx(xDrag: boolean, xOffset: number): number {
    if (!xDrag || xOffset >= -TOUCH_START_X_THRESHOLD) {
        return 0;
    }

    return xOffset + TOUCH_START_X_THRESHOLD;
}

export function closedSidebarPeekPx(xDrag: boolean, xOffset: number): number {
    if (!xDrag || xOffset <= TOUCH_OPEN_X_THRESHOLD) {
        return 0;
    }

    return xOffset - TOUCH_OPEN_X_THRESHOLD;
}

/**
 * Whether the element handles horizontal gestures itself: it scrolls sideways for real
 * (`overflow-x` auto/scroll with overflowing content; the page root scrolls unless
 * `overflow-x: hidden`) or declares `touch-action: pan-y`/`none` (carousels, sliders).
 * The sidebar must not claim a swipe that starts inside one.
 */
export function ownsHorizontalGesture(element: Element): boolean {
    const style = getComputedStyle(element);
    const touchAction = style.touchAction;
    const claimsX =
        touchAction === "none" || (touchAction.includes("pan-y") && !touchAction.includes("pan-x"));

    if (claimsX) {
        return true;
    }

    const overflows = element.scrollWidth > element.clientWidth + 1;
    const isRoot = element === document.documentElement;
    const scrollsX = isRoot
        ? style.overflowX !== "hidden"
        : style.overflowX === "auto" || style.overflowX === "scroll";

    return scrollsX && overflows;
}

/**
 * Walks from the touch target up to the page root looking for an element that owns the
 * horizontal gesture. The sidebar's own content container is included: on pages whose
 * content overflows sideways it is the element that scrolls.
 */
export function touchStartsInHorizontalGesture(target: EventTarget | null): boolean {
    let node = target instanceof Element ? target : null;

    while (node) {
        if (ownsHorizontalGesture(node)) {
            return true;
        }

        node = node.parentElement;
    }

    return false;
}
