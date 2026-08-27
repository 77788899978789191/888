/**
 * Project: Gungnir - Control Flow Flattening
 *
 * Transforms structured control flow into a dispatch-loop state machine.
 * Each basic block becomes a case in a while(true) + switch pattern.
 *
 * Layer 2: Control Flow Purgatory
 *
 * 【作用域安全：局部变量提升 + α 改名】
 *  - 分发循环把每个基本块放进独立的 if/elseif 分支，各分支是独立
 *    作用域。若不处理，`local x`（分支 A）与后续引用（分支 B）会被
 *    拆散——B 中的 x 静默退化成全局 nil（间歇性运行时崩溃根源）。
 *  - 解法：块内所有顶层局部声明提升为循环前的一次 `local`（全新
 *    不冲突名），原声明处改为赋值（`local a,b = f()` → `fa,fb = f()`
 *    完整保留多值调整语义），声明点之后的引用统一 α 改名到新名。
 *    引用先于声明点的保持原名（继续绑定外层作用域，与 Lua 语义一致）。
 *  - 同名遮蔽（重声明 / 嵌套函数 / 循环变量 / 参数）经统一改名后
 *    遮蔽结构同构保持，语义严格等价。
 *  - 顶层 break 在分发循环中会绑错循环 → 此类块直接放弃扁平化。
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import {
  walk, createIdentifier, createNumericLiteral, collectIdentifierNames,
} from '../utils/helpers';
import {
  hoistTopLevelLocals, topLevelLocalsSafeToHoist,
} from '../utils/ScopeHoist';

interface FlattenedBlock {
  id: number;
  body: LuaNode[];
  nextBlockId: number | null;
}

export class ControlFlowFlatteningPlugin implements ObfuscationPlugin {
  name = 'ControlFlowFlattening';
  description = 'Flattens structured control flow into dispatch-loop state machines with scrambled case ordering and scope-safe local hoisting';
  layers = [2];

  /** Counter for generating unique state IDs */
  private stateCounter = 0;
  /** 本插件已生成的 fresh 名（跨块去重，防同名碰撞） */
  private usedFreshNames = new Set<string>();

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
   *   local a = 1; stmt1(a); local b = 2; stmt2(b)
   *
   * Becomes (scope-safe):
   *   do
   *     local fa, fb                      -- hoisted locals
   *     local __state = START
   *     while true do
   *       if __state == 3 then fa = 1; __state = 7
   *       elseif __state == 7 then stmt1(fa); __state = 1
   *       elseif __state == 1 then fb = 2; stmt2(fb); break
   *       end
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

    // 顶层 break 会绑到分发循环而非原循环 → 放弃该块
    for (const stmt of body) {
      if (String((stmt as unknown as Record<string, unknown>).type) === 'BreakStatement') return;
    }

    // 纯计算切块数（不改动 AST）：少于 2 块则放弃（避免先改名后放弃的半成品状态）
    if (this.countBlocks(body) < 2) return;

    // raw 文本引用了将提升的顶层 local 名 → 无法触及改名 → 放弃该块
    // （必须在任何 AST 变异之前判定）
    if (!topLevelLocalsSafeToHoist(body)) return;

    // —— 此刻起必然产出：执行提升 + 改名（安全，不再有回退路径）——
    const hoisted = hoistTopLevelLocals(ctx, body, this.usedFreshNames, '_hf');
    const { decl, newBody } = hoisted;

    // Phase 1: Split the hoisted body into basic blocks
    const blocks: FlattenedBlock[] = [];
    let currentBlock: LuaNode[] = [];

    for (const stmt of newBody) {
      const n = stmt as unknown as Record<string, unknown>;
      currentBlock.push(stmt);

      // Control flow statements end a basic block
      if (['IfStatement', 'WhileStatement', 'ForNumericStatement', 'ReturnStatement', 'BreakStatement'].includes(String(n.type))) {
        blocks.push({
          id: this.nextStateId(ctx),
          body: [...currentBlock],
          nextBlockId: null,
        });
        currentBlock = [];
      }
    }

    if (currentBlock.length > 0) {
      blocks.push({
        id: this.nextStateId(ctx),
        body: [...currentBlock],
        nextBlockId: null,
      });
    }

    if (blocks.length < 2) return;

    // Phase 2: Link blocks in sequence (but scramble the IDs)
    const scrambledBlocks = ctx.rng.shuffle(blocks);

    // Link: each block points to the next in original order
    for (let i = 0; i < blocks.length; i++) {
      const next = i + 1 < blocks.length ? blocks[i + 1] : null;
      blocks[i].nextBlockId = next ? next.id : null;
    }

    // Phase 3: Generate the dispatch loop AST
    const dispatchLoop = this.generateDispatchLoop(ctx, blocks, scrambledBlocks);

    // Phase 4: Replace the original body with the dispatch loop
    const doBody = decl ? [decl, dispatchLoop.stateDecl] : [dispatchLoop.stateDecl];
    (parent as Record<string, unknown>)[bodyKey] = [{
      type: 'DoStatement',
      body: [...doBody, dispatchLoop.whileLoop],
    }];
  }

  /** 纯计算：按切块规则统计块数（不修改 AST） */
  private countBlocks(body: LuaNode[]): number {
    let count = 0;
    let open = false;
    for (const stmt of body) {
      const t = String((stmt as unknown as Record<string, unknown>).type);
      open = true;
      if (['IfStatement', 'WhileStatement', 'ForNumericStatement', 'ReturnStatement', 'BreakStatement'].includes(t)) {
        count++;
        open = false;
      }
    }
    if (open) count++;
    return count;
  }

  /**
   * Generate the while(true) dispatch loop AST.
   */
  private generateDispatchLoop(
    ctx: ObfuscationContext,
    blocks: FlattenedBlock[],
    scrambledBlocks: FlattenedBlock[]
  ): { stateDecl: LuaNode; whileLoop: LuaNode } {
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

    // local stateVar = initialState
    const stateDecl: LuaNode = {
      type: 'LocalStatement',
      variables: [createIdentifier(stateVar)] as never,
      init: [createNumericLiteral(initialState)] as never,
    } as never;

    return { stateDecl, whileLoop };
  }

  private nextStateId(ctx: ObfuscationContext): number {
    // Generate random-looking state IDs to obscure execution order
    this.stateCounter++;
    return ctx.rng.int(1000, 9999) + this.stateCounter;
  }

  private generateStateVarName(ctx: ObfuscationContext): string {
    // 状态变量名与全 chunk 标识符 + 本插件 fresh 名去重（防遮蔽用户变量）
    const used = collectIdentifierNames(ctx.ast as unknown as LuaNode);
    for (const u of this.usedFreshNames) used.add(u);
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let name = '_' + chars[ctx.rng.int(0, 25)];
    for (let i = 0; i < 5; i++) {
      name += chars[ctx.rng.int(0, 25)];
    }
    while (used.has(name)) {
      name = '_' + chars[ctx.rng.int(0, 25)];
      for (let i = 0; i < 5; i++) {
        name += chars[ctx.rng.int(0, 25)];
      }
    }
    return name;
  }
}
