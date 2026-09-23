<template>
    <div
        ref="rootRef"

        :class="rootClass"
    >
        <div
            v-if="showTrigger"
            ref="anchorRef"

            class="w-full"
        >
            <Button
                v-if="!$slots.button && !isControlled"

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
            :max-height-px="maxHeightPx"
            :min-width-px="minWidthPx"
            :mobile-modal="mobileModal"
            :force-modal="forceModal"
            :open="panelBindOpen"

            @update:open="onPanelOpenUpdate"
        >
            <OptionsList
                v-model:search-query="searchQuery"
                :options="options"
                :search="search"
                :show-checkmark="showCheckmark"
                :is-option-selected="isOptionSelected"
                :max-height-px="maxHeightPx"

                @select="onSelect"
                @search:external="onSearchExternal"
            />
        </FloatingPanel>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Button from "./Button.vue";
import FloatingPanel from "./internal/FloatingPanel.vue";
import OptionsList, {
    type OptionItem,
    type SearchConfig,
    type SearchExternalPayload
} from "./internal/OptionsList.vue";

export default defineComponent({
    name: "Dropdown",

    components: {
        Button,
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
            type: Function as PropType<
                (value: string | undefined, item?: OptionItem, parent?: OptionItem) => boolean
            >,
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

    emits: ["click:value", "update:open", "search:external"],

    data() {
        return {
            searchQuery: "",
            triggerEl: null as HTMLElement | null,
            internalOpen: false
        };
    },

    computed: {
        isControlled(): boolean {
            return this.open !== undefined;
        },

        panelBindOpen(): boolean {
            return this.isControlled ? Boolean(this.open) : this.internalOpen;
        },

        isOpen(): boolean {
            return this.panelBindOpen;
        },

        showTrigger(): boolean {
            return Boolean(this.$slots.button || !this.isControlled);
        },

        /**
         * Controlled menus without `#button` overlay the wrapping parent
         * (`relative` + the external trigger) so the panel can measure it.
         */
        rootClass(): string {
            if (!this.showTrigger) {
                return "pointer-events-none absolute inset-0";
            }

            return "relative inline-block w-full";
        }
    },

    mounted() {
        this.syncTriggerEl();
    },

    updated() {
        this.syncTriggerEl();
    },

    methods: {
        syncTriggerEl() {
            const trigger = this.$refs.anchorRef as HTMLElement | undefined;

            if (trigger) {
                if (trigger !== this.triggerEl) {
                    this.triggerEl = trigger;
                }

                return;
            }

            const root = this.$refs.rootRef as HTMLElement | undefined;
            const el = root?.parentElement ?? root ?? null;

            if (el !== this.triggerEl) {
                this.triggerEl = el;
            }
        },

        onSelect(value: string, item?: OptionItem, parent?: OptionItem) {
            this.$emit("click:value", value, item, parent);

            if (this.closeOnSelect) {
                this.close();
            }
        },

        onSearchExternal(payload: SearchExternalPayload) {
            this.$emit("search:external", payload);
        },

        onPanelOpenUpdate(next: boolean) {
            if (this.isControlled) {
                this.$emit("update:open", next);

                return;
            }

            this.internalOpen = next;
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
