"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressionDecompositionPlugin = void 0;
const helpers_1 = require("../utils/helpers");
const ARITH_OPS = ['+', '-', '*', '%', '^'];
class ExpressionDecompositionPlugin {
    name = 'ExpressionDecomposition';
    description = 'Rebuilds literal arithmetic as deep identity-wrapped expression trees (exact for integers)';
    layers = [3];
    transform(ctx) {
        const intensity = ctx.config.intensity;
        // Nesting depth per side; total tree depth ≈ 2 * depth + 1 (max 21 levels)
        const depth = Math.min(2 + Math.floor(intensity * 0.8), 10);
        const rate = Math.min(0.15 + intensity * 0.08, 0.9);
        // Collect targets first — never mutate during walk
        const targets = [];
        (0, helpers_1.walk)(ctx.ast, (node) => {
            const n = node;
            if (n.type !== 'BinaryExpression')
                return;
            const op = String(n.operator);
            if (!ARITH_OPS.includes(op))
                return;
            const left = n.left;
            const right = n.right;
            if (!left || left.type !== 'NumericLiteral')
                return;
            if (!right || right.type !== 'NumericLiteral')
                return;
            const lv = Number(left.value);
            const rv = Number(right.value);
            if (!Number.isInteger(lv) || !Number.isInteger(rv))
                return;
            if (Math.abs(lv) > 2 ** 31 || Math.abs(rv) > 2 ** 31)
                return;
            // The result must stay an exact integer under this operation
            const result = this.applyOp(op, lv, rv);
            if (!Number.isInteger(result) || Math.abs(result) > 2 ** 51)
                return;
            if (ctx.rng.next() < rate)
                targets.push(n);
        });
        for (const target of targets) {
            const n = target;
            // Re-validate: an aliased node may already have been rewritten by an
            // earlier iteration — guard against `undefined` leaking into output.
            if (!n.left || n.left.type !== 'NumericLiteral')
                continue;
            if (!n.right || n.right.type !== 'NumericLiteral')
                continue;
            if (!Number.isFinite(n.left.value) || !Number.isFinite(n.right.value))
                continue;
            const replacement = this.buildExpression(ctx, n.left.value, n.operator, n.right.value, depth);
            // In-place field replacement: the fresh tree never references the
            // old node, so the AST stays acyclic
            for (const key of Object.keys(target)) {
                delete target[key];
            }
            Object.assign(target, replacement);
            ctx.stats.expressionsDecomposed++;
        }
        return ctx.ast;
    }
    /**
     * Build a fully decomposed expression tree from literal values.
     * Test-friendly: deterministic given ctx and inputs.
     */
    buildExpression(ctx, lv, op, rv, depth) {
        const left = this.wrapValue(ctx, (0, helpers_1.createNumericLiteral)(lv), lv, depth);
        const right = this.wrapValue(ctx, (0, helpers_1.createNumericLiteral)(rv), rv, depth);
        const core = (0, helpers_1.createBinaryExpression)(op, left, right);
        const result = this.applyOp(op, lv, rv);
        return this.wrapValue(ctx, core, result, depth);
    }
    /**
     * Wrap a node in `depth` layers of (e + k) - k identity.
     * Only applied when the subtree's value is an integer within
     * exact double range — the wrap is exact under that condition.
     */
    wrapValue(ctx, node, value, depth) {
        let current = node;
        for (let i = 0; i < depth; i++) {
            if (!Number.isInteger(value) || Math.abs(value) > 2 ** 40)
                break;
            const k = ctx.rng.int(1, 999);
            current = (0, helpers_1.createBinaryExpression)('-', (0, helpers_1.createBinaryExpression)('+', current, (0, helpers_1.createNumericLiteral)(k)), (0, helpers_1.createNumericLiteral)(k));
        }
        return current;
    }
    /**
     * Evaluate an arithmetic op. Used only for the integrality gate and
     * result-range check — never for emitting values.
     */
    applyOp(op, lv, rv) {
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
exports.ExpressionDecompositionPlugin = ExpressionDecompositionPlugin;
