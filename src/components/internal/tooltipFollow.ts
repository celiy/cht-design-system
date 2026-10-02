export const TOOLTIP_VIEWPORT_PAD = 8;
export const TOOLTIP_DEFAULT_OFFSET = 12;

/**
 * Place a follow-tooltip centered above the pointer, flipping when it would leave the viewport.
 */
export function followTooltipPosition(
    pointerX: number,
    pointerY: number,
    tipWidth: number,
    tipHeight: number,
    viewportWidth: number,
    viewportHeight: number,
    offset = TOOLTIP_DEFAULT_OFFSET
): { x: number; y: number } {
    let x = pointerX - tipWidth / 2;
    let y = pointerY - tipHeight - offset;

    if (y < TOOLTIP_VIEWPORT_PAD) {
        y = pointerY + offset;
    }

    const maxX = Math.max(TOOLTIP_VIEWPORT_PAD, viewportWidth - tipWidth - TOOLTIP_VIEWPORT_PAD);
    const maxY = Math.max(TOOLTIP_VIEWPORT_PAD, viewportHeight - tipHeight - TOOLTIP_VIEWPORT_PAD);

    return {
        x: Math.min(Math.max(x, TOOLTIP_VIEWPORT_PAD), maxX),
        y: Math.min(Math.max(y, TOOLTIP_VIEWPORT_PAD), maxY)
    };
}
