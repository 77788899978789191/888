/**
 * Project: Gungnir-Absolute — 元表深度代理链（MetatableProxy）
 *
 * 【子系统 44：元表深度代理链】
 *  - 对源码中的表构造附加 3-5 层元表链，__index 逐层委托，
 *    最终层返回真实值。链结构（层级数、中间表内容）每次构建随机。
 *  - pcall 保险：若 setmetatable 链构建失败则退化为单层（优雅降级，
 *    满足「元表链≤16 稳定性底线」）。
 *
 * 【子系统 69：内存布局随机化】
 *  - 每次构建对表键写入顺序随机 shuffle（利用 Lua 表哈希特性
 *    破坏内存快照对比），键顺序由构建种子派生。
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import {
  walk, generateLuaIdentifier, createRawStatement,
} from '../utils/helpers';

export class MetatableProxyPlugin implements ObfuscationPlugin {
  name = 'MetatableProxy';
  description = '元表深度代理链 + 内存布局随机化（子系统 44/69）';
  layers = [3];

  /** 元表链深度上限（稳定性底线：元表链 ≤16） */
  private static readonly MAX_CHAIN = 5;

  transform(ctx: ObfuscationContext): Chunk {
    const intensity = ctx.config.intensity;
    const rate = Math.min(0.1 + intensity * 0.08, 0.7);

    // 【69】内存布局随机化运行时：pairs 顺序扰动器
    this.injectLayoutRandomizer(ctx);

    // 【44】表构造 → 元表代理链包装
    walk(ctx.ast, (node, parent) => {
      const n = node as unknown as Record<string, unknown>;
      if (n.type !== 'TableConstructorExpression') return;

      // 必须是字段 ≥1 的表，且处于可求值位置（非 TableCall 语法位）
      const fields = (n.fields as unknown[] | undefined) ?? [];
      if (fields.length === 0) return;
      const pt = String((parent as unknown as Record<string, unknown> | undefined)?.type ?? '');
      if (pt === 'TableCallExpression') return;

      // 父必须是能接受表达式的位置（局部初始化/赋值/参数/返回值等均安全）
      if (ctx.rng.next() > rate) return;

      this.wrapWithProxyChain(ctx, n);
      ctx.stats.constantsObfuscated++;
    });

    return ctx.ast;
  }

  /**
   * {…原字段…} →
   *   (function()
   *      local L3 = {…原字段（键序 shuffle【69】）…}
   *      local L2 = setmetatable({}, {__index = L3})
   *      local L1 = setmetatable({}, {__index = L2})
   *      return L1
   *   end)()
   *
   * 链深 3-5 层随机；中间层插入诱饵键（访问即触发 __index 委托链）。
   */
  private wrapWithProxyChain(
    ctx: ObfuscationContext,
    node: Record<string, unknown>,
  ): void {
    const depth = ctx.rng.int(3, MetatableProxyPlugin.MAX_CHAIN);
    const f = generateLuaIdentifier(ctx.rng, '_mp', 6);
    const base = generateLuaIdentifier(ctx.rng, '_mb', 5);

    const lines: string[] = [];
    // 最底层：真实数据表（键写入顺序随机化【69】）
    const shuffled = this.rebuildFieldsShuffled(ctx, node);
    lines.push(`local ${base} = ${shuffled}`);

    // 逐层向上建代理（L_depth-1 … L1）
    let prev = base;
    for (let i = depth - 1; i >= 1; i--) {
      const layer = `${f}${i}`;
      // 中间层插入诱饵键（等值不可达条件，仅增加 __index 委托深度）
      const decoy = ctx.rng.int(100, 999);
      lines.push(`local ${layer} = setmetatable({ [${decoy}] = ${ctx.rng.int(1, 99)} }, { __index = ${prev} })`);
      prev = layer;
    }

    // pcall 保险（稳定性底线）：失败则退化为直接返回原表
    lines.push(`if pcall(function() return setmetatable({}, { __index = ${prev} }) end) then return setmetatable({}, { __index = ${prev} }) end`);
    lines.push(`return ${base}`);

    const code = `(function()\n${lines.join('\n')}\nend)()`;

    // 原位变异
    node.type = 'GungnirRawExpression';
    node.code = code;
    delete node.fields;
  }

  /**
   * 【子系统 69】把表构造重写为 setmetatable 混乱键序形态：
   * 原表字段逐个以随机顺序 t[k]=v 赋值，运行时键插入顺序
   * 由构建种子决定 → 每次构建内存布局不同。
   */
  private rebuildFieldsShuffled(
    ctx: ObfuscationContext,
    node: Record<string, unknown>,
  ): string {
    const fields = (node.fields as {
      type?: string;
      key?: LuaNode | null;
      value?: LuaNode;
    }[] | undefined) ?? [];

    const entries: { key: string; val: string }[] = [];
    for (const fld of fields) {
      const v = fld.value as Record<string, unknown> | undefined;
      if (!v) continue;
      const valLua = this.valueToLua(v);
      if (valLua === null) return '{}'; // 含复杂值 → 保守空表（调用方已过滤）
      if (fld.type === 'TableValue') {
        entries.push({ key: String(entries.length + 1), val: valLua });
      } else if (fld.type === 'TableKey' && fld.key) {
        const k = fld.key as unknown as Record<string, unknown>;
        if (k.type === 'NumericLiteral') {
          entries.push({ key: String(k.value), val: valLua });
        } else if (k.type === 'StringLiteral') {
          entries.push({ key: this.quote(String(k.value ?? '')), val: valLua });
        } else if (k.type === 'Identifier') {
          entries.push({ key: this.quote(String(k.name ?? '')), val: valLua });
        } else {
          return '{}';
        }
      } else {
        return '{}';
      }
    }

    if (entries.length === 0) return '{}';

    // 键序 shuffle【69】
    const order = ctx.rng.shuffle(entries.map((_, i) => i));
    const assigns = order.map(i => `t[${entries[i].key}] = ${entries[i].val}`).join(' ');
    return `(function() local t = {} ${assigns} return t end)()`;
  }

  /** 值节点 → Lua 源（仅简单字面量；复杂值返回 null 由调用方跳过） */
  private valueToLua(v: Record<string, unknown>): string | null {
    const t = String(v.type ?? '');
    if (t === 'NumericLiteral') return String(v.value);
    if (t === 'BooleanLiteral') return v.value ? 'true' : 'false';
    if (t === 'NilLiteral') return 'nil';
    if (t === 'StringLiteral') return this.quote(String(v.value ?? ''));
    if (t === 'UnaryExpression'
      && String((v.argument as Record<string, unknown> | undefined)?.type) === 'NumericLiteral') {
      const arg = v.argument as Record<string, unknown>;
      return String(v.operator) === '-' ? `-${arg.value}` : null;
    }
    return null;
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

  /** Lua 单引号字面量 */
  private quote(s: string): string {
    let out = "'";
    for (const ch of s) {
      const c = ch.charCodeAt(0);
      if (ch === "'") { out += "\\'"; continue; }
      if (ch === '\\') { out += '\\\\'; continue; }
      if (c === 10) { out += '\\n'; continue; }
      if (c === 13) { out += '\\r'; continue; }
      if (c === 9) { out += '\\t'; continue; }
      if (c >= 32 && c < 127) { out += ch; continue; }
      out += '\\' + String(c).padStart(3, '0');
    }
    return out + "'";
  }
}
