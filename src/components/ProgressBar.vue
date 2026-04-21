<style scoped lang="scss">
.progress-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 0.5rem;
  background: transparent;

  &:focus {
    outline: none;
  }

  &::-webkit-slider-runnable-track {
    height: 0.5rem;
    border-radius: 9999px;
    background: linear-gradient(
      to right,
      var(--color-primary) 0%,
      var(--color-primary) var(--progress-percent, 0%),
      var(--color-muted) var(--progress-percent, 0%),
      var(--color-muted) 100%
    );
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 1rem;
    height: 1rem;
    margin-top: -0.25rem;
    border-radius: 9999px;
    background: var(--color-primary-foreground);
    border: 2px solid var(--color-primary);
    box-shadow: 0 0 0 1px var(--color-border);
    cursor: pointer;
  }

  &::-moz-range-track {
    height: 0.5rem;
    border-radius: 9999px;
    background: var(--color-muted);
  }

  &::-moz-range-progress {
    height: 0.5rem;
    border-radius: 9999px;
    background: var(--color-primary);
  }

  &::-moz-range-thumb {
    width: 1rem;
    height: 1rem;
    border-radius: 9999px;
    background: var(--color-background);
    border: 2px solid var(--color-primary);
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
    background: transparent;
    box-shadow: none;
  }

  &::-moz-range-thumb {
    width: 0;
    height: 0;
    margin: 0;
    border: 0;
    background: transparent;
    box-shadow: none;
  }
}

.progress-range--vertical {
  writing-mode: vertical-lr;
  direction: ltr;
  --progress-vertical-thumb-w: 1rem;
  --progress-vertical-track-w: 0.5rem;
  --progress-vertical-control-w: var(--progress-vertical-thumb-w);

  width: var(--progress-vertical-control-w);
  min-width: var(--progress-vertical-control-w);
  height: var(--progress-vertical-height, 8rem);

  &::-webkit-slider-runnable-track {
    width: var(--progress-vertical-track-w);
    height: 100%;
    margin-inline: 0;
    margin-block: calc((var(--progress-vertical-thumb-w) - var(--progress-vertical-track-w)) / 2);
    background: linear-gradient(
      to bottom,
      var(--color-primary) 0%,
      var(--color-primary) var(--progress-percent, 0%),
      var(--color-muted) var(--progress-percent, 0%),
      var(--color-muted) 100%
    );
  }

  &::-webkit-slider-thumb {
    margin: 0;
    margin-left: -0.3rem;
    box-sizing: border-box;
  }

  &::-moz-range-track {
    width: var(--progress-vertical-track-w);
    height: 100%;
    margin-inline: 0;
    margin-block: calc((var(--progress-vertical-thumb-w) - var(--progress-vertical-track-w)) / 2);
    background: var(--color-muted);
  }

  &::-moz-range-progress {
    width: var(--progress-vertical-track-w);
    margin-inline: 0;
    margin-block: calc((var(--progress-vertical-thumb-w) - var(--progress-vertical-track-w)) / 2);
    background: var(--color-primary);
  }

  &::-moz-range-thumb {
    margin: 0;
    margin-left: -0.3rem;
    box-sizing: border-box;
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
</style>

<template>
    <div class="flex flex-col w-full">
        <label 
            v-if="label"

            class="text-foreground font-semibold text-sm mb-2 block"
            :for="id"
        >
            {{ label }}
        </label>

        <div
            class="relative"
            :class="{
                'flex w-full justify-center': direction === 'vertical'
            }"
        >
            <input
                class="progress-range rounded-lg relative"
                :class="[
                    direction === 'vertical' ? 'progress-range--vertical rotate-180' : 'h-2 w-full',
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
                v-if="showProgress"

                class="absolute top-0 -translate-y-10 rounded transition-all"
                :class="{
                    'right-1/2': direction === 'horizontal',
                    'opacity-100': isVisible,
                    'opacity-0': !isVisible
                }"
            >
                <div class="bg-popover border p-2 rounded-lg select-none">
                    {{ localValue }}
                </div>
            </div>
        </div>

        <span 
            v-if="helperText"

            class="text-muted-foreground mt-2 text-sm block"
        >
            {{ helperText }}
        </span>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: "ProgressBar",

    emits: ["update:value", "update:modelValue"],

    props: {
        direction: {
            type: String as PropType<"horizontal" | "vertical">,
            default: "horizontal",
            required: false
        },

        /**
         * Height used when direction prop is vertical
         */
        height: {
            type: String,
            default: '12rem',
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

        step: {
            type: Number,
            default: 1,
            required: false
        },

        max: {
            type: Number,
            default: 100,
            required: false
        },

        min: {
            type: Number,
            default: 0,
            required: false
        },

        label: {
            type: String,
            required: false
        },

        helperText: {
            type: String,
            required: false
        },

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

        readonly: {
            type: Boolean,
            required: false
        },

        showProgress: {
            type: Boolean,
            required: false
        }
    },

    data() {
        return {
            localValue: 0 as number,
            isVisible: false
        };
    },

    mounted() {

    },

    watch: {
        sourceValue: {
            /**
             * Synchronizes local state with the value coming from props.
             */
            handler(newVal: number | undefined) {
                this.localValue = newVal ?? 0
            },

            immediate: true
        }
    },

    methods: {
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

        handleMouseUp() {
            this.isVisible = false;
        },

        handleMouseDown() {
            if (this.readonly) {
                return;
            }

            this.isVisible = true;
        },

        onRangeKeydown(event: KeyboardEvent) {
            if (!this.readonly) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
        }
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
        },

        progressPercent(): number {
            const min = Number(this.min ?? 0);
            const max = Number(this.max ?? 100);
            const value = Number(this.localValue ?? 0);
            const safeMax = max <= min ? min + 1 : max;
            const clamped = Math.min(Math.max(value, min), safeMax);

            return ((clamped - min) * 100) / (safeMax - min);
        },

        progressTrackStyle(): Record<string, string> {
            const style: Record<string, string> = {
                "--progress-percent": `${this.progressPercent}%`
            };

            if (this.direction === "vertical") {
                style["--progress-vertical-height"] = this.height;
            }

            return style;
        }
    }
});
</script>