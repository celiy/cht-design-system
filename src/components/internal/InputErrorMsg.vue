<template>
    <transition name="expand-error">
        <span
            v-if="error || errorsMessage.length > 0"

            class="mt-2 block rounded border-destructive/20! bg-destructive/10 p-0.5 px-1.5 text-sm text-destructive/90"
            :class="{ 'error-active': isFocused }"
        >
            <i class="fa-solid fa-warning mr-1 text-sm" />

            <span v-if="error">
                {{ error }}
            </span>

            <span
                v-for="(errorMessage, index) of errorsMessage"
                v-else-if="errorsMessage?.length > 0"
                :key="index"
            >
                {{ errorMessage }}

                <br v-if="index > 1" />
            </span>
        </span>
    </transition>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: "InputErrorMsg",

    props: {
        error: {
            type: String,
            default: "",
            required: false
        },

        errorsMessage: {
            type: Array as PropType<string[]>,
            default: () => [],
            required: false
        },

        isFocused: {
            type: Boolean,
            default: false,
            required: false
        }
    }
});
</script>

<style scoped>
.expand-error-enter-active,
.expand-error-leave-active {
    transition: all 0.3s ease-in-out;
}

.expand-error-enter-from,
.expand-error-leave-to {
    max-height: 0;
    opacity: 0;
    margin-top: 0;
}

.expand-error-enter-to,
.expand-error-leave-from {
    max-height: 40px;
    opacity: 1;
    margin-top: 0.5rem;
}
</style>
