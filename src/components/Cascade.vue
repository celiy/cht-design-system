<template>
    <div class="w-full">
        <!-- Header -->
        <button
            type="button"
            class="flex w-full cursor-pointer items-center justify-between text-left select-none"
            :class="headerClass"
            :aria-expanded="isOpen"

            @click="toggle"
        >
            <span class="flex min-w-0 flex-1 items-center">
                <slot
                    name="header"
                    :is-open="isOpen"
                />
            </span>

            <!-- Arrow, rotates when open -->
            <span
                v-if="$slots.icon"

                class="inline-flex shrink-0 items-center transition-transform duration-300"
                :class="[{ 'rotate-180': isOpen }, iconClass]"
            >
                <slot
                    name="icon"
                    :is-open="isOpen"
                />
            </span>
        </button>

        <!-- Content -->
        <div
            class="grid w-full transition-[grid-template-rows] duration-300 ease-out"
            :class="isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
        >
            <div class="min-h-0 overflow-hidden">
                <div :class="contentClass">
                    <slot :is-open="isOpen" />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    name: "Cascade",

    props: {
        /**
         * Controlled open state. Leave it out and the Cascade keeps its own state.
         */
        open: {
            type: Boolean,
            default: undefined,
            required: false
        },

        /**
         * Initial open state when `open` is not controlled
         */
        defaultOpen: {
            type: Boolean,
            default: false,
            required: false
        },

        /**
         * Classes of the header button: text, background, border, padding, hover
         */
        headerClass: {
            type: [String, Array, Object],
            required: false
        },

        /**
         * Classes of the `icon` slot wrapper, which rotates when open
         */
        iconClass: {
            type: [String, Array, Object],
            required: false
        },

        /**
         * Classes of the wrapper around the content
         */
        contentClass: {
            type: [String, Array, Object],
            required: false
        }
    },

    emits: ["update:open", "change"],

    data() {
        return {
            internalOpen: this.defaultOpen
        };
    },

    computed: {
        isOpen(): boolean {
            return this.open ?? this.internalOpen;
        }
    },

    methods: {
        toggle() {
            const next = !this.isOpen;

            this.internalOpen = next;
            this.$emit("update:open", next);
            this.$emit("change", next);
        }
    }
});
</script>
