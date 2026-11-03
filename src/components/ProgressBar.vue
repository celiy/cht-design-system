<template>
    <div class="flex w-full flex-col">
        <!-- Label -->
        <label
            v-if="label"

            class="mb-2"
            :class="labelClass"
            :for="id"
        >
            {{ label }}
        </label>

        <!-- Bar -->
        <div
            v-if="variant === 'bar'"

            :class="{
                'flex w-full justify-center': isVertical,
                'mb-6': !isVertical && normalizedMarks.length > 0
            }"
        >
            <div
                class="relative"
                :class="isVertical ? 'w-fit' : 'w-full'"
            >
                <input
                    class="progress-range relative block rounded transition-all"
                    :class="[
                        isVertical
                            ? [
                                  'progress-range--vertical',
                                  { 'rotate-180': verticalOrigin === 'bottom' }
                              ]
                            : 'w-full touch-pan-y',
                        {
                            'opacity-70': disabled,
                            'progress-range--readonly': readonly,
                            'cursor-pointer disabled:cursor-not-allowed': !readonly,
                            'pointer-events-none': readonly
                        }
                    ]"
                    :style="progressTrackStyle"
                    type="range"
                    :aria-readonly="readonly ? true : undefined"
                    :tabindex="readonly ? -1 : undefined"
                    :value="localValue"
                    :step="step"
                    :max="max"
                    :min="min"
                    :required="required"
                    :disabled="disabled"

                    @mousedown="handleMouseDown"
                    @mouseup="handleMouseUp"
                    @mouseleave="handleMouseUp"
                    @touchstart="handleMouseDown"
                    @touchend="handleMouseUp"
                    @touchleave="handleMouseUp"
                    @keydown="onRangeKeydown"
                    @input="onInput($event)"
                />

                <div
                    v-for="mark in normalizedMarks"
                    :key="mark.value"

                    class="pointer-events-none absolute flex items-center justify-center"
                    :class="isVertical ? 'inset-x-0' : 'inset-y-0'"
                    :style="positionAlongTrack(mark.percent)"
                >
                    <slot
                        name="mark-tick"
                        :mark="mark"
                    >
                        <span
                            class="block rounded-full bg-background"
                            :class="[isVertical ? 'h-0.5 w-2' : 'h-2 w-0.5', markClass]"
                        />
                    </slot>

                    <span
                        class="absolute text-xs whitespace-nowrap text-muted-foreground select-none"
                        :class="[isVertical ? 'right-full mr-3' : 'top-full mt-2', markLabelClass]"
                    >
                        <slot
                            name="mark-label"
                            :mark="mark"
                        >
                            {{ mark.label }}
                        </slot>
                    </span>
                </div>

                <div
                    v-if="showProgress"

                    class="pointer-events-none absolute z-10 transition-opacity"
                    :class="[
                        isVertical ? 'left-full ml-3' : 'bottom-full mb-2',
                        isVisible ? 'opacity-100' : 'opacity-0'
                    ]"
                    :style="positionAlongTrack(progressPercent)"
                >
                    <div
                        class="rounded border bg-popover p-2 text-foreground! shadow-sm select-none"
                        :class="tooltipClass"
                    >
                        <slot
                            name="tooltip"
                            :value="localValue"
                        >
                            {{ localValue }}
                        </slot>
                    </div>
                </div>
            </div>
        </div>

        <!-- Circular -->
        <div
            v-if="variant === 'circular'"

            class="relative"
        >
            <svg
                fill="none"
                class="inset-0"
                v-bind="circularProgressAtributes"
            >
                <circle
                    v-bind="circleAtributes"
                    stroke="var(--progress-track, color-mix(in oklch, var(--color-foreground) 14%, var(--color-background)))"
                    stroke-width="4"
                    fill="none"
                    class="text-gray-200"
                ></circle>

                <circle
                    v-if="!isCircularLoading"

                    v-bind="circleAtributes"
                    stroke="var(--progress-fill, var(--color-primary))"
                    stroke-width="4"
                    fill="none"
                    stroke-linecap="round"
                    :stroke-dasharray="circularProgressArc.strokeDasharray"
                    :stroke-dashoffset="circularProgressArc.strokeDashoffset"
                    :transform="circularProgressArc.transform"
                    class="transition-all duration-500 ease-out"
                />

                <g
                    v-else

                    :transform="circularSpinnerStageTransform"
                >
                    <g class="progress-circular__spin">
                        <circle
                            cx="0"
                            cy="0"
                            :r="circleAtributes.r"
                            stroke="var(--progress-fill, var(--color-primary))"
                            stroke-width="4"
                            fill="none"
                            stroke-linecap="round"
                            class="progress-circular__indeterminate-arc"
                            :style="circularSpinnerArcStyle"
                        />
                    </g>
                </g>
            </svg>
        </div>

        <!-- Helper text -->
        <small-muted
            v-if="helperText"

            class="mt-2"
            :class="helperTextClass"
        >
            {{ helperText }}
        </small-muted>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export type ProgressBarMark = number | { value: number; label?: string };

type NormalizedMark = { value: number; label: string; percent: number };

/** Keep in sync with the `--progress-thumb-size` fallback in the styles. */
const THUMB_SIZE = "var(--progress-thumb-size, 1rem)";

export default defineComponent({
    name: "ProgressBar",

    props: {
        /**
         * The variant of the progressbar
         */
        variant: {
            type: String as PropType<"circular" | "bar">,
            default: "bar",
            required: false
        },

        /**
         * The size of the progressbar
         */
        size: {
            type: String as PropType<"small" | "medium" | "large">,
            default: "medium",
            required: false
        },

        /**
         * The direction of the progressbar
         */
        direction: {
            type: String as PropType<"horizontal" | "vertical">,
            default: "horizontal",
            required: false
        },

        /**
         * Vertical only: where the minimum sits. `bottom` fills upward, `top` fills downward.
         */
        verticalOrigin: {
            type: String as PropType<"bottom" | "top">,
            default: "bottom",
            required: false
        },

        /**
         * Values marked along the bar, as numbers or `{ value, label }`. Out-of-range values are skipped.
         */
        marks: {
            type: Array as PropType<ProgressBarMark[]>,
            default: () => [],
            required: false
        },

        labelClass: {
            type: String,
            required: false
        },

        helperTextClass: {
            type: String,
            required: false
        },

        tooltipClass: {
            type: String,
            required: false
        },

        /**
         * Class of the default mark tick
         */
        markClass: {
            type: String,
            required: false
        },

        markLabelClass: {
            type: String,
            required: false
        },

        /**
         * Height used when direction prop is vertical
         */
        height: {
            type: String,
            default: "12rem",
            required: false
        },

        /**
         * Value controlled by Vue's v-model pattern.
         * When defined, it has priority over the value prop.
         */
        modelValue: {
            type: Number,
            required: false,
            default: undefined
        },

        /**
         * The step of the progressbar
         */
        step: {
            type: Number,
            default: 1,
            required: false
        },

        /**
         * The max of the progressbar
         */
        max: {
            type: Number,
            default: 100,
            required: false
        },

        /**
         * The min of the progressbar
         */
        min: {
            type: Number,
            default: 0,
            required: false
        },

        /**
         * The label of the progressbar
         */
        label: {
            type: String,
            required: false
        },

        /**
         * The helper text of the progressbar
         */
        helperText: {
            type: String,
            required: false
        },

        /**
         * Whether the progressbar is id
         */
        id: {
            type: String,
            required: false
        },

        /**
         * Indicates whether the field is required.
         */
        required: {
            type: Boolean,
            required: false
        },

        /**
         * Disables user interaction with the field.
         */
        disabled: {
            type: Boolean,
            required: false
        },

        /**
         * Whether the progressbar is readonly
         */
        readonly: {
            type: Boolean,
            required: false
        },

        /**
         * Whether to show progress
         */
        showProgress: {
            type: Boolean,
            required: false
        },

        /**
         * Whether the progressbar is loading
         */
        loading: {
            type: Boolean,
            required: false,
            default: false
        }
    },

    emits: ["update:value", "update:modelValue"],

    data() {
        return {
            localValue: 0 as number,
            isVisible: false
        };
    },

    computed: {
        /**
         * Defines the single source of truth between modelValue and value.
         *
         * @Returns - Value prioritizing modelValue when it is defined.
         */
        sourceValue(): number | undefined {
            if (this.modelValue !== undefined) {
                return this.modelValue;
            }

            return undefined;
        },

        /**
         * Gets the progress percent
         * @returns {unknown} The progress percent
         */
        progressPercent(): number {
            return this.percentOf(Number(this.localValue ?? 0));
        },

        isVertical(): boolean {
            return this.direction === "vertical";
        },

        normalizedMarks(): NormalizedMark[] {
            const marks: NormalizedMark[] = [];

            for (const mark of this.marks) {
                const value = typeof mark === "number" ? mark : mark.value;

                if (value < this.min || value > this.max) {
                    continue;
                }

                const label = typeof mark === "number" ? undefined : mark.label;

                marks.push({
                    value,
                    label: label ?? String(value),
                    percent: this.percentOf(value)
                });
            }

            return marks;
        },

        /**
         * Gets the progress track style
         * @returns {unknown} The progress track style
         */
        progressTrackStyle(): Record<string, string> {
            const style: Record<string, string> = {
                "--progress-percent": `${this.progressPercent}%`
            };

            if (this.direction === "vertical") {
                style["--progress-vertical-height"] = this.height;
            }

            return style;
        },

        /**
         * Gets the circular progress atributes
         * @returns {unknown} The circular progress atributes
         */
        circularProgressAtributes(): {
            width: number;
            height: number;
            viewBox: string;
        } {
            switch (this.size) {
                case "small":
                    return { width: 32, height: 32, viewBox: "0 0 32 32" };
                case "large":
                    return { width: 128, height: 128, viewBox: "0 0 128 128" };
                default:
                    return { width: 64, height: 64, viewBox: "0 0 64 64" };
            }
        },

        /**
         * Gets the circle atributes
         * @returns {unknown} The circle atributes
         */
        circleAtributes(): {
            cx: number;
            cy: number;
            r: number;
        } {
            switch (this.size) {
                case "small":
                    return { cx: 16, cy: 16, r: 14 };
                case "large":
                    return { cx: 64, cy: 64, r: 62 };
                case "medium":
                default:
                    return { cx: 32, cy: 32, r: 30 };
            }
        },

        /**
         * Gets the circular progress arc
         * @returns {unknown} The circular progress arc
         */
        circularProgressArc(): {
            strokeDasharray: number;
            strokeDashoffset: number;
            transform: string;
        } {
            const { cx, cy, r } = this.circleAtributes;
            const circumference = 2 * Math.PI * r;
            const fraction = Math.min(Math.max(this.progressPercent / 100, 0), 1);

            return {
                strokeDasharray: circumference,
                strokeDashoffset: circumference * (1 - fraction),
                transform: `rotate(-90 ${cx} ${cy})`
            };
        },

        /**
         * Gets the circular circumference
         * @returns {unknown} The circular circumference
         */
        circularCircumference(): number {
            return 2 * Math.PI * this.circleAtributes.r;
        },

        /**
         * Checks if circular loading
         * @returns {boolean} True if is circular loading
         */
        isCircularLoading(): boolean {
            return this.variant === "circular" && Boolean(this.loading);
        },

        /**
         * Gets the circular spinner stage transform
         * @returns {unknown} The circular spinner stage transform
         */
        circularSpinnerStageTransform(): string {
            const { cx, cy } = this.circleAtributes;

            return `translate(${cx} ${cy})`;
        },

        /**
         * Gets the circular spinner arc style
         * @returns {unknown} The circular spinner arc style
         */
        circularSpinnerArcStyle(): Record<string, string> {
            return {
                "--progress-circ": `${this.circularCircumference}px`
            };
        }
    },

    watch: {
        sourceValue: {
            /**
             * Synchronizes local state with the value coming from props.
             */
            handler(newVal: number | undefined) {
                this.localValue = newVal ?? 0;
            },

            immediate: true
        }
    },

    /**
     * Mounts the component
     * @returns {void}
     */
    mounted() {},

    methods: {
        /**
         * Position of a value along the bar, in percent of the range.
         * @param {number} value The value
         * @returns {number} 0 to 100
         */
        percentOf(value: number): number {
            const min = Number(this.min ?? 0);
            const max = Number(this.max ?? 100);
            const safeMax = max <= min ? min + 1 : max;
            const clamped = Math.min(Math.max(value, min), safeMax);

            return ((clamped - min) * 100) / (safeMax - min);
        },

        /**
         * Places an overlay (tooltip, mark) at the thumb center for the given percent. The thumb
         * travels the track minus its own size, so the ends are inset by half a thumb.
         * @param {number} percent 0 to 100
         * @returns {Record<string, string>} The position style
         */
        positionAlongTrack(percent: number): Record<string, string> {
            const offset = `calc(${THUMB_SIZE} / 2 + (100% - ${THUMB_SIZE}) * ${percent / 100})`;

            if (!this.isVertical) {
                return { left: offset, transform: "translateX(-50%)" };
            }

            if (this.verticalOrigin === "bottom") {
                return { bottom: offset, transform: "translateY(50%)" };
            }

            return { top: offset, transform: "translateY(-50%)" };
        },

        /**
         * Handles typing, normalizes the value, and emits updates to the parent.
         *
         * @param event - Native input/textarea event.
         */
        onInput(event: Event) {
            if (this.readonly) {
                return;
            }

            let value = Number((event.target as HTMLInputElement).value);

            this.localValue = value;

            this.$emit("update:value", value);
            this.$emit("update:modelValue", value);
        },

        /**
         * Handles the mouse up
         * @returns {void}
         */
        handleMouseUp() {
            this.isVisible = false;
        },

        /**
         * Handles the mouse down
         * @returns {void}
         */
        handleMouseDown() {
            if (this.readonly) {
                return;
            }

            this.isVisible = true;
        },

        /**
         * Handles the range keydown
         * @param {KeyboardEvent} event The event
         * @returns {void}
         */
        onRangeKeydown(event: KeyboardEvent) {
            if (!this.readonly) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
        }
    }
});
</script>

<style scoped lang="scss">
/*
 * Customizable through CSS variables set on the ProgressBar (or any ancestor):
 * --progress-fill, --progress-track, --progress-thumb, --progress-thumb-border,
 * --progress-track-size and --progress-thumb-size.
 */
.progress-range {
    /* The track mixes foreground into background so it has the same contrast in both themes. */
    --_fill: var(--progress-fill, var(--color-primary));
    --_track: var(
        --progress-track,
        color-mix(in oklch, var(--color-foreground) 14%, var(--color-background))
    );
    --_thumb: var(--progress-thumb, var(--color-primary-foreground));
    --_thumb-border: var(--progress-thumb-border, var(--_fill));
    --_track-size: var(--progress-track-size, 0.5rem);
    --_thumb-size: var(--progress-thumb-size, 1rem);

    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: var(--_track-size);
    background: transparent;

    &:focus {
        outline: none;
    }

    &::-webkit-slider-runnable-track {
        height: var(--_track-size);
        border-radius: 9999px;
        background: linear-gradient(
            to right,
            var(--_fill) 0%,
            var(--_fill) var(--progress-percent, 0%),
            var(--_track) var(--progress-percent, 0%),
            var(--_track) 100%
        );
    }

    &::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        box-sizing: border-box;
        width: var(--_thumb-size);
        height: var(--_thumb-size);
        margin-top: calc((var(--_track-size) - var(--_thumb-size)) / 2);
        border-radius: 9999px;
        background: var(--_thumb);
        border: 2px solid var(--_thumb-border);
        box-shadow: 0 0 0 1px var(--color-border);
        cursor: pointer;
    }

    &::-moz-range-track {
        height: var(--_track-size);
        border-radius: 9999px;
        background: var(--_track);
    }

    &::-moz-range-progress {
        height: var(--_track-size);
        border-radius: 9999px;
        background: var(--_fill);
    }

    &::-moz-range-thumb {
        box-sizing: border-box;
        width: var(--_thumb-size);
        height: var(--_thumb-size);
        border-radius: 9999px;
        background: var(--_thumb);
        border: 2px solid var(--_thumb-border);
        box-shadow: 0 0 0 1px var(--color-border);
        cursor: pointer;
    }

    &:disabled::-webkit-slider-thumb,
    &:disabled::-moz-range-thumb {
        border-color: var(--color-muted-foreground);
        cursor: not-allowed;
    }
}

/* Somente leitura: sem thumb e sem interação (pointer-events no template) */
.progress-range--readonly {
    cursor: default;

    &::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 0;
        height: 0;
        margin: 0;
        border: 0;
        background: var(--color-primary-foreground);
        box-shadow: none;
    }

    &::-moz-range-thumb {
        width: 0;
        height: 0;
        margin: 0;
        border: 0;
        background: var(--color-primary-foreground);
        box-shadow: none;
    }
}

.progress-range--vertical {
    writing-mode: vertical-lr;
    direction: ltr;
    --progress-vertical-thumb-w: var(--_thumb-size);
    --progress-vertical-track-w: var(--_track-size);
    --progress-vertical-control-w: var(--progress-vertical-thumb-w);

    width: var(--progress-vertical-control-w);
    min-width: var(--progress-vertical-control-w);
    height: var(--progress-vertical-height, 8rem);

    &::-webkit-slider-runnable-track {
        width: var(--progress-vertical-track-w);
        height: 100%;
        margin-inline: 0;
        margin-block: calc(
            (var(--progress-vertical-thumb-w) - var(--progress-vertical-track-w)) / 2
        );
        background: linear-gradient(
            to bottom,
            var(--_fill) 0%,
            var(--_fill) var(--progress-percent, 0%),
            var(--_track) var(--progress-percent, 0%),
            var(--_track) 100%
        );
    }

    &::-webkit-slider-thumb {
        margin: 0;
        margin-left: calc((var(--_track-size) - var(--_thumb-size)) / 2);
        box-sizing: border-box;
        background: var(--_thumb);
    }

    &::-moz-range-track {
        width: var(--progress-vertical-track-w);
        height: 100%;
        margin-inline: 0;
        margin-block: calc(
            (var(--progress-vertical-thumb-w) - var(--progress-vertical-track-w)) / 2
        );
        background: var(--_track);
    }

    &::-moz-range-progress {
        width: var(--progress-vertical-track-w);
        margin-inline: 0;
        margin-block: calc(
            (var(--progress-vertical-thumb-w) - var(--progress-vertical-track-w)) / 2
        );
        background: var(--_fill);
    }

    &::-moz-range-thumb {
        margin: 0;
        margin-left: calc((var(--_track-size) - var(--_thumb-size)) / 2);
        box-sizing: border-box;
        background: var(--_thumb);
    }

    &.progress-range--readonly {
        &::-webkit-slider-thumb,
        &::-moz-range-thumb {
            width: 0;
            height: 0;
            margin: 0;
            margin-left: 0;
            border: 0;
        }
    }
}

.progress-circular__spin {
    animation: progress-circular-rotate 2.5s linear infinite;
}

.progress-circular__indeterminate-arc {
    animation: progress-circular-dash 2.5s ease-in-out infinite;
}

@keyframes progress-circular-rotate {
    100% {
        transform: rotate(360deg);
    }
}

@keyframes progress-circular-dash {
    0% {
        stroke-dasharray: 1px var(--progress-circ, 200px);
        stroke-dashoffset: 0;
    }

    50% {
        stroke-dasharray: calc(var(--progress-circ, 200px) * 0.72) var(--progress-circ, 200px);
        stroke-dashoffset: calc(var(--progress-circ, 200px) * -0.22);
    }

    100% {
        stroke-dasharray: 1px var(--progress-circ, 200px);
        stroke-dashoffset: calc(var(--progress-circ, 200px) * -1);
    }
}
</style>
