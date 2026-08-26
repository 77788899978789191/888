"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeadCodeInjectionPlugin = void 0;
const helpers_1 = require("../utils/helpers");
class DeadCodeInjectionPlugin {
    name = 'DeadCodeInjection';
    description = 'Injects side-effect-bearing dead blocks behind unsolvable nonlinear guards (path explosion bombs)';
    layers = [2, 5];
    transform(ctx) {
        const intensity = ctx.config.intensity;
        // Blocks injected per 100 statements: 2% → 25%
        const injectRate = Math.min(intensity * 0.025, 0.25);
        // Branching factor inside each dead block: 1 → 4
        const innerBranches = Math.min(Math.floor(intensity / 3), 4);
        const injectionPoints = [];
        // Find statement-list containers to inject into
        (0, helpers_1.walk)(ctx.ast, (node) => {
            const n = node;
            if (Array.isArray(n.body)) {
                const body = n.body;
                // Inject after each statement with probability injectRate
                for (let i = 0; i < body.length; i++) {
                    const stmtType = String(body[i].type ?? '');
                    // Never inject into control-flow-critical positions
                    if (stmtType === 'ReturnStatement' || stmtType === 'BreakStatement' || stmtType === 'GotoStatement')
                        continue;
                    if (ctx.rng.next() < injectRate) {
                        injectionPoints.push({ body, index: i });
                    }
                }
            }
        });
        // Inject in reverse index order so earlier indices stay valid
        injectionPoints.reverse();
        for (const point of injectionPoints) {
            const body = point.body;
            const index = Number(point.index);
            const deadBlock = this.generateDeadBlock(ctx, innerBranches);
            body.splice(index + 1, 0, deadBlock);
            ctx.stats.deadBlocksInjected++;
        }
        return ctx.ast;
    }
    /**
     * Generate a dead block:
     *   if <unsolvable-false-predicate> then
     *     <plausible side-effecting code with branching>
     *   end
     */
    generateDeadBlock(ctx, innerBranches) {
        // Scratch variable name — unique per injection
        const scratchVar = '_dx' + ctx.rng.int(100000, 999999).toString(36);
        // Generate the always-false guard using a nonlinear predicate
        const guard = this.generateFalseGuard(ctx);
        // Generate the inner body with branching for path explosion
        const innerBody = [];
        // Initialize scratch
        innerBody.push({
            type: 'LocalStatement',
            variables: [(0, helpers_1.createIdentifier)(scratchVar)],
            init: [(0, helpers_1.createNumericLiteral)(ctx.rng.int(1, 9999))],
        });
        // Add branching structure — each branch mutates scratch differently
        for (let b = 0; b < innerBranches; b++) {
            const branchCond = this.generateInnerCondition(ctx, scratchVar);
            const branchBody = [];
            // Plausible operations: arithmetic, table access, string ops
            const op = ctx.rng.int(0, 3);
            switch (op) {
                case 0: // scratch = scratch * k + m
                    branchBody.push({
                        type: 'AssignmentStatement',
                        variables: [(0, helpers_1.createIdentifier)(scratchVar)],
                        init: [(0, helpers_1.createBinaryExpression)('+', (0, helpers_1.createBinaryExpression)('*', (0, helpers_1.createIdentifier)(scratchVar), (0, helpers_1.createNumericLiteral)(ctx.rng.int(2, 99))), (0, helpers_1.createNumericLiteral)(ctx.rng.int(1, 999)))],
                    });
                    break;
                case 1: // scratch = #(tostring(scratch))
                    branchBody.push({
                        type: 'AssignmentStatement',
                        variables: [(0, helpers_1.createIdentifier)(scratchVar)],
                        init: [{
                                type: 'UnaryExpression',
                                operator: '#',
                                argument: {
                                    type: 'CallExpression',
                                    base: (0, helpers_1.createIdentifier)('tostring'),
                                    arguments: [(0, helpers_1.createIdentifier)(scratchVar)],
                                },
                            }],
                    });
                    break;
                case 2: // scratch = string.len(string.rep("a", 1)) + scratch % k
                    branchBody.push({
                        type: 'AssignmentStatement',
                        variables: [(0, helpers_1.createIdentifier)(scratchVar)],
                        init: [(0, helpers_1.createBinaryExpression)('+', (0, helpers_1.createBinaryExpression)('%', (0, helpers_1.createIdentifier)(scratchVar), (0, helpers_1.createNumericLiteral)(ctx.rng.int(7, 97))), (0, helpers_1.createNumericLiteral)(ctx.rng.int(1, 99)))],
                    });
                    break;
                default: // scratch = math.abs(scratch - k)
                    branchBody.push({
                        type: 'AssignmentStatement',
                        variables: [(0, helpers_1.createIdentifier)(scratchVar)],
                        init: [{
                                type: 'CallExpression',
                                base: {
                                    type: 'MemberExpression',
                                    indexer: '.',
                                    identifier: (0, helpers_1.createIdentifier)('abs'),
                                    base: (0, helpers_1.createIdentifier)('math'),
                                },
                                arguments: [(0, helpers_1.createBinaryExpression)('-', (0, helpers_1.createIdentifier)(scratchVar), (0, helpers_1.createNumericLiteral)(ctx.rng.int(1, 9999)))],
                            }],
                    });
            }
            innerBody.push({
                type: 'IfStatement',
                clauses: [{ condition: branchCond, body: branchBody }],
                else_: null,
            });
        }
        // Final scratch consumption — prevents DCE from removing the whole block
        innerBody.push({
            type: 'CallStatement',
            expression: {
                type: 'CallExpression',
                base: (0, helpers_1.createIdentifier)('tostring'),
                arguments: [(0, helpers_1.createIdentifier)(scratchVar)],
            },
        });
        return {
            type: 'IfStatement',
            clauses: [{ condition: guard, body: innerBody }],
            else_: null,
        };
    }
    /**
     * Generate an always-false guard using nonlinear arithmetic.
     *
     * Strategy: (x² + 1) == 0 — no real solution, so the equality can
     * never hold. x is a nonzero constant, making this trivially false
     * at runtime but requiring nonlinear reasoning to prove statically.
     */
    generateFalseGuard(ctx) {
        const x = ctx.rng.int(2, 9999);
        const variant = ctx.rng.int(0, 2);
        switch (variant) {
            case 0: {
                // (x^2 + 1) == 0 → always false (no real roots)
                const xSq = (0, helpers_1.createBinaryExpression)('^', (0, helpers_1.createNumericLiteral)(x), (0, helpers_1.createNumericLiteral)(2));
                const plus1 = (0, helpers_1.createBinaryExpression)('+', xSq, (0, helpers_1.createNumericLiteral)(1));
                return (0, helpers_1.createBinaryExpression)('==', plus1, (0, helpers_1.createNumericLiteral)(0));
            }
            case 1: {
                // (x * (x + 1)) % 2 == 1 → always false (consecutive product is even)
                const product = (0, helpers_1.createBinaryExpression)('*', (0, helpers_1.createNumericLiteral)(x), (0, helpers_1.createNumericLiteral)(x + 1));
                const mod = (0, helpers_1.createBinaryExpression)('%', product, (0, helpers_1.createNumericLiteral)(2));
                return (0, helpers_1.createBinaryExpression)('==', mod, (0, helpers_1.createNumericLiteral)(1));
            }
            default: {
                // sin²(x) + cos²(x) == 0 → always false (identity equals 1)
                const sinPart = (0, helpers_1.createBinaryExpression)('^', this.mathCall('sin', x), (0, helpers_1.createNumericLiteral)(2));
                const cosPart = (0, helpers_1.createBinaryExpression)('^', this.mathCall('cos', x), (0, helpers_1.createNumericLiteral)(2));
                const sum = (0, helpers_1.createBinaryExpression)('+', sinPart, cosPart);
                return (0, helpers_1.createBinaryExpression)('==', sum, (0, helpers_1.createNumericLiteral)(0));
            }
        }
    }
    /**
     * Generate an inner condition on the scratch variable.
     * These are genuinely indeterminate — forces the symbolic executor
     * to fork states for every branch (path explosion).
     */
    generateInnerCondition(ctx, scratchVar) {
        const variant = ctx.rng.int(0, 2);
        const k = ctx.rng.int(2, 999);
        switch (variant) {
            case 0: // scratch % k == m
                return (0, helpers_1.createBinaryExpression)('==', (0, helpers_1.createBinaryExpression)('%', (0, helpers_1.createIdentifier)(scratchVar), (0, helpers_1.createNumericLiteral)(k)), (0, helpers_1.createNumericLiteral)(ctx.rng.int(0, k - 1)));
            case 1: // scratch > k
                return (0, helpers_1.createBinaryExpression)('>', (0, helpers_1.createIdentifier)(scratchVar), (0, helpers_1.createNumericLiteral)(k));
            default: // #tostring(scratch) == m
                return (0, helpers_1.createBinaryExpression)('==', {
                    type: 'UnaryExpression',
                    operator: '#',
                    argument: {
                        type: 'CallExpression',
                        base: (0, helpers_1.createIdentifier)('tostring'),
                        arguments: [(0, helpers_1.createIdentifier)(scratchVar)],
                    },
                }, (0, helpers_1.createNumericLiteral)(ctx.rng.int(1, 9)));
        }
    }
    mathCall(fnName, arg) {
        return {
            type: 'CallExpression',
            base: {
                type: 'MemberExpression',
                indexer: '.',
                identifier: (0, helpers_1.createIdentifier)(fnName),
                base: (0, helpers_1.createIdentifier)('math'),
            },
            arguments: [(0, helpers_1.createNumericLiteral)(arg)],
        };
    }
}
exports.DeadCodeInjectionPlugin = DeadCodeInjectionPlugin;
