/**
 * Project: Gungnir - Control Flow Flattening
 *
 * Transforms structured control flow into a dispatch-loop state machine.
 * Each basic block becomes a case in a while(true) + switch pattern.
 *
 * Layer 2: Control Flow Purgatory
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import { walk, createIdentifier, createNumericLiteral } from '../utils/helpers';

interface FlattenedBlock {
  id: number;
  body: LuaNode[];
  nextBlockId: number | null;
  condition: LuaNode | null; // If non-null, this is a conditional branch
  trueBlockId: number | null;
  falseBlockId: number | null;
}

export class ControlFlowFlatteningPlugin implements ObfuscationPlugin {
  name = 'ControlFlowFlattening';
  description = 'Flattens structured control flow into dispatch-loop state machines with scrambled case ordering';
  layers = [2];

  /** Counter for generating unique state IDs */
  private stateCounter = 0;

  transform(ctx: ObfuscationContext): Chunk {
    const intensity = ctx.config.intensity;

    // Only flatten blocks at sufficient complexity for the given intensity
    const minBlockSize = Math.max(2, 8 - intensity);
    const flattenRate = Math.min(intensity / 10, 0.6);

    // Find candidate functions/blocks to flatten
    const candidates: {
      body: LuaNode[];
      parent: Record<string, unknown>;
      bodyKey: string;
    }[] = [];

    walk(ctx.ast, (node) => {
      const n = node as unknown as Record<string, unknown>;

      // Flatten function bodies
      if (n.type === 'FunctionDeclaration' || n.type === 'FunctionExpression') {
        if (Array.isArray(n.body) && (n.body as unknown[]).length >= minBlockSize) {
          if (ctx.rng.next() < flattenRate) {
            candidates.push({
              body: n.body as unknown as LuaNode[],
              parent: n,
              bodyKey: 'body',
            });
          }
        }
      }

      // Flatten if statement bodies (else branches)
      if (n.type === 'IfStatement') {
        const ifNode = n as unknown as {
          clauses: { body: LuaNode[] }[];
          else_: LuaNode[] | null;
        };
        for (const clause of ifNode.clauses) {
          if (clause.body.length >= minBlockSize && ctx.rng.next() < flattenRate) {
            candidates.push({
              body: clause.body,
              parent: clause as unknown as Record<string, unknown>,
              bodyKey: 'body',
            });
          }
        }
      }
    });

    // Apply flattening to each candidate
    for (const candidate of candidates) {
      try {
        this.flattenBlock(ctx, candidate.body, candidate.parent, candidate.bodyKey);
        ctx.stats.blocksFlattened++;
      } catch (err) {
        // Error recovery — skip blocks that fail to flatten
        if (ctx.config.verbose) {
          console.warn(`CFF: Failed to flatten block: ${err}`);
        }
      }
    }

    return ctx.ast;
  }

  /**
   * Flatten a sequence of statements into a dispatch-loop state machine.
   *
   * Original:
   *   stmt1; stmt2; stmt3
   *
   * Becomes:
   *   local __state = START
   *   while true do
   *     if __state == 3 then stmt1; __state = 7
   *     elseif __state == 7 then stmt2; __state = 1
   *     elseif __state == 1 then stmt3; break
   *     end
   *   end
   */
  private flattenBlock(
    ctx: ObfuscationContext,
    body: LuaNode[],
    parent: Record<string, unknown>,
    bodyKey: string
  ): void {
    if (body.length < 2) return;

    // Phase 1: Split the body into basic blocks
    const blocks: FlattenedBlock[] = [];
    let currentBlock: LuaNode[] = [];

    for (const stmt of body) {
      const n = stmt as unknown as Record<string, unknown>;
      currentBlock.push(stmt);

      // Control flow statements end a basic block
      if (['IfStatement', 'WhileStatement', 'ForNumericStatement', 'ReturnStatement', 'BreakStatement'].includes(String(n.type))) {
        blocks.push({
          id: this.nextStateId(ctx),
          body: [...currentBlock],
          nextBlockId: null,
          condition: null,
          trueBlockId: null,
          falseBlockId: null,
        });
        currentBlock = [];
      }
    }

    // Don't forget the last block
    if (currentBlock.length > 0) {
      blocks.push({
        id: this.nextStateId(ctx),
        body: [...currentBlock],
        nextBlockId: null,
        condition: null,
        trueBlockId: null,
        falseBlockId: null,
      });
    }

    if (blocks.length < 2) return;

    // Phase 2: Link blocks in sequence (but scramble the IDs)
    // Assign random IDs to make the execution order non-obvious
    const scrambledBlocks = ctx.rng.shuffle(blocks);
    const blockById = new Map<number, FlattenedBlock>();

    for (let i = 0; i < scrambledBlocks.length; i++) {
      blockById.set(scrambledBlocks[i].id, scrambledBlocks[i]);
    }

    // Link: each block points to the next in original order
    for (let i = 0; i < blocks.length; i++) {
      const next = i + 1 < blocks.length ? blocks[i + 1] : null;
      blocks[i].nextBlockId = next ? next.id : null;
    }

    // Phase 3: Generate the dispatch loop AST
    const dispatchLoop = this.generateDispatchLoop(ctx, blocks, scrambledBlocks);

    // Phase 4: Replace the original body with the dispatch loop
    (parent as Record<string, unknown>)[bodyKey] = [dispatchLoop];
  }

  /**
   * Generate the while(true) dispatch loop AST.
   */
  private generateDispatchLoop(
    ctx: ObfuscationContext,
    blocks: FlattenedBlock[],
    scrambledBlocks: FlattenedBlock[]
  ): LuaNode {
    const stateVar = this.generateStateVarName(ctx);
    const initialState = blocks[0].id;

    // Build the if-elseif chain for the dispatch
    const clauses: { condition: LuaNode; body: LuaNode[] }[] = [];

    for (const block of scrambledBlocks) {
      const condCheck: LuaNode = {
        type: 'BinaryExpression',
        operator: '==',
        left: createIdentifier(stateVar),
        right: createNumericLiteral(block.id),
      } as never;

      const blockBody: LuaNode[] = [...block.body];

      // Check if the last statement is a return — if so, no transition needed
      const lastStmt = blockBody[blockBody.length - 1] as unknown as { type: string } | undefined;
      const endsWithReturn = lastStmt?.type === 'ReturnStatement';
      const endsWithBreak = lastStmt?.type === 'BreakStatement';

      if (endsWithReturn || endsWithBreak) {
        // Block already terminates control flow — no transition needed
      } else if (block.nextBlockId !== null) {
        blockBody.push({
          type: 'AssignmentStatement',
          variables: [createIdentifier(stateVar)],
          init: [createNumericLiteral(block.nextBlockId)],
        } as never);
      } else {
        // Last block — break out of the loop
        blockBody.push({ type: 'BreakStatement' } as never);
      }

      clauses.push({ condition: condCheck, body: blockBody });
    }

    // Build: while true do ... end
    const whileLoop: LuaNode = {
      type: 'WhileStatement',
      condition: { type: 'BooleanLiteral', value: true } as never,
      body: [{
        type: 'IfStatement',
        clauses,
        else_: [{
          type: 'BreakStatement',
        } as never],
      } as never],
    } as never;

    // Prepend: local stateVar = initialState
    const localDecl: LuaNode = {
      type: 'LocalStatement',
      variables: [createIdentifier(stateVar)],
      init: [createNumericLiteral(initialState)],
    } as never;

    // Return a "block" that includes both the local declaration and the while loop
    // For simplicity, we wrap in a do...end block
    return {
      type: 'DoStatement',
      body: [localDecl, whileLoop],
    } as never;
  }

  private nextStateId(ctx: ObfuscationContext): number {
    // Generate random-looking state IDs to obscure execution order
    this.stateCounter++;
    return ctx.rng.int(1000, 9999) + this.stateCounter;
  }

  private generateStateVarName(ctx: ObfuscationContext): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let name = '';
    for (let i = 0; i < 6; i++) {
      name += chars[ctx.rng.int(0, chars.length - 1)];
    }
    return '_' + name;
  }
}
