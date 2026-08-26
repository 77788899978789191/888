"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetatableProxyPlugin = void 0;
const helpers_1 = require("../utils/helpers");
class MetatableProxyPlugin {
    name = 'MetatableProxy';
    description = '元表深度代理链 + 内存布局随机化（子系统 44/69）';
    layers = [3];
    /** 元表链深度上限（稳定性底线：元表链 ≤16） */
    static MAX_CHAIN = 5;
    transform(ctx) {
        const intensity = ctx.config.intensity;
        const rate = Math.min(0.1 + intensity * 0.08, 0.7);
        // 【69】内存布局随机化运行时：pairs 顺序扰动器
        this.injectLayoutRandomizer(ctx);
        // 【44】表构造 → 元表代理链包装
        (0, helpers_1.walk)(ctx.ast, (node, parent) => {
            const n = node;
            if (n.type !== 'TableConstructorExpression')
                return;
            // 必须是字段 ≥1 的表，且处于可求值位置（非 TableCall 语法位）
            const fields = n.fields ?? [];
            if (fields.length === 0)
                return;
            const pt = String(parent?.type ?? '');
            if (pt === 'TableCallExpression')
                return;
            // 父必须是能接受表达式的位置（局部初始化/赋值/参数/返回值等均安全）
            if (ctx.rng.next() > rate)
                return;
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
    wrapWithProxyChain(ctx, node) {
        const depth = ctx.rng.int(3, MetatableProxyPlugin.MAX_CHAIN);
        const f = (0, helpers_1.generateLuaIdentifier)(ctx.rng, '_mp', 6);
        const base = (0, helpers_1.generateLuaIdentifier)(ctx.rng, '_mb', 5);
        const lines = [];
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
    rebuildFieldsShuffled(ctx, node) {
        const fields = node.fields ?? [];
        const entries = [];
        for (const fld of fields) {
            const v = fld.value;
            if (!v)
                continue;
            const valLua = this.valueToLua(v);
            if (valLua === null)
                return '{}'; // 含复杂值 → 保守空表（调用方已过滤）
            if (fld.type === 'TableValue') {
                entries.push({ key: String(entries.length + 1), val: valLua });
            }
            else if (fld.type === 'TableKey' && fld.key) {
                const k = fld.key;
                if (k.type === 'NumericLiteral') {
                    entries.push({ key: String(k.value), val: valLua });
                }
                else if (k.type === 'StringLiteral') {
                    entries.push({ key: this.quote(String(k.value ?? '')), val: valLua });
                }
                else if (k.type === 'Identifier') {
                    entries.push({ key: this.quote(String(k.name ?? '')), val: valLua });
                }
                else {
                    return '{}';
                }
            }
            else {
                return '{}';
            }
        }
        if (entries.length === 0)
            return '{}';
        // 键序 shuffle【69】
        const order = ctx.rng.shuffle(entries.map((_, i) => i));
        const assigns = order.map(i => `t[${entries[i].key}] = ${entries[i].val}`).join(' ');
        return `(function() local t = {} ${assigns} return t end)()`;
    }
    /** 值节点 → Lua 源（仅简单字面量；复杂值返回 null 由调用方跳过） */
    valueToLua(v) {
        const t = String(v.type ?? '');
        if (t === 'NumericLiteral')
            return String(v.value);
        if (t === 'BooleanLiteral')
            return v.value ? 'true' : 'false';
        if (t === 'NilLiteral')
            return 'nil';
        if (t === 'StringLiteral')
            return this.quote(String(v.value ?? ''));
        if (t === 'UnaryExpression'
            && String(v.argument?.type) === 'NumericLiteral') {
            const arg = v.argument;
            return String(v.operator) === '-' ? `-${arg.value}` : null;
        }
        return null;
    }
    /**
     * 【子系统 69】注入内存布局随机化器：
     * 运行时对指定表执行键序扰动（重建表副本），破坏快照对比。
     */
    injectLayoutRandomizer(ctx) {
        const f = (0, helpers_1.generateLuaIdentifier)(ctx.rng, '_ml', 6);
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
        const body = ctx.ast.body;
        body.unshift((0, helpers_1.createRawStatement)(stub));
    }
    /** Lua 单引号字面量 */
    quote(s) {
        let out = "'";
        for (const ch of s) {
            const c = ch.charCodeAt(0);
            if (ch === "'") {
                out += "\\'";
                continue;
            }
            if (ch === '\\') {
                out += '\\\\';
                continue;
            }
            if (c === 10) {
                out += '\\n';
                continue;
            }
            if (c === 13) {
                out += '\\r';
                continue;
            }
            if (c === 9) {
                out += '\\t';
                continue;
            }
            if (c >= 32 && c < 127) {
                out += ch;
                continue;
            }
            out += '\\' + String(c).padStart(3, '0');
        }
        return out + "'";
    }
}
exports.MetatableProxyPlugin = MetatableProxyPlugin;
