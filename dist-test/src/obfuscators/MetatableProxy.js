"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetatableProxyPlugin = void 0;
const helpers_1 = require("../utils/helpers");
class MetatableProxyPlugin {
    name = 'MetatableProxy';
    description = '元表深度代理链 + 内存布局随机化（子系统 44/69）';
    layers = [3];
    /** 诱饵链深度上限（含底层，稳定性底线：元表链 ≤16） */
    static MAX_CHAIN = 4;
    transform(ctx) {
        const intensity = ctx.config.intensity;
        const rate = Math.min(0.1 + intensity * 0.08, 0.7);
        // 【69】内存布局随机化运行时：pairs 顺序扰动器
        this.injectLayoutRandomizer(ctx);
        // 先收集再变换（避免 walk 期间原位变异导致重复包装）
        const targets = [];
        (0, helpers_1.walk)(ctx.ast, (node, parent) => {
            const n = node;
            if (n.type !== 'TableConstructorExpression')
                return;
            const fields = n.fields ?? [];
            if (fields.length === 0)
                return;
            const pt = String(parent?.type ?? '');
            if (pt === 'TableCallExpression')
                return;
            if (ctx.rng.next() > rate)
                return;
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
    wrapWithProxyChain(ctx, node) {
        const depth = ctx.rng.int(2, MetatableProxyPlugin.MAX_CHAIN);
        const f = (0, helpers_1.generateLuaIdentifier)(ctx.rng, '_mp', 6);
        const tName = `${f}t`;
        const okName = `${f}ok`;
        const rName = `${f}r`;
        // 键控字段 shuffle【69】；位置字段保持相对顺序（数组语义不可乱序）
        const fields = node.fields ?? [];
        const positional = [];
        const keyed = [];
        for (const fld of fields) {
            if (fld.type === 'TableValue')
                positional.push(fld);
            else
                keyed.push(fld);
        }
        const shuffledKeyed = ctx.rng.shuffle(keyed);
        const merged = [];
        let pi = 0;
        let ki = 0;
        for (const fld of fields) {
            if (fld.type === 'TableValue')
                merged.push(positional[pi++]);
            else
                merged.push(shuffledKeyed[ki++]);
        }
        // 诱饵链（自底向上声明：D1 → D2 → D3 …）
        const chainLines = [];
        const bottom = `${f}b`;
        chainLines.push(`local ${bottom} = { [${ctx.rng.int(100, 999)}] = ${ctx.rng.int(1, 99)} }`);
        let prev = bottom;
        for (let i = 1; i <= depth; i++) {
            const layer = `${f}${i}`;
            chainLines.push(`local ${layer} = setmetatable({ [${ctx.rng.int(100, 999)}] = ${ctx.rng.int(1, 99)} }, { __index = ${prev} })`);
            prev = layer;
        }
        // 顶层真实表（原字段 AST 原样保留）
        const newTable = {
            type: 'TableConstructorExpression',
            fields: merged,
        };
        // local ok, r = pcall(setmetatable, t, { __index = 链顶 })
        const setMetatableCall = {
            type: 'CallExpression',
            base: (0, helpers_1.createIdentifier)('pcall'),
            arguments: [
                (0, helpers_1.createIdentifier)('setmetatable'),
                (0, helpers_1.createIdentifier)(tName),
                {
                    type: 'TableConstructorExpression',
                    fields: [{
                            type: 'TableKeyString',
                            key: (0, helpers_1.createIdentifier)('__index'),
                            value: (0, helpers_1.createIdentifier)(prev),
                        }],
                },
            ],
        };
        // if ok then return r end return t
        const fallbackIf = {
            type: 'IfStatement',
            clauses: [{
                    condition: (0, helpers_1.createIdentifier)(okName),
                    body: [{
                            type: 'ReturnStatement',
                            arguments: [(0, helpers_1.createIdentifier)(rName)],
                        }],
                }],
            else_: [{
                    type: 'ReturnStatement',
                    arguments: [(0, helpers_1.createIdentifier)(tName)],
                }],
        };
        const body = [
            {
                type: 'LocalStatement',
                variables: [(0, helpers_1.createIdentifier)(tName)],
                init: [newTable],
            },
            (0, helpers_1.createRawStatement)(chainLines.join('\n')),
            {
                type: 'LocalStatement',
                variables: [(0, helpers_1.createIdentifier)(okName), (0, helpers_1.createIdentifier)(rName)],
                init: [setMetatableCall],
            },
            fallbackIf,
        ];
        // 原位变异：TableConstructorExpression → (function() ... end)()
        const wrapper = {
            type: 'CallExpression',
            base: {
                type: 'FunctionExpression',
                parameters: [],
                body: body,
            },
            arguments: [],
        };
        for (const key of Object.keys(node))
            delete node[key];
        Object.assign(node, wrapper);
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
}
exports.MetatableProxyPlugin = MetatableProxyPlugin;
