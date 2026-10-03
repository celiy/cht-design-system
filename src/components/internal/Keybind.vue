<script lang="ts">
import { defineComponent } from "vue";
import { isTypingTarget, matchesKey } from "@shared/frontend/keybinds";

export default defineComponent({
    name: "Keybind",

    props: {
        /**
         * Key to listen for, e.g. `"s"` or `"Escape"`.
         */
        keyName: {
            type: String,
            required: true
        },

        /**
         * Skip the handler while focus is in an input, textarea, select, or
         * contenteditable element.
         */
        ignoreWhenTyping: {
            type: Boolean,
            default: true
        },

        /**
         * When false, the listener stays registered but does not emit.
         */
        enabled: {
            type: Boolean,
            default: true
        }
    },

    emits: ["trigger"],

    /**
     * Mounts the component
     * @returns {void}
     */
    mounted() {
        window.addEventListener("keydown", this.onKeydown);
    },

    /**
     * Unmounts the component
     * @returns {void}
     */
    beforeUnmount() {
        window.removeEventListener("keydown", this.onKeydown);
    },

    methods: {
        /**
         * Handles the keydown
         * @param {KeyboardEvent} event The event
         * @returns {void}
         */
        onKeydown(event: KeyboardEvent) {
            if (!this.enabled) {
                return;
            }

            if (this.ignoreWhenTyping && isTypingTarget(event)) {
                return;
            }

            if (!matchesKey(event, this.keyName)) {
                return;
            }

            event.preventDefault();
            this.$emit("trigger", event);
        }
    },

    render() {
        return null;
    }
});
</script>
