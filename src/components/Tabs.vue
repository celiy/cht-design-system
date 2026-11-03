<!--
Example on how to use this component:

<TabsComponent>
    <template #tab-title-0>
        TAB TITLE 0
    </template>

    <template #tab-content-0>
        CONTENT 0
    </template>

    <template #tab-title-1>
        TAB TITLE 1
    </template>

    <template #tab-content-1>
        CONTENT 1
    </template>
</TabsComponent>
-->

<template>
    <div
        class="flex w-full"
        :class="{
            'flex-col': position === 'top',
            'flex-col-reverse': position === 'bottom',
            'flex-row items-start': position === 'left',
            'flex-row-reverse items-start': position === 'right'
        }"
    >
        <div
            ref="tabList"

            class="relative flex scrollbar-thin rounded p-1"
            :class="{
                'w-fit overflow-x-auto': !isVertical,
                'h-fit w-fit shrink-0 flex-col overflow-y-auto': isVertical,
                'mb-2': position === 'top',
                'mt-2': position === 'bottom',
                'mr-2': position === 'left',
                'ml-2': position === 'right',
                'bg-secondary': variant === 'secondary',
                'bg-transparent': variant === 'transparent'
            }"
        >
            <button
                v-for="(_, index) in tabCount"
                :key="index"

                class="bg-transparent p-3 text-sm leading-1 font-medium transition-all dark:hover:brightness-150 light:hover:brightness-50"
                :class="{
                    'text-foreground': index === activeTab,
                    'text-muted-foreground': index !== activeTab,
                    'text-left': position === 'left',
                    'text-right': position === 'right',

                    rounded: variant === 'secondary',
                    'border-ring/50': index === activeTab && variant === 'secondary',
                    'border-transparent': index !== activeTab && variant === 'secondary',

                    'border-b-2-transparent': variant === 'transparent' && position === 'top',
                    'border-t-2-transparent': variant === 'transparent' && position === 'bottom',
                    'border-r-2-transparent': variant === 'transparent' && position === 'left',
                    'border-l-2-transparent': variant === 'transparent' && position === 'right',
                    'text-primary': index === activeTab && variant === 'transparent',
                    'rounded-none!': variant === 'transparent'
                }"
                :aria-selected="index === activeTab"
                role="tab"

                @click="switchTab(index)"
                @mouseenter="openOnHover && switchTab(index)"
            >
                <slot :name="`tab-title-${index}`" />
            </button>

            <div
                v-if="$slots['tab-bar']"

                class="flex items-center"
                :class="isVertical ? 'flex-col' : 'flex-row'"
            >
                <slot name="tab-bar" />
            </div>

            <!-- Indicator, slides to the active tab on the edge that faces the content -->
            <div
                v-if="variant === 'transparent'"

                class="pointer-events-none absolute top-0 left-0 bg-primary"
                :style="barStyle"
            />
        </div>

        <div
            v-for="(_, index) in tabCount"
            v-show="activeTab === index"
            :key="index"

            :class="{ 'min-w-0 flex-1': isVertical }"
        >
            <slot :name="`tab-content-${index}`" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: "Tabs",

    props: {
        /**
         * The variant of the tabs
         */
        variant: {
            type: String as PropType<"secondary" | "transparent">,
            default: "secondary",
            required: false
        },

        /**
         * Active tab index for `v-model`. Optional: without it the tabs keep their own state.
         */
        modelValue: {
            type: Number,
            required: false
        },

        /**
         * Switches to a tab when the pointer enters its button.
         */
        openOnHover: {
            type: Boolean,
            default: false,
            required: false
        },

        /**
         * Side where the tab buttons sit relative to the content.
         */
        position: {
            type: String as PropType<"top" | "bottom" | "left" | "right">,
            default: "top",
            required: false
        }
    },

    emits: ["update:modelValue", "change"],

    data() {
        return {
            activeTab: this.modelValue ?? 0,
            tabCount: 0,
            bar: { x: 0, y: 0, width: 0, height: 0, measured: false, animate: false },
            resizeObserver: null as ResizeObserver | null
        };
    },

    computed: {
        isVertical(): boolean {
            return this.position === "left" || this.position === "right";
        },

        /**
         * Gets the underline style. The first measure is placed without transition
         * @returns {Record<string, string>} The style
         */
        barStyle(): Record<string, string> {
            return {
                width: `${this.bar.width}px`,
                height: `${this.bar.height}px`,
                translate: `${this.bar.x}px ${this.bar.y}px`,
                transition: this.bar.animate
                    ? "translate 200ms ease-out, width 200ms ease-out, height 200ms ease-out"
                    : "none",
                visibility: this.bar.measured ? "visible" : "hidden"
            };
        }
    },

    watch: {
        activeTab() {
            this.$nextTick(() => this.updateBar());
        },

        modelValue(value: number | undefined) {
            if (value !== undefined) {
                this.activeTab = value;
            }
        },

        position() {
            this.$nextTick(() => this.updateBar());
        },

        tabCount() {
            this.$nextTick(() => this.updateBar());
        },

        variant() {
            this.$nextTick(() => this.updateBar());
        }
    },

    /**
     * Mounts the component
     * @returns {void}
     */
    mounted() {
        this.refreshTabCount();

        // Also fires when a hidden Tabs becomes visible, so the underline gets measured then
        this.resizeObserver = new ResizeObserver(() => this.updateBar());
        this.resizeObserver.observe(this.$refs.tabList as HTMLElement);
        this.updateBar();
    },

    /**
     * Unmounts the component
     * @returns {void}
     */
    beforeUnmount() {
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
    },

    /**
     * Updates the component
     * @returns {void}
     */
    updated() {
        this.refreshTabCount();
    },

    methods: {
        /**
         * Counts `#tab-title-n` slots, including those created with `v-for`.
         */
        refreshTabCount() {
            let index = 0;

            while (this.$slots[`tab-title-${index}`]) {
                index += 1;
            }

            if (this.tabCount !== index) {
                this.tabCount = index;
            }
        },

        /**
         * Moves the underline under the active tab
         * @returns {void}
         */
        updateBar() {
            const button = (this.$refs.tabList as HTMLElement | undefined)?.children[
                this.activeTab
            ] as HTMLElement | undefined;

            if (this.variant !== "transparent" || !button || button.offsetWidth === 0) {
                return;
            }

            const thickness = 2;
            let x = button.offsetLeft;
            let y = button.offsetTop;
            let width = button.offsetWidth;
            let height = thickness;

            if (this.position === "top") {
                y = button.offsetTop + button.offsetHeight - thickness;
            } else if (this.isVertical) {
                width = thickness;
                height = button.offsetHeight;

                if (this.position === "left") {
                    x = button.offsetLeft + button.offsetWidth - thickness;
                }
            }

            if (
                this.bar.measured &&
                this.bar.x === x &&
                this.bar.y === y &&
                this.bar.width === width &&
                this.bar.height === height
            ) {
                return;
            }

            this.bar = { x, y, width, height, measured: true, animate: this.bar.measured };
        },

        /**
         * Switch tab
         * @param {number} tab The tab
         * @returns {void}
         */
        switchTab(tab: number) {
            if (this.activeTab === tab) {
                return;
            }

            this.activeTab = tab;
            this.$emit("update:modelValue", tab);
            this.$emit("change", tab);
        }
    }
});
</script>
