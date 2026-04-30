<template>
    <FloatingPanel
        ref="panelRef"

        :header="header"
        :buttonAtributes="buttonAtributes"
        :buttonVariant="buttonVariant"
        :hideDropdownArrow="hideDropdownArrow"
        :openOnHover="openOnHover"
        :closeOnContentClick="closeOnContentClick"
        :maxHeightPx="maxHeightPx"
        :minWidthPx="minWidthPx"

        :panelClass="panelClass"
    >
        <template
            v-if="$slots.button"

            #button="slotProps"
        >
            <slot
                name="button"

                v-bind="slotProps"
            />
        </template>

        <template #default="slotProps">
            <slot v-bind="slotProps" />
        </template>
    </FloatingPanel>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import FloatingPanel from "./internal/FloatingPanel.vue";

export default defineComponent({
    name: "Popover",

    components: {
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

        buttonVariant: {
            type: String,
            default: "secondary",
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
        }
    },

    methods: {
        open() {
            const panel = this.$refs.panelRef as InstanceType<typeof FloatingPanel> | undefined;
            panel?.open();
        },

        close() {
            const panel = this.$refs.panelRef as InstanceType<typeof FloatingPanel> | undefined;
            panel?.close();
        },

        toggleOpenClose() {
            const panel = this.$refs.panelRef as InstanceType<typeof FloatingPanel> | undefined;
            panel?.toggleOpenClose();
        }
    }
});
</script>
