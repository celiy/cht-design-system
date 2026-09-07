type Rgb = {
    r: number;
    g: number;
    b: number;
    a: number;
    lum: number;
};

const OKLCH_REGEX = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/i;
const RGB_REGEX = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)$/i;
const HEX_REGEX = /^#([0-9a-f]{3,8})$/i;

const TRANSPARENT_COLOR: Rgb = { r: 0, g: 0, b: 0, a: 0, lum: 0 };

const colorCache = new Map<string, Rgb | null>();
colorCache.set("transparent", TRANSPARENT_COLOR);
colorCache.set("rgba(0, 0, 0, 0)", TRANSPARENT_COLOR);
colorCache.set("rgb(0, 0, 0, 0)", TRANSPARENT_COLOR);
colorCache.set("", TRANSPARENT_COLOR);

let sharedCanvasCtx: CanvasRenderingContext2D | null = null;
let probeEl: HTMLSpanElement | null = null;

let cachedTheme: string | null = null;
let cachedFgColor: Rgb | null = null;
let cachedBgColor: Rgb | null = null;

function getSharedCanvasCtx(): CanvasRenderingContext2D | null {
    if (typeof document === "undefined") {
        return null;
    }

    if (!sharedCanvasCtx) {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        sharedCanvasCtx = canvas.getContext("2d", { willReadFrequently: true });
    }

    return sharedCanvasCtx;
}

function channelToLinear(channel: number): number {
    const c = channel / 255;

    if (c <= 0.03928) {
        return c / 12.92;
    }

    return ((c + 0.055) / 1.055) ** 2.4;
}

function calculateLuminance(r: number, g: number, b: number): number {
    return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
}

function oklchToRgb(L: number, C: number, h: number, a = 1): Rgb {
    const hr = (h * Math.PI) / 180;
    const A = C * Math.cos(hr);
    const B = C * Math.sin(hr);
    const l_ = L + 0.3963377774 * A + 0.2158037573 * B;
    const m_ = L - 0.1055613458 * A - 0.0638541728 * B;
    const s_ = L - 0.0894841775 * A - 1.2914855480 * B;
    const l = l_ ** 3;
    const m = m_ ** 3;
    const s = s_ ** 3;
    const rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

    const toSrgb = (channel: number) => {
        const c = Math.min(Math.max(channel, 0), 1);

        if (c <= 0.031308) {
            return 255 * 12.92 * c;
        }

        return 255 * (1.055 * (c ** (1 / 2.4)) - 0.055);
    };

    const r = toSrgb(rLin);
    const g = toSrgb(gLin);
    const b = toSrgb(bLin);

    return {
        r,
        g,
        b,
        a,
        lum: calculateLuminance(r, g, b)
    };
}

function parseCssColor(value: string): Rgb | null {
    if (!value) {
        return TRANSPARENT_COLOR;
    }

    const cached = colorCache.get(value);

    if (cached !== undefined) {
        return cached;
    }

    const trimmed = value.trim();
    const cachedTrimmed = colorCache.get(trimmed);

    if (cachedTrimmed !== undefined) {
        colorCache.set(value, cachedTrimmed);

        return cachedTrimmed;
    }

    // 1. OKLCH color parsing (standard in Tailwind v4)
    if (trimmed.startsWith("oklch")) {
        const match = trimmed.match(OKLCH_REGEX);

        if (match) {
            const L = Number(match[1]);
            const C = Number(match[2]);
            const h = Number(match[3]);
            const alpha = match[4] !== undefined ? Number(match[4]) : 1;

            if ([L, C, h, alpha].every(n => Number.isFinite(n))) {
                const result = oklchToRgb(L, C, h, alpha);
                colorCache.set(value, result);

                return result;
            }
        }
    }

    // 2. RGB / RGBA color parsing
    if (trimmed.startsWith("rgb")) {
        const match = trimmed.match(RGB_REGEX);

        if (match) {
            const r = Number(match[1]);
            const g = Number(match[2]);
            const b = Number(match[3]);
            const a = match[4] !== undefined ? Number(match[4]) : 1;

            if ([r, g, b, a].every(n => Number.isFinite(n))) {
                if (a === 0) {
                    colorCache.set(value, TRANSPARENT_COLOR);

                    return TRANSPARENT_COLOR;
                }

                const result: Rgb = {
                    r,
                    g,
                    b,
                    a,
                    lum: calculateLuminance(r, g, b)
                };
                colorCache.set(value, result);

                return result;
            }
        }
    }

    // 3. Hex color parsing
    if (trimmed.startsWith("#")) {
        const match = trimmed.match(HEX_REGEX);

        if (match) {
            const hex = match[1];

            if (hex) {
                let r = 0;
                let g = 0;
                let b = 0;
                let a = 1;

                if (hex.length === 3 || hex.length === 4) {
                    const h0 = hex[0] ?? "0";
                    const h1 = hex[1] ?? "0";
                    const h2 = hex[2] ?? "0";
                    const h3 = hex[3] ?? "f";

                    r = Number.parseInt(h0 + h0, 16);
                    g = Number.parseInt(h1 + h1, 16);
                    b = Number.parseInt(h2 + h2, 16);

                    if (hex.length === 4) {
                        a = Number.parseInt(h3 + h3, 16) / 255;
                    }
                } else if (hex.length === 6 || hex.length === 8) {
                    r = Number.parseInt(hex.slice(0, 2), 16);
                    g = Number.parseInt(hex.slice(2, 4), 16);
                    b = Number.parseInt(hex.slice(4, 6), 16);

                    if (hex.length === 8) {
                        a = Number.parseInt(hex.slice(6, 8), 16) / 255;
                    }
                }

                const result: Rgb = {
                    r,
                    g,
                    b,
                    a,
                    lum: calculateLuminance(r, g, b)
                };
                colorCache.set(value, result);

                return result;
            }
        }
    }

    // 4. Fallback for named colors using singleton canvas context
    const ctx = getSharedCanvasCtx();

    if (ctx) {
        ctx.fillStyle = "#000000";
        ctx.fillStyle = trimmed;
        const resolved = ctx.fillStyle;

        if (typeof resolved === "string" && resolved.startsWith("#")) {
            const hex = resolved.slice(1);

            if (hex.length === 6) {
                const r = Number.parseInt(hex.slice(0, 2), 16);
                const g = Number.parseInt(hex.slice(2, 4), 16);
                const b = Number.parseInt(hex.slice(4, 6), 16);
                const result: Rgb = {
                    r,
                    g,
                    b,
                    a: 1,
                    lum: calculateLuminance(r, g, b)
                };
                colorCache.set(value, result);

                return result;
            }
        }
    }

    colorCache.set(value, null);

    return null;
}

function contrastRatio(l1: number, l2: number): number {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
}

function blend(fg: Rgb, bg: Rgb): Rgb {
    const a = Math.min(Math.max(fg.a, 0), 1);
    const r = fg.r * a + bg.r * (1 - a);
    const g = fg.g * a + bg.g * (1 - a);
    const b = fg.b * a + bg.b * (1 - a);

    return {
        r,
        g,
        b,
        a: 1,
        lum: calculateLuminance(r, g, b)
    };
}

function getProbe(): HTMLSpanElement | null {
    if (typeof document === "undefined") {
        return null;
    }

    if (!probeEl || !probeEl.isConnected) {
        probeEl = document.createElement("span");
        probeEl.style.cssText = "position: absolute; visibility: hidden; pointer-events: none;";
        document.body.appendChild(probeEl);
    }

    return probeEl;
}

function getThemeTokens(): { fgColor: Rgb; bgColor: Rgb } {
    const currentTheme = (typeof document !== "undefined" ? document.documentElement.dataset.theme : null) || "dark";

    if (cachedTheme === currentTheme && cachedFgColor && cachedBgColor) {
        return { fgColor: cachedFgColor, bgColor: cachedBgColor };
    }

    const probe = getProbe();

    if (probe) {
        probe.style.color = "var(--color-foreground)";
        cachedFgColor = parseCssColor(getComputedStyle(probe).color) ?? { r: 255, g: 255, b: 255, a: 1, lum: 1 };

        probe.style.color = "var(--color-background)";
        cachedBgColor = parseCssColor(getComputedStyle(probe).color) ?? { r: 0, g: 0, b: 0, a: 1, lum: 0 };
    } else {
        cachedFgColor = { r: 255, g: 255, b: 255, a: 1, lum: 1 };
        cachedBgColor = { r: 0, g: 0, b: 0, a: 1, lum: 0 };
    }

    cachedTheme = currentTheme;

    return { fgColor: cachedFgColor, bgColor: cachedBgColor };
}

function effectiveBackground(el: Element, pageBg: Rgb): Rgb {
    let stacked: Rgb | null = null;
    let node: Element | null = el;

    while (node) {
        const bgStr = getComputedStyle(node).backgroundColor;
        const parsed = parseCssColor(bgStr);

        if (parsed && parsed.a > 0) {
            if (parsed.a >= 0.99) {
                return parsed;
            }

            stacked = stacked === null ? parsed : blend(stacked, parsed);

            if (stacked.a >= 0.99) {
                return stacked;
            }
        }

        node = node.parentElement;
    }

    if (stacked === null) {
        return pageBg;
    }

    return blend(stacked, pageBg);
}

export function applyTextContrast(root: ParentNode = document) {
    if (typeof document === "undefined") {
        return;
    }

    const nodes = root.querySelectorAll(".text-contrast");

    if (nodes.length === 0) {
        return;
    }

    const { fgColor, bgColor } = getThemeTokens();
    const lFg = fgColor.lum;
    const lPage = bgColor.lum;

    const bodyBg = parseCssColor(getComputedStyle(document.body).backgroundColor);
    const pageBg = bodyBg && bodyBg.a >= 0.99 ? bodyBg : bgColor;

    for (const node of nodes) {
        const bg = effectiveBackground(node, pageBg);
        const lBg = bg.lum;
        const usePageBackground = contrastRatio(lPage, lBg) > contrastRatio(lFg, lBg);
        const target = usePageBackground ? "background" : "foreground";

        if (node.getAttribute("data-contrast") !== target) {
            node.setAttribute("data-contrast", target);
        }
    }
}

export function startTextContrastObserver() {
    if (typeof window !== "undefined") {
        (window as unknown as { __applyTextContrast?: typeof applyTextContrast }).__applyTextContrast = applyTextContrast;
    }

    if (typeof document === "undefined" || typeof MutationObserver === "undefined") {
        return;
    }

    let raf = 0;

    const schedule = () => {
        if (raf) {
            return;
        }

        raf = window.requestAnimationFrame(() => {
            raf = 0;
            applyTextContrast();
        });
    };

    const start = () => {
        applyTextContrast();

        const observer = new MutationObserver(schedule);

        observer.observe(document.body, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ["class", "style"]
        });

        // Also observe theme changes on documentElement
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme"]
        });
    };

    if (document.body) {
        start();

        return;
    }

    document.addEventListener("DOMContentLoaded", start, { once: true });
}
