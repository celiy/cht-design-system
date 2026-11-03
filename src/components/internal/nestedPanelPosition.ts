/**
 * The nested panel position module
 * This module is responsible for keeping the nested options panel inside the viewport of the project.
 */

export type NestedPanelPlacement = { top: number; left: number; maxWidth: number };

/**
 * Places the nested panel next to its option. It opens to the right, then to the left when the
 * right side has no room, and otherwise slides sideways until it fits; it also moves up when
 * it would pass the bottom edge.
 *
 * @param anchor Rect of the option that opened the panel
 * @param panel Real size of the panel
 * @param viewport Viewport size
 * @param margin Space kept from the viewport edges
 * @returns Fixed position of the panel
 */
export function placeNestedPanel(
    anchor: { top: number; left: number; right: number },
    panel: { width: number; height: number },
    viewport: { width: number; height: number },
    margin = 8
): NestedPanelPlacement {
    const maxWidth = Math.max(0, viewport.width - margin * 2);
    const width = Math.min(panel.width, maxWidth);
    const gap = 4;
    let left = anchor.right - gap;

    if (left + width > viewport.width - margin) {
        const leftSide = anchor.left - width - gap;

        left = leftSide >= margin ? leftSide : viewport.width - margin - width;
    }

    let top = anchor.top;

    if (top + panel.height > viewport.height - margin) {
        top = viewport.height - margin - panel.height;
    }

    return {
        top: Math.max(margin, top),
        left: Math.max(margin, left),
        maxWidth
    };
}
