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
