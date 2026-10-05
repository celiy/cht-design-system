<template>
    <div
        class="relative inline-block"
        :class="{ 'w-full': !$slots.button }"
    >
        <div
            ref="anchorRef"

            :class="{ 'w-full': !$slots.button }"

            @mouseenter="onTriggerEnter"
            @mouseleave="onTriggerLeave"
        >
            <Button
                v-if="!$slots.button"

                v-bind="buttonAtributes"
                class="w-full"
                :class="{
                    'hover-ring': isOpen
                }"
                :hover-effect="false"

                @click.stop="toggleOpenClose"
                @keydown.enter="onTriggerActivate"
                @keydown.space="onTriggerActivate"
            >
                <div class="flex w-full items-center justify-between gap-2">
                    <div class="min-w-0 flex-1 text-left">
                        <slot
                            name="triggerLabel"
                            :is-open="isOpen"
                        >
                            <span>{{ header }}</span>
                        </slot>
                    </div>

                    <i
                        v-if="!hideDropdownArrow"

                        class="fa-solid fa-chevron-down ml-2 text-xs transition-all"
                        :class="{ 'rotate-180': isOpen }"
                    />
                </div>
            </Button>

            <slot
                name="button"
                :is-open="isOpen"
                :toggle="toggleOpenClose"
                :open="openPanel"
                :close="close"
            />
        </div>

        <FloatingPanel
            ref="panelRef"

            :anchor="triggerEl"
            :open-on-hover="openOnHover"
            :close-on-content-click="closeOnContentClick"
            :max-height-px="maxHeightPx"
            :min-width-px="minWidthPx"
            :max-width-px="maxWidthPx"
            :lock-to-anchor="lockToAnchor"
            :mobile-modal="mobileModal"
            :force-modal="forceModal"
            :panel-class="panelClass"
            :open="internalOpen"

            @update:open="onPanelOpenUpdate"
        >
            <template #default="slotProps">
                <slot v-bind="slotProps" />
            </template>
        </FloatingPanel>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Button from "./Button.vue";
import FloatingPanel from "./internal/FloatingPanel.vue";

export default defineComponent({
    name: "Popover",

    components: {
        Button,
        FloatingPanel
    },

    props: {
        /**
         * Whether the popover is header
         */
        header: {
            type: String,
            required: false
        },

        /**
         * Opens the popover on mouse enter and closes on mouse leave.
         */
        openOnHover: {
            type: Boolean,
            default: false
        },

        /**
         * Closes the popover after any click inside the floating content slot.
         */
        closeOnContentClick: {
            type: Boolean,
            default: false
        },

        /**
         * Popovers use the default trigger as a plain action; chevron is off by default.
         * Set to false to show the open/close chevron like Select/Dropdown.
         */
        hideDropdownArrow: {
            type: Boolean,
            default: true
        },

        /**
         * The button atributes of the popover
         */
        buttonAtributes: {
            type: Object,
            required: false
        },

        /**
         * The max height px of the popover
         */
        maxHeightPx: {
            type: Number,
            default: 280
        },

        /**
         * Optional minimum width for the floating panel in pixels.
         * Final panel width is max(trigger width, minWidthPx).
         */
        minWidthPx: {
            type: Number,
            default: 280,
            required: false
        },

        /**
         * Optional maximum width for the floating panel in pixels.
         */
        maxWidthPx: {
            type: Number,
            required: false
        },

        /**
         * Whether the popover locks to the anchor
         */
        lockToAnchor: {
            type: Boolean,
            default: true
        },

        /**
         * The class of the floating panel
         */
        panelClass: {
            type: String,
            default: "text-popover-foreground p-2",
            required: false
        },

        /**
         * When true, narrow viewports open a blank modal instead of the floating panel.
         * Off by default for Popover.
         */
        mobileModal: {
            type: Boolean,
            default: false
        },

        /**
         * Always open a blank modal, including on desktop.
         */
        forceModal: {
            type: Boolean,
            default: false
        }
    },

    data() {
        return {
            triggerEl: null as HTMLElement | null,
            internalOpen: false
        };
    },

    computed: {
        /**
         * Checks if open
         * @returns {boolean} True if is open
         */
        isOpen(): boolean {
            return this.internalOpen;
        }
    },

    /**
     * Mounts the component
     * @returns {void}
     */
    mounted() {
        this.syncTriggerEl();
    },

    /**
     * Updates the component
     * @returns {void}
     */
    updated() {
        this.syncTriggerEl();
    },

    methods: {
        /**
         * Handles the panel open update
         * @param {boolean} next The next
         * @returns {void}
         */
        onPanelOpenUpdate(next: boolean) {
            this.internalOpen = next;
        },

        /**
         * Sync trigger el
         * @returns {void}
         */
        syncTriggerEl() {
            const el = this.$refs.anchorRef as HTMLElement | undefined;

            if (el !== this.triggerEl) {
                this.triggerEl = el ?? null;
            }
        },

        /**
         * Handles the trigger enter
         * @returns {void}
         */
        onTriggerEnter() {
            if (this.openOnHover) {
                this.openPanel();
            }
        },

        /**
         * Handles the trigger leave
         * @returns {void}
         */
        onTriggerLeave() {
            if (this.openOnHover) {
                const panel = this.$refs.panelRef as InstanceType<typeof FloatingPanel> | undefined;
                panel?.requestHoverClose();
            }
        },

        /**
         * Handles the trigger activate
         * @param {KeyboardEvent} event The event
         * @returns {void}
         */
        onTriggerActivate(event: KeyboardEvent) {
            if (this.isOpen) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            this.openPanel();
        },

        /**
         * Open panel
         * @returns {void}
         */
        openPanel() {
            const panel = this.$refs.panelRef as InstanceType<typeof FloatingPanel> | undefined;
            panel?.openPanel();
        },

        /**
         * Open
         * @returns {void}
         */
        open() {
            this.openPanel();
        },

        /**
         * Close
         * @returns {void}
         */
        close() {
            const panel = this.$refs.panelRef as InstanceType<typeof FloatingPanel> | undefined;
            panel?.close();
        },

        /**
         * Toggles the open close
         * @returns {void}
         */
        toggleOpenClose() {
            if (this.openOnHover) {
                return;
            }

            const panel = this.$refs.panelRef as InstanceType<typeof FloatingPanel> | undefined;
            panel?.toggleOpenClose();
        }
    }
});
</script>
