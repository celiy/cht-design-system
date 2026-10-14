/**
 * The drawer swipe module
 * This module is responsible for the drag-to-close gesture math of the drawer modal of the project.
 */

import { ownsHorizontalGesture } from "../custom/sidebarSwipe.ts";

export type DrawerSide = "left" | "right" | "bottom";

/** Movement before the gesture picks an axis. */
export const DRAWER_DRAG_SLOP_PX = 10;

/** Release speed (px/ms, toward closing) that closes even below the distance threshold. */
export const DRAWER_FLING_PX_PER_MS = 0.5;

/** A release this long after the last move counts as a stop, not a fling. */
export const DRAWER_FLING_STALE_MS = 100;

/** Same timing as the Sidebar slide (`duration-300 ease-out`). */
export const DRAWER_ANIMATION_MS = 300;
export const DRAWER_ANIMATION_EASING = "cubic-bezier(0, 0, 0.2, 1)";

/**
 * How far the drawer has been dragged toward closing. Never negative: dragging the
 * other way keeps the panel in place.
 * @param side The drawer side
 * @param dx Horizontal movement since the gesture origin
 * @param dy Vertical movement since the gesture origin
 * @returns The offset in px toward closing
 */
export function drawerDragOffset(side: DrawerSide, dx: number, dy: number): number {
    if (side === "left") {
        return Math.max(0, -dx);
    }

    if (side === "right") {
        return Math.max(0, dx);
    }

    return Math.max(0, dy);
}

/**
 * Decides once per gesture whether it drags the drawer.
 * @param side The drawer side
 * @param dx Horizontal movement since the touch start
 * @param dy Vertical movement since the touch start
 * @returns `null` while still inside the slop, `"drag"` when the move goes along the drawer
 * axis toward closing, `"ignore"` otherwise (the gesture is left to scroll)
 */
export function lockDrawerGesture(
    side: DrawerSide,
    dx: number,
    dy: number
): "drag" | "ignore" | null {
    if (Math.max(Math.abs(dx), Math.abs(dy)) < DRAWER_DRAG_SLOP_PX) {
        return null;
    }

    const horizontal = Math.abs(dx) > Math.abs(dy);
    const alongAxis = side === "bottom" ? !horizontal : horizontal;

    if (!alongAxis || drawerDragOffset(side, dx, dy) <= 0) {
        return "ignore";
    }

    return "drag";
}

/**
 * Whether a release closes the drawer: past the distance threshold, or a quick flick.
 * @param offset Offset toward closing at release
 * @param velocity Speed toward closing at release (px/ms)
 * @param threshold Distance that closes the drawer
 * @returns True if the drawer should close
 */
export function shouldCloseDrawer(offset: number, velocity: number, threshold: number): boolean {
    if (offset >= threshold) {
        return true;
    }

    return velocity >= DRAWER_FLING_PX_PER_MS && offset >= DRAWER_DRAG_SLOP_PX;
}

/**
 * Transform for the panel dragged `offset` px toward closing.
 * @param side The drawer side
 * @param offset Offset toward closing
 * @returns The CSS transform
 */
export function drawerOffsetTransform(side: DrawerSide, offset: number): string {
    if (side === "left") {
        return `translateX(${-offset}px)`;
    }

    if (side === "right") {
        return `translateX(${offset}px)`;
    }

    return `translateY(${offset}px)`;
}

/**
 * Transform for the panel fully off screen. Never closer than the current drag offset, so a
 * panel dragged past its own size keeps moving out instead of coming back.
 * @param side The drawer side
 * @param offset Current offset toward closing
 * @returns The CSS transform
 */
export function drawerClosedTransform(side: DrawerSide, offset = 0): string {
    if (side === "left") {
        return `translateX(min(-100%, ${-offset}px))`;
    }

    if (side === "right") {
        return `translateX(max(100%, ${offset}px))`;
    }

    return `translateY(max(100%, ${offset}px))`;
}

/**
 * Whether a gesture starting at `target` belongs to the content instead of the drawer:
 * a scrolled-down area (bottom drawer, the finger should scroll it back up) or an element
 * with its own horizontal gesture (side drawers: carousels, sliders, horizontal scroll).
 * @param target The touch target
 * @param panel The drawer panel (the walk stops there)
 * @param side The drawer side
 * @returns True if the drawer must not take the gesture
 */
export function drawerGestureBlockedByContent(
    target: EventTarget | null,
    panel: Element | null,
    side: DrawerSide
): boolean {
    let node = target instanceof Element ? target : null;

    while (node) {
        if (side === "bottom") {
            const overflowY = getComputedStyle(node).overflowY;
            const scrolls = overflowY === "auto" || overflowY === "scroll";

            if (scrolls && node.scrollTop > 0) {
                return true;
            }
        } else if (ownsHorizontalGesture(node)) {
            return true;
        }

        if (node === panel) {
            break;
        }

        node = node.parentElement;
    }

    return false;
}
