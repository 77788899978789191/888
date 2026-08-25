/**
 * Project: Gungnir - Expression Decomposition (Layer 3: Data & Constant Blackhole)
 *
 * Item 15: expression tree depth decomposition.
 *
 * Rebuilds literal arithmetic expressions (e.g. `2 + 3`, `x * 7` where
 * both operands are integer literals) as deeply nested identity-wrapped
 * trees:
 *
 *   a + b  →  ((((a + k1) - k1) + k2) - k2) op ((((b + k3) - k3) ...) ...)
 *
 * Tree depth scales with intensity (up to ~21 levels at intensity 10),
 * far beyond what decompiler expression reconstructors will collapse.
 *
 * EXACTNESS GUARANTEE:
 * - Only integer-valued literal operands with integer results are targeted
 * - The identity (e + k) - k is exact for integers within double range
 * - The replacement tree is built entirely from fresh nodes (no aliasing
 *   of the original node — in-place field replacement stays acyclic)
 *
 * Note on `%`: the identity wrapping is value-preserving under any modulo
 * convention (Lua and JS differ on negative operands, but the wrapping
 * never depends on the operand's evaluated value — only on its
 * integrality, which holds under both conventions).
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import { createNumericLiteral, createBinaryExpression, walk } from '../utils/helpers';

const ARITH_OPS = ['+', '-', '*', '%', '^'] as const;
type ArithOp = typeof ARITH_OPS[number];

export class ExpressionDecompositionPlugin implements ObfuscationPlugin {
  name = 'ExpressionDecomposition';
  description = 'Rebuilds literal arithmetic as deep identity-wrapped expression trees (exact for integers)';
  layers = [3];

  transform(ctx: ObfuscationContext): Chunk {
    const intensity = ctx.config.intensity;
    // Nesting depth per side; total tree depth ≈ 2 * depth + 1 (max 21 levels)
    const depth = Math.min(2 + Math.floor(intensity * 0.8), 10);
    const rate = Math.min(0.15 + intensity * 0.08, 0.9);

    // Collect targets first — never mutate during walk
    const targets: Record<string, unknown>[] = [];

    walk(ctx.ast, (node) => {
      const n = node as unknown as Record<string, unknown>;
      if (n.type !== 'BinaryExpression') return;

      const op = String(n.operator) as ArithOp;
      if (!(ARITH_OPS as readonly string[]).includes(op)) return;

      const left = n.left as { type?: string; value?: number } | undefined;
      const right = n.right as { type?: string; value?: number } | undefined;
      if (!left || left.type !== 'NumericLiteral') return;
      if (!right || right.type !== 'NumericLiteral') return;

      const lv = Number(left.value);
      const rv = Number(right.value);
      if (!Number.isInteger(lv) || !Number.isInteger(rv)) return;
      if (Math.abs(lv) > 2 ** 31 || Math.abs(rv) > 2 ** 31) return;

      // The result must stay an exact integer under this operation
      const result = this.applyOp(op, lv, rv);
      if (!Number.isInteger(result) || Math.abs(result) > 2 ** 51) return;

      if (ctx.rng.next() < rate) targets.push(n);
    });

    for (const target of targets) {
      const n = target as unknown as {
        operator: string;
        left: { type?: string; value?: number };
        right: { type?: string; value?: number };
      };

      // Re-validate: an aliased node may already have been rewritten by an
      // earlier iteration — guard against `undefined` leaking into output.
      if (!n.left || n.left.type !== 'NumericLiteral') continue;
      if (!n.right || n.right.type !== 'NumericLiteral') continue;
      if (!Number.isFinite(n.left.value) || !Number.isFinite(n.right.value)) continue;

      const replacement = this.buildExpression(
        ctx, n.left.value as number, n.operator, n.right.value as number, depth
      );

      // In-place field replacement: the fresh tree never references the
      // old node, so the AST stays acyclic
      for (const key of Object.keys(target)) {
        delete target[key];
      }
      Object.assign(target, replacement as unknown as Record<string, unknown>);

      ctx.stats.expressionsDecomposed++;
    }

    return ctx.ast;
  }

  /**
   * Build a fully decomposed expression tree from literal values.
   * Test-friendly: deterministic given ctx and inputs.
   */
  private buildExpression(
    ctx: ObfuscationContext,
    lv: number,
    op: string,
    rv: number,
    depth: number
  ): LuaNode {
    const left = this.wrapValue(ctx, createNumericLiteral(lv), lv, depth);
    const right = this.wrapValue(ctx, createNumericLiteral(rv), rv, depth);
    const core = createBinaryExpression(op, left, right);

    const result = this.applyOp(op, lv, rv);
    return this.wrapValue(ctx, core, result, depth);
  }

  /**
   * Wrap a node in `depth` layers of (e + k) - k identity.
   * Only applied when the subtree's value is an integer within
   * exact double range — the wrap is exact under that condition.
   */
  private wrapValue(
    ctx: ObfuscationContext,
    node: LuaNode,
    value: number,
    depth: number
  ): LuaNode {
    let current = node;
    for (let i = 0; i < depth; i++) {
      if (!Number.isInteger(value) || Math.abs(value) > 2 ** 40) break;
      const k = ctx.rng.int(1, 999);
      current = createBinaryExpression(
        '-',
        createBinaryExpression('+', current, createNumericLiteral(k)),
        createNumericLiteral(k)
      );
    }
    return current;
  }

  /**
   * Evaluate an arithmetic op. Used only for the integrality gate and
   * result-range check — never for emitting values.
   */
  private applyOp(op: string, lv: number, rv: number): number {
    switch (op) {
      case '+': return lv + rv;
      case '-': return lv - rv;
      case '*': return lv * rv;
      case '%': return lv % rv;
      case '^': return Math.pow(lv, rv);
      default: return NaN;
    }
  }
}
