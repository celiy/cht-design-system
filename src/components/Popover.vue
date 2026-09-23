<template>
    <div class="relative inline-block w-full">
        <div
            ref="anchorRef"

            class="w-full"

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

        buttonAtributes: {
            type: Object,
            required: false
        },

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
            required: false
        },

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
        isOpen(): boolean {
            return this.internalOpen;
        }
    },

    mounted() {
        this.syncTriggerEl();
    },

    updated() {
        this.syncTriggerEl();
    },

    methods: {
        onPanelOpenUpdate(next: boolean) {
            this.internalOpen = next;
        },

        syncTriggerEl() {
            const el = this.$refs.anchorRef as HTMLElement | undefined;

            if (el !== this.triggerEl) {
                this.triggerEl = el ?? null;
            }
        },

        onTriggerEnter() {
            if (this.openOnHover) {
                this.openPanel();
            }
        },

        onTriggerLeave() {
            if (this.openOnHover) {
                const panel = this.$refs.panelRef as InstanceType<typeof FloatingPanel> | undefined;
                panel?.requestHoverClose();
            }
        },

        onTriggerActivate(event: KeyboardEvent) {
            if (this.isOpen) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            this.openPanel();
        },

        openPanel() {
            const panel = this.$refs.panelRef as InstanceType<typeof FloatingPanel> | undefined;
            panel?.openPanel();
        },

        open() {
            this.openPanel();
        },

        close() {
            const panel = this.$refs.panelRef as InstanceType<typeof FloatingPanel> | undefined;
            panel?.close();
        },

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
