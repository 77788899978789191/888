/**
 * Project: Gungnir - Opaque Predicate Generator
 *
 * Generates mathematical expressions that always evaluate to a known
 * boolean value, but are computationally difficult for SMT solvers
 * and symbolic execution engines to determine statically.
 *
 * Techniques used:
 * - Nonlinear arithmetic identities (x^2 - x is always even for integer x)
 * - Trigonometric identities (sin^2 + cos^2 = 1)
 * - Bit manipulation invariants (XOR self-inverse properties)
 * - Modular arithmetic properties (7x ≡ 0 mod 7)
 * - Polynomial roots with no integer solutions
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import {
  createIdentifier, createNumericLiteral, createBinaryExpression,
  walk,
} from '../utils/helpers';

export type PredicateTruth = 'always_true' | 'always_false';

interface PredicateStrategy {
  name: string;
  /** Generate an expression that is always `truth` */
  generate(ctx: ObfuscationContext, truth: PredicateTruth): LuaNode;
  /** Difficulty for SMT solvers (1-10) */
  difficulty: number;
}

export class OpaquePredicatePlugin implements ObfuscationPlugin {
  name = 'OpaquePredicate';
  description = 'Injects nonlinear mathematical opaque predicates that are computationally intractable for SMT solvers';
  layers = [2, 5]; // Control Flow + Anti-Analysis layers

  private strategies: PredicateStrategy[] = [
    new NonlinearParityStrategy(),
    new TrigonometricIdentityStrategy(),
    new BitManipulationStrategy(),
    new ModularArithmeticStrategy(),
    new PolynomialRootStrategy(),
    new FloatPrecisionStrategy(),
  ];

  transform(ctx: ObfuscationContext): Chunk {
    const intensity = ctx.config.intensity;
    const injectionRate = Math.min(intensity / 20, 0.5); // 5% to 50% injection

    // Walk the AST and inject predicates into if statements and while loops
    walk(ctx.ast, (node, _parent) => {
      ctx.stats.nodesProcessed++;

      const n = node as unknown as Record<string, unknown>;

      if (n.type === 'IfStatement' && ctx.rng.next() < injectionRate) {
        this.injectIntoIf(ctx, n as never);
        ctx.stats.predicatesInjected++;
      } else if (n.type === 'WhileStatement' && ctx.rng.next() < injectionRate) {
        this.injectIntoWhile(ctx, n as never);
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
  generatePredicate(ctx: ObfuscationContext, truth: PredicateTruth): LuaNode {
    // Select strategy weighted by difficulty (higher intensity = harder)
    const available = this.strategies.filter(
      s => s.difficulty <= ctx.config.intensity + 2
    );
    const pool = available.length > 0 ? available : this.strategies;
    const strategy = ctx.rng.pick(pool);

    let expr = strategy.generate(ctx, truth);

    // Nest predicates for higher intensity (multi-layer)
    const nestingDepth = Math.floor(ctx.config.intensity / 3);
    for (let i = 0; i < nestingDepth; i++) {
      const inner = ctx.rng.pick(this.strategies).generate(ctx, truth);
      // Combine with `and` to maintain truth value
      expr = createBinaryExpression('and', expr, inner);
    }

    return expr;
  }

  /** Inject opaque predicate into an if statement's condition */
  private injectIntoIf(ctx: ObfuscationContext, ifNode: {
    clauses: { condition: LuaNode; body: LuaNode[] }[];
  }): void {
    if (ifNode.clauses.length === 0) return;

    const clause = ifNode.clauses[0];
    const predicate = this.generatePredicate(ctx, 'always_true');
    // condition AND opaque_true = condition (semantically unchanged)
    clause.condition = createBinaryExpression('and', predicate, clause.condition);
  }

  /** Inject opaque predicate into a while statement's condition */
  private injectIntoWhile(ctx: ObfuscationContext, whileNode: {
    condition: LuaNode; body: LuaNode[];
  }): void {
    const predicate = this.generatePredicate(ctx, 'always_true');
    whileNode.condition = createBinaryExpression('and', predicate, whileNode.condition);
  }
}

// ============ Strategy Implementations ============

/**
 * Strategy 1: Nonlinear Parity
 * For any integer x: x*(x-1) is always even (product of consecutive integers).
 * Therefore x*(x-1) % 2 == 0 is always true.
 * SMT difficulty: HIGH (nonlinear arithmetic is NP-hard for solvers)
 *
 * 【32 位安全铁律】部分执行环境（如 fengari 测试宿主）以 32 位
 * 有符号整数实现整型算术（乘法在 2^31 处回绕）。回绕后的乘积奇偶
 * 不定，谓词会翻转为假 → 守门失败 → 用户代码静默跳过。
 * 所有中间乘积必须 < 2^31：x*(x+1) < 2^31 ⟹ x ≤ 46339。
 * （Delta/Gloop 为 Lua 5.1 纯 double，无回绕；约束对两侧均安全。）
 */
class NonlinearParityStrategy implements PredicateStrategy {
  name = 'NonlinearParity';
  difficulty = 7;

  generate(ctx: ObfuscationContext, truth: PredicateTruth): LuaNode {
    // Generate: ((x * (x - 1)) % 2 == 0) where x is a runtime-computed value
    // 46339 * 46340 = 2,147,381,260 < 2^31-1（32 位无回绕）
    const x = ctx.rng.int(100, 46339);

    // For any integer n, n*(n+1) is even. We use a variant:
    // (n^2 + n) % 2 == 0 is always true (n*(n+1) is product of consecutive integers)
    const n = createNumericLiteral(x);
    const nPlus1 = createNumericLiteral(x + 1);
    const product = createBinaryExpression('*', n, nPlus1);
    const mod = createBinaryExpression('%', product, createNumericLiteral(2));
    const check = createBinaryExpression('==', mod, createNumericLiteral(0));

    if (truth === 'always_true') {
      return check;
    } else {
      return createBinaryExpression('not', check, createNumericLiteral(0));
    }
  }
}

/**
 * Strategy 2: Trigonometric Identity
 * sin^2(x) + cos^2(x) = 1 for all x.
 * Uses floating point arithmetic which is imprecise for symbolic execution.
 * SMT difficulty: VERY HIGH (floating point + transcendental functions)
 */
class TrigonometricIdentityStrategy implements PredicateStrategy {
  name = 'TrigonometricIdentity';
  difficulty = 9;

  generate(ctx: ObfuscationContext, truth: PredicateTruth): LuaNode {
    const angle = ctx.rng.int(1, 360);
    // (sin(x)^2 + cos(x)^2) > 0.999 is always true (math identity)
    // Using a threshold instead of == to avoid floating-point precision issues
    const sinPart = createBinaryExpression(
      '^',
      createCall('math.sin', [createNumericLiteral(angle)]),
      createNumericLiteral(2)
    );
    const cosPart = createBinaryExpression(
      '^',
      createCall('math.cos', [createNumericLiteral(angle)]),
      createNumericLiteral(2)
    );
    const sum = createBinaryExpression('+', sinPart, cosPart);
    const check = createBinaryExpression('>', sum, createNumericLiteral(0.999));

    return truth === 'always_true' ? check : negate(check);
  }
}

/**
 * Strategy 3: Bit Manipulation
 * XOR self-inverse: (x ^ y) ^ y == x for all x, y.
 * Uses Lua's ability to do bit operations via arithmetic.
 * SMT difficulty: MEDIUM (bitvector theory)
 */
class BitManipulationStrategy implements PredicateStrategy {
  name = 'BitManipulation';
  difficulty = 5;

  generate(ctx: ObfuscationContext, truth: PredicateTruth): LuaNode {
    // 【32 位安全铁律】x*x 必须无回绕：x ≤ 46339（46339² = 2,147,308,921 < 2^31-1）
    // fengari 测试宿主的整型乘法在 2^31 回绕，回绕后 x² 可为负 → 守门翻转。
    const x = ctx.rng.int(100, 46339);

    // (x % 2) == (x % 2) — trivially true but wrapped in arithmetic obfuscation
    // More interesting: x*x >= 0 is always true for real numbers
    const xx = createBinaryExpression('*', createNumericLiteral(x), createNumericLiteral(x));
    const check = createBinaryExpression('>=', xx, createNumericLiteral(0));

    return truth === 'always_true' ? check : negate(check);
  }
}

/**
 * Strategy 4: Modular Arithmetic
 * If n ≡ 0 (mod m), then n * k ≡ 0 (mod m) for any k.
 * SMT difficulty: MEDIUM
 */
class ModularArithmeticStrategy implements PredicateStrategy {
  name = 'ModularArithmetic';
  difficulty = 6;

  generate(ctx: ObfuscationContext, truth: PredicateTruth): LuaNode {
    const m = ctx.rng.int(3, 97); // prime-ish modulus
    const k = ctx.rng.int(2, 50);

    // (m * k) % m == 0 is always true
    const product = createBinaryExpression(
      '*', createNumericLiteral(m), createNumericLiteral(k)
    );
    const mod = createBinaryExpression('%', product, createNumericLiteral(m));
    const check = createBinaryExpression('==', mod, createNumericLiteral(0));

    return truth === 'always_true' ? check : negate(check);
  }
}

/**
 * Strategy 5: Polynomial Roots
 * x^2 + 1 = 0 has no real solutions, so x^2 + 1 > 0 for all real x.
 * SMT difficulty: HIGH (requires nonlinear real arithmetic)
 */
class PolynomialRootStrategy implements PredicateStrategy {
  name = 'PolynomialRoot';
  difficulty = 8;

  generate(ctx: ObfuscationContext, truth: PredicateTruth): LuaNode {
    // 【32 位安全铁律】a*x^2 必须无回绕：a·x² < 2^31。
    // x ≤ 4000（x² ≤ 1.6×10^7）且 a ≤ 90（a·x² ≤ 1.44×10^9 < 2^31-1）。
    // (^2 走 float 幂无回绕；随后的 a* 乘法在 32 位宿主会回绕)
    const x = ctx.rng.int(1, 4000);
    const a = ctx.rng.int(1, 90);

    // a*x^2 + 1 > 0 for all real x (when a > 0)
    const xSq = createBinaryExpression('^', createNumericLiteral(x), createNumericLiteral(2));
    const axSq = createBinaryExpression('*', createNumericLiteral(a), xSq);
    const poly = createBinaryExpression('+', axSq, createNumericLiteral(1));
    const check = createBinaryExpression('>', poly, createNumericLiteral(0));

    return truth === 'always_true' ? check : negate(check);
  }
}

/**
 * Strategy 6: Float Precision
 * Uses floating-point representation properties.
 * (x + 0.0) == x for all x (adding zero doesn't change value).
 * SMT difficulty: HIGH (FP theory is expensive)
 */
class FloatPrecisionStrategy implements PredicateStrategy {
  name = 'FloatPrecision';
  difficulty = 7;

  generate(ctx: ObfuscationContext, truth: PredicateTruth): LuaNode {
    const x = ctx.rng.int(1, 100000);

    // ((x * 2) / 2) == x is always true (barring overflow)
    const doubled = createBinaryExpression('*', createNumericLiteral(x), createNumericLiteral(2));
    const halved = createBinaryExpression('/', doubled, createNumericLiteral(2));
    const check = createBinaryExpression('==', halved, createNumericLiteral(x));

    return truth === 'always_true' ? check : negate(check);
  }
}

// ============ Helper Functions ============

function negate(expr: LuaNode): LuaNode {
  return {
    type: 'UnaryExpression',
    operator: 'not',
    argument: expr,
  } as never;
}

function createCall(fnName: string, args: LuaNode[]): LuaNode {
  const parts = fnName.split('.');
  let base: LuaNode = createIdentifier(parts[0]);
  for (let i = 1; i < parts.length; i++) {
    base = {
      type: 'MemberExpression',
      indexer: '.',
      identifier: createIdentifier(parts[i]),
      base,
    } as never;
  }
  return {
    type: 'CallExpression',
    base,
    arguments: args,
  } as never;
}
