import { describe, expect, it } from 'vitest';
import {
  convertUnit,
  equationVariables,
  evaluateExpression,
  formatResult,
  parseEquation,
  solveEquation,
} from './formula-calculator.service';
import { calculators } from './formula-calculator.data';

function calculator(id: string) {
  return calculators.find((calc) => calc.id === id)!;
}

describe('formula-calculator', () => {
  describe('equationVariables', () => {
    it('lists the variables, without functions and constants', () => {
      expect(equationVariables('T = W * sqrt(S^2 + (L / 2)^2) / (2 * S)')).toEqual(['T', 'W', 'S', 'L']);
      expect(equationVariables('A = 4 * pi * r^2')).toEqual(['A', 'r']);
      expect(equationVariables('y = e^(k * t) + sin(t)')).toEqual(['y', 'k', 't']);
    });

    it('needs exactly one "="', () => {
      expect(() => parseEquation('a + b')).toThrow();
      expect(() => parseEquation('a = b = c')).toThrow();
      expect(equationVariables('y = (a == b) + c')).toEqual(['y', 'a', 'b', 'c']);
    });
  });

  describe('solveEquation', () => {
    it('evaluates a variable that stands alone on one side', () => {
      expect(solveEquation('V = I * R', 'V', { I: 2, R: 3 })).toEqual([6]);
      expect(solveEquation('I * R = V', 'V', { I: 2, R: 3 })).toEqual([6]);
    });

    it('solves for a variable inside the formula', () => {
      const [current] = solveEquation('V = I * R', 'I', { V: 5, R: 2 });
      expect(current).toBeCloseTo(2.5, 12);
      const [radius] = solveEquation('A = 4 * pi * r^2', 'r', { A: 4 * Math.PI });
      expect(radius).toBeCloseTo(1, 12);
    });

    it('returns every root, positive ones first', () => {
      const roots = solveEquation('x^2 = 4', 'x', {});
      expect(roots).toHaveLength(2);
      expect(roots[0]).toBeCloseTo(2, 12);
      expect(roots[1]).toBeCloseTo(-2, 12);
      expect(solveEquation('x * (x - 3) = 0', 'x', {})).toEqual([3, 0]);
    });

    it('returns no root when there is none, nor at a pole', () => {
      expect(solveEquation('x^2 = -1', 'x', {})).toEqual([]);
      expect(solveEquation('1 / (x - 1) = 0', 'x', {})).toEqual([]);
      expect(solveEquation('y = sqrt(x)', 'y', { x: -1 })).toEqual([]);
    });

    it('solves the slackline tension for the sag', () => {
      const { formula } = calculator('slackline');
      const [tension] = solveEquation(formula, 'T', { W: 100, S: 1, L: 15 });
      expect(tension).toBeCloseTo((100 * Math.sqrt(1 + 7.5 ** 2)) / 2, 9);
      const [sag] = solveEquation(formula, 'S', { W: 100, T: tension, L: 15 });
      expect(sag).toBeCloseTo(1, 9);
    });

    it('computes the voltage drop of a copper cable', () => {
      // 10 m of 1.5 mm² copper at 10 A: 2 × 1.68e-8 × 10 / 1.5e-6 × 10 = 2.24 V.
      const { formula, extraOutputs } = calculator('voltage-drop');
      const values = { L: 10, A: 1.5, I: 10, p: 1.68e-8 };
      expect(solveEquation(formula, 'x', values)[0]).toBeCloseTo(2.24, 12);
      expect(evaluateExpression(extraOutputs![0].formula, values)).toBeCloseTo(0.224, 12);
      expect(evaluateExpression(extraOutputs![1].formula, values)).toBeCloseTo(22.4, 10);
      const [area] = solveEquation(formula, 'A', { ...values, x: 2.24 });
      expect(area).toBeCloseTo(1.5, 9);
    });
  });

  describe('calculators', () => {
    it('declare every variable of their formula, with a known unit', () => {
      for (const calc of calculators) {
        expect(calc.variables.map((variable) => variable.name).sort(), calc.id).toEqual(
          equationVariables(calc.formula).sort(),
        );
        for (const variable of calc.variables) {
          for (const shown of variable.units) {
            expect(() => convertUnit(1, shown, variable.unit), `${calc.id} ${shown}`).not.toThrow();
          }
          expect(variable.units).toContain(variable.shownUnit ?? variable.unit);
        }
        expect(
          calc.variables.filter((variable) => variable.default === undefined),
          calc.id,
        ).toHaveLength(1);
      }
    });

    it('have wire gauges as areas', () => {
      const gauges = calculator('voltage-drop').presets![1].table.rows;
      expect(gauges['10 AWG'].area).toBeCloseTo(5.26, 2);
      expect(Object.keys(gauges)).toHaveLength(44);
    });
  });

  it('converts units', () => {
    expect(convertUnit(1, 'kgf', 'N')).toBeCloseTo(9.80665, 12);
    expect(convertUnit(16.8, 'nohm m', 'ohm m')).toBeCloseTo(1.68e-8, 20);
    expect(convertUnit(1, 'in^2', 'mm^2')).toBeCloseTo(645.16, 9);
    expect(convertUnit(3, 'V', 'V')).toBe(3);
  });

  it('formats results without floating point noise', () => {
    expect(formatResult(0.1 + 0.2)).toBe('0.3');
    expect(formatResult(1.68e-8)).toBe('1.68e-8');
    expect(formatResult(Number.NaN)).toBe('');
  });
});
