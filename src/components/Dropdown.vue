<template>
    <FloatingPanel
        ref="panelRef"

        :header="header"
        :button-atributes="buttonAtributes"
        :hide-dropdown-arrow="hideDropdownArrow"
        :max-height-px="maxHeightPx"
        :min-width-px="minWidthPx"
        :mobile-modal="mobileModal"
        :force-modal="forceModal"
        v-bind="open === undefined ? {} : { open }"

        @update:open="$emit('update:open', $event)"
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

        <template #default>
            <OptionsList
                v-model:search-query="searchQuery"

                :options="options"
                :search="search"
                :show-checkmark="showCheckmark"
                :is-option-selected="isOptionSelected"

                @select="onSelect"
            />
        </template>
    </FloatingPanel>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import FloatingPanel from "./internal/FloatingPanel.vue";
import OptionsList, { type OptionItem, type SearchConfig } from "./internal/OptionsList.vue";

export default defineComponent({
    name: "Dropdown",

    components: {
        FloatingPanel,
        OptionsList
    },

    props: {
        header: {
            type: String,
            required: false
        },

        options: {
            type: Array as PropType<OptionItem[]>,
            required: false
        },

        /**
         * Enables the search input on top of the options list.
         */
        search: {
            type: Object as PropType<SearchConfig>,
            required: false
        },

        buttonAtributes: {
            type: Object,
            required: false
        },

        hideDropdownArrow: {
            type: Boolean,
            default: false
        },

        /**
         * Closes the menu after selecting an option. Set to false for menus that keep the panel open after click.
         */
        closeOnSelect: {
            type: Boolean,
            default: true
        },

        maxHeightPx: {
            type: Number,
            default: 280
        },

        /**
         * Minimum floating panel width in pixels. The panel is max(trigger, minWidthPx).
         */
        minWidthPx: {
            type: Number,
            default: 192
        },

        mobileModal: {
            type: Boolean,
            default: true
        },

        forceModal: {
            type: Boolean,
            default: false
        },

        /**
         * Shows a checkmark column, same as Select.
         */
        showCheckmark: {
            type: Boolean,
            default: false
        },

        /**
         * Reports whether an option is selected when `showCheckmark` is on.
         */
        isOptionSelected: {
            type: Function as PropType<(value: string | undefined, item?: OptionItem, parent?: OptionItem) => boolean>,
            required: false
        },

        /**
         * When defined, the menu is controlled by the parent (`v-model:open`).
         * The built-in trigger is hidden; use an external button.
         */
        open: {
            type: Boolean as PropType<boolean | undefined>,
            default: undefined
        }
    },

    emits: ["click:value", "update:open"],

    data() {
        return {
            searchQuery: ""
        };
    },

    methods: {
        onSelect(value: string, item?: OptionItem, parent?: OptionItem) {
            this.$emit("click:value", value, item, parent);

            if (this.closeOnSelect) {
                this.close();
            }
        },

        openPanel() {
            const panel = this.$refs.panelRef as InstanceType<typeof FloatingPanel> | undefined;
            panel?.openPanel();
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
