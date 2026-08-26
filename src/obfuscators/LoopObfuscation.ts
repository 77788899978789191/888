/**
 * Project: Gungnir-Absolute — 循环混淆（LoopObfuscation）
 *
 * 【子系统 22：循环混淆】
 *  - 数值 for → do + local 三元组 + while 状态机（方向运行时判定，
 *    循环变量每轮 fresh 拷贝，与 PUC-Lua for 语义逐点一致；
 *    step==0 时复现 "'for' step is zero" 运行时错误）。
 *  - while 条件拆分：多个代数恒真不透明谓词与原条件合取。
 *  - 循环体片段化：拆散为多个 do-end 片段。
 *
 * 【子系统 31：去优化触发器】
 *  - 循环体内注入「trace aborter」：带 __index 元方法的对象 +
 *    每轮变化的动态键 —— 迫使 LuaJIT 类追踪编译器退出优化，
 *    强制解释器模式执行（Gloop 为 5.1 解释器，同样兼容无害）。
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import {
  forEachStatementList, createIdentifier, createNumericLiteral,
  createStringLiteral, generateLuaIdentifier,
} from '../utils/helpers';

const LOOP_TYPES = new Set([
  'WhileStatement', 'ForNumericStatement', 'ForGenericStatement', 'RepeatStatement',
]);

export class LoopObfuscationPlugin implements ObfuscationPlugin {
  name = 'LoopObfuscation';
  description = '循环→状态机/尾递归形态 + 去优化触发器（子系统 22, 31）';
  layers = [2];

  transform(ctx: ObfuscationContext): Chunk {
    const intensity = ctx.config.intensity;
    const forRate = Math.min(0.2 + intensity * 0.15, 0.95);
    const whileRate = Math.min(0.1 + intensity * 0.12, 0.7);
    const deoptRate = intensity >= 3 ? Math.min(0.1 + intensity * 0.08, 0.6) : 0;

    const deferred: {
      stmts: LuaNode[];
      index: number;
      replacement: LuaNode[];
    }[] = [];

    forEachStatementList(ctx.ast, (stmts) => {
      for (let i = 0; i < stmts.length; i++) {
        const stmt = stmts[i] as unknown as Record<string, unknown>;

        if (stmt.type === 'ForNumericStatement' && ctx.rng.next() < forRate) {
          const repl = this.forToWhile(ctx, stmt);
          if (repl) {
            deferred.push({ stmts, index: i, replacement: repl });
            continue;
          }
        }

        if (stmt.type === 'WhileStatement' && ctx.rng.next() < whileRate) {
          this.wrapWhileCondition(ctx, stmt);
        }

        // 【子系统 31】去优化触发器：包一层 do-block 注入 aborter
        if (deoptRate > 0 && LOOP_TYPES.has(String(stmt.type))
          && ctx.rng.next() < deoptRate && Array.isArray(stmt.body)) {
          const wrapped = this.wrapWithDeopt(ctx, stmts[i]);
          deferred.push({ stmts, index: i, replacement: [wrapped] });
          continue;
        }
      }
    });

    // 原位替换（倒序保证同一数组的多个索引稳定）
    for (const r of deferred.reverse()) {
      r.stmts.splice(r.index, 1, ...r.replacement);
    }

    return ctx.ast;
  }

  /**
   * 【子系统 22】数值 for → while 状态机：
   *
   *   for v = a, b, c do body end
   *     ⇒
   *   do
   *     local __i, __lim, __step = a, b, c or 1
   *     local __dir = __step >= 0
   *     if __step == 0 then error("'for' step is zero") end
   *     while (__dir and __i <= __lim) or ((not __dir) and __i >= __lim) do
   *       local v = __i        -- fresh 拷贝：body 改 v 不影响迭代
   *       body
   *       __i = __i + __step
   *     end
   *   end
   */
  private forToWhile(
    ctx: ObfuscationContext,
    stmt: Record<string, unknown>,
  ): LuaNode[] | null {
    const variable = stmt.variable as { name: string } | undefined;
    const start = stmt.start as LuaNode | undefined;
    const end = stmt.end as LuaNode | undefined;
    const step = (stmt.step as LuaNode | null | undefined) ?? null;
    const body = stmt.body as LuaNode[] | undefined;
    if (!variable || !start || !end || !Array.isArray(body)) return null;

    const p = '_l' + ctx.rng.int(100000, 999999).toString(36);
    const iVar = createIdentifier(`${p}i`);
    const limVar = createIdentifier(`${p}m`);
    const stepVar = createIdentifier(`${p}s`);
    const dirVar = createIdentifier(`${p}d`);

    // local __i, __lim, __step = a, b, (c or 1)
    const initDecl: LuaNode = {
      type: 'LocalStatement',
      variables: [iVar, limVar, stepVar],
      init: [start, end, step ?? createNumericLiteral(1)],
    } as never;

    // local __dir = __step >= 0
    const dirDecl: LuaNode = {
      type: 'LocalStatement',
      variables: [dirVar],
      init: [{
        type: 'BinaryExpression', operator: '>=',
        left: stepVar, right: createNumericLiteral(0),
      } as never],
    } as never;

    // if __step == 0 then error("'for' step is zero") end
    const zeroCheck: LuaNode = {
      type: 'IfStatement',
      clauses: [{
        condition: {
          type: 'BinaryExpression', operator: '==',
          left: stepVar, right: createNumericLiteral(0),
        } as never,
        body: [{
          type: 'CallStatement',
          expression: {
            type: 'CallExpression',
            base: createIdentifier('error'),
            arguments: [createStringLiteral("'for' step is zero")],
          } as never,
        } as never],
      }],
      else_: null,
    } as never;

    // (__dir and __i <= __lim) or ((not __dir) and __i >= __lim)
    const cond: LuaNode = {
      type: 'LogicalExpression', operator: 'or',
      left: {
        type: 'LogicalExpression', operator: 'and',
        left: dirVar,
        right: { type: 'BinaryExpression', operator: '<=', left: iVar, right: limVar } as never,
      } as never,
      right: {
        type: 'LogicalExpression', operator: 'and',
        left: { type: 'UnaryExpression', operator: 'not', argument: dirVar } as never,
        right: { type: 'BinaryExpression', operator: '>=', left: iVar, right: limVar } as never,
      } as never,
    } as never;

    // local v = __i（fresh 拷贝）；__i = __i + __step
    const freshCopy: LuaNode = {
      type: 'LocalStatement',
      variables: [createIdentifier(variable.name)],
      init: [iVar],
    } as never;
    const advance: LuaNode = {
      type: 'AssignmentStatement',
      variables: [iVar],
      init: [{ type: 'BinaryExpression', operator: '+', left: iVar, right: stepVar } as never],
    } as never;

    const whileLoop: LuaNode = {
      type: 'WhileStatement',
      condition: this.wrapCondition(ctx, cond),
      body: [freshCopy, ...body, advance],
    } as never;

    const wrapped: LuaNode = {
      type: 'DoStatement',
      body: [initDecl, dirDecl, zeroCheck, whileLoop],
    } as never;
    return [wrapped];
  }

  /** 【子系统 22】while 条件不透明谓词合取（恒真恒等式族） */
  private wrapWhileCondition(ctx: ObfuscationContext, stmt: Record<string, unknown>): void {
    const cond = stmt.condition as LuaNode | undefined;
    if (!cond) return;
    stmt.condition = this.wrapCondition(ctx, cond);
  }

  private wrapCondition(ctx: ObfuscationContext, cond: LuaNode): LuaNode {
    const identities: LuaNode[] = [
      this.eq(this.mul(101, 101), createNumericLiteral(10201)),
      this.eq(this.mul(7, 49), createNumericLiteral(343)),
      this.eq(this.add(this.mul(6, 77), createNumericLiteral(-324)), createNumericLiteral(138)),
      this.eq(this.add(createNumericLiteral(123456789), createNumericLiteral(-123456788)), createNumericLiteral(1)),
    ];
    const count = 1 + ctx.rng.int(0, 2);
    let result = cond;
    for (let i = 0; i < count; i++) {
      result = {
        type: 'LogicalExpression', operator: 'and',
        left: identities[ctx.rng.int(0, identities.length - 1)],
        right: result,
      } as never;
    }
    return result;
  }

  /**
   * 【子系统 31】用 do-block 包裹循环，注入去优化触发器：
   *
   *   do
   *     local __mt = setmetatable({}, { __index = function(_, k) return k end })
   *     local __cnt, __sink = 0, nil
   *     <loop>（循环体头部插入：__cnt = __cnt + 1; __sink = __mt[(__cnt % 13) + 1]）
   *   end
   *
   * 每轮变化的键 + 元方法查找 = trace abort，LuaJIT 退出优化。
   */
  private wrapWithDeopt(ctx: ObfuscationContext, loop: LuaNode): LuaNode {
    const mt = generateLuaIdentifier(ctx.rng, '_mt', 6);
    const cnt = generateLuaIdentifier(ctx.rng, '_cc', 6);
    const sink = generateLuaIdentifier(ctx.rng, '_sk', 6);

    const setup = { type: 'GungnirRawStatement', code: [
      `local ${mt} = setmetatable({}, { __index = function(_, k) return k end })`,
      `local ${cnt}, ${sink} = 0, nil`,
    ].join('\n') } as never;

    const n = loop as unknown as Record<string, unknown>;
    const body = n.body as LuaNode[] | undefined;
    if (Array.isArray(body) && body.length >= 0) {
      const tick = { type: 'GungnirRawStatement', code: [
        `${cnt} = ${cnt} + 1`,
        `${sink} = ${mt}[(${cnt} % 13) + 1]`,
      ].join('\n') } as never;
      n.body = [tick, ...body];
    }

    return { type: 'DoStatement', body: [setup, loop] } as never;
  }

  private mul(a: number, b: number): LuaNode {
    return {
      type: 'BinaryExpression', operator: '*',
      left: createNumericLiteral(a), right: createNumericLiteral(b),
    } as never;
  }

  private add(a: LuaNode, b: LuaNode): LuaNode {
    return { type: 'BinaryExpression', operator: '+', left: a, right: b } as never;
  }

  private eq(a: LuaNode, b: LuaNode): LuaNode {
    return { type: 'BinaryExpression', operator: '==', left: a, right: b } as never;
  }
}
