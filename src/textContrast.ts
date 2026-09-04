type Rgb = { r: number; g: number; b: number; a: number };

const CHANNEL = /[\d.]+/g;

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

        if (c <= 0.0031308) {
            return 255 * 12.92 * c;
        }

        return 255 * (1.055 * (c ** (1 / 2.4)) - 0.055);
    };

    return { r: toSrgb(rLin), g: toSrgb(gLin), b: toSrgb(bLin), a };
}

function parseCssColor(value: string): Rgb | null {
    if (!value || value === "transparent") {
        return { r: 0, g: 0, b: 0, a: 0 };
    }

    const trimmed = value.trim();
    const oklch = trimmed.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/i);

    if (oklch) {
        const L = Number(oklch[1]);
        const C = Number(oklch[2]);
        const h = Number(oklch[3]);
        const alpha = oklch[4] !== undefined ? Number(oklch[4]) : 1;

        if (![L, C, h, alpha].every(n => Number.isFinite(n))) {
            return null;
        }

        return oklchToRgb(L, C, h, alpha);
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (ctx) {
        ctx.fillStyle = "#000000";
        ctx.fillStyle = value;
        const resolved = ctx.fillStyle;

        if (typeof resolved === "string" && resolved.startsWith("#")) {
            const hex = resolved.slice(1);

            if (hex.length === 6) {
                return {
                    r: Number.parseInt(hex.slice(0, 2), 16),
                    g: Number.parseInt(hex.slice(2, 4), 16),
                    b: Number.parseInt(hex.slice(4, 6), 16),
                    a: 1
                };
            }
        }
    }

    const nums = trimmed.match(CHANNEL);

    if (!nums || nums.length < 3 || trimmed.startsWith("lch")) {
        return null;
    }

    if (!trimmed.includes("rgb")) {
        return null;
    }

    const r = Number(nums[0]);
    const g = Number(nums[1]);
    const b = Number(nums[2]);
    const a = nums[3] !== undefined ? Number(nums[3]) : 1;

    if (![r, g, b, a].every(n => Number.isFinite(n))) {
        return null;
    }

    return { r, g, b, a };
}

function channelToLinear(channel: number): number {
    const c = channel / 255;

    if (c <= 0.03928) {
        return c / 12.92;
    }

    return ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(color: Rgb): number {
    return (
        0.2126 * channelToLinear(color.r)
        + 0.7152 * channelToLinear(color.g)
        + 0.0722 * channelToLinear(color.b)
    );
}

function contrastRatio(l1: number, l2: number): number {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
}

function blend(fg: Rgb, bg: Rgb): Rgb {
    const a = Math.min(Math.max(fg.a, 0), 1);

    return {
        r: fg.r * a + bg.r * (1 - a),
        g: fg.g * a + bg.g * (1 - a),
        b: fg.b * a + bg.b * (1 - a),
        a: 1
    };
}

function tokenRgb(token: string, cache: Map<string, Rgb>): Rgb {
    const cached = cache.get(token);

    if (cached) {
        return cached;
    }

    const probe = document.createElement("span");

    probe.style.color = `var(${token})`;
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    document.body.appendChild(probe);

    const parsed = parseCssColor(getComputedStyle(probe).color) ?? { r: 255, g: 255, b: 255, a: 1 };

    probe.remove();

    const color = { ...parsed, a: 1 };

    cache.set(token, color);

    return color;
}

function effectiveBackground(el: Element): Rgb {
    let stacked: Rgb = { r: 0, g: 0, b: 0, a: 0 };
    let node: Element | null = el;

    while (node) {
        const parsed = parseCssColor(getComputedStyle(node).backgroundColor);

        if (parsed && parsed.a > 0) {
            stacked = stacked.a === 0 ? parsed : blend(stacked, parsed);

            if (stacked.a >= 0.99) {
                return { ...stacked, a: 1 };
            }
        }

        node = node.parentElement;
    }

    const page = parseCssColor(getComputedStyle(document.body).backgroundColor)
        ?? { r: 0, g: 0, b: 0, a: 1 };

    if (stacked.a === 0) {
        return { ...page, a: 1 };
    }

    return blend(stacked, page);
}

export function applyTextContrast(root: ParentNode = document) {
    const tokenCache = new Map<string, Rgb>();
    const lFg = relativeLuminance(tokenRgb("--color-foreground", tokenCache));
    const lPage = relativeLuminance(tokenRgb("--color-background", tokenCache));
    const nodes = root.querySelectorAll(".text-contrast");

    for (const node of nodes) {
        const bg = effectiveBackground(node);
        const lBg = relativeLuminance(bg);
        const usePageBackground = contrastRatio(lPage, lBg) > contrastRatio(lFg, lBg);

        node.setAttribute("data-contrast", usePageBackground ? "background" : "foreground");
    }
}

export function startTextContrastObserver() {
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
    };

    if (document.body) {
        start();

        return;
    }

    document.addEventListener("DOMContentLoaded", start, { once: true });
}
