<template>
    <div
        class="block rounded text-sm transition-all select-none"
        v-bind="$attrs"
        :class="{
            'text-destructive!': isDestructive,
            'bg-destructive/20!':
                (showCheckmark || showCheckboxSwitch) && selected && isDestructive && !hasChildren,
            'bg-destructive/30!': highlighted && !$project.device.isMobile && isDestructive,
            'hover:bg-destructive/30!': isSelectable && isDestructive && !disabled,

            'text-popover-foreground': !isDestructive,
            'bg-accent/50':
                (showCheckmark || showCheckboxSwitch) &&
                selected &&
                !highlighted &&
                !isDestructive &&
                !hasChildren,
            'bg-accent!': highlighted && !$project.device.isMobile && !isDestructive,
            'hover:bg-accent': isSelectable && !isDestructive && !disabled,

            'mx-1 cursor-pointer px-2.5 py-1.5': isSelectable && !disabled,
            'mx-1 cursor-not-allowed px-2.5 py-1.5 opacity-80': isSelectable && disabled,
            'm-1 p-1 px-2.5 text-sm font-semibold text-muted-foreground!': isHeading,
            'mt-1': first,
            'mb-1': last
        }"

        @click="$emit('click', $event)"
        @mouseenter="$emit('mouseenter', $event)"
    >
        <div class="flex flex-nowrap items-center justify-between gap-2">
            <div class="flex w-full flex-nowrap items-center gap-2">
                <span
                    v-if="indicator"

                    class="block shrink-0 rounded-full border border-current/10"
                    :style="indicatorStyle"
                />

                <i
                    v-if="icon"

                    :class="`fa-solid ${icon} text-sm`"
                />

                <Marker
                    v-if="separator"

                    class="my-1 w-full"
                    separator
                />

                <span
                    v-if="label"

                    class="w-full truncate text-sm font-medium"
                >
                    <template v-if="labelHelper && label && labelHelperPosition === 'left'">
                        <div class="flex gap-2">
                            <span>
                                {{ label }}
                            </span>

                            <span class="text-muted-foreground!">
                                {{ labelHelper }}
                            </span>
                        </div>
                    </template>

                    <template v-else-if="labelHelper && label && labelHelperPosition === 'right'">
                        <div class="flex justify-between">
                            <span>
                                {{ label }}
                            </span>

                            <span class="text-muted-foreground!">
                                {{ labelHelper }}
                            </span>
                        </div>
                    </template>

                    <template v-else>
                        <span>
                            {{ label }}
                        </span>
                    </template>
                </span>
            </div>

            <div
                v-if="showCheckmark || showCheckboxSwitch || hasChildren"

                class="flex shrink-0 items-center gap-2"
            >
                <i
                    v-if="showCheckmark && !hasChildren && !showCheckboxSwitch"

                    class="fa-solid fa-check text-xs text-muted-foreground"
                    :class="{
                        'opacity-100': selected,
                        'opacity-0': !selected
                    }"
                />

                <Checkbox
                    v-if="showCheckboxSwitch && !hasChildren && !showCheckmark"

                    :id="`option-${label}-${value}`"
                    :name="`option-${label}-${value}-name`"
                    checkbox-style="switch"
                    :checked="selected"
                    :clickable="false"
                    size="small"
                />

                <i
                    v-if="hasChildren"

                    class="fa-solid fa-chevron-right text-[0.65rem] text-muted-foreground"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Marker from "./Marker.vue";
import Checkbox from "./Checkbox.vue";

export default defineComponent({
    name: "Option",

    components: {
        Marker,
        Checkbox
    },

    inheritAttrs: false,

    props: {
        label: {
            type: String,
            required: false
        },

        labelHelper: {
            type: String,
            required: false
        },

        labelHelperPosition: {
            type: String as PropType<"left" | "right">,
            default: "left",
            required: false
        },

        icon: {
            type: String,
            required: false
        },

        indicator: {
            type: Object as PropType<{ color?: string; size?: string; backgroundColor?: string }>,
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

        showCheckboxSwitch: {
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
        },

        disabled: {
            type: Boolean,
            default: false
        },

        hasChildren: {
            type: Boolean,
            default: false
        }
    },

    emits: ["click", "mouseenter"],

    computed: {
        indicatorStyle(): Record<string, string> {
            const size = this.indicator?.size ?? "0.625rem";
            const color = this.indicator?.color ?? "currentColor";
            const backgroundColor = this.indicator?.backgroundColor ?? color;

            return {
                width: size,
                height: size,
                backgroundColor,
                borderColor: color
            };
        },

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
