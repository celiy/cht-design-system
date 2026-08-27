<template>
    <div
        ref="box"

        class="resizable box-border"
        :class="hoverBorderClass"
        :style="boxStyle"
    >
        <slot />

        <div
            v-for="handle in handles"
            :key="handle.edge"

            class="absolute z-20 touch-none"
            :class="handle.className"
            tabindex="-1"
            :aria-label="handle.label"
            :style="{ cursor: handle.cursor }"

            @pointerdown="onPointerDown(handle.edge, $event)"
        />
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

type ResizeMode = "all" | "horizontal" | "vertical" | "left" | "right" | "top" | "bottom";
type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

type HandleDef = {
    edge: ResizeEdge;
    cursor: string;
    className: string;
    label: string;
};

const HANDLE_CLASS: Record<ResizeEdge, HandleDef> = {
    n: { edge: "n", cursor: "ns-resize", className: "left-2 right-2 top-0 h-2", label: "Resize top" },
    s: { edge: "s", cursor: "ns-resize", className: "left-2 right-2 bottom-0 h-2", label: "Resize bottom" },
    e: { edge: "e", cursor: "ew-resize", className: "top-2 bottom-2 right-0 w-2", label: "Resize right" },
    w: { edge: "w", cursor: "ew-resize", className: "top-2 bottom-2 left-0 w-2", label: "Resize left" },
    ne: { edge: "ne", cursor: "nesw-resize", className: "top-0 right-0 w-3 h-3", label: "Resize top-right" },
    nw: { edge: "nw", cursor: "nwse-resize", className: "top-0 left-0 w-3 h-3", label: "Resize top-left" },
    se: { edge: "se", cursor: "nwse-resize", className: "bottom-0 right-0 w-3 h-3", label: "Resize bottom-right" },
    sw: { edge: "sw", cursor: "nesw-resize", className: "bottom-0 left-0 w-3 h-3", label: "Resize bottom-left" }
};

export default defineComponent({
    name: "Resizable",

    inheritAttrs: true,

    emits: ["update:width", "update:height", "resize-start", "resize-end"],

    props: {
        /**
         * Initial / controlled width in pixels. Omit to keep CSS width until the first drag.
         */
        width: {
            type: Number,
            required: false
        },

        /**
         * Initial / controlled height in pixels. Omit to keep CSS height until the first drag.
         */
        height: {
            type: Number,
            required: false
        },

        minWidth: {
            type: Number,
            default: 48
        },

        minHeight: {
            type: Number,
            default: 48
        },

        /**
         * Max width in pixels. The parent box is always an additional cap.
         */
        maxWidth: {
            type: Number,
            required: false
        },

        /**
         * Max height in pixels. The parent box is always an additional cap.
         */
        maxHeight: {
            type: Number,
            required: false
        },

        /**
         * Which edges can be dragged: all sides, one axis (`horizontal` / `vertical`), or one side.
         */
        resize: {
            type: String as PropType<ResizeMode>,
            default: "all"
        },

        /**
         * Draw `border-ring` on hover (and while dragging).
         */
        hoverBorder: {
            type: Boolean,
            default: false
        },

        disabled: {
            type: Boolean,
            default: false
        }
    },

    data() {
        return {
            dragging: false,
            currentWidth: null as number | null,
            currentHeight: null as number | null,
            dragEdge: null as ResizeEdge | null,
            startX: 0,
            startY: 0,
            startW: 0,
            startH: 0,
            parentObserver: null as ResizeObserver | null
        };
    },

    computed: {
        allowedEdges(): Set<ResizeEdge> {
            if (this.disabled) {
                return new Set();
            }

            switch (this.resize) {
                case "horizontal":
                    return new Set(["e", "w"]);
                case "vertical":
                    return new Set(["n", "s"]);
                case "left":
                    return new Set(["w"]);
                case "right":
                    return new Set(["e"]);
                case "top":
                    return new Set(["n"]);
                case "bottom":
                    return new Set(["s"]);
                default:
                    return new Set(["n", "s", "e", "w", "ne", "nw", "se", "sw"]);
            }
        },

        handles(): HandleDef[] {
            return [...this.allowedEdges].map((edge) => HANDLE_CLASS[edge]);
        },

        /**
         * Hover/drag ring only on the edges that can be resized.
         */
        hoverBorderClass(): string[] {
            if (!this.hoverBorder) {
                return [];
            }

            const active = this.dragging;

            switch (this.resize) {
                case "horizontal":
                    return [
                        "border-x",
                        active ? "border-x-ring!" : "hover:border-x-ring!"
                    ];
                case "vertical":
                    return [
                        "border-y",
                        active ? "border-y-ring!" : "hover:border-y-ring!"
                    ];
                case "left":
                    return [
                        "border-l",
                        active ? "border-l-ring!" : "hover:border-l-ring!"
                    ];
                case "right":
                    return [
                        "border-r",
                        active ? "border-r-ring!" : "hover:border-r-ring!"
                    ];
                case "top":
                    return [
                        "border-t",
                        active ? "border-t-ring!" : "hover:border-t-ring!"
                    ];
                case "bottom":
                    return [
                        "border-b",
                        active ? "border-b-ring!" : "hover:border-b-ring!"
                    ];
                default:
                    return [
                        "border",
                        "border-transparent",
                        active ? "border-ring!" : "hover:border-ring!"
                    ];
            }
        },

        boxStyle(): Record<string, string> {
            const style: Record<string, string> = {};

            if (this.currentWidth != null) {
                style.width = `${this.currentWidth}px`;
            }

            if (this.currentHeight != null) {
                style.height = `${this.currentHeight}px`;
            }

            return style;
        }
    },

    watch: {
        width(value: number | undefined) {
            if (this.dragging) {
                return;
            }

            this.currentWidth = value ?? null;
        },

        height(value: number | undefined) {
            if (this.dragging) {
                return;
            }

            this.currentHeight = value ?? null;
        }
    },

    mounted() {
        this.currentWidth = this.width ?? null;
        this.currentHeight = this.height ?? null;
        this.observeParent();
    },

    beforeUnmount() {
        this.stopListening();
        this.disconnectParent();
    },

    methods: {
        /**
         * Watches the constraint parent so a smaller container clamps this box.
         */
        observeParent() {
            this.disconnectParent();

            const parent = this.constraintParent();

            if (!parent || typeof ResizeObserver === "undefined") {
                return;
            }

            this.parentObserver = new ResizeObserver(() => {
                this.clampToParent();
            });

            this.parentObserver.observe(parent);
        },

        disconnectParent() {
            this.parentObserver?.disconnect();
            this.parentObserver = null;
        },

        /**
         * Finds a parent with a real laid-out size that is not shrink-wrapping this box.
         */
        constraintParent(): HTMLElement | null {
            const el = this.$refs.box as HTMLElement | undefined;

            if (!el) {
                return null;
            }

            let node = el.parentElement;

            while (node && node !== document.documentElement) {
                const wrapsChild = Math.abs(node.clientWidth - el.offsetWidth) <= 1
                    && Math.abs(node.clientHeight - el.offsetHeight) <= 1;
                const hasBox = node.clientWidth > 0 && node.clientHeight > 0;

                if (hasBox && !wrapsChild) {
                    return node;
                }

                node = node.parentElement;
            }

            return document.body;
        },

        parentLimits(): { maxW: number; maxH: number } {
            const el = this.$refs.box as HTMLElement | undefined;
            const parent = this.constraintParent();

            if (!el || !parent) {
                return {
                    maxW: Number.POSITIVE_INFINITY,
                    maxH: Number.POSITIVE_INFINITY
                };
            }

            const parentRect = parent.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();

            return {
                maxW: Math.max(this.minWidth, parentRect.right - elRect.left),
                maxH: Math.max(this.minHeight, parentRect.bottom - elRect.top)
            };
        },

        /**
         * Clamps a width to min, max prop, and parent width.
         */
        clampWidth(value: number): number {
            const { maxW } = this.parentLimits();
            const cap = Math.min(this.maxWidth ?? Number.POSITIVE_INFINITY, maxW);

            return Math.min(Math.max(value, this.minWidth), cap);
        },

        /**
         * Clamps a height to min, max prop, and parent height.
         */
        clampHeight(value: number): number {
            const { maxH } = this.parentLimits();
            const cap = Math.min(this.maxHeight ?? Number.POSITIVE_INFINITY, maxH);

            return Math.min(Math.max(value, this.minHeight), cap);
        },

        clampToParent() {
            if (this.currentWidth != null) {
                const next = this.clampWidth(this.currentWidth);

                if (next !== this.currentWidth) {
                    this.currentWidth = next;
                    this.$emit("update:width", next);
                }
            }

            if (this.currentHeight != null) {
                const next = this.clampHeight(this.currentHeight);

                if (next !== this.currentHeight) {
                    this.currentHeight = next;
                    this.$emit("update:height", next);
                }
            }
        },

        /**
         * Starts an edge drag and binds window pointer listeners.
         */
        onPointerDown(edge: ResizeEdge, event: PointerEvent) {
            if (this.disabled) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const el = this.$refs.box as HTMLElement;

            this.dragging = true;
            this.dragEdge = edge;
            this.startX = event.clientX;
            this.startY = event.clientY;
            this.startW = el.offsetWidth;
            this.startH = el.offsetHeight;
            this.$emit("resize-start");

            if (this.allowsHorizontal()) {
                this.currentWidth = this.startW;
            }

            if (this.allowsVertical()) {
                this.currentHeight = this.startH;
            }

            document.body.style.userSelect = "none";
            document.body.style.cursor = HANDLE_CLASS[edge].cursor;

            window.addEventListener("pointermove", this.onPointerMove);
            window.addEventListener("pointerup", this.onPointerUp);
            window.addEventListener("pointercancel", this.onPointerUp);
        },

        allowsHorizontal(): boolean {
            return this.resize === "all"
                || this.resize === "horizontal"
                || this.resize === "left"
                || this.resize === "right";
        },

        allowsVertical(): boolean {
            return this.resize === "all"
                || this.resize === "vertical"
                || this.resize === "top"
                || this.resize === "bottom";
        },

        onPointerMove(event: PointerEvent) {
            if (!this.dragging || !this.dragEdge) {
                return;
            }

            const dx = event.clientX - this.startX;
            const dy = event.clientY - this.startY;
            const edge = this.dragEdge;

            if (edge.includes("e") && this.allowsHorizontal()) {
                const next = this.clampWidth(this.startW + dx);

                this.currentWidth = next;
                this.$emit("update:width", next);
            }

            if (edge.includes("w") && this.allowsHorizontal()) {
                const next = this.clampWidth(this.startW - dx);

                this.currentWidth = next;
                this.$emit("update:width", next);
            }

            if (edge.includes("s") && this.allowsVertical()) {
                const next = this.clampHeight(this.startH + dy);

                this.currentHeight = next;
                this.$emit("update:height", next);
            }

            if (edge.includes("n") && this.allowsVertical()) {
                const next = this.clampHeight(this.startH - dy);

                this.currentHeight = next;
                this.$emit("update:height", next);
            }
        },

        onPointerUp() {
            const wasDragging = this.dragging;

            this.dragging = false;
            this.dragEdge = null;
            this.stopListening();

            if (wasDragging) {
                this.$emit("resize-end");
            }
        },

        stopListening() {
            window.removeEventListener("pointermove", this.onPointerMove);
            window.removeEventListener("pointerup", this.onPointerUp);
            window.removeEventListener("pointercancel", this.onPointerUp);

            document.body.style.userSelect = "";
            document.body.style.cursor = "";
        }
    }
});
</script>

<style scoped>
.resizable:not(.absolute):not(.fixed):not(.sticky) {
    position: relative;
}
</style>
