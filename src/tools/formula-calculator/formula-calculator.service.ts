import { type MathNode, parse, unit } from 'mathjs';

// Ported from Omni-Tools (src/pages/tools/number/generic-calc), MIT. Omni solves the formula
// symbolically with nerdamer; here it is solved numerically with mathjs, which the fork already
// has: any formula works, not only the ones nerdamer can rearrange, and mathjs converts the units.

/** Names that are constants in a formula, never variables. */
const CONSTANTS = new Set([
  'pi',
  'PI',
  'e',
  'E',
  'tau',
  'phi',
  'i',
  'Infinity',
  'NaN',
  'SQRT2',
  'SQRT1_2',
  'LN2',
  'LN10',
]);

export interface Equation {
  left: MathNode;
  right: MathNode;
}

/** Splits `left = right` at its single `=`; `==`, `<=`, `>=` and `!=` are not one. */
export function parseEquation(formula: string): Equation {
  const positions = [...formula.matchAll(/(?<![=<>!])=(?!=)/g)].map((match) => match.index!);
  if (positions.length !== 1) {
    throw new Error('The formula must have exactly one "=".');
  }
  const [at] = positions;
  return { left: parse(formula.slice(0, at)), right: parse(formula.slice(at + 1)) };
}

function symbolsOf(node: MathNode): string[] {
  const functions = new Set(
    node
      .filter((child) => child.type === 'FunctionNode')
      .map((child) => (child as unknown as { fn: { name: string } }).fn.name),
  );
  const names = node
    .filter((child) => child.type === 'SymbolNode')
    .map((child) => (child as unknown as { name: string }).name)
    .filter((name) => !functions.has(name) && !CONSTANTS.has(name));
  return [...new Set(names)];
}

/** The variables of a formula, in the order they first appear. */
export function equationVariables(formula: string): string[] {
  const { left, right } = parseEquation(formula);
  return [...new Set([...symbolsOf(left), ...symbolsOf(right)])];
}

function evaluateNode(node: MathNode, scope: Record<string, number>): number {
  const value = node.evaluate({ ...scope });
  return typeof value === 'number' ? value : Number.NaN;
}

export function evaluateExpression(expression: string, scope: Record<string, number>): number {
  return evaluateNode(parse(expression), scope);
}

function bisect(f: (x: number) => number, a: number, b: number, fa: number): number {
  for (let i = 0; i < 200; i++) {
    const middle = (a + b) / 2;
    if (middle === a || middle === b) {
      break;
    }
    const value = f(middle);
    if (value === 0) {
      return middle;
    }
    if (Math.sign(value) === Math.sign(fa)) {
      a = middle;
      fa = value;
    } else {
      b = middle;
    }
  }
  return (a + b) / 2;
}

/** Sign changes of f over ±1e-15…1e15 on a log scale, refined by bisection. */
function scanRoots(f: (x: number) => number, isRoot: (x: number) => boolean, sign: 1 | -1): number[] {
  const roots: number[] = [];
  let previous: { x: number; value: number } | undefined;
  for (let k = -300; k <= 300; k++) {
    const x = sign * 10 ** (k / 20);
    const value = f(x);
    if (!Number.isFinite(value)) {
      previous = undefined;
      continue;
    }
    if (value === 0) {
      roots.push(x);
    } else if (previous && previous.value !== 0 && Math.sign(previous.value) !== Math.sign(value)) {
      const root = bisect(f, previous.x, x, previous.value);
      // A sign change across a pole, as 1/(x-1) has at 1, is no root.
      if (isRoot(root)) {
        roots.push(root);
      }
    }
    previous = { x, value };
  }
  return roots;
}

function dedupe(roots: number[]): number[] {
  return roots.filter(
    (root, index) => roots.findIndex((other) => Math.abs(other - root) <= 1e-9 * Math.abs(root)) === index,
  );
}

/**
 * Solves the formula for one variable, given the values of the others. Returns every root it finds:
 * positive ones first (smallest first), as physical quantities usually are, then zero, then negative
 * ones (nearest to zero first). An empty list means no solution.
 */
export function solveEquation(formula: string, target: string, values: Record<string, number>): number[] {
  const { left, right } = parseEquation(formula);
  const scope = { ...values };
  delete scope[target];

  // `target = expression without target`: no need to search.
  for (const [side, other] of [
    [left, right],
    [right, left],
  ] as const) {
    if (
      side.type === 'SymbolNode' &&
      (side as unknown as { name: string }).name === target &&
      !symbolsOf(other).includes(target)
    ) {
      const value = evaluateNode(other, scope);
      return Number.isFinite(value) ? [value] : [];
    }
  }

  const sides = (x: number) => [
    evaluateNode(left, { ...scope, [target]: x }),
    evaluateNode(right, { ...scope, [target]: x }),
  ];
  const f = (x: number) => {
    const [l, r] = sides(x);
    return l - r;
  };
  const isRoot = (x: number) => {
    const [l, r] = sides(x);
    return Math.abs(l - r) <= 1e-6 * Math.max(Math.abs(l), Math.abs(r), 1e-300);
  };

  const positive = dedupe(scanRoots(f, isRoot, 1));
  const zero = f(0) === 0 ? [0] : [];
  const negative = dedupe(scanRoots(f, isRoot, -1));
  return [...positive, ...zero, ...negative];
}

export function convertUnit(value: number, from: string, to: string): number {
  return from === to ? value : unit(value, from).toNumber(to);
}

/** Rounds away the floating point noise of a result: 12 significant digits. */
export function formatResult(value: number): string {
  if (!Number.isFinite(value)) {
    return '';
  }
  return String(Number(value.toPrecision(12)));
}
