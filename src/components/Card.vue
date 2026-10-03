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
            <footer :class="footerClass">
                <slot name="footer" />
            </footer>
        </template>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: "Card",

    props: {
        /**
         * The variant of the card
         */
        variant: {
            type: String as PropType<"default" | "transparent">,
            default: "default",
            required: false
        },

        /**
         * The border style of the card
         */
        borderStyle: {
            type: String,
            required: false
        },

        /**
         * The background style of the card
         */
        backgroundStyle: {
            type: String,
            required: false
        },

        /**
         * Whether the card is footer style
         */
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
        /**
         * The stretch class
         * @returns {string} The stretch class
         */
        stretchClass() {
            return this.stretch ? "flex h-full flex-col" : "";
        },

        /**
         * The body stretch class
         * @returns {string} The body stretch class
         */
        bodyStretchClass() {
            return this.stretch ? "flex flex-1 flex-col" : "";
        },

        /**
         * The border class
         * @returns {string} The border class
         */
        borderClass() {
            if (this.borderStyle) {
                return this.borderStyle;
            }

            return {
                "border border-border/50!": this.variant === "default"
            };
        },

        /**
         * The background class
         * @returns {string} The background class
         */
        backgroundClass() {
            if (this.backgroundStyle) {
                return this.backgroundStyle;
            }

            return {
                "bg-card": this.variant === "default",
                "bg-transparent": this.variant === "transparent"
            };
        },

        /**
         * The footer class
         * @returns {string} The footer class
         */
        footerClass() {
            if (this.footerStyle) {
                return this.footerStyle;
            }

            return "rounded-b border-t bg-muted/50 p-4";
        }
    }
});
</script>
