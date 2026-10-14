/**
 * The chart motion module
 * This module is responsible for the first-appearance trigger and value tweening of the charts of the project.
 */

/** Wave line drawing time. */
export const CHART_DRAW_MS = 900;

/** Bar growth time and the delay between consecutive groups. */
export const CHART_GROW_MS = 550;
export const CHART_STAGGER_MS = 60;

/** Smooth transition when the data changes. */
export const CHART_MORPH_MS = 450;

/**
 * Whether the user asked for reduced motion.
 * @returns True when animations should be skipped
 */
export function prefersReducedMotion(): boolean {
    return (
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
}

/**
 * Calls `callback` once, the first time `element` is at least partly on screen.
 * Runs immediately when the observer is unavailable.
 * @param element The chart root
 * @param callback Starts the entrance animation
 * @returns Cleanup that stops observing
 */
export function onFirstAppearance(element: Element, callback: () => void): () => void {
    if (typeof IntersectionObserver === "undefined") {
        callback();

        return () => {};
    }

    const observer = new IntersectionObserver(
        (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                observer.disconnect();
                callback();
            }
        },
        { threshold: 0.2 }
    );

    observer.observe(element);

    return () => observer.disconnect();
}

function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Interpolates two number lists of the same length, calling `onFrame` on every frame.
 * Lists of different lengths jump straight to `to`.
 * @param from Start values
 * @param to End values
 * @param duration Duration in ms
 * @param onFrame Receives the values of each frame
 * @returns Cancels the tween
 */
export function tweenNumbers(
    from: number[],
    to: number[],
    duration: number,
    onFrame: (values: number[]) => void
): () => void {
    if (from.length !== to.length || duration <= 0 || typeof requestAnimationFrame === "undefined") {
        onFrame(to);

        return () => {};
    }

    let frame = 0;
    const started = performance.now();

    const step = (now: number) => {
        const t = Math.min(1, (now - started) / duration);
        const eased = easeInOutCubic(t);

        onFrame(from.map((value, index) => value + ((to[index] ?? value) - value) * eased));

        if (t < 1) {
            frame = requestAnimationFrame(step);
        }
    };

    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
}
