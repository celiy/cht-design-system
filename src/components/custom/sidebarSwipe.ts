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
