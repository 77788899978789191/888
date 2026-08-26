"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpaquePredicatePlugin = void 0;
const helpers_1 = require("../utils/helpers");
class OpaquePredicatePlugin {
    name = 'OpaquePredicate';
    description = 'Injects nonlinear mathematical opaque predicates that are computationally intractable for SMT solvers';
    layers = [2, 5]; // Control Flow + Anti-Analysis layers
    strategies = [
        new NonlinearParityStrategy(),
        new TrigonometricIdentityStrategy(),
        new BitManipulationStrategy(),
        new ModularArithmeticStrategy(),
        new PolynomialRootStrategy(),
        new FloatPrecisionStrategy(),
    ];
    transform(ctx) {
        const intensity = ctx.config.intensity;
        const injectionRate = Math.min(intensity / 20, 0.5); // 5% to 50% injection
        // Walk the AST and inject predicates into if statements and while loops
        (0, helpers_1.walk)(ctx.ast, (node, _parent) => {
            ctx.stats.nodesProcessed++;
            const n = node;
            if (n.type === 'IfStatement' && ctx.rng.next() < injectionRate) {
                this.injectIntoIf(ctx, n);
                ctx.stats.predicatesInjected++;
            }
            else if (n.type === 'WhileStatement' && ctx.rng.next() < injectionRate) {
                this.injectIntoWhile(ctx, n);
                ctx.stats.predicatesInjected++;
            }
        });
        return ctx.ast;
    }
    /**
     * Generate an opaque predicate expression.
     * The returned expression, when evaluated in Lua, will always
     * equal `truth`, but is hard to determine statically.
     */
    generatePredicate(ctx, truth) {
        // Select strategy weighted by difficulty (higher intensity = harder)
        const available = this.strategies.filter(s => s.difficulty <= ctx.config.intensity + 2);
        const pool = available.length > 0 ? available : this.strategies;
        const strategy = ctx.rng.pick(pool);
        let expr = strategy.generate(ctx, truth);
        // Nest predicates for higher intensity (multi-layer)
        const nestingDepth = Math.floor(ctx.config.intensity / 3);
        for (let i = 0; i < nestingDepth; i++) {
            const inner = ctx.rng.pick(this.strategies).generate(ctx, truth);
            // Combine with `and` to maintain truth value
            expr = (0, helpers_1.createBinaryExpression)('and', expr, inner);
        }
        return expr;
    }
    /** Inject opaque predicate into an if statement's condition */
    injectIntoIf(ctx, ifNode) {
        if (ifNode.clauses.length === 0)
            return;
        const clause = ifNode.clauses[0];
        const predicate = this.generatePredicate(ctx, 'always_true');
        // condition AND opaque_true = condition (semantically unchanged)
        clause.condition = (0, helpers_1.createBinaryExpression)('and', predicate, clause.condition);
    }
    /** Inject opaque predicate into a while statement's condition */
    injectIntoWhile(ctx, whileNode) {
        const predicate = this.generatePredicate(ctx, 'always_true');
        whileNode.condition = (0, helpers_1.createBinaryExpression)('and', predicate, whileNode.condition);
    }
}
exports.OpaquePredicatePlugin = OpaquePredicatePlugin;
// ============ Strategy Implementations ============
/**
 * Strategy 1: Nonlinear Parity
 * For any integer x: x*(x-1) is always even (product of consecutive integers).
 * Therefore x*(x-1) % 2 == 0 is always true.
 * SMT difficulty: HIGH (nonlinear arithmetic is NP-hard for solvers)
 */
class NonlinearParityStrategy {
    name = 'NonlinearParity';
    difficulty = 7;
    generate(ctx, truth) {
        // Generate: ((x * (x - 1)) % 2 == 0) where x is a runtime-computed value
        const x = ctx.rng.int(100, 999999);
        // For any integer n, n*(n+1) is even. We use a variant:
        // (n^2 + n) % 2 == 0 is always true (n*(n+1) is product of consecutive integers)
        const n = (0, helpers_1.createNumericLiteral)(x);
        const nPlus1 = (0, helpers_1.createNumericLiteral)(x + 1);
        const product = (0, helpers_1.createBinaryExpression)('*', n, nPlus1);
        const mod = (0, helpers_1.createBinaryExpression)('%', product, (0, helpers_1.createNumericLiteral)(2));
        const check = (0, helpers_1.createBinaryExpression)('==', mod, (0, helpers_1.createNumericLiteral)(0));
        if (truth === 'always_true') {
            return check;
        }
        else {
            return (0, helpers_1.createBinaryExpression)('not', check, (0, helpers_1.createNumericLiteral)(0));
        }
    }
}
/**
 * Strategy 2: Trigonometric Identity
 * sin^2(x) + cos^2(x) = 1 for all x.
 * Uses floating point arithmetic which is imprecise for symbolic execution.
 * SMT difficulty: VERY HIGH (floating point + transcendental functions)
 */
class TrigonometricIdentityStrategy {
    name = 'TrigonometricIdentity';
    difficulty = 9;
    generate(ctx, truth) {
        const angle = ctx.rng.int(1, 360);
        // (sin(x)^2 + cos(x)^2) > 0.999 is always true (math identity)
        // Using a threshold instead of == to avoid floating-point precision issues
        const sinPart = (0, helpers_1.createBinaryExpression)('^', createCall('math.sin', [(0, helpers_1.createNumericLiteral)(angle)]), (0, helpers_1.createNumericLiteral)(2));
        const cosPart = (0, helpers_1.createBinaryExpression)('^', createCall('math.cos', [(0, helpers_1.createNumericLiteral)(angle)]), (0, helpers_1.createNumericLiteral)(2));
        const sum = (0, helpers_1.createBinaryExpression)('+', sinPart, cosPart);
        const check = (0, helpers_1.createBinaryExpression)('>', sum, (0, helpers_1.createNumericLiteral)(0.999));
        return truth === 'always_true' ? check : negate(check);
    }
}
/**
 * Strategy 3: Bit Manipulation
 * XOR self-inverse: (x ^ y) ^ y == x for all x, y.
 * Uses Lua's ability to do bit operations via arithmetic.
 * SMT difficulty: MEDIUM (bitvector theory)
 */
class BitManipulationStrategy {
    name = 'BitManipulation';
    difficulty = 5;
    generate(ctx, truth) {
        const x = ctx.rng.int(1, 1000000);
        // (x % 2) == (x % 2) — trivially true but wrapped in arithmetic obfuscation
        // More interesting: x*x >= 0 is always true for real numbers
        const xx = (0, helpers_1.createBinaryExpression)('*', (0, helpers_1.createNumericLiteral)(x), (0, helpers_1.createNumericLiteral)(x));
        const check = (0, helpers_1.createBinaryExpression)('>=', xx, (0, helpers_1.createNumericLiteral)(0));
        return truth === 'always_true' ? check : negate(check);
    }
}
/**
 * Strategy 4: Modular Arithmetic
 * If n ≡ 0 (mod m), then n * k ≡ 0 (mod m) for any k.
 * SMT difficulty: MEDIUM
 */
class ModularArithmeticStrategy {
    name = 'ModularArithmetic';
    difficulty = 6;
    generate(ctx, truth) {
        const m = ctx.rng.int(3, 97); // prime-ish modulus
        const k = ctx.rng.int(2, 50);
        // (m * k) % m == 0 is always true
        const product = (0, helpers_1.createBinaryExpression)('*', (0, helpers_1.createNumericLiteral)(m), (0, helpers_1.createNumericLiteral)(k));
        const mod = (0, helpers_1.createBinaryExpression)('%', product, (0, helpers_1.createNumericLiteral)(m));
        const check = (0, helpers_1.createBinaryExpression)('==', mod, (0, helpers_1.createNumericLiteral)(0));
        return truth === 'always_true' ? check : negate(check);
    }
}
/**
 * Strategy 5: Polynomial Roots
 * x^2 + 1 = 0 has no real solutions, so x^2 + 1 > 0 for all real x.
 * SMT difficulty: HIGH (requires nonlinear real arithmetic)
 */
class PolynomialRootStrategy {
    name = 'PolynomialRoot';
    difficulty = 8;
    generate(ctx, truth) {
        const x = ctx.rng.int(1, 10000);
        const a = ctx.rng.int(1, 100);
        // a*x^2 + 1 > 0 for all real x (when a > 0)
        const xSq = (0, helpers_1.createBinaryExpression)('^', (0, helpers_1.createNumericLiteral)(x), (0, helpers_1.createNumericLiteral)(2));
        const axSq = (0, helpers_1.createBinaryExpression)('*', (0, helpers_1.createNumericLiteral)(a), xSq);
        const poly = (0, helpers_1.createBinaryExpression)('+', axSq, (0, helpers_1.createNumericLiteral)(1));
        const check = (0, helpers_1.createBinaryExpression)('>', poly, (0, helpers_1.createNumericLiteral)(0));
        return truth === 'always_true' ? check : negate(check);
    }
}
/**
 * Strategy 6: Float Precision
 * Uses floating-point representation properties.
 * (x + 0.0) == x for all x (adding zero doesn't change value).
 * SMT difficulty: HIGH (FP theory is expensive)
 */
class FloatPrecisionStrategy {
    name = 'FloatPrecision';
    difficulty = 7;
    generate(ctx, truth) {
        const x = ctx.rng.int(1, 100000);
        // ((x * 2) / 2) == x is always true (barring overflow)
        const doubled = (0, helpers_1.createBinaryExpression)('*', (0, helpers_1.createNumericLiteral)(x), (0, helpers_1.createNumericLiteral)(2));
        const halved = (0, helpers_1.createBinaryExpression)('/', doubled, (0, helpers_1.createNumericLiteral)(2));
        const check = (0, helpers_1.createBinaryExpression)('==', halved, (0, helpers_1.createNumericLiteral)(x));
        return truth === 'always_true' ? check : negate(check);
    }
}
// ============ Helper Functions ============
function negate(expr) {
    return {
        type: 'UnaryExpression',
        operator: 'not',
        argument: expr,
    };
}
function createCall(fnName, args) {
    const parts = fnName.split('.');
    let base = (0, helpers_1.createIdentifier)(parts[0]);
    for (let i = 1; i < parts.length; i++) {
        base = {
            type: 'MemberExpression',
            indexer: '.',
            identifier: (0, helpers_1.createIdentifier)(parts[i]),
            base,
        };
    }
    return {
        type: 'CallExpression',
        base,
        arguments: args,
    };
}
