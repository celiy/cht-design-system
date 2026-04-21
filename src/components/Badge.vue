<template>
    <div
        class="rounded-xl py-1 px-2 select-none font-semibold w-fit"

        :class="{
            'bg-primary text-primary-foreground text-xs': variant === 'primary',
            'bg-secondary text-secondary-foreground text-xs border border-border': variant === 'secondary',
            'bg-destructive text-destructive-foreground text-xs': variant === 'destructive',
            'bg-warning text-warning-foreground text-xs': variant === 'warning',
            'bg-info text-info-foreground text-xs': variant === 'info',
            'bg-success text-success-foreground text-xs': variant === 'success',
            'hover:underline cursor-pointer': type === 'link'
        }"

        @click="handleClick"
    >
        <span v-if="label">{{ label }}</span>
        <slot v-else/>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: 'Badge',

    emits: ['click'],

    props: {
        label: {
            type: String,
            required: false
        },

        variant: {
            type: String as PropType<"primary" | "secondary" | "destructive" | "warning" | "info" | "success">,
            default: "primary",
            required: false
        },

        type: {
            type: String as PropType<"normal" | "link">,
            default: "normal",
            required: false
        },

        link: {
            type: String,
            required: false
        },

        external: {
            type: Boolean,
            default: false,
            required: false
        }
    },

    methods: {
        handleClick() {
            if (this.link && this.external) {
                const newWindow = window.open(this.link, "_blank");

                if (newWindow) {
                    newWindow.focus();
                }
            } else if (this.link && !this.external) {
                (this as any).$router?.push(this.link);
            }

            this.$emit("click");
        }
    }
});
</script>