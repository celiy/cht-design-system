<template>
    <div
        ref="root"

        class="cht-scrollable relative min-h-0 overflow-hidden"
        :class="{ 'cht-scrollable--always': alwaysVisible }"
        :data-side="side"
        :style="rootStyle"
    >
        <div class="cht-scrollable__body min-h-0">
            <slot />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import SimpleScrollbar from "simple-scrollbar";
import "simple-scrollbar/simple-scrollbar.css";

type ScrollableSide = "left" | "right";

type SimpleScrollbarApi = {
    initEl(element: Element): void;
    unbindEl?(element: Element): void;
};

function getSimpleScrollbar(): SimpleScrollbarApi {
    const mod = SimpleScrollbar as unknown as SimpleScrollbarApi & {
        default?: SimpleScrollbarApi;
    };

    if (typeof mod.initEl === "function") {
        return mod;
    }

    if (mod.default && typeof mod.default.initEl === "function") {
        return mod.default;
    }

    return mod;
}

export default defineComponent({
    name: "Scrollable",

    props: {
        /**
         * Vertical thumb side. The underlying library only paints a vertical bar.
         */
        side: {
            type: String as PropType<ScrollableSide>,
            default: "right",
            validator: (value: string) => value === "left" || value === "right"
        },
        /**
         * Thumb fill. Any CSS color; defaults to muted foreground.
         */
        color: {
            type: String,
            default: ""
        },
        /**
         * Thumb width in pixels.
         */
        size: {
            type: Number,
            default: 9
        },
        /**
         * Keep the thumb visible instead of only on hover.
         */
        alwaysVisible: {
            type: Boolean,
            default: false
        }
    },

    data() {
        return {
            bound: false,
            resizeObserver: null as ResizeObserver | null
        };
    },

    computed: {
        /**
         * Get the root style.
         */
        rootStyle(): Record<string, string> {
            const style: Record<string, string> = {
                "--ss-thumb-width": `${this.size}px`,
                "--ss-thumb-radius": `${Math.max(this.size / 2, 2)}px`
            };

            if (this.color) {
                style["--ss-thumb"] = this.color;
            }

            return style;
        }
    },

    watch: {
        /**
         * Watch the side property and rebind the scrollbar when it changes.
         */
        side() {
            this.rebind();
        }
    },

    mounted() {
        this.bind();
    },

    beforeUnmount() {
        this.unbind();
    },

    methods: {
        /**
         * Bind the scrollbar to the root element.
         */
        bind() {
            const root = this.$refs.root;

            if (!(root instanceof HTMLElement) || this.bound) {
                return;
            }

            getSimpleScrollbar().initEl(root);
            this.bound = true;
            this.observeContent(root);
        },

        /**
         * Unbind the scrollbar from the root element.
         */
        unbind() {
            this.disconnectObserver();

            const root = this.$refs.root;

            if (!(root instanceof HTMLElement) || !this.bound) {
                this.bound = false;
                return;
            }

            getSimpleScrollbar().unbindEl?.(root);
            this.bound = false;
        },

        /**
         * Rebind the scrollbar to the root element.
         */
        rebind() {
            this.unbind();
            this.$nextTick(() => {
                this.bind();
            });
        },

        /**
         * Observe the content of the root element.
         */
        observeContent(root: HTMLElement) {
            this.disconnectObserver();

            const content = root.querySelector(".ss-content");

            if (!(content instanceof HTMLElement) || typeof ResizeObserver === "undefined") {
                return;
            }

            const observer = new ResizeObserver(() => {
                this.refreshBar(root);
            });

            observer.observe(content);
            this.resizeObserver = observer;
        },

        /**
         * Disconnect the observer from the root element.
         */
        disconnectObserver() {
            this.resizeObserver?.disconnect();
            this.resizeObserver = null;
        },

        /**
         * Refresh the scrollbar.
         */
        refreshBar(root: HTMLElement) {
            const instance = (
                root as HTMLElement & {
                    ["data-simple-scrollbar"]?: { moveBar?: () => void };
                }
            )["data-simple-scrollbar"];

            instance?.moveBar?.();
        }
    }
});
</script>

<style>
.cht-scrollable {
    --ss-thumb: color-mix(in oklab, var(--color-muted-foreground) 55%, transparent);
    --ss-thumb-width: 9px;
    --ss-thumb-radius: 4px;
}

.cht-scrollable .ss-wrapper {
    float: none;
}

.cht-scrollable .ss-content {
    width: 100%;
    scrollbar-width: none;
}

.cht-scrollable .ss-content::-webkit-scrollbar {
    width: 0;
    height: 0;
}

.cht-scrollable .ss-scroll {
    position: absolute;
    background: var(--ss-thumb);
    width: var(--ss-thumb-width);
    border-radius: var(--ss-thumb-radius);
}

.cht-scrollable[data-side="left"] .ss-scroll {
    left: 0 !important;
    right: auto !important;
}

.cht-scrollable--always .ss-scroll {
    opacity: 1;
}
</style>
