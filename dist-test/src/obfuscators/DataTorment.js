"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTormentPlugin = void 0;
const helpers_1 = require("../utils/helpers");
class DataTormentPlugin {
    name = 'DataTorment';
    description = '数据过程化/表键名混淆/弱表终结器/语义等价替换/常量擦除（子系统 39/42/43/46/47）';
    layers = [3];
    transform(ctx) {
        const intensity = ctx.config.intensity;
        // 【47】语义等价替换：标准库调用 → 手动实现
        this.replaceStdlibCalls(ctx, intensity);
        // 【42】数据过程化：静态表 → 函数生成
        this.proceduralizeTables(ctx, intensity);
        // 【43】表键名混淆 + 【46】弱表终结器 + 【39】常量擦除：注入运行时桩
        this.injectRuntimeStub(ctx);
        return ctx.ast;
    }
    // ================= 【子系统 47】语义等价替换 =================
    /**
     * string.gsub(s, "a", "b") → 手动循环 + byte 操作
     * string.rep(s, n) → 手动拼接循环
     * string.upper(s) / string.lower(s) → 手动 byte 偏移
     *
     * 每次构建随机选择替换哪些家族（保证多态性）。
     */
    replaceStdlibCalls(ctx, intensity) {
        const rate = Math.min(0.2 + intensity * 0.08, 0.8);
        // 随机选择启用的替换家族
        const families = ctx.rng.shuffle(['gsub', 'rep', 'upper', 'lower']);
        const enabled = new Set(families.slice(0, ctx.rng.int(2, 4)));
        (0, helpers_1.walk)(ctx.ast, (node, parent) => {
            const n = node;
            const pt = String(parent?.type ?? '');
            // 不可在语法位（函数调用参数需可求值表达式——一切位置均可，但保守跳过 StringCall）
            if (pt === 'StringCallExpression')
                return;
            if (n.type !== 'CallExpression')
                return;
            const base = n.base;
            if (!base || base.type !== 'MemberExpression')
                return;
            if (base.indexer !== '.')
                return;
            const baseBase = base.base;
            const id = base.identifier;
            if (!baseBase || baseBase.type !== 'Identifier' || baseBase.name !== 'string')
                return;
            const fname = String(id?.name ?? '');
            if (!enabled.has(fname))
                return;
            if (ctx.rng.next() > rate)
                return;
            const args = n.arguments ?? [];
            if (fname === 'rep' && args.length >= 2 && this.isSimpleString(args[0]) && this.isSimpleNumber(args[1])) {
                this.replaceRep(ctx, n, args);
                ctx.stats.constantsObfuscated++;
            }
            else if (fname === 'upper' && args.length >= 1 && this.isSimpleString(args[0])) {
                this.replaceUpperLower(ctx, n, args, -32);
                ctx.stats.constantsObfuscated++;
            }
            else if (fname === 'lower' && args.length >= 1 && this.isSimpleString(args[0])) {
                this.replaceUpperLower(ctx, n, args, 32);
                ctx.stats.constantsObfuscated++;
            }
            // gsub 全量替换需要 pattern 引擎（Lua pattern 子集），仅对字面 pattern 的简单情况启用
            else if (fname === 'gsub' && args.length >= 3
                && this.isSimpleString(args[0]) && this.isSimpleString(args[1]) && this.isSimpleString(args[2])
                && this.isPlainPattern(args[1])) {
                this.replaceGsubPlain(ctx, n, args);
                ctx.stats.constantsObfuscated++;
            }
        });
    }
    isSimpleString(node) {
        const n = node;
        return n.type === 'StringLiteral' || n.type === 'Identifier';
    }
    isSimpleNumber(node) {
        const n = node;
        return n.type === 'NumericLiteral' || n.type === 'Identifier';
    }
    /** 无 pattern 元字符的纯字面 pattern（可安全手动替换） */
    isPlainPattern(node) {
        const n = node;
        if (n.type !== 'StringLiteral')
            return false;
        const v = String(n.value ?? '');
        // Lua pattern 魔法字符集
        return !/[%^$()*+?.\[\]\\|-]/.test(v) && v.length > 0;
    }
    /** string.rep(s, n) → 手动循环拼接 */
    replaceRep(ctx, node, args) {
        const f = (0, helpers_1.generateLuaIdentifier)(ctx.rng, '_rp', 6);
        // 注入手动 rep 实现为内联 IIFE
        const sArg = this.exprToLua(args[0]);
        const nArg = this.exprToLua(args[1]);
        const code = `(function() local ${f}s, ${f}r = ${sArg}, ${nArg} local ${f}o = "" for ${f}i = 1, ${f}r do ${f}o = ${f}o .. ${f}s end return ${f}o end)()`;
        this.replaceWithRaw(node, code);
    }
    /** string.upper(s) / string.lower(s) → 手动 byte 偏移（delta 由构建随机方向） */
    replaceUpperLower(ctx, node, args, delta) {
        const f = (0, helpers_1.generateLuaIdentifier)(ctx.rng, '_cl', 6);
        const sArg = this.exprToLua(args[0]);
        // delta 混入两个常量的差（隐蔽化）
        const a = ctx.rng.int(100, 999);
        const b = a - delta;
        const code = `(function() local ${f}d = ${a} - ${b} local ${f}o = "" local ${f}s = ${sArg} for ${f}i = 1, #${f}s do local ${f}c = string.byte(${f}s, ${f}i) if ${f}c >= 97 and ${f}c <= 122 then ${f}c = ${f}c + ${f}d elseif ${f}c >= 65 and ${f}c <= 90 then ${f}c = ${f}c - ${f}d end ${f}o = ${f}o .. string.char(${f}c) end return ${f}o end)()`;
        this.replaceWithRaw(node, code);
    }
    /** string.gsub(s, "lit", "rep") → 手动查找循环 */
    replaceGsubPlain(ctx, node, args) {
        const f = (0, helpers_1.generateLuaIdentifier)(ctx.rng, '_gs', 6);
        const sArg = this.exprToLua(args[0]);
        const pArg = this.exprToLua(args[1]);
        const rArg = this.exprToLua(args[2]);
        const code = `(function() local ${f}s, ${f}p, ${f}r = ${sArg}, ${pArg}, ${rArg} local ${f}o, ${f}i = "", 1 while ${f}i <= #${f}s do if string.sub(${f}s, ${f}i, ${f}i + #${f}p - 1) == ${f}p then ${f}o = ${f}o .. ${f}r ${f}i = ${f}i + #${f}p else ${f}o = ${f}o .. string.sub(${f}s, ${f}i, ${f}i) ${f}i = ${f}i + 1 end end return ${f}o end)()`;
        this.replaceWithRaw(node, code);
    }
    /** 将节点变异为 Raw 表达式（LuaPrinter 直通打印） */
    replaceWithRaw(node, code) {
        node.type = 'GungnirRawExpression';
        node.code = code;
        delete node.base;
        delete node.arguments;
    }
    /** 表达式节点 → Lua 源（仅支持简单字面量/标识符——其余情况已过滤） */
    exprToLua(node) {
        const n = node;
        if (n.type === 'StringLiteral')
            return this.quote(String(n.value ?? ''));
        if (n.type === 'NumericLiteral')
            return String(n.value);
        if (n.type === 'Identifier')
            return String(n.name);
        return 'nil';
    }
    // ================= 【子系统 42】数据过程化 =================
    /**
     * 静态表构造 {1,2,3} → (function() local t = {} t[1]=... return t end)()
     * 表内容由函数过程生成，静态不可直接读取。
     */
    proceduralizeTables(ctx, intensity) {
        const rate = Math.min(0.1 + intensity * 0.06, 0.6);
        const minFields = 2;
        const maxFields = 8;
        (0, helpers_1.walk)(ctx.ast, (node, parent) => {
            const n = node;
            if (n.type !== 'TableConstructorExpression')
                return;
            // 跳过我们生成的键控表（TableKey 形式，StringSplitting 产物）
            const fields = n.fields ?? [];
            if (fields.length < minFields || fields.length > maxFields)
                return;
            for (const f of fields) {
                if (f.type === 'TableKey')
                    return; // 键控表由 StringSplitting 管理
            }
            // 必须全是简单值（数字/字符串/布尔）——其余类型过程化会破坏语义
            for (const f of fields) {
                const v = f.value;
                if (!v)
                    return;
                const vt = String(v.type ?? '');
                if (vt !== 'NumericLiteral' && vt !== 'StringLiteral' && vt !== 'BooleanLiteral')
                    return;
            }
            // 语法位检查：TableCallExpression f{...} 参数需表构造器——跳过
            const pt = String(parent?.type ?? '');
            if (pt === 'TableCallExpression')
                return;
            if (ctx.rng.next() > rate)
                return;
            this.proceduralize(ctx, n, fields);
            ctx.stats.constantsObfuscated++;
        });
    }
    /** {v1, v2, v3} → (function() local t = {} t[1]=v1 ... return t end)() */
    proceduralize(ctx, node, fields) {
        const lines = [];
        for (let i = 0; i < fields.length; i++) {
            const v = fields[i].value;
            const val = v.type === 'StringLiteral'
                ? this.quote(String(v.value ?? ''))
                : String(v.value);
            lines.push(`t[${i + 1}] = ${val}`);
        }
        // 混入不可达的键扰动（不透明条件）
        const k = ctx.rng.int(2, 9);
        const code = `(function() local t = {} if ${k} == ${k} + 1 then t[${ctx.rng.int(100, 999)}] = ${ctx.rng.int(1, 99)} end ${lines.map(l => l.replace(/^t\[/, 't[')).join(' ')} return t end)()`;
        this.replaceWithRaw(node, code);
    }
    // ================= 【39/43/46】运行时桩 =================
    /**
     * 注入运行时数据折磨桩：
     *  - 【43】哈希键代理表（__index 解密键名）
     *  - 【46】newproxy + __gc 弱表终结器隐式数据流
     *  - 【39】常量擦除器（置 nil + collectgarbage）
     */
    injectRuntimeStub(ctx) {
        const f = (0, helpers_1.generateLuaIdentifier)(ctx.rng, '_dt', 8);
        const kf = `${f}k`;
        const pool = `${f}pool`;
        const weak = `${f}weak`;
        const wrap = `${f}wrap`;
        const erase = `${f}erase`;
        // 键哈希密钥（构建种子派生）
        const kkey = ctx.rng.int(1000, 2147483000);
        const stub = `
-- [Gungnir 子系统 39/43/46] 数据折磨运行时（键名解密代理 / 弱表终结器 / 常量擦除）
local ${pool} = {}
local ${weak} = setmetatable({}, { __mode = 'kv' })
local ${f}finalized = false

-- 【43】键名混淆代理：t.真实键 → 哈希键存取，__index 动态解密
local ${f}proxy = setmetatable({}, {
  __index = function(_, k)
    local ${kf} = 0
    if type(k) == 'string' then
      for i = 1, #k do ${kf} = (${kf} * 31 + string.byte(k, i)) % ${kkey + 7} end
    end
    return ${pool}[${kf}]
  end,
  __newindex = function(_, k, v)
    local ${kf} = 0
    if type(k) == 'string' then
      for i = 1, #k do ${kf} = (${kf} * 31 + string.byte(k, i)) % ${kkey + 7} end
    end
    ${pool}[${kf}] = v
  end,
})

-- 【46】newproxy + __gc 终结器：GC 触发时把数据传递到弱表（隐式数据流）
do
  local ok, proxy = pcall(function() return newproxy(true) end)
  if ok and proxy then
    local mt = getmetatable(proxy)
    if mt then
      mt.__gc = function()
        ${weak}[#${weak} + 1] = ${pool}
        ${f}finalized = true
      end
    end
  end
end

-- 【39】常量即时擦除：使用后置 nil + 强制 GC（时机由调用方随机决定）
local ${erase} = function(...)
  local keys = {...}
  for i = 1, #keys do
    if type(keys[i]) == 'table' then
      for k in pairs(keys[i]) do keys[i][k] = nil end
    else
      ${pool}[keys[i]] = nil
    end
  end
  pcall(function() collectgarbage('collect') end)
end

-- 【42】过程化数据存取接口（供其他模块使用）
local ${wrap} = function(v) ${pool}[#${pool} + 1] = v return #${pool} end
`;
        // 注入到 chunk 头部
        const body = ctx.ast.body;
        body.unshift((0, helpers_1.createRawStatement)(stub));
        ctx.stats.deadBlocksInjected++;
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
exports.DataTormentPlugin = DataTormentPlugin;
