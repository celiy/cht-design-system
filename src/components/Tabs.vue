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
    <div class="w-full">
        <div
            ref="tabList"

            class="relative mb-2 flex w-fit scrollbar-thin overflow-x-auto rounded p-1"
            :class="{
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

                    rounded: variant === 'secondary',
                    'border-ring/50': index === activeTab && variant === 'secondary',
                    'border-transparent': index !== activeTab && variant === 'secondary',

                    'border-b-2-transparent': variant === 'transparent',
                    'text-primary': index === activeTab && variant === 'transparent',
                    'rounded-none!': variant === 'transparent'
                }"

                @click="switchTab(index)"
            >
                <slot :name="`tab-title-${index}`" />
            </button>

            <!-- Underline, slides to the active tab -->
            <div
                v-if="variant === 'transparent'"

                class="pointer-events-none absolute top-0 left-0 h-0.5 bg-primary"
                :style="barStyle"
            />
        </div>

        <div
            v-for="(_, index) in tabCount"
            v-show="activeTab === index"
            :key="index"
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
        }
    },

    data() {
        return {
            activeTab: 0,
            tabCount: 0,
            bar: { x: 0, y: 0, width: 0, measured: false, animate: false },
            resizeObserver: null as ResizeObserver | null
        };
    },

    computed: {
        /**
         * Gets the underline style. The first measure is placed without transition
         * @returns {Record<string, string>} The style
         */
        barStyle(): Record<string, string> {
            return {
                width: `${this.bar.width}px`,
                translate: `${this.bar.x}px ${this.bar.y}px`,
                transition: this.bar.animate
                    ? "translate 200ms ease-out, width 200ms ease-out"
                    : "none",
                visibility: this.bar.measured ? "visible" : "hidden"
            };
        }
    },

    watch: {
        activeTab() {
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

            const x = button.offsetLeft;
            const y = button.offsetTop + button.offsetHeight - 2;
            const width = button.offsetWidth;

            if (
                this.bar.measured &&
                this.bar.x === x &&
                this.bar.y === y &&
                this.bar.width === width
            ) {
                return;
            }

            this.bar = { x, y, width, measured: true, animate: this.bar.measured };
        },

        /**
         * Switch tab
         * @param {number} tab The tab
         * @returns {void}
         */
        switchTab(tab: number) {
            this.activeTab = tab;
        }
    }
});
</script>
