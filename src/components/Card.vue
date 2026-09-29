<template>
    <div
        class="w-full rounded shadow-md"
        :class="[borderClass, backgroundClass, stretchClass]"
    >
        <!-- Header -->
        <template v-if="$slots.header">
            <div
                class="grid"
                :class="$slots.headerRightSide ? 'grid-cols-2' : ''"
            >
                <!-- Header left side -->
                <div class="px-4 pt-3">
                    <slot name="header" />
                </div>

                <!-- Header right side -->
                <div
                    v-if="$slots.headerRightSide"

                    class="px-4 pt-4"
                >
                    <slot name="headerRightSide" />
                </div>
            </div>
        </template>

        <!-- Card -->
        <template v-if="$slots.card">
            <slot name="card" />
        </template>

        <!-- Body -->
        <template v-if="$slots.body">
            <div
                class="px-4 pb-4"
                :class="[
                    {
                        'pt-4': $slots.description || !$slots.header,
                        'pt-2': !$slots.description || !$slots.header
                    },
                    bodyStretchClass
                ]"
            >
                <slot name="body" />
            </div>
        </template>

        <!-- Footer -->
        <template v-if="$slots.footer">
            <div :class="footerClass">
                <slot name="footer" />
            </div>
        </template>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: "Card",

    props: {
        variant: {
            type: String as PropType<"default" | "transparent">,
            default: "default",
            required: false
        },

        borderStyle: {
            type: String,
            required: false
        },

        backgroundStyle: {
            type: String,
            required: false
        },

        footerStyle: {
            type: String,
            required: false
        },

        /**
         * Fill parent height and make `#body` a column so children can use `mt-auto`.
         * Off by default — stretching every Card breaks equal-height grids (e.g. docs home).
         */
        stretch: {
            type: Boolean,
            default: false
        }
    },

    computed: {
        stretchClass() {
            return this.stretch ? "flex h-full flex-col" : "";
        },

        bodyStretchClass() {
            return this.stretch ? "flex flex-1 flex-col" : "";
        },

        borderClass() {
            if (this.borderStyle) {
                return this.borderStyle;
            }

            return {
                "border border-border/50!": this.variant === "default"
            };
        },

        backgroundClass() {
            if (this.backgroundStyle) {
                return this.backgroundStyle;
            }

            return {
                "bg-card": this.variant === "default",
                "bg-transparent": this.variant === "transparent"
            };
        },

        footerClass() {
            if (this.footerStyle) {
                return this.footerStyle;
            }

            return "rounded-b border-t bg-muted/50 p-4";
        }
    }
});
</script>
