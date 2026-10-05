/**
 * The floating panel placement module
 * This module is responsible for viewport clamping and above/below placement of the project.
 */

/**
 * Clamps the panel left edge inside the viewport
 * @param {number} preferredLeft The preferred left
 * @param {number} panelWidth The panel width
 * @param {number} viewportWidth The viewport width
 * @param {number} [padding] The padding
 * @returns {number} The clamped left
 */
export function clampPanelLeft(
    preferredLeft: number,
    panelWidth: number,
    viewportWidth: number,
    padding?: number
): number;

/**
 * Prefers the trigger left, or right-aligns when the panel is narrower
 * @param {number} anchorLeft The anchor left
 * @param {number} anchorWidth The anchor width
 * @param {number} panelWidth The panel width
 * @returns {number} The preferred left
 */
export function preferredPanelLeft(
    anchorLeft: number,
    anchorWidth: number,
    panelWidth: number
): number;

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

/**
 * Computes whether the panel locks to the trigger width or grows up to maxWidth
 * @param {number} anchorWidth The anchor width
 * @param {number | undefined} minWidthPx The min width px
 * @param {number | undefined} maxWidthPx The max width px
 * @param {number} viewportMax The viewport max
 * @param {boolean} [lockToAnchor] When true, panel width matches the trigger
 * @returns {{ lockWidth: boolean, width: number, minWidth: number, maxWidth: number }} The constraints
 */
export function panelWidthConstraints(
    anchorWidth: number,
    minWidthPx: number | undefined,
    maxWidthPx: number | undefined,
    viewportMax: number,
    lockToAnchor?: boolean
): { lockWidth: boolean; width: number; minWidth: number; maxWidth: number };
