<template>
    <div
        class="block select-none rounded bg-popover text-sm transition-all"
        v-bind="$attrs"

        :class="{
            'text-destructive!': isDestructive,
            'text-popover-foreground': !isDestructive,
            'bg-accent/50!': showCheckmark && selected,
            'bg-accent!': (highlighted && !$project.device.isMobile),
            'hover:bg-accent! cursor-pointer px-2.5 py-1.5 mx-1': isSelectable,
            'p-1 px-2.5 m-1 text-muted-foreground! text-sm font-semibold': isHeading,
            'mt-1': first,
            'mb-1': last
        }"

        @click="$emit('click', $event)"
        @mouseenter="$emit('mouseenter', $event)"
    >
        <div class="flex flex-nowrap items-center justify-between gap-4">
            <div class="w-full flex flex-nowrap items-center">
                <i
                    v-if="icon"

                    :class="`fa-solid ${icon} mr-2 text-sm`"
                />

                <div
                    v-if="separator"

                    class="separator my-1"
                />

                <span
                    v-if="label"

                    class="font-medium truncate"
                    :class="{
                        'text-sm': value,
                        'text-xs': !value
                    }"
                >
                    {{ label }}
                </span>
            </div>

            <i
                v-if="showCheckmark"

                class="fa-solid fa-check text-xs text-muted-foreground"
                :class="{
                    'opacity-100': selected,
                    'opacity-0': !selected
                }"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: "Option",

    inheritAttrs: false,

    emits: ["click", "mouseenter"],

    props: {
        label: {
            type: String,
            required: false
        },

        icon: {
            type: String,
            required: false
        },

        separator: {
            type: Boolean,
            default: false
        },

        /**
         * When set, the label uses option size (`text-sm`); without it, heading size (`text-xs`).
         */
        value: {
            type: String,
            required: false
        },

        variant: {
            type: String as PropType<"destructive">,
            required: false
        },

        showCheckmark: {
            type: Boolean,
            default: false
        },

        selected: {
            type: Boolean,
            default: false
        },

        highlighted: {
            type: Boolean,
            default: false
        },

        first: {
            type: Boolean,
            default: false
        },

        last: {
            type: Boolean,
            default: false
        }
    },

    computed: {
        isSelectable(): boolean {
            return !this.separator && Boolean(this.value);
        },

        isDestructive(): boolean {
            return this.variant === "destructive" && this.isSelectable;
        },

        isHeading(): boolean {
            return Boolean(this.label) && !this.value && !this.separator;
        }
    }
});
</script>
