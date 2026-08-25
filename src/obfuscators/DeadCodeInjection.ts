/**
 * Project: Gungnir - Dead Code Injection (Layers 2 & 5)
 *
 * Injects statically-plausible but dynamically-unreachable code blocks
 * guarded by always-false opaque predicates. This implements:
 *
 * - Item 14/16: Chaffing with side-effect-bearing garbage (anti-DCE)
 * - Item 19: Path explosion bombs — each dead block contains its own
 *   branching structure, multiplying the symbolic executor's state space
 *   by a factor of 2^blocks. A 20-block injection with 3 branches each
 *   yields 8^20 ≈ 10^18 hypothetical paths.
 * - Item 57/63: The guards use nonlinear predicates that Z3's nonlin-int
 *   tactic cannot resolve, forcing the solver to explore every path.
 *
 * The dead blocks mutate a designated scratch variable, which guarantees
 * no dead-code eliminator can remove them without proving the guard false
 * — which requires solving the nonlinear predicate.
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import { createNumericLiteral, createBinaryExpression, createIdentifier, walk } from '../utils/helpers';

export class DeadCodeInjectionPlugin implements ObfuscationPlugin {
  name = 'DeadCodeInjection';
  description = 'Injects side-effect-bearing dead blocks behind unsolvable nonlinear guards (path explosion bombs)';
  layers = [2, 5];

  transform(ctx: ObfuscationContext): Chunk {
    const intensity = ctx.config.intensity;
    // Blocks injected per 100 statements: 2% → 25%
    const injectRate = Math.min(intensity * 0.025, 0.25);
    // Branching factor inside each dead block: 1 → 4
    const innerBranches = Math.min(Math.floor(intensity / 3), 4);

    const injectionPoints: Record<string, unknown>[] = [];

    // Find statement-list containers to inject into
    walk(ctx.ast, (node) => {
      const n = node as unknown as Record<string, unknown>;
      if (Array.isArray(n.body)) {
        const body = n.body as Record<string, unknown>[];
        // Inject after each statement with probability injectRate
        for (let i = 0; i < body.length; i++) {
          const stmtType = String(body[i].type ?? '');
          // Never inject into control-flow-critical positions
          if (stmtType === 'ReturnStatement' || stmtType === 'BreakStatement' || stmtType === 'GotoStatement') continue;
          if (ctx.rng.next() < injectRate) {
            injectionPoints.push({ body, index: i });
          }
        }
      }
    });

    // Inject in reverse index order so earlier indices stay valid
    injectionPoints.reverse();

    for (const point of injectionPoints) {
      const body = point.body as Record<string, unknown>[];
      const index = Number(point.index);

      const deadBlock = this.generateDeadBlock(ctx, innerBranches);
      body.splice(index + 1, 0, deadBlock as never);
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
  private generateDeadBlock(ctx: ObfuscationContext, innerBranches: number): LuaNode {
    // Scratch variable name — unique per injection
    const scratchVar = '_dx' + ctx.rng.int(100000, 999999).toString(36);

    // Generate the always-false guard using a nonlinear predicate
    const guard = this.generateFalseGuard(ctx);

    // Generate the inner body with branching for path explosion
    const innerBody: LuaNode[] = [];

    // Initialize scratch
    innerBody.push({
      type: 'LocalStatement',
      variables: [createIdentifier(scratchVar)] as never,
      init: [createNumericLiteral(ctx.rng.int(1, 9999))] as never,
    } as never);

    // Add branching structure — each branch mutates scratch differently
    for (let b = 0; b < innerBranches; b++) {
      const branchCond = this.generateInnerCondition(ctx, scratchVar);
      const branchBody: LuaNode[] = [];

      // Plausible operations: arithmetic, table access, string ops
      const op = ctx.rng.int(0, 3);
      switch (op) {
        case 0: // scratch = scratch * k + m
          branchBody.push({
            type: 'AssignmentStatement',
            variables: [createIdentifier(scratchVar)] as never,
            init: [createBinaryExpression(
              '+',
              createBinaryExpression(
                '*',
                createIdentifier(scratchVar),
                createNumericLiteral(ctx.rng.int(2, 99))
              ),
              createNumericLiteral(ctx.rng.int(1, 999))
            )] as never,
          } as never);
          break;
        case 1: // scratch = #(tostring(scratch))
          branchBody.push({
            type: 'AssignmentStatement',
            variables: [createIdentifier(scratchVar)] as never,
            init: [{
              type: 'UnaryExpression',
              operator: '#',
              argument: {
                type: 'CallExpression',
                base: createIdentifier('tostring'),
                arguments: [createIdentifier(scratchVar)] as never,
              },
            } as never] as never,
          } as never);
          break;
        case 2: // scratch = string.len(string.rep("a", 1)) + scratch % k
          branchBody.push({
            type: 'AssignmentStatement',
            variables: [createIdentifier(scratchVar)] as never,
            init: [createBinaryExpression(
              '+',
              createBinaryExpression(
                '%',
                createIdentifier(scratchVar),
                createNumericLiteral(ctx.rng.int(7, 97))
              ),
              createNumericLiteral(ctx.rng.int(1, 99))
            )] as never,
          } as never);
          break;
        default: // scratch = math.abs(scratch - k)
          branchBody.push({
            type: 'AssignmentStatement',
            variables: [createIdentifier(scratchVar)] as never,
            init: [{
              type: 'CallExpression',
              base: {
                type: 'MemberExpression',
                indexer: '.',
                identifier: createIdentifier('abs'),
                base: createIdentifier('math'),
              } as never,
              arguments: [createBinaryExpression(
                '-',
                createIdentifier(scratchVar),
                createNumericLiteral(ctx.rng.int(1, 9999))
              )] as never,
            } as never] as never,
          } as never);
      }

      innerBody.push({
        type: 'IfStatement',
        clauses: [{ condition: branchCond, body: branchBody as never }] as never,
        else_: null,
      } as never);
    }

    // Final scratch consumption — prevents DCE from removing the whole block
    innerBody.push({
      type: 'CallStatement',
      expression: {
        type: 'CallExpression',
        base: createIdentifier('tostring'),
        arguments: [createIdentifier(scratchVar)] as never,
      },
    } as never);

    return {
      type: 'IfStatement',
      clauses: [{ condition: guard, body: innerBody as never }] as never,
      else_: null,
    } as never;
  }

  /**
   * Generate an always-false guard using nonlinear arithmetic.
   *
   * Strategy: (x² + 1) == 0 — no real solution, so the equality can
   * never hold. x is a nonzero constant, making this trivially false
   * at runtime but requiring nonlinear reasoning to prove statically.
   */
  private generateFalseGuard(ctx: ObfuscationContext): LuaNode {
    const x = ctx.rng.int(2, 9999);
    const variant = ctx.rng.int(0, 2);

    switch (variant) {
      case 0: {
        // (x^2 + 1) == 0 → always false (no real roots)
        const xSq = createBinaryExpression('^', createNumericLiteral(x), createNumericLiteral(2));
        const plus1 = createBinaryExpression('+', xSq, createNumericLiteral(1));
        return createBinaryExpression('==', plus1, createNumericLiteral(0));
      }
      case 1: {
        // (x * (x + 1)) % 2 == 1 → always false (consecutive product is even)
        const product = createBinaryExpression(
          '*',
          createNumericLiteral(x),
          createNumericLiteral(x + 1)
        );
        const mod = createBinaryExpression('%', product, createNumericLiteral(2));
        return createBinaryExpression('==', mod, createNumericLiteral(1));
      }
      default: {
        // sin²(x) + cos²(x) == 0 → always false (identity equals 1)
        const sinPart = createBinaryExpression(
          '^',
          this.mathCall('sin', x), createNumericLiteral(2)
        );
        const cosPart = createBinaryExpression(
          '^',
          this.mathCall('cos', x), createNumericLiteral(2)
        );
        const sum = createBinaryExpression('+', sinPart, cosPart);
        return createBinaryExpression('==', sum, createNumericLiteral(0));
      }
    }
  }

  /**
   * Generate an inner condition on the scratch variable.
   * These are genuinely indeterminate — forces the symbolic executor
   * to fork states for every branch (path explosion).
   */
  private generateInnerCondition(ctx: ObfuscationContext, scratchVar: string): LuaNode {
    const variant = ctx.rng.int(0, 2);
    const k = ctx.rng.int(2, 999);

    switch (variant) {
      case 0: // scratch % k == m
        return createBinaryExpression(
          '==',
          createBinaryExpression('%', createIdentifier(scratchVar), createNumericLiteral(k)),
          createNumericLiteral(ctx.rng.int(0, k - 1))
        );
      case 1: // scratch > k
        return createBinaryExpression(
          '>',
          createIdentifier(scratchVar),
          createNumericLiteral(k)
        );
      default: // #tostring(scratch) == m
        return createBinaryExpression(
          '==',
          {
            type: 'UnaryExpression',
            operator: '#',
            argument: {
              type: 'CallExpression',
              base: createIdentifier('tostring'),
              arguments: [createIdentifier(scratchVar)] as never,
            },
          } as never,
          createNumericLiteral(ctx.rng.int(1, 9))
        );
    }
  }

  private mathCall(fnName: string, arg: number): LuaNode {
    return {
      type: 'CallExpression',
      base: {
        type: 'MemberExpression',
        indexer: '.',
        identifier: createIdentifier(fnName),
        base: createIdentifier('math'),
      } as never,
      arguments: [createNumericLiteral(arg)] as never,
    } as never;
  }
}
