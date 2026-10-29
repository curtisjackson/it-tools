<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type CalcVariable, type Calculator, calculators } from './formula-calculator.data';
import {
  convertUnit,
  equationVariables,
  evaluateExpression,
  formatResult,
  solveEquation,
} from './formula-calculator.service';
import InputCopyable from '@/components/InputCopyable.vue';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t, te } = useI18n();

const UNIT_LABELS: Record<string, string> = {
  uV: 'µV',
  uA: 'µA',
  ohm: 'Ω',
  mohm: 'mΩ',
  kohm: 'kΩ',
  Mohm: 'MΩ',
  'ohm m': 'Ω·m',
  'nohm m': 'nΩ·m',
  'uohm cm': 'µΩ·cm',
  'mm^2': 'mm²',
  'cm^2': 'cm²',
  'm^2': 'm²',
  'in^2': 'in²',
  'ft^2': 'ft²',
  'mm^3': 'mm³',
  'cm^3': 'cm³',
  'm^3': 'm³',
  'in^3': 'in³',
  'ft^3': 'ft³',
};

const calcId = useQueryParamOrStorage({
  name: 'calc',
  storageName: 'formula-calculator:calc',
  defaultValue: 'ohms-law',
});
const customFormula = useQueryParamOrStorage({
  name: 'formula',
  storageName: 'formula-calculator:formula',
  defaultValue: 'F = m * a',
});

const calcOptions = computed(() => [
  ...calculators.map((calc) => ({ label: t(`tools.formula-calculator.texts.calc-${calc.id}`), value: calc.id })),
  { label: t('tools.formula-calculator.texts.calc-custom'), value: 'custom' },
]);

const customParse = computed<{ variables: string[]; error?: string }>(() => {
  try {
    return { variables: equationVariables(customFormula.value) };
  } catch (error) {
    return { variables: [], error: (error as Error).message };
  }
});

const calc = computed<Calculator>(() => {
  if (calcId.value !== 'custom') {
    return calculators.find((candidate) => candidate.id === calcId.value) ?? calculators[0];
  }
  return {
    id: 'custom',
    formula: customFormula.value,
    variables: customParse.value.variables.map((name) => ({ name, label: '', unit: '', units: [] })),
  };
});

/** Values as entered, in the shown unit of each variable. */
const values = ref<Record<string, number | null>>({});
const shownUnits = ref<Record<string, string>>({});
const target = ref('');
/** Chosen row of each preset, '' for the user's own value. */
const presetRows = ref<Record<string, string>>({});
const extraUnits = ref<Record<string, string>>({});

function resetForCalculator() {
  const current = calc.value;
  values.value = {};
  shownUnits.value = {};
  for (const variable of current.variables) {
    const shown = variable.shownUnit ?? variable.unit;
    shownUnits.value[variable.name] = shown;
    values.value[variable.name] =
      variable.default === undefined ? null : Number(formatResult(convertUnit(variable.default, variable.unit, shown)));
  }
  target.value =
    current.variables.find((variable) => variable.default === undefined)?.name ?? current.variables[0]?.name ?? '';
  presetRows.value = Object.fromEntries((current.presets ?? []).map((preset) => [preset.label, preset.default]));
  extraUnits.value = Object.fromEntries((current.extraOutputs ?? []).map((output) => [output.label, output.unit]));
}
watch(calcId, resetForCalculator, { immediate: true });

// A custom formula keeps the values of the variables it still has.
watch(
  () => customParse.value.variables,
  (names) => {
    if (calcId.value !== 'custom') {
      return;
    }
    values.value = Object.fromEntries(names.map((name) => [name, values.value[name] ?? null]));
    if (!names.includes(target.value)) {
      target.value = names[0] ?? '';
    }
  },
  { immediate: true },
);

/** Variable name → value from the chosen preset row, in the variable's unit. */
const presetValues = computed(() => {
  const bound: Record<string, number> = {};
  for (const preset of calc.value.presets ?? []) {
    const row = preset.table.rows[presetRows.value[preset.label]];
    if (!row) {
      continue;
    }
    for (const [name, column] of Object.entries(preset.bind)) {
      const variable = calc.value.variables.find((candidate) => candidate.name === name)!;
      bound[name] = convertUnit(row[column], preset.table.columns[column], variable.unit);
    }
  }
  return bound;
});

function toUnit(variable: CalcVariable, value: number) {
  return variable.unit ? convertUnit(value, shownUnits.value[variable.name], variable.unit) : value;
}

function fromUnit(variable: CalcVariable, value: number) {
  return variable.unit ? convertUnit(value, variable.unit, shownUnits.value[variable.name]) : value;
}

const solution = computed<{ roots: number[]; scope: Record<string, number> } | { error: string }>(() => {
  if (calcId.value === 'custom' && customParse.value.error) {
    return { error: customParse.value.error };
  }
  const scope: Record<string, number> = {};
  for (const variable of calc.value.variables) {
    if (variable.name === target.value) {
      continue;
    }
    const value = presetValues.value[variable.name] ?? values.value[variable.name];
    if (value === null || value === undefined || Number.isNaN(value)) {
      return { error: t('tools.formula-calculator.texts.missing-value') };
    }
    scope[variable.name] = variable.name in presetValues.value ? value : toUnit(variable, value);
  }
  try {
    const roots = solveEquation(calc.value.formula, target.value, scope);
    if (roots.length === 0) {
      return { error: t('tools.formula-calculator.texts.no-solution') };
    }
    return { roots, scope: { ...scope, [target.value]: roots[0] } };
  } catch (error) {
    return { error: (error as Error).message };
  }
});

function shownValue(variable: CalcVariable): string {
  if (variable.name === target.value) {
    return 'roots' in solution.value ? formatResult(fromUnit(variable, solution.value.roots[0])) : '';
  }
  const preset = presetValues.value[variable.name];
  return preset === undefined ? '' : formatResult(fromUnit(variable, preset));
}

const otherSolutions = computed(() => {
  const variable = calc.value.variables.find((candidate) => candidate.name === target.value);
  if (!variable || !('roots' in solution.value) || solution.value.roots.length < 2) {
    return '';
  }
  return solution.value.roots
    .slice(1)
    .map((root) => formatResult(fromUnit(variable, root)))
    .join('; ');
});

/** The value just found stays in the field of the variable that was solved for. */
function selectTarget(name: string) {
  const previous = calc.value.variables.find((variable) => variable.name === target.value);
  if (previous && !(previous.name in presetValues.value)) {
    const shown = shownValue(previous);
    values.value[previous.name] = shown === '' ? (values.value[previous.name] ?? null) : Number(shown);
  }
  target.value = name;
}

function isInput(variable: CalcVariable) {
  return variable.name !== target.value && !(variable.name in presetValues.value);
}

function changeUnit(variable: CalcVariable, unit: string) {
  const value = values.value[variable.name];
  if (value !== null && value !== undefined && isInput(variable)) {
    values.value[variable.name] = Number(formatResult(convertUnit(value, shownUnits.value[variable.name], unit)));
  }
  shownUnits.value[variable.name] = unit;
}

function diameterOf(variable: CalcVariable): number | null {
  const radius = values.value[variable.name];
  return radius === null || radius === undefined ? null : Number(formatResult(radius * 2));
}

function setDiameter(variable: CalcVariable, diameter: number | null) {
  values.value[variable.name] = diameter === null ? null : diameter / 2;
}

function shownDiameter(variable: CalcVariable): string {
  const radius = shownValue(variable);
  return radius === '' ? '' : formatResult(Number(radius) * 2);
}

const extraValues = computed(() => {
  const outputs = calc.value.extraOutputs ?? [];
  if (!('roots' in solution.value)) {
    return outputs.map(() => '');
  }
  const { scope } = solution.value;
  return outputs.map((output) => {
    try {
      return formatResult(
        convertUnit(evaluateExpression(output.formula, scope), output.unit, extraUnits.value[output.label]),
      );
    } catch {
      return '';
    }
  });
});

function unitOptions(units: string[]) {
  return units.map((unit) => ({ label: UNIT_LABELS[unit] ?? unit, value: unit }));
}

function variableLabel(variable: CalcVariable) {
  return variable.label ? t(`tools.formula-calculator.texts.${variable.label}`) : variable.name;
}

function presetOptions(rows: Record<string, unknown>) {
  return [
    { label: t('tools.formula-calculator.texts.preset-custom'), value: '' },
    ...Object.keys(rows).map((row) => {
      const key = `tools.formula-calculator.texts.${row}`;
      return { label: te(key) ? t(key) : row, value: row };
    }),
  ];
}
</script>

<template>
  <div style="flex: 0 0 100%">
    <div mx-auto max-w-700px>
      <c-card mb-3>
        <c-select
          v-model:value="calcId"
          :options="calcOptions"
          :label="t('tools.formula-calculator.texts.label-calculator')"
          label-position="left"
          label-width="110px"
          mb-2
        />
        <c-input-text
          v-if="calcId === 'custom'"
          v-model:value="customFormula"
          :label="t('tools.formula-calculator.texts.label-formula')"
          label-position="left"
          label-width="110px"
          font-mono
          raw-text
          mb-2
          data-test-id="formula"
        />
        <div v-else mb-2 font-mono data-test-id="formula">
          {{ calc.formula }}
        </div>
        <n-text depth="3" text-sm>
          {{ t(`tools.formula-calculator.texts.about-${calc.id}`) }}
        </n-text>
      </c-card>

      <c-card v-if="calc.presets?.length" :title="t('tools.formula-calculator.texts.presets')" mb-3>
        <c-select
          v-for="preset in calc.presets"
          :key="preset.label"
          v-model:value="presetRows[preset.label]"
          :options="presetOptions(preset.table.rows)"
          :label="t(`tools.formula-calculator.texts.${preset.label}`)"
          label-position="left"
          label-width="160px"
          searchable
          mb-2
        />
      </c-card>

      <c-card :title="t('tools.formula-calculator.texts.variables')" mb-3>
        <n-radio-group :value="target" name="solve-for" w-full @update:value="selectTarget">
          <div class="variables">
            <div />
            <div />
            <div />
            <n-text depth="3" text-center text-sm>
              {{ t('tools.formula-calculator.texts.solve-for') }}
            </n-text>

            <template v-for="variable in calc.variables" :key="variable.name">
              <div>{{ variableLabel(variable) }}</div>
              <n-input-number-i18n
                v-if="isInput(variable)"
                v-model:value="values[variable.name]"
                :show-button="false"
                :data-test-id="`value-${variable.name}`"
              />
              <InputCopyable v-else :value="shownValue(variable)" readonly :data-test-id="`value-${variable.name}`" />
              <c-select
                v-if="variable.units.length"
                :value="shownUnits[variable.name]"
                :options="unitOptions(variable.units)"
                :data-test-id="`unit-${variable.name}`"
                @update:value="(unit: string) => changeUnit(variable, unit)"
              />
              <div v-else />
              <div flex justify-center>
                <n-radio
                  :value="variable.name"
                  :disabled="variable.name in presetValues"
                  :data-test-id="`solve-${variable.name}`"
                />
              </div>

              <template v-if="variable.diameter">
                <div pl-4>
                  {{ t('tools.formula-calculator.texts.var-diameter') }}
                </div>
                <n-input-number-i18n
                  v-if="isInput(variable)"
                  :value="diameterOf(variable)"
                  :show-button="false"
                  :data-test-id="`diameter-${variable.name}`"
                  @update:value="(diameter: number | null) => setDiameter(variable, diameter)"
                />
                <InputCopyable
                  v-else
                  :value="shownDiameter(variable)"
                  readonly
                  :data-test-id="`diameter-${variable.name}`"
                />
                <n-text depth="3" pl-2>
                  {{ unitOptions([shownUnits[variable.name]])[0].label }}
                </n-text>
                <div />
              </template>
            </template>
          </div>
        </n-radio-group>

        <c-alert v-if="'error' in solution" type="warning" mt-3>
          {{ solution.error }}
        </c-alert>
        <n-text v-else-if="otherSolutions" depth="3" mt-3 block text-sm>
          {{ t('tools.formula-calculator.texts.other-solutions', [otherSolutions]) }}
        </n-text>
      </c-card>

      <c-card v-if="calc.extraOutputs?.length" :title="t('tools.formula-calculator.texts.extra-outputs')">
        <div class="variables">
          <template v-for="(output, index) in calc.extraOutputs" :key="output.label">
            <div>{{ t(`tools.formula-calculator.texts.${output.label}`) }}</div>
            <InputCopyable :value="extraValues[index]" readonly :data-test-id="`extra-${index}`" />
            <c-select v-model:value="extraUnits[output.label]" :options="unitOptions(output.units)" />
            <div />
          </template>
        </div>
      </c-card>
    </div>
  </div>
</template>

<style scoped lang="less">
.variables {
  display: grid;
  grid-template-columns: minmax(120px, 1.2fr) 2fr minmax(90px, 1fr) 60px;
  gap: 8px 12px;
  align-items: center;
}

@media (max-width: 600px) {
  .variables {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
