/**
 * Checks if the panel should be positioned above
 * @param {number} spaceAbove The space above
 * @param {number} spaceBelow The space below
 * @param {number} estimatedPanelHeight The estimated panel height
 * @param {boolean | undefined} preferAbove The prefer above
 * @returns {boolean} True if the panel should be positioned above
 */
export function shouldPositionAbove(
    spaceAbove: number,
    spaceBelow: number,
    estimatedPanelHeight: number,
    preferAbove?: boolean
): boolean;
