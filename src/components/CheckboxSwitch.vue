<template>
    <label
        :for="inputId"
        class="inline-flex items-center"
        :class="{
            'cursor-pointer': !disabled,
            'cursor-not-allowed opacity-60': disabled
        }"
    >
        <span
            class="relative inline-flex h-4 w-8 items-center rounded-full transition-colors"
            :class="{
                'bg-primary': checked,
                'bg-input/70': !checked && !disabled,
                'bg-input': disabled
            }"
        >
            <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="checked ? 'translate-x-4' : 'translate-x-0.5'"
            />
        </span>
    </label>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    name: "CheckboxSwitch",

    props: {
        inputId: {
            type: String,
            required: true
        },

        checked: {
            type: Boolean,
            required: true
        },

        disabled: {
            type: Boolean,
            default: false,
            required: false
        }
    }
});
</script>
