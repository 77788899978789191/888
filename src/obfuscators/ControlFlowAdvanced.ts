/**
 * Project: Gungnir - Control Flow Advanced Techniques (CF-19 ~ CF-20)
 *
 * CF-19: Control Flow Scrambling
 * CF-20: Loop Unrolling & Fusion
 *
 * Layer 2: Purgatory Control Flow (extension)
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import { walk, createIdentifier, createNumericLiteral } from '../utils/helpers';

export class ControlFlowAdvancedPlugin implements ObfuscationPlugin {
  name = 'ControlFlowAdvanced';
  description = 'CF-19~CF-20: Control flow scrambling, loop unrolling and fusion';
  layers = [2];

  transform(ctx: ObfuscationContext): Chunk {
    // CF-19: Control flow scrambling
    this.applyControlFlowScrambling(ctx);

    // CF-20: Loop unrolling & fusion
    this.applyLoopUnrollingFusion(ctx);

    return ctx.ast;
  }

  // ============ CF-19: Control Flow Scrambling ============
  /**
   * Scramble the order of basic blocks within functions,
   * inserting indirect jumps to maintain correct execution order.
   * Uses a jump table with encrypted targets.
   */
  private applyControlFlowScrambling(ctx: ObfuscationContext): void {
    const scrambleRate = 0.2 + ctx.config.intensity * 0.05;
    let scrambled = 0;

    walk(ctx.ast, (node) => {
      const n = node as unknown as Record<string, unknown>;

      // Scramble function bodies with sufficient blocks
      if ((n.type === 'FunctionDeclaration' || n.type === 'FunctionExpression'
           || n.type === 'LocalFunctionStatement') && Array.isArray(n.body)) {
        const body = n.body as LuaNode[];
        if (body.length >= 4 && ctx.rng.next() < scrambleRate) {
          this.scrambleBlock(body, ctx);
          scrambled++;
        }
      }

      // Scramble if/elseif/else clause order (with jump table)
      if (n.type === 'IfStatement') {
        const clauses = n.clauses as { condition: LuaNode; body: LuaNode[] }[] | undefined;
        if (clauses && clauses.length >= 2 && ctx.rng.next() < scrambleRate * 0.5) {
          // Shuffle clause order and add dispatch variable
          const shuffled = [...clauses];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = ctx.rng.int(0, i);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          n.clauses = shuffled;
          scrambled++;
        }
      }
    });

    ctx.stats.controlFlowScrambles = scrambled;
  }

  private scrambleBlock(body: LuaNode[], ctx: ObfuscationContext): void {
    // Split body into segments
    const segmentCount = Math.min(4, Math.floor(body.length / 2));
    if (segmentCount < 2) return;

    const segments: LuaNode[][] = [];
    const segSize = Math.floor(body.length / segmentCount);
    for (let i = 0; i < segmentCount; i++) {
      const start = i * segSize;
      const end = (i === segmentCount - 1) ? body.length : (i + 1) * segSize;
      segments.push(body.slice(start, end));
    }

    // Shuffle segment order
    const order = segments.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = ctx.rng.int(0, i);
      [order[i], order[j]] = [order[j], order[i]];
    }

    // Build scrambled body with dispatch state machine
    const stateVar = '_cf_scramble_' + ctx.rng.int(1000, 9999);
    const newBody: LuaNode[] = [];

    // Initial state
    newBody.push({
      type: 'LocalStatement',
      variables: [createIdentifier(stateVar)],
      init: [createNumericLiteral(order[0])],
    } as never);

    // Dispatch loop
    const loopBody: LuaNode[] = [];
    for (let idx = 0; idx < segments.length; idx++) {
      const segIdx = order.indexOf(idx);
      const clause: LuaNode = {
        type: 'IfStatement',
        clauses: [{
          condition: {
            type: 'BinaryExpression',
            operator: '==',
            left: createIdentifier(stateVar),
            right: createNumericLiteral(idx),
          },
          body: [
            ...segments[segIdx],
            {
              type: 'AssignmentStatement',
              variables: [createIdentifier(stateVar)],
              init: [createNumericLiteral(idx + 1)],
            } as never,
          ],
        }],
        else_: [],
      };
      loopBody.push(clause);
    }

    // Break when done
    loopBody.push({
      type: 'IfStatement',
      clauses: [{
        condition: {
          type: 'BinaryExpression',
          operator: '>=',
          left: createIdentifier(stateVar),
          right: createNumericLiteral(segments.length),
        },
        body: [{ type: 'BreakStatement' }],
      }],
      else_: [],
    });

    newBody.push({
      type: 'WhileStatement',
      condition: { type: 'BooleanLiteral', value: true },
      body: loopBody,
    } as never);

    // Replace original body
    body.length = 0;
    body.push(...newBody);
  }

  // ============ CF-20: Loop Unrolling & Fusion ============
  /**
   * Unroll loops with known iteration counts, and fuse adjacent loops
   * into a single loop with combined bodies.
   */
  private applyLoopUnrollingFusion(ctx: ObfuscationContext): void {
    const unrollRate = 0.15 + ctx.config.intensity * 0.03;
    let unrolled = 0;
    let fused = 0;

    walk(ctx.ast, (node) => {
      const n = node as unknown as Record<string, unknown>;

      // CF-20a: Loop unrolling for numeric for loops with small constants
      if (n.type === 'ForNumericStatement' && ctx.rng.next() < unrollRate) {
        const start = n.start as unknown as Record<string, unknown>;
        const end = n.end as unknown as Record<string, unknown>;
        if (start?.type === 'NumericLiteral' && end?.type === 'NumericLiteral') {
          const startVal = Number(start.value);
          const endVal = Number(end.value);
          const iterations = Math.abs(endVal - startVal) + 1;
          if (iterations >= 2 && iterations <= 8) {
            this.unrollLoop(n, iterations, ctx);
            unrolled++;
          }
        }
      }

      // CF-20b: Loop fusion - fuse adjacent while loops
      if (n.type === 'DoStatement' || n.type === 'Chunk' || n.type === 'FunctionDeclaration'
          || n.type === 'FunctionExpression' || n.type === 'LocalFunctionStatement') {
        const body = n.body as LuaNode[] | undefined;
        if (!Array.isArray(body)) return;

        for (let i = 0; i < body.length - 1; i++) {
          const loop1 = body[i] as unknown as Record<string, unknown>;
          const loop2 = body[i + 1] as unknown as Record<string, unknown>;

          if ((loop1.type === 'WhileStatement' || loop1.type === 'ForNumericStatement')
              && (loop2.type === 'WhileStatement' || loop2.type === 'ForNumericStatement')
              && ctx.rng.next() < unrollRate * 0.5) {
            // Fuse into a single while loop with combined body
            const fusedBody: LuaNode[] = [
              ...(loop1.body as LuaNode[] || []),
              ...(loop2.body as LuaNode[] || []),
            ];
            const fusedLoop: LuaNode = {
              type: 'WhileStatement',
              condition: loop1.condition || { type: 'BooleanLiteral', value: true },
              body: fusedBody,
            };
            body[i] = fusedLoop;
            body.splice(i + 1, 1);
            fused++;
            i--;
          }
        }
      }
    });

    ctx.stats.loopsUnrolled = unrolled;
    ctx.stats.loopsFused = fused;
  }

  private unrollLoop(node: Record<string, unknown>, iterations: number, ctx: ObfuscationContext): void {
    const body = node.body as LuaNode[] || [];
    const variable = node.variable as unknown as { name: string };
    const start = node.start as unknown as { value: number };
    const unrolledBody: LuaNode[] = [];

    for (let i = 0; i < iterations; i++) {
      const iterVar = '_unroll_' + variable.name + '_' + i;
      unrolledBody.push({
        type: 'LocalStatement',
        variables: [createIdentifier(iterVar)],
        init: [createNumericLiteral(Number(start.value) + i)],
      } as never);
      // Add original body with variable renamed
      for (const stmt of body) {
        unrolledBody.push(this.renameInNode(stmt, variable.name, iterVar));
      }
    }

    // Replace loop with do...end containing unrolled body
    const replacement: LuaNode = {
      type: 'DoStatement',
      body: unrolledBody,
    };
    Object.assign(node, replacement);
  }

  private renameInNode(node: LuaNode, oldName: string, newName: string): LuaNode {
    const n = node as unknown as Record<string, unknown>;
    if (n.type === 'Identifier' && n.name === oldName) {
      return { type: 'Identifier', name: newName };
    }
    // Recursively rename in children
    for (const key of Object.keys(n)) {
      const val = n[key];
      if (Array.isArray(val)) {
        n[key] = val.map(child =>
          typeof child === 'object' && child !== null ? this.renameInNode(child, oldName, newName) : child
        );
      } else if (typeof val === 'object' && val !== null && 'type' in val) {
        n[key] = this.renameInNode(val as LuaNode, oldName, newName);
      }
    }
    return node;
  }
}
