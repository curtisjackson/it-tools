// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/time/convert-time-to-decimal/service.ts and
// humanTimeValidation from src/utils/time.ts

export interface InitialValuesType {
  decimalPlaces: string;
}

interface TimeValidationResult {
  isValid: boolean;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Parses `HH:MM`, `HH:MM:SS` or the same with dots (not mixed); minutes and seconds must be below 60. */
export function humanTimeValidation(input: string): TimeValidationResult {
  const invalid = { isValid: false, hours: 0, minutes: 0, seconds: 0 };
  const time = input?.trim();
  if (!time) {
    return invalid;
  }
  const hasColon = time.includes(':');
  const hasDot = time.includes('.');
  if (hasColon === hasDot) {
    return invalid;
  }
  const parts = time.split(hasColon ? ':' : '.');
  if (parts.length < 2 || parts.length > 3) {
    return invalid;
  }
  const [h, m, s = '0'] = parts;
  if (![h, m, s].every((part) => /^\d+$/.test(part))) {
    return invalid;
  }
  const [hours, minutes, seconds] = [h, m, s].map((part) => Number.parseInt(part, 10));
  if (minutes > 59 || seconds > 59) {
    return invalid;
  }
  return { isValid: true, hours, minutes, seconds };
}

const DEFAULT_INVALID = 'Incorrect input format use `HH:MM:(SS)` or `HH.MM.(SS )`.';

/** Converts each `HH:MM(:SS)` line to decimal hours (`13:25` → `13.416667`); empty lines are skipped. */
export function convertTimeToDecimal(
  input: string,
  options: InitialValuesType,
  invalidMessage = DEFAULT_INVALID,
): string {
  if (!input) {
    return '';
  }
  const decimalPlaces = Number.parseInt(options.decimalPlaces, 10);
  if (Number.isNaN(decimalPlaces) || decimalPlaces < 0) {
    return 'Invalid decimal places value.';
  }
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const { isValid, hours, minutes, seconds } = humanTimeValidation(line);
      return isValid ? (hours + minutes / 60 + seconds / 3600).toFixed(decimalPlaces) : invalidMessage;
    })
    .join('\n');
}
