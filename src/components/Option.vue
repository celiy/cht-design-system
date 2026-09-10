<template>
    <div
        class="block rounded bg-popover text-sm transition-all select-none"
        v-bind="$attrs"
        :class="{
            'text-destructive!': isDestructive,
            'bg-destructive/20!': showCheckmark && selected && isDestructive,
            'bg-destructive/30!': highlighted && !$project.device.isMobile && isDestructive,
            'hover:bg-destructive/30!': isSelectable && isDestructive,

            'text-popover-foreground': !isDestructive,
            'bg-accent/50!': showCheckmark && selected && !isDestructive,
            'bg-accent!': highlighted && !$project.device.isMobile && !isDestructive,
            'hover:bg-accent': isSelectable && !isDestructive,

            'mx-1 cursor-pointer px-2.5 py-1.5': isSelectable,
            'm-1 p-1 px-2.5 text-sm font-semibold text-muted-foreground!': isHeading,
            'mt-1': first,
            'mb-1': last
        }"

        @click="$emit('click', $event)"
        @mouseenter="$emit('mouseenter', $event)"
    >
        <div class="flex flex-nowrap items-center justify-between gap-4">
            <div class="flex w-full flex-nowrap items-center">
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

                    class="truncate font-medium"
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

    emits: ["click", "mouseenter"],

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
