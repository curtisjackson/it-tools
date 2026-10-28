<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useValidation } from '@/composable/validation';
import { formatTimecode, parseTimecode } from '@/utils/timecode';

const props = withDefaults(
  defineProps<{
    duration: number;
    start: number;
    end: number;
    disabled?: boolean;
  }>(),
  { disabled: false },
);
const emit = defineEmits<{
  (event: 'update:start', value: number): void;
  (event: 'update:end', value: number): void;
  (event: 'seek', time: number): void;
}>();

const { t } = useI18n();

const TOLERANCE = 0.0005;

const range = computed({
  get: () => [props.start, props.end] as [number, number],
  set: ([start, end]: [number, number]) => {
    if (start !== props.start) {
      emit('update:start', start);
      emit('seek', start);
    } else if (end !== props.end) {
      emit('update:end', end);
      emit('seek', end);
    }
  },
});

// The text fields keep what the user types until it parses, instead of reformatting on every keystroke.
const startText = ref(formatTimecode(props.start));
const endText = ref(formatTimecode(props.end));
watch(
  () => props.start,
  (start) => {
    if (!isSameTime(startText.value, start)) {
      startText.value = formatTimecode(start);
    }
  },
);
watch(
  () => props.end,
  (end) => {
    if (!isSameTime(endText.value, end)) {
      endText.value = formatTimecode(end);
    }
  },
);

function isSameTime(text: string, seconds: number) {
  try {
    return Math.abs(parseTimecode(text) - seconds) < TOLERANCE;
  } catch {
    return false;
  }
}

function isInRange(seconds: number, isStart: boolean) {
  return isStart ? seconds < props.end : seconds > props.start && seconds <= props.duration + TOLERANCE;
}

function parseIfValid(text: string, isStart: boolean): number | undefined {
  try {
    const seconds = parseTimecode(text);
    return isInRange(seconds, isStart) ? Math.min(seconds, props.duration) : undefined;
  } catch {
    return undefined;
  }
}

function rules(isStart: boolean) {
  // useValidation shows the message of the last failing rule, so the format rule comes last.
  return [
    {
      message: t('shared.media.time-out-of-range'),
      validator: (value: string) => isInRange(parseTimecode(value), isStart),
    },
    { message: t('shared.media.invalid-time'), validator: (value: string) => parseTimecode(value) >= 0 },
  ];
}
const startValidation = useValidation({ source: startText, rules: rules(true), watch: [toRef(props, 'end')] });
const endValidation = useValidation({ source: endText, rules: rules(false), watch: [toRef(props, 'start')] });

function onText(text: string, isStart: boolean) {
  (isStart ? startText : endText).value = text;
  const seconds = parseIfValid(text, isStart);
  if (seconds !== undefined) {
    if (isStart) {
      emit('update:start', seconds);
    } else {
      emit('update:end', seconds);
    }
    emit('seek', seconds);
  }
}
</script>

<template>
  <div>
    <n-slider
      v-model:value="range"
      range
      :min="0"
      :max="duration"
      :step="0.01"
      :format-tooltip="formatTimecode"
      :disabled="disabled || duration <= 0"
      mb-3
    />
    <div flex flex-wrap gap-3>
      <c-input-text
        :value="startText"
        :label="t('shared.media.start')"
        :validation="startValidation"
        :disabled="disabled"
        placeholder="00:00.000"
        monospace
        raw-text
        flex-1
        data-test-id="trim-start"
        @update:value="(text: string) => onText(text, true)"
      />
      <c-input-text
        :value="endText"
        :label="t('shared.media.end')"
        :validation="endValidation"
        :disabled="disabled"
        placeholder="00:00.000"
        monospace
        raw-text
        flex-1
        data-test-id="trim-end"
        @update:value="(text: string) => onText(text, false)"
      />
    </div>
    <div text-sm op-70>{{ t('shared.media.selected-duration', [formatTimecode(Math.max(0, end - start))]) }}</div>
  </div>
</template>
