<template>
    <div
        class="flex w-full items-center justify-between rounded text-sm font-medium transition-all"
        :class="[chipClass]"
    >
        <slot name="left-side" />

        <div class="px-4 py-2">
            <slot name="body" />

            <span
                v-if="label || labelIcon"

                class="flex min-w-0 items-center gap-2 transition-all select-none"
            >
                <i
                    v-if="labelIcon"

                    class="fa-solid shrink-0 text-xs"
                    :class="labelIcon"
                />

                <span class="min-w-0 truncate">{{ label }}</span>
            </span>
        </div>

        <slot name="right-side" />
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: "Chip",

    props: {
        label: {
            type: String,
            required: false
        },

        labelIcon: {
            type: String,
            required: false
        },

        variant: {
            type: String as PropType<
                | "default"
                | "primary"
                | "secondary"
                | "success"
                | "info"
                | "warning"
                | "destructive"
                | "transparent"
            >,
            default: "default",
            required: false
        },

        textColor: {
            type: String,
            required: false
        }
    },

    computed: {
        chipTextColor(): object {
            if (this.textColor) {
                return [`${this.textColor}`];
            } else {
                return {
                    "text-primary/80 hover:text-primary": this.variant === "primary",
                    "text-success/80 hover:text-success": this.variant === "success",
                    "text-info/80 hover:text-info": this.variant === "info",
                    "text-warning/80 hover:text-warning": this.variant === "warning",
                    "text-destructive/80 hover:text-destructive": this.variant === "destructive",
                    "text-foreground/80 hover:text-foreground":
                        this.variant === "transparent" ||
                        this.variant === "default" ||
                        this.variant === "secondary"
                };
            }
        },

        chipClass(): object {
            return {
                "bg-input/10 hover:bg-input/60 ": this.variant === "default",
                "bg-primary/10 hover:bg-primary/20 ": this.variant === "primary",
                "bg-secondary/10 hover:bg-secondary/60 ": this.variant === "secondary",
                "bg-success/10 hover:bg-success/20 ": this.variant === "success",
                "bg-info/10 hover:bg-info/20 ": this.variant === "info",
                "bg-warning/10 hover:bg-warning/20 ": this.variant === "warning",
                "bg-destructive/10 hover:bg-destructive/20 ": this.variant === "destructive",
                "bg-transparent hover:bg-accent ": this.variant === "transparent",
                ...this.chipTextColor
            };
        }
    }
});
</script>
