<template>
    <div>
        <div
            v-if="label"

            class="mb-2"
        >
            <label>
                {{ label }}
            </label>
        </div>

        <div class="flex items-center gap-1">
            <div
                v-for="(field, index) in fields"
                :key="field.type + '-' + index"
            >
                <Input
                    v-if="field.type === 'input'"
                    ref="otpInputs"

                    class="w-9!"
                    type="text"
                    fit
                    :pattern="cellPattern(cellIndex(index))"
                    :max-size="1"
                    :value="cellValues[cellIndex(index)] ?? ''"
                    :visual-error="error !== ''"
                    :readonly="readonly"
                    :disabled="disabled"
                    input-class="text-center"

                    @update:value="onCellUpdate(cellIndex(index), $event)"
                    @keydown="onCellKeydown(cellIndex(index), $event)"
                    @paste="onCellPaste(cellIndex(index), $event)"
                    @beforeinput="onCellBeforeInput(cellIndex(index), $event)"
                />

                <span
                    v-else-if="field.type === 'colon'"

                    class="font-bold"
                >
                    :
                </span>

                <span
                    v-else-if="field.type === 'dash'"

                    class="font-bold"
                >
                    -
                </span>
            </div>
        </div>

        <InputErrorMsg :error="error" />

        <div
            v-if="helperText"

            class="mt-2"
        >
            <small-muted>
                {{ helperText }}
            </small-muted>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Input from "./Input.vue";
import {
    applyOtpBackspace,
    applyOtpChar,
    applyOtpPaste,
    cellsFromValue,
    otpInputFieldIndexes
} from "./internal/otpCells.ts";
import { matchesInputPattern } from "./internal/inputValueConstraints.ts";
import InputErrorMsg from "./internal/InputErrorMsg.vue";

export default defineComponent({
    name: "InputOTP",

    components: {
        Input,
        InputErrorMsg
    },

    props: {
        /**
         * Text displayed above the OTP fields.
         */
        label: {
            type: String,
            default: "",
            required: false
        },

        /**
         * Hint displayed below the OTP fields.
         */
        helperText: {
            type: String,
            default: "",
            required: false
        },

        /**
         * Error message shown under the fields.
         */
        error: {
            type: String,
            default: "",
            required: false
        },

        /**
         * When true, cells cannot be edited.
         */
        readonly: {
            type: Boolean,
            default: false,
            required: false
        },

        /**
         * When true, cells cannot be edited or focused.
         */
        disabled: {
            type: Boolean,
            default: false,
            required: false
        },

        /**
         * Joined OTP string. Splits into one character per input cell.
         */
        value: {
            type: String,
            default: "",
            required: false
        },

        /**
         * Vue v-model value. When defined, it has priority over `value`.
         */
        modelValue: {
            type: String,
            default: undefined,
            required: false
        },

        /**
         * Character kinds accepted in cells that have no `field.pattern`.
         */
        inputsPattern: {
            type: Array as PropType<("text" | "number")[]>,
            default: () => ["text", "number"] as ("text" | "number")[],
            required: false
        },

        /**
         * Cells and separators. `input` is editable; `colon` and `dash` are not focused.
         */
        fields: {
            type: Array as PropType<
                {
                    type: string;
                    pattern?: string;
                }[]
            >,
            default: () => [],
            required: false
        }
    },

    emits: ["click", "update:value", "update:modelValue"],

    data() {
        return {
            cellValues: [] as string[]
        };
    },

    computed: {
        /**
         * Returns a regex based on the inputsPattern prop.
         * If only "text", accepts letters. If only "number", accepts digits.
         * If both, accepts letters or digits.
         * @returns {RegExp}
         */
        inputsPatternRegex(): RegExp {
            const hasText = this.inputsPattern.includes("text");
            const hasNumber = this.inputsPattern.includes("number");

            if (hasText && hasNumber) {
                return /^[A-Za-z0-9]$/;
            } else if (hasText) {
                return /^[A-Za-z]$/;
            } else if (hasNumber) {
                return /^[0-9]$/;
            } else {
                // Default: allow nothing
                return /^$/;
            }
        },

        /**
         * Return a regex based on the fields prop
         * (unchanged – assumes you want to keep any custom pattern logic for fields)
         * @returns {RegExp}
         */
        fieldsRegex(): RegExp {
            const parts = this.fields
                .map((field) => field.pattern)
                .filter((part): part is string => Boolean(part));

            if (parts.length === 0) {
                return /(?:)/;
            }

            try {
                return new RegExp(parts.join("|"));
            } catch {
                return /(?:)/;
            }
        },

        /**
         * Combines inputsPattern and fieldsRegex.
         * Note: Combines their sources with a logical OR, if both are defined and non-trivial.
         * If fieldsRegex is empty, returns inputsPatternRegex.
         * @returns {RegExp}
         */
        regex(): RegExp {
            const patternSource = this.inputsPatternRegex.source;
            const fieldsSource = this.fieldsRegex.source;
            if (fieldsSource && fieldsSource !== "(?:)") {
                return new RegExp(`${patternSource}|${fieldsSource}`);
            }

            return this.inputsPatternRegex;
        },

        /**
         * Returns the indexes of the input fields.
         * @returns {number[]}
         */
        inputFieldIndexes(): number[] {
            return otpInputFieldIndexes(this.fields);
        },

        /**
         * Returns the number of cells.
         * @returns {number}
         */
        cellCount(): number {
            return this.inputFieldIndexes.length;
        },

        /**
         * Returns the source value.
         * @returns {string}
         */
        sourceValue(): string {
            if (this.modelValue != null) {
                return String(this.modelValue);
            }

            return String(this.value ?? "");
        }
    },

    watch: {
        cellCount: {
            handler() {
                this.syncFromSource();
            },
            immediate: true
        },

        /**
         * Syncs the source value.
         * @returns {void}
         */
        sourceValue() {
            this.syncFromSource();
        }
    },

    methods: {
        /**
         * Returns the index of the cell.
         * @param {number} fieldIndex - The index of the field.
         * @returns {number}
         */
        cellIndex(fieldIndex: number): number {
            const pos = this.inputFieldIndexes.indexOf(fieldIndex);

            return pos < 0 ? 0 : pos;
        },

        /**
         * Returns the pattern of the cell.
         * @param {number} cellIndex - The index of the cell.
         * @returns {string | RegExp}
         */
        cellPattern(cellIndex: number): string | RegExp {
            const fieldIndex = this.inputFieldIndexes[cellIndex];
            const field = fieldIndex == null ? undefined : this.fields[fieldIndex];

            return field?.pattern || this.inputsPatternRegex;
        },

        /**
         * Focuses the cell.
         * @param {number} cellIndex - The index of the cell.
         * @returns {void}
         */
        focusCell(cellIndex: number) {
            const run = () => {
                const raw = this.$refs.otpInputs;
                const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
                const comp = list[cellIndex] as { $el?: HTMLElement } | undefined;
                const field = comp?.$el?.querySelector?.("input, textarea") as
                    HTMLInputElement | undefined;

                field?.focus();
                field?.select();
            };

            run();
            this.$nextTick(run);
        },

        /**
         * Syncs the source value.
         * @returns {void}
         */
        syncFromSource() {
            const next = cellsFromValue(this.sourceValue, this.cellCount);
            const same =
                next.length === this.cellValues.length &&
                next.every((char, i) => char === this.cellValues[i]);

            if (same) {
                return;
            }

            this.cellValues = next;
        },

        /**
         * Emits the cells.
         * @returns {void}
         */
        emitCells() {
            const joined = this.cellValues.join("");

            this.$emit("update:value", joined);
            this.$emit("update:modelValue", joined);
        },

        /**
         * Applies the result.
         * @param {Object} result - The result.
         * @param {string[]} result.values - The values.
         * @param {number} result.focus - The focus.
         * @returns {void}
         */
        applyResult(result: { values: string[]; focus: number }) {
            this.cellValues = result.values;
            this.emitCells();
            this.focusCell(result.focus);
        },

        /**
         * Handles the keydown event.
         * @param {number} cellIndex - The index of the cell.
         * @param {KeyboardEvent} event - The event.
         * @returns {void}
         */
        onCellKeydown(cellIndex: number, event: KeyboardEvent) {
            if (event.key === "Backspace" || event.key === "Delete") {
                event.preventDefault();
                this.applyResult(applyOtpBackspace(this.cellValues, cellIndex, this.cellCount));
                return;
            }

            if (event.key === "ArrowLeft") {
                event.preventDefault();
                this.focusCell(Math.max(0, cellIndex - 1));
                return;
            }

            if (event.key === "ArrowRight") {
                event.preventDefault();
                this.focusCell(Math.min(this.cellCount - 1, cellIndex + 1));
                return;
            }

            if (event.ctrlKey || event.metaKey || event.altKey) {
                return;
            }

            if (event.key.length !== 1) {
                return;
            }

            event.preventDefault();

            if (!matchesInputPattern(event.key, this.cellPattern(cellIndex))) {
                return;
            }

            this.applyResult(applyOtpChar(this.cellValues, cellIndex, event.key, this.cellCount));
        },

        /**
         * Handles the beforeinput event.
         * @param {number} cellIndex - The index of the cell.
         * @param {Event} event - The event.
         * @returns {void}
         */
        onCellBeforeInput(cellIndex: number, event: Event) {
            const inputEvent = event as InputEvent;

            if (
                inputEvent.inputType !== "insertText" &&
                inputEvent.inputType !== "insertFromPaste" &&
                inputEvent.inputType !== "insertCompositionText"
            ) {
                return;
            }

            if (inputEvent.inputType === "insertFromPaste") {
                return;
            }

            const char = inputEvent.data ?? "";

            if (char.length !== 1) {
                return;
            }

            inputEvent.preventDefault();

            if (!matchesInputPattern(char, this.cellPattern(cellIndex))) {
                return;
            }

            this.applyResult(applyOtpChar(this.cellValues, cellIndex, char, this.cellCount));
        },

        /**
         * Handles the paste event.
         * @param {number} cellIndex - The index of the cell.
         * @param {ClipboardEvent} event - The event.
         * @returns {void}
         */
        onCellPaste(cellIndex: number, event: ClipboardEvent) {
            event.preventDefault();
            const text = event.clipboardData?.getData("text") ?? "";
            const patterns = this.inputFieldIndexes.map((_, i) => this.cellPattern(i));

            this.applyResult(applyOtpPaste(this.cellValues, cellIndex, text, patterns));
        },

        /**
         * Handles the update event.
         * @param {number} cellIndex - The index of the cell.
         * @param {string} value - The value.
         * @returns {void}
         */
        onCellUpdate(cellIndex: number, value: string) {
            const raw = String(value ?? "");
            const current = this.cellValues[cellIndex] ?? "";

            if (raw === current) {
                return;
            }

            if (raw === "") {
                return;
            }

            const char = raw.slice(-1);

            if (char == null || !matchesInputPattern(char, this.cellPattern(cellIndex))) {
                return;
            }

            this.applyResult(applyOtpChar(this.cellValues, cellIndex, char, this.cellCount));
        }
    }
});
</script>
