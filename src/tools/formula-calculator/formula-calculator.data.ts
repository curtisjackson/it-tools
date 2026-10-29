// The calculators of Omni-Tools (src/pages/tools/number/generic-calc/data and src/datatables), MIT.
// Units are mathjs unit names. Each variable is entered in one of its `units`; the formula
// gets it in `unit`.

export interface CalcVariable {
  name: string;
  /** Key of its label in `tools.formula-calculator.texts`. */
  label: string;
  unit: string;
  units: string[];
  /** The unit shown at first; `unit` if missing. */
  shownUnit?: string;
  /** The variable without a default is the one solved for at first. */
  default?: number;
  /** Also offer the diameter, for a radius. */
  diameter?: boolean;
}

export interface DataTable {
  /** Unit of each column. */
  columns: Record<string, string>;
  rows: Record<string, Record<string, number>>;
}

export interface CalcPreset {
  label: string;
  table: DataTable;
  /** A row of the table, or '' for the user's own values. */
  default: string;
  /** Variable name → column. */
  bind: Record<string, string>;
}

export interface CalcExtraOutput {
  label: string;
  formula: string;
  unit: string;
  units: string[];
}

export interface Calculator {
  id: string;
  formula: string;
  variables: CalcVariable[];
  presets?: CalcPreset[];
  extraOutputs?: CalcExtraOutput[];
}

const LENGTH = ['mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi'];
const AREA = ['mm^2', 'cm^2', 'm^2', 'in^2', 'ft^2'];
const VOLUME = ['mm^3', 'cm^3', 'm^3', 'mL', 'L', 'in^3', 'ft^3', 'gal'];
const VOLTAGE = ['uV', 'mV', 'V', 'kV'];
const CURRENT = ['uA', 'mA', 'A', 'kA'];
const RESISTANCE = ['mohm', 'ohm', 'kohm', 'Mohm'];
const POWER = ['mW', 'W', 'kW'];
const FORCE = ['N', 'kN', 'kgf', 'lbf'];

/** Resistivity at 20 °C. */
const materials: DataTable = {
  columns: { resistivity: 'ohm m' },
  rows: {
    Copper: { resistivity: 1.68e-8 },
    Aluminum: { resistivity: 2.82e-8 },
  },
};

const awgDiameters: [string, number][] = [
  ['0000 (4/0)', 11.684],
  ['000 (3/0)', 10.405],
  ['00 (2/0)', 9.266],
  ['0 (1/0)', 8.251],
  ['1', 7.348],
  ['2', 6.544],
  ['3', 5.827],
  ['4', 5.189],
  ['5', 4.621],
  ['6', 4.115],
  ['7', 3.665],
  ['8', 3.264],
  ['9', 2.906],
  ['10', 2.588],
  ['11', 2.305],
  ['12', 2.053],
  ['13', 1.828],
  ['14', 1.628],
  ['15', 1.45],
  ['16', 1.291],
  ['17', 1.15],
  ['18', 1.024],
  ['19', 0.912],
  ['20', 0.812],
  ['21', 0.723],
  ['22', 0.644],
  ['23', 0.573],
  ['24', 0.511],
  ['25', 0.455],
  ['26', 0.405],
  ['27', 0.361],
  ['28', 0.321],
  ['29', 0.286],
  ['30', 0.255],
  ['31', 0.227],
  ['32', 0.202],
  ['33', 0.18],
  ['34', 0.16],
  ['35', 0.143],
  ['36', 0.127],
  ['37', 0.113],
  ['38', 0.101],
  ['39', 0.0897],
  ['40', 0.0799],
];

const wireGauges: DataTable = {
  columns: { area: 'mm^2' },
  rows: Object.fromEntries(
    awgDiameters.map(([gauge, diameter]) => [`${gauge} AWG`, { area: Math.PI * (diameter / 2) ** 2 }]),
  ),
};

export const calculators: Calculator[] = [
  {
    id: 'ohms-law',
    formula: 'V = I * R',
    variables: [
      { name: 'V', label: 'var-voltage', unit: 'V', units: VOLTAGE, default: 5 },
      { name: 'I', label: 'var-current', unit: 'A', units: CURRENT, default: 1 },
      { name: 'R', label: 'var-resistance', unit: 'ohm', units: RESISTANCE },
    ],
    extraOutputs: [{ label: 'var-power', formula: 'V * I', unit: 'W', units: POWER }],
  },
  {
    id: 'voltage-drop',
    // Both conductors, there and back: L is the length of the cable.
    formula: 'x = 2 * p * L / (A * 10^-6) * I',
    variables: [
      { name: 'L', label: 'var-cable-length', unit: 'm', units: LENGTH, default: 10 },
      { name: 'A', label: 'var-wire-area', unit: 'mm^2', units: AREA, default: 1.5 },
      { name: 'I', label: 'var-current', unit: 'A', units: CURRENT, default: 10 },
      {
        name: 'p',
        label: 'var-resistivity',
        unit: 'ohm m',
        units: ['nohm m', 'uohm cm', 'ohm m'],
        shownUnit: 'nohm m',
        default: 1.68e-8,
      },
      { name: 'x', label: 'var-voltage-drop', unit: 'V', units: VOLTAGE },
    ],
    presets: [
      { label: 'preset-material', table: materials, default: 'Copper', bind: { p: 'resistivity' } },
      { label: 'preset-wire-gauge', table: wireGauges, default: '', bind: { A: 'area' } },
    ],
    extraOutputs: [
      { label: 'var-total-resistance', formula: '2 * p * L / (A * 10^-6)', unit: 'ohm', units: RESISTANCE },
      { label: 'var-power-loss', formula: 'I^2 * 2 * p * L / (A * 10^-6)', unit: 'W', units: POWER },
    ],
  },
  {
    id: 'sphere-area',
    formula: 'A = 4 * pi * r^2',
    variables: [
      { name: 'A', label: 'var-surface-area', unit: 'mm^2', units: AREA },
      { name: 'r', label: 'var-radius', unit: 'mm', units: LENGTH, default: 1, diameter: true },
    ],
  },
  {
    id: 'sphere-volume',
    formula: 'v = 4 / 3 * pi * r^3',
    variables: [
      { name: 'v', label: 'var-volume', unit: 'mm^3', units: VOLUME },
      { name: 'r', label: 'var-radius', unit: 'mm', units: LENGTH, default: 1, diameter: true },
    ],
  },
  {
    id: 'slackline',
    // A load in the middle of the line.
    formula: 'T = W * sqrt(S^2 + (L / 2)^2) / (2 * S)',
    variables: [
      { name: 'L', label: 'var-span', unit: 'm', units: LENGTH, default: 15 },
      { name: 'W', label: 'var-load', unit: 'N', units: FORCE, shownUnit: 'kgf', default: 75 * 9.80665 },
      { name: 'S', label: 'var-sag', unit: 'm', units: LENGTH, default: 1 },
      { name: 'T', label: 'var-tension', unit: 'N', units: FORCE, shownUnit: 'kgf' },
    ],
  },
];
