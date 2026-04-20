<template>
    <FloatingPanel
        ref="panelRef"

        :header="header"
        :buttonAtributes="buttonAtributes"
        :buttonVariant="buttonVariant"
        :hideDropdownArrow="hideDropdownArrow"
        :maxHeightPx="maxHeightPx"
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
                v-model:searchQuery="searchQuery"

                :options="options"
                :search="search"

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

    emits: ["click:value"],

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

        buttonVariant: {
            type: String,
            default: "secondary",
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
        }
    },

    data() {
        return {
            searchQuery: ""
        };
    },

    methods: {
        onSelect(value: string) {
            this.$emit("click:value", value);

            if (this.closeOnSelect) {
                this.close();
            }
        },

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
