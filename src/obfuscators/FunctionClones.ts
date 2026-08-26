/**
 * Project: Gungnir-Absolute — 多态函数克隆（FunctionClones）
 *
 * 【子系统 58：多态函数克隆】
 *  - 同一功能生成 3 个实现完全不同的函数版本（直通版 / pcall 重试
 *    版 / 元表 __call 分发版），运行时经 LCG 权重随机选择调用。
 *    LCG 状态为函数外 upvalue——跨调用持续演进，每次调用路径不同。
 *
 * 【子系统 59：可变参数污染函数签名】
 *  - 分发器与全部克隆带 ... 形参转发（select('#',...) 计数扰），
 *    干扰调用约定分析与调试器参数显示。
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import {
  forEachStatementList, generateLuaIdentifier, createIdentifier,
  createRawStatement,
} from '../utils/helpers';

export class FunctionClonesPlugin implements ObfuscationPlugin {
  name = 'FunctionClones';
  description = '多态函数克隆 + 可变参数污染（子系统 58/59）';
  layers = [4];

  transform(ctx: ObfuscationContext): Chunk {
    const intensity = ctx.config.intensity;
    const rate = Math.min(0.1 + intensity * 0.07, 0.55);

    // 顶层函数声明 → 3 克隆 + LCG 随机分发器
    forEachStatementList(ctx.ast, (stmts) => {
      for (let i = 0; i < stmts.length; i++) {
        const n = stmts[i] as unknown as Record<string, unknown>;
        if (n.type !== 'FunctionDeclaration') continue;
        if (n.isLocal === true) continue;

        const id = n.identifier as { name?: unknown; type?: string } | null;
        if (!id || id.type !== 'Identifier') continue; // 只处理简单名
        if (String(id.name ?? '') === '') continue;

        if (ctx.rng.next() > rate) continue;

        const setup = this.buildCloneSetup(ctx, n);
        if (setup.length > 0) {
          // 克隆/权重声明插到函数声明之前（upvalue 捕获）
          stmts.splice(i, 0, ...setup);
          i += setup.length;
          ctx.stats.functionsProxied++;
        }
      }
    });

    return ctx.ast;
  }

  /**
   * function f(a, b) BODY end ⇒（前置插入）
   *   local _c1 = function(a, b, ...) BODY end          -- 直通克隆
   *   local _c2 = function(...)                          -- pcall 克隆
   *     local ok, r = pcall(_c1, ...)
   *     if ok then return r end
   *     return _c1(...)
   *   end
   *   local _c3 = setmetatable({}, { __call =            -- __call 克隆
   *     function(_, ...) return _c1(...) end })
   *   local _w = <构建种子>
   * 并把原函数变异为分发器：
   *   function f(...)
   *     _w = (_w * 1103515245 + 12345) % 2147483648
   *     local _r = _w % 3
   *     if _r == 0 then return _c1(...)
   *     elseif _r == 1 then return _c2(...)
   *     else return _c3(...) end
   *   end
   *
   * 【59】分发器与全部克隆带 ... 形参污染。
   * _w 为分发器 upvalue —— LCG 状态跨调用演进（运行时路径随机）。
   */
  private buildCloneSetup(
    ctx: ObfuscationContext,
    fn: Record<string, unknown>,
  ): LuaNode[] {
    const f = generateLuaIdentifier(ctx.rng, '_fc', 6);
    const c1 = `${f}a`;
    const c2 = `${f}b`;
    const c3 = `${f}c`;
    const w = `${f}w`;

    // 原参数与函数体（移入直通克隆）
    const params = (fn.parameters as LuaNode[] | undefined) ?? [];
    const body = (fn.body as LuaNode[] | undefined) ?? [];

    // 克隆 1：直通版（原始函数体 + ... 尾参污染【59】）
    const clone1Params = [...params];
    if (!clone1Params.some(p => String((p as unknown as { type?: string }).type) === 'VarargLiteral')) {
      clone1Params.push({ type: 'VarargLiteral', value: '...' } as unknown as LuaNode);
    }
    const clone1: LuaNode = {
      type: 'FunctionExpression',
      identifier: null,
      isLocal: false,
      parameters: clone1Params,
      body,
    } as unknown as LuaNode;

    // 克隆 2：pcall 重试版（错误吞噬后直调）
    const clone2: LuaNode = {
      type: 'FunctionExpression',
      identifier: null,
      isLocal: false,
      parameters: [{ type: 'VarargLiteral', value: '...' } as unknown as LuaNode],
      body: [
        {
          type: 'LocalStatement',
          variables: [createIdentifier(`${f}ok`), createIdentifier(`${f}r`)],
          init: [{
            type: 'CallExpression',
            base: createIdentifier('pcall'),
            arguments: [
              createIdentifier(c1),
              { type: 'VarargLiteral', value: '...' } as unknown as LuaNode,
            ],
          } as unknown as LuaNode],
        } as unknown as LuaNode,
        {
          type: 'IfStatement',
          clauses: [{
            condition: createIdentifier(`${f}ok`),
            body: [
              {
                type: 'ReturnStatement',
                arguments: [createIdentifier(`${f}r`)],
              } as unknown as LuaNode,
            ],
          }],
          else_: null,
        } as unknown as LuaNode,
        {
          type: 'ReturnStatement',
          arguments: [{
            type: 'CallExpression',
            base: createIdentifier(c1),
            arguments: [{ type: 'VarargLiteral', value: '...' } as unknown as LuaNode],
          } as unknown as LuaNode],
        } as unknown as LuaNode,
      ],
    } as unknown as LuaNode;

    // 克隆 3：__call 元表版
    const clone3: LuaNode = {
      type: 'CallExpression',
      base: createIdentifier('setmetatable'),
      arguments: [
        { type: 'TableConstructorExpression', fields: [] } as unknown as LuaNode,
        {
          type: 'TableConstructorExpression',
          fields: [{
            type: 'TableKeyString',
            key: createIdentifier('__call'),
            value: {
              type: 'FunctionExpression',
              identifier: null,
              isLocal: false,
              parameters: [
                { type: 'Identifier', name: `${f}self` },
                { type: 'VarargLiteral', value: '...' },
              ],
              body: [
                {
                  type: 'ReturnStatement',
                  arguments: [{
                    type: 'CallExpression',
                    base: createIdentifier(c1),
                    arguments: [{ type: 'VarargLiteral', value: '...' } as unknown as LuaNode],
                  } as unknown as LuaNode],
                } as unknown as LuaNode,
              ],
            } as unknown as LuaNode,
          } as unknown as LuaNode],
        } as unknown as LuaNode,
      ],
    } as unknown as LuaNode;

    // LCG 权重种子（构建随机）
    const seed = ctx.rng.int(100000, 2147483000);

    // 前置声明序列（分发器的 upvalue 源）
    const setup: LuaNode[] = [
      {
        type: 'LocalStatement',
        variables: [createIdentifier(c1)],
        init: [clone1],
      } as unknown as LuaNode,
      {
        type: 'LocalStatement',
        variables: [createIdentifier(c2)],
        init: [clone2],
      } as unknown as LuaNode,
      {
        type: 'LocalStatement',
        variables: [createIdentifier(c3)],
        init: [clone3],
      } as unknown as LuaNode,
      createRawStatement(`local ${w} = ${seed}`) as LuaNode,
    ];

    // 原函数变异为分发器（保留名字与位置）
    fn.parameters = [{ type: 'VarargLiteral', value: '...' }];
    fn.body = [
      createRawStatement(`${w} = (${w} * 1103515245 + 12345) % 2147483648`) as LuaNode,
      createRawStatement(`local ${f}r = ${w} % 3`) as LuaNode,
      createRawStatement(
        [
          `if ${f}r == 0 then`,
          `  return ${c1}(...)`,
          `elseif ${f}r == 1 then`,
          `  return ${c2}(...)`,
          `else`,
          `  return ${c3}(...)`,
          `end`,
        ].join('\n'),
      ) as LuaNode,
    ];

    return setup;
  }
}
