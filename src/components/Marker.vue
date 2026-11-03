<template>
    <div
        v-if="separator"

        :class="{
            'flex items-center': hasContent,
            'flex-col justify-center': hasContent && orientation === 'vertical'
        }"
    >
        <div :class="lineClass('before')" />

        <small
            v-if="hasLabel"

            class="text-muted-foreground!"
            :class="orientation === 'vertical' ? 'py-4' : 'px-4'"
        >
            <slot name="label" />

            <template v-if="!$slots.label">
                {{ label }}
            </template>
        </small>

        <span
            v-else-if="centerIcon"

            :class="[
                `fa-solid ${centerIcon} text-muted-foreground!`,
                {
                    'mx-4': orientation === 'horizontal',
                    'my-4': orientation === 'vertical'
                }
            ]"
        />

        <div
            v-if="hasContent"

            :class="lineClass('after')"
        />
    </div>

    <!-- Marker with label, left icon or left number -->
    <div
        v-else

        class="flex items-center"
    >
        <span
            v-if="leftIcon"

            :class="`fa-solid ${leftIcon} mr-3 text-muted-foreground!`"
        />

        <div
            v-if="leftNumber"

            :class="[
                `mr-3 flex h-6 w-6 items-center justify-center rounded-full text-sm`,
                {
                    'bg-muted text-foreground': color === 'foreground',
                    'bg-muted text-muted-foreground': color === 'muted'
                }
            ]"
        >
            {{ leftNumber }}
        </div>

        <span
            class="font-medium"
            :class="{
                'text-foreground': color === 'foreground',
                'text-muted-foreground': color === 'muted'
            }"
        >
            <slot name="label" />

            <template v-if="!$slots.label">
                {{ label }}
            </template>
        </span>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: "Marker",

    props: {
        /**
         * The label of the marker
         */
        label: {
            type: String,
            required: false
        },

        /**
         * The left icon of the marker
         */
        leftIcon: {
            type: String,
            required: false
        },

        /**
         * Whether the marker is center icon
         */
        centerIcon: {
            type: String,
            required: false
        },

        /**
         * Whether the marker is left number
         */
        leftNumber: {
            type: Number,
            required: false
        },

        /**
         * Whether the marker is separator
         */
        separator: {
            type: Boolean,
            required: false
        },

        /**
         * The orientation of the marker
         */
        orientation: {
            type: String as PropType<"horizontal" | "vertical">,
            default: "horizontal",
            required: false
        },

        /**
         * Where the separator label or center icon sits along the line
         */
        contentPosition: {
            type: String as PropType<"start" | "center" | "end">,
            default: "center",
            required: false
        },

        /**
         * The color of the marker
         */
        color: {
            type: String as PropType<"foreground" | "muted">,
            default: "muted",
            required: false
        }
    },

    computed: {
        /**
         * Checks if label
         * @returns {boolean} True if has label
         */
        hasLabel(): boolean {
            if (this.label || this.$slots.label) {
                return true;
            }

            return false;
        },

        hasContent(): boolean {
            return this.hasLabel || Boolean(this.centerIcon);
        }
    },

    methods: {
        /**
         * Line on one side of the separator content. The side next to `contentPosition` stays short.
         * @param {"before" | "after"} side The line side
         * @returns {string[]} The line classes
         */
        lineClass(side: "before" | "after"): string[] {
            const isVertical = this.orientation === "vertical";
            const border = isVertical ? "border-r" : "border-t";

            if (!this.hasContent) {
                return isVertical ? [border, "h-full w-fit"] : [border, "w-full"];
            }

            const isShort =
                (side === "before" && this.contentPosition === "start") ||
                (side === "after" && this.contentPosition === "end");

            if (isShort) {
                return [border, "shrink-0", isVertical ? "h-8" : "w-8"];
            }

            return [border, "min-h-0 min-w-0 flex-1"];
        }
    }
});
</script>
