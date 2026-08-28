<template>
    <div
        class="inline-flex w-fit rounded-lg bg-white p-2"

        role="img"
        :aria-label="ariaLabel"
    >
        <QrcodeVue
            :value="value"
            :size="size"
            :level="level"
            :margin="margin"
            render-as="svg"
            background="#ffffff"
            foreground="#000000"
        />
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import QrcodeVue from "qrcode.vue";
import type { Level } from "qrcode.vue";

export default defineComponent({
    name: "QrCode",

    components: {
        QrcodeVue
    },

    props: {
        value: {
            type: String,
            required: true
        },

        size: {
            type: Number,
            default: 192
        },

        level: {
            type: String as PropType<Level>,
            default: "M"
        },

        margin: {
            type: Number,
            default: 1
        }
    },

    computed: {
        ariaLabel(): string {
            return `Código QR: ${this.value}`;
        }
    }
});
</script>
