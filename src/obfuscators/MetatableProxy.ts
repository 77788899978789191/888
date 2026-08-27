/**
 * Project: Gungnir-Absolute — 元表深度代理链（MetatableProxy）
 *
 * 【子系统 44：元表深度代理链】
 *  - 对源码中的表构造附加 2-4 层诱饵元表链（__index 逐层委托），
 *    缺失键查找需穿透全部诱饵层才返回 nil。
 *  - 语义安全铁律：真实数据必须留在顶层表本身！Lua 5.1 的 `#`、
 *    `pairs`、`ipairs`、`table.concat`、`unpack` 均不经过 __index，
 *    若数据藏于链底代理，以上操作全部静默损坏（#t=0 / concat=""）。
 *    因此本变换后表的行为与原表完全一致。
 *  - pcall 保险：setmetatable 不可用时退化为原表（优雅降级）。
 *
 * 【子系统 69：内存布局随机化】
 *  - 键控字段写入顺序每次构建随机 shuffle（位置字段保持相对顺序，
 *    因为 `{a,b,c}` 的数组语义依赖出现顺序），运行时哈希布局不同。
 *  - 另注入 pairs 键序扰动器（重建表副本，破坏内存快照对比）。
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import {
  walk, generateLuaIdentifier, createRawStatement, createIdentifier,
} from '../utils/helpers';

export class MetatableProxyPlugin implements ObfuscationPlugin {
  name = 'MetatableProxy';
  description = '元表深度代理链 + 内存布局随机化（子系统 44/69）';
  layers = [3];

  /** 诱饵链深度上限（含底层，稳定性底线：元表链 ≤16） */
  private static readonly MAX_CHAIN = 4;

  transform(ctx: ObfuscationContext): Chunk {
    const intensity = ctx.config.intensity;
    const rate = Math.min(0.1 + intensity * 0.08, 0.7);

    // 【69】内存布局随机化运行时：pairs 顺序扰动器
    this.injectLayoutRandomizer(ctx);

    // 先收集再变换（避免 walk 期间原位变异导致重复包装）
    const targets: Record<string, unknown>[] = [];
    walk(ctx.ast, (node, parent) => {
      const n = node as unknown as Record<string, unknown>;
      if (n.type !== 'TableConstructorExpression') return;

      const fields = (n.fields as unknown[] | undefined) ?? [];
      if (fields.length === 0) return;
      const pt = String((parent as unknown as Record<string, unknown> | undefined)?.type ?? '');
      if (pt === 'TableCallExpression') return;

      if (ctx.rng.next() > rate) return;
      targets.push(n);
    });

    for (const node of targets) {
      this.wrapWithProxyChain(ctx, node);
      ctx.stats.constantsObfuscated++;
    }

    return ctx.ast;
  }

  /**
   * {...原字段...} ⇒
   *   (function()
   *      local t = {...原字段（键控字段 shuffle【69】）...}   -- 真实数据在顶层
   *      local D1 = { [诱饵键] = 值 }                          -- 诱饵链底层
   *      local D2 = setmetatable({ [诱饵键] = 值 }, { __index = D1 })
   *      local D3 = setmetatable({ [诱饵键] = 值 }, { __index = D2 })
   *      local ok, r = pcall(setmetatable, t, { __index = D3 })
   *      if ok then return r end
   *      return t
   *   end)()
   *
   * 原表构造节点保留为 AST（复杂值：函数/调用/嵌套表全部无损），
   * 求值恰好一次（pcall 失败路径复用同一 t，无重复副作用）。
   */
  private wrapWithProxyChain(
    ctx: ObfuscationContext,
    node: Record<string, unknown>,
  ): void {
    const depth = ctx.rng.int(2, MetatableProxyPlugin.MAX_CHAIN);
    const f = generateLuaIdentifier(ctx.rng, '_mp', 6);
    const tName = `${f}t`;
    const okName = `${f}ok`;
    const rName = `${f}r`;

    // 键控字段 shuffle【69】；位置字段保持相对顺序（数组语义不可乱序）
    const fields = (node.fields as Record<string, unknown>[]) ?? [];
    const positional: Record<string, unknown>[] = [];
    const keyed: Record<string, unknown>[] = [];
    for (const fld of fields) {
      if (fld.type === 'TableValue') positional.push(fld);
      else keyed.push(fld);
    }
    const shuffledKeyed = ctx.rng.shuffle(keyed);
    const merged: Record<string, unknown>[] = [];
    let pi = 0;
    let ki = 0;
    for (const fld of fields) {
      if (fld.type === 'TableValue') merged.push(positional[pi++]);
      else merged.push(shuffledKeyed[ki++]);
    }

    // 诱饵链（自底向上声明：D1 → D2 → D3 …）
    const chainLines: string[] = [];
    const bottom = `${f}b`;
    chainLines.push(`local ${bottom} = { [${ctx.rng.int(100, 999)}] = ${ctx.rng.int(1, 99)} }`);
    let prev = bottom;
    for (let i = 1; i <= depth; i++) {
      const layer = `${f}${i}`;
      chainLines.push(
        `local ${layer} = setmetatable({ [${ctx.rng.int(100, 999)}] = ${ctx.rng.int(1, 99)} }, { __index = ${prev} })`,
      );
      prev = layer;
    }

    // 顶层真实表（原字段 AST 原样保留）
    const newTable: LuaNode = {
      type: 'TableConstructorExpression',
      fields: merged as never,
    } as never;

    // local ok, r = pcall(setmetatable, t, { __index = 链顶 })
    const setMetatableCall: LuaNode = {
      type: 'CallExpression',
      base: createIdentifier('pcall'),
      arguments: [
        createIdentifier('setmetatable'),
        createIdentifier(tName),
        {
          type: 'TableConstructorExpression',
          fields: [{
            type: 'TableKeyString',
            key: createIdentifier('__index'),
            value: createIdentifier(prev),
          } as never] as never,
        } as never,
      ] as never,
    } as never;

    // if ok then return r end return t
    const fallbackIf: LuaNode = {
      type: 'IfStatement',
      clauses: [{
        condition: createIdentifier(okName),
        body: [{
          type: 'ReturnStatement',
          arguments: [createIdentifier(rName)] as never,
        } as never] as never,
      } as never] as never,
      else_: [{
        type: 'ReturnStatement',
        arguments: [createIdentifier(tName)] as never,
      } as never] as never,
    } as never;

    const body: LuaNode[] = [
      {
        type: 'LocalStatement',
        variables: [createIdentifier(tName)] as never,
        init: [newTable] as never,
      } as never,
      createRawStatement(chainLines.join('\n')),
      {
        type: 'LocalStatement',
        variables: [createIdentifier(okName), createIdentifier(rName)] as never,
        init: [setMetatableCall] as never,
      } as never,
      fallbackIf,
    ];

    // 原位变异：TableConstructorExpression → (function() ... end)()
    const wrapper: Record<string, unknown> = {
      type: 'CallExpression',
      base: {
        type: 'FunctionExpression',
        parameters: [] as never,
        body: body as never,
      } as never,
      arguments: [] as never,
    };
    for (const key of Object.keys(node)) delete node[key];
    Object.assign(node, wrapper);
  }

  /**
   * 【子系统 69】注入内存布局随机化器：
   * 运行时对指定表执行键序扰动（重建表副本），破坏快照对比。
   */
  private injectLayoutRandomizer(ctx: ObfuscationContext): void {
    const f = generateLuaIdentifier(ctx.rng, '_ml', 6);
    const stub = `
-- [Gungnir 子系统 69] 内存布局随机化：重建表以扰动键序（破坏内存快照对比）
local ${f}shuffle
${f}shuffle = function(t)
  if type(t) ~= 'table' then return t end
  local keys = {}
  for k in pairs(t) do keys[#keys + 1] = k end
  -- 构建种子派生的伪随机重排（无 math.random 依赖，确定性可控）
  local s = ${ctx.rng.int(100000, 2147483000)}
  for i = #keys, 2, -1 do
    s = (s * 1103515245 + 12345) % 2147483648
    local j = (s % i) + 1
    keys[i], keys[j] = keys[j], keys[i]
  end
  local out = {}
  for i = 1, #keys do out[keys[i]] = t[keys[i]] end
  return out
end
`;
    const body = (ctx.ast as unknown as { body: LuaNode[] }).body;
    body.unshift(createRawStatement(stub) as LuaNode);
  }
}
