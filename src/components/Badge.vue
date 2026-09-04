<template>
    <div
        class="rounded py-0.5 px-2 select-none font-semibold w-fit text-xs flex items-center"

        :class="{
            'bg-primary text-primary-foreground': variant === 'primary',
            'bg-secondary text-secondary-foreground border': variant === 'secondary',
            'bg-destructive text-destructive-foreground': variant === 'destructive',
            'bg-warning text-warning-foreground': variant === 'warning',
            'bg-info text-info-foreground': variant === 'info',
            'bg-success text-success-foreground': variant === 'success',
            'bg-chart-1 text-foreground': variant === 'chart-1',
            'bg-chart-2 text-foreground': variant === 'chart-2',
            'bg-chart-3 text-foreground': variant === 'chart-3',
            'bg-chart-4 text-foreground': variant === 'chart-4',
            'bg-chart-5 text-foreground': variant === 'chart-5',
            'hover:underline cursor-pointer': type === 'link'
        }"

        @click="handleClick"
    >
        <span v-if="label">
            {{ label }}
        </span>

        <slot v-else/>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: 'Badge',

    props: {
        label: {
            type: String,
            required: false
        },

        variant: {
            type: String as PropType<
                | "primary"
                | "secondary"
                | "destructive"
                | "warning"
                | "info"
                | "success"
                | "chart-1"
                | "chart-2"
                | "chart-3"
                | "chart-4"
                | "chart-5"
            >,
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

    emits: ['click'],

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