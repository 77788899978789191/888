/**
 * Project: Gungnir - Constant Obfuscation (Layer 3: Data & Constant Blackhole)
 *
 * Transforms every numeric constant into semantically-equivalent but
 * analytically hostile expressions:
 *
 * - Arithmetic decomposition: 42 → (168 / 4), (21 * 2), (41 + 1)
 * - MBA-style (Mixed Boolean-Arithmetic): n → ((n ⊕ k) + ((n & k) * 2))
 *   exploiting the identity (a xor b) + 2*(a and b) == a + b
 * - Split-radix encoding: n → hi * 2^k + lo
 * - Table length encoding: n → #{e1, e2, ...} (n elements)
 * - Negative wrapping: n → (~x) + 1 == -x bitwise complement identity
 * - Float precision encoding: integer → fractional arithmetic that
 *   resolves exactly in IEEE754 (x → (x * 4) / 4 within 2^52)
 *
 * Every transform is value-preserving: the generated expression evaluates
 * to the exact original constant in Lua 5.1/5.3/Luau at runtime.
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import { createNumericLiteral, createBinaryExpression, walk } from '../utils/helpers';

type TransformKind =
  | 'arith-decompose'
  | 'mba-identity'
  | 'split-radix'
  | 'table-length'
  | 'negative-wrap'
  | 'float-encode';

const TRANSFORM_COSTS: Record<TransformKind, number> = {
  'arith-decompose': 1,
  'mba-identity': 4,
  'split-radix': 3,
  'table-length': 6,
  'negative-wrap': 2,
  'float-encode': 3,
};

export class ConstantObfuscationPlugin implements ObfuscationPlugin {
  name = 'ConstantObfuscation';
  description = 'Rewrites numeric constants as MBA identities, split-radix arithmetic, and table-length expressions';
  layers = [3];

  transform(ctx: ObfuscationContext): Chunk {
    const intensity = ctx.config.intensity;
    // Injection probability scales with intensity (10% → 90%)
    const injectRate = Math.min(0.1 + intensity * 0.08, 0.9);

    // Collect numeric literals first to avoid mutating during walk
    const targets: {
      node: Record<string, unknown>;
      value: number;
      raw: string;
    }[] = [];

    walk(ctx.ast, (node) => {
      const n = node as unknown as Record<string, unknown>;
      if (n.type !== 'NumericLiteral') return;

      const value = Number(n.value);
      const raw = String(n.raw ?? '');

      // Skip: hex literals already obfuscated by author, tiny numbers
      // used as loop steps, and values we can't round-trip safely
      if (!Number.isFinite(value)) return;
      if (raw.startsWith('0x') || raw.startsWith('0X')) return;
      if (value === 0 || value === 1) return; // keep trivial values fast
      if (!Number.isInteger(value) && Math.abs(value) > 2 ** 31) return;

      // Hot-path exemption: in float-heavy contexts keep constants native
      if (ctx.config.hotPathExemption && Math.abs(value) > 2 ** 40) return;

      targets.push({ node: n, value, raw });
    });

    for (const target of targets) {
      if (ctx.rng.next() > injectRate) continue;

      const transformed = this.transformConstant(ctx, target.value, intensity);
      if (transformed === null) continue;

      // Replace the literal in-place with the generated expression
      const newNode = transformed as unknown as Record<string, unknown>;
      for (const key of Object.keys(target.node)) {
        delete target.node[key];
      }
      Object.assign(target.node, newNode);
      ctx.stats.constantsObfuscated++;
    }

    return ctx.ast;
  }

  /**
   * Transform a constant into an equivalent expression.
   * May recursively nest transforms at high intensity.
   */
  private transformConstant(
    ctx: ObfuscationContext, value: number, intensity: number
  ): LuaNode | null {
    const kinds: TransformKind[] = [
      'arith-decompose', 'mba-identity', 'split-radix',
      'table-length', 'negative-wrap', 'float-encode',
    ];

    // Filter by affordability: expensive transforms only at higher intensity
    const affordable = kinds.filter(
      k => TRANSFORM_COSTS[k] <= intensity
    );
    const pool = affordable.length > 0
      ? affordable
      : (['arith-decompose'] as TransformKind[]);
    const kind = ctx.rng.pick(pool);

    let result = this.applyTransform(ctx, value, kind);

    // Nesting: at intensity >= 6, wrap the result in a second transform.
    // Only for integers — (e + k) - k is not exact for arbitrary floats.
    if (result !== null && Number.isInteger(value) && intensity >= 6 && ctx.rng.bool()) {
      result = this.wrapSecondLayer(ctx, result);
    }

    return result;
  }

  /**
   * Apply a single transform kind to a constant value.
   */
  private applyTransform(
    ctx: ObfuscationContext, value: number, kind: TransformKind
  ): LuaNode | null {
    switch (kind) {
      case 'arith-decompose':
        return this.arithDecompose(ctx, value);
      case 'mba-identity':
        return this.mbaIdentity(ctx, value);
      case 'split-radix':
        return this.splitRadix(ctx, value);
      case 'table-length':
        return this.tableLength(ctx, value);
      case 'negative-wrap':
        return this.negativeWrap(ctx, value);
      case 'float-encode':
        return this.floatEncode(ctx, value);
      default:
        return null;
    }
  }

  /**
   * Transform 1: Arithmetic Decomposition
   * n → (a op b) where a op b == n
   * Variants: n*2/2, n+k-k, (n<<1)>>1, (n-1)+1
   */
  private arithDecompose(ctx: ObfuscationContext, value: number): LuaNode {
    // Only safe for integers within float-exact range
    if (!Number.isInteger(value) || Math.abs(value) > 2 ** 51) {
      // For floats: n → (n * 4) / 4 — exact when n is IEEE754 representable
      return createBinaryExpression(
        '/',
        createBinaryExpression('*', createNumericLiteral(value), createNumericLiteral(4)),
        createNumericLiteral(4)
      );
    }

    const variant = ctx.rng.int(0, 4);
    switch (variant) {
      case 0: // (n + k) - k
      {
        const k = ctx.rng.int(2, 9999);
        return createBinaryExpression(
          '-',
          createBinaryExpression('+', createNumericLiteral(value), createNumericLiteral(k)),
          createNumericLiteral(k)
        );
      }
      case 1: // (n * 2) / 2
        return createBinaryExpression(
          '/',
          createBinaryExpression('*', createNumericLiteral(value), createNumericLiteral(2)),
          createNumericLiteral(2)
        );
      case 2: // (a * b) + c where a*b + c = n
      {
        // Find a divisor for exact factorization, fallback to additive split
        const c = ctx.rng.int(1, Math.max(2, Math.floor(Math.abs(value) / 4)) || 2);
        const rest = value - c;
        if (rest !== 0 && Math.abs(rest) > 2) {
          return createBinaryExpression(
            '+',
            createBinaryExpression(
              '*',
              createNumericLiteral(Math.trunc(rest / 2)),
              createNumericLiteral(2)
            ),
            createNumericLiteral(rest - Math.trunc(rest / 2) * 2 + c)
          );
        }
        return createBinaryExpression(
          '+', createNumericLiteral(value), createNumericLiteral(0)
        );
      }
      case 3: // (n - 1) + 1
        return createBinaryExpression(
          '+',
          createBinaryExpression('-', createNumericLiteral(value), createNumericLiteral(1)),
          createNumericLiteral(1)
        );
      default: { // (n ^ 1) — XOR with 1 keeps value only if low bit clear; use safe variant: n * 1
        return createBinaryExpression(
          '*',
          createNumericLiteral(value),
          createBinaryExpression('-', createNumericLiteral(3), createNumericLiteral(2))
        );
      }
    }
  }

  /**
   * Transform 2: MBA Identity (Mixed Boolean-Arithmetic)
   *
   * Strategy A (|n| < 2^25, integers): nonlinear polynomial identity
   *   n == (n^2 + n) - n^2
   * Nonlinear arithmetic is the known weak point of SMT solvers (Z3's
   * nonlin-int tactic is incomplete). Exact only for integers whose
   * square fits in a double — floats drift by ~1e-17 under this
   * identity, so they are excluded.
   *
   * Strategy B (larger integers): mod-partition identity
   *   n == (n % k) + (n - n % k)
   * This holds exactly under any modulo convention (the (n % k) terms
   * cancel algebraically), and % is hostile to nonlinear-integer solvers.
   *
   * Non-integer values return null — no exact nonlinear transform exists.
   */
  private mbaIdentity(ctx: ObfuscationContext, value: number): LuaNode | null {
    if (!Number.isInteger(value)) return null;

    if (Math.abs(value) < 2 ** 25) {
      // Fresh node objects per usage — shared AST references get visited
      // multiple times by later in-place rewrite passes, causing
      // double-processing corruption.
      const nSq = () => createBinaryExpression('^', createNumericLiteral(value), createNumericLiteral(2));
      const nSqPlusN = createBinaryExpression('+', nSq(), createNumericLiteral(value));
      return createBinaryExpression('-', nSqPlusN, nSq());
    }

    if (Math.abs(value) < 2 ** 51) {
      const k = ctx.rng.int(3, 997);
      const modA = createBinaryExpression('%', createNumericLiteral(value), createNumericLiteral(k));
      const modB = createBinaryExpression('%', createNumericLiteral(value), createNumericLiteral(k));
      const subPart = createBinaryExpression('-', createNumericLiteral(value), modB);
      return createBinaryExpression('+', modA, subPart);
    }

    return null;
  }

  /**
   * Transform 3: Split-Radix Encoding
   * n → hi * 2^k + lo, where the value is split across a random radix point.
   * Defeats pattern matching on immediate constants.
   */
  private splitRadix(ctx: ObfuscationContext, value: number): LuaNode | null {
    if (!Number.isInteger(value) || value <= 0 || value > 2 ** 31) return null;

    const shift = ctx.rng.int(4, 16);
    const radix = 2 ** shift;
    const hi = Math.floor(value / radix);
    const lo = value - hi * radix;

    if (hi <= 0) return null;

    // (hi * radix) + lo  — radix itself expressed as a power for extra noise
    const radixExpr = createBinaryExpression(
      '^', createNumericLiteral(2), createNumericLiteral(shift)
    );
    return createBinaryExpression(
      '+',
      createBinaryExpression('*', createNumericLiteral(hi), radixExpr),
      createNumericLiteral(lo)
    );
  }

  /**
   * Transform 4: Table Length Encoding
   * n → #{e1, e2, ..., en} (a table constructor with exactly n entries)
   * The count is computed at runtime; entries are cheap literals.
   * Extremely hostile to static constant folding.
   */
  private tableLength(_ctx: ObfuscationContext, value: number): LuaNode | null {
    // Cap: table constructor with >64 entries is wasteful
    if (!Number.isInteger(value) || value < 2 || value > 64) return null;

    const entries: LuaNode[] = [];
    for (let i = 0; i < value; i++) {
      entries.push(createNumericLiteral(0));
    }

    return {
      type: 'UnaryExpression',
      operator: '#',
      argument: {
        type: 'TableConstructorExpression',
        fields: entries.map(e => ({
          type: 'TableValue',
          key: null,
          value: e,
        })) as never,
      },
    } as never;
  }

  /**
   * Transform 5: Negative Wrap (Lua 5.1 compatible — no bitwise operators)
   * n → -(-n), or n → (n*k) - n*(k-1) for random k.
   * Both forms are exactly value-preserving for integers.
   */
  private negativeWrap(ctx: ObfuscationContext, value: number): LuaNode | null {
    if (!Number.isInteger(value) || value >= 0) return null;

    // -(-n): double negation
    if (ctx.rng.bool()) {
      return {
        type: 'UnaryExpression',
        operator: '-',
        argument: {
          type: 'UnaryExpression',
          operator: '-',
          argument: createNumericLiteral(value),
        },
      } as never;
    }

    // (n*k) - n*(k-1) == n — requires |n*k| < 2^53 for exactness
    const k = ctx.rng.int(2, 9);
    if (Math.abs(value) * k < 2 ** 51) {
      return createBinaryExpression(
        '-',
        createBinaryExpression('*', createNumericLiteral(value), createNumericLiteral(k)),
        createBinaryExpression('*', createNumericLiteral(value), createNumericLiteral(k - 1))
      );
    }

    // Fallback for very large negatives: double sign flip (exact for all values)
    return createBinaryExpression(
      '-',
      createNumericLiteral(0),
      createBinaryExpression('-', createNumericLiteral(0), createNumericLiteral(value))
    );
  }

  /**
   * Transform 6: Float Precision Encoding
   * Integer n (|n| < 2^26) → (n.m * 1e6 - frac * 1e6) / 1e0
   * Uses the fact that integers are exactly representable in doubles.
   */
  private floatEncode(ctx: ObfuscationContext, value: number): LuaNode | null {
    if (!Number.isInteger(value) || Math.abs(value) > 2 ** 26) return null;

    const scale = ctx.rng.pick([1000, 10000, 100000]);
    const shifted = value * scale; // exact for |value| < 2^26 / 1e5 ≈ 671088

    if (!Number.isInteger(shifted)) return null;

    // (shifted + 0.0) / scale — the +0.0 forces float domain
    return createBinaryExpression(
      '/',
      createBinaryExpression('+', createNumericLiteral(shifted), createNumericLiteral(0)),
      createNumericLiteral(scale)
    );
  }

  /**
   * Wrap an existing expression in a second noise layer:
   * expr → (expr + k) - k
   */
  private wrapSecondLayer(ctx: ObfuscationContext, expr: LuaNode): LuaNode {
    const k = ctx.rng.int(2, 999);
    return createBinaryExpression(
      '-',
      createBinaryExpression('+', expr, createNumericLiteral(k)),
      createNumericLiteral(k)
    );
  }
}
