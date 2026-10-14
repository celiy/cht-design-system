/**
 * Clamp the panel's left edge so it stays inside the viewport.
 *
 * @param {number} preferredLeft
 * @param {number} panelWidth
 * @param {number} viewportWidth
 * @param {number} [padding=8]
 */
export function clampPanelLeft(preferredLeft, panelWidth, viewportWidth, padding = 8) {
    const maxLeft = Math.max(padding, viewportWidth - panelWidth - padding);

    return Math.min(Math.max(preferredLeft, padding), maxLeft);
}

/**
 * Horizontal position of the panel relative to the trigger.
 * `left` keeps the trigger's left edge (or its right edge when the panel is narrower,
 * e.g. maxWidthPx smaller than the anchor); `center` and `right` align to the trigger
 * center and right edge. The result is meant to go through `clampPanelLeft`.
 *
 * @param {number} anchorLeft
 * @param {number} anchorWidth
 * @param {number} panelWidth
 * @param {"left" | "center" | "right"} [align="left"]
 */
export function preferredPanelLeft(anchorLeft, anchorWidth, panelWidth, align = "left") {
    if (align === "center") {
        return anchorLeft + (anchorWidth - panelWidth) / 2;
    }

    if (align === "right" || panelWidth < anchorWidth) {
        return anchorLeft + anchorWidth - panelWidth;
    }

    return anchorLeft;
}

/**
 * Decide whether the floating panel opens above the anchor.
 *
 * @param {number} spaceAbove
 * @param {number} spaceBelow
 * @param {number} estimatedPanelHeight
 * @param {boolean} preferAbove
 */
export function shouldPositionAbove(
    spaceAbove,
    spaceBelow,
    estimatedPanelHeight,
    preferAbove = false
) {
    if (preferAbove) {
        return spaceAbove >= estimatedPanelHeight || spaceAbove >= spaceBelow;
    }

    return spaceAbove >= spaceBelow && spaceBelow < estimatedPanelHeight;
}

/**
 * Select/Dropdown pass `lockToAnchor` so the panel matches the trigger.
 * Popover does not: content sets the width, `maxWidthPx` is only a cap.
 *
 * @param {number} anchorWidth
 * @param {number | undefined} minWidthPx
 * @param {number | undefined} maxWidthPx
 * @param {number} viewportMax
 * @param {boolean} [lockToAnchor=true]
 */
export function panelWidthConstraints(
    anchorWidth,
    minWidthPx,
    maxWidthPx,
    viewportMax,
    lockToAnchor = true
) {
    const maxWidth = maxWidthPx ?? viewportMax;
    const minWidth = Math.min(Math.max(lockToAnchor ? anchorWidth : 0, minWidthPx ?? 0), maxWidth);

    return {
        lockWidth: lockToAnchor,
        width: minWidth,
        minWidth,
        maxWidth
    };
}
