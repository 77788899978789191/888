"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControlFlowChaosPlugin = void 0;
const helpers_1 = require("../utils/helpers");
class ControlFlowChaosPlugin {
    name = 'ControlFlowChaos';
    description = '概率加权分发 + 20 层尾调用链 + 多返回值状态机 + pcall 异常驱动 + 元表 CFI 破坏（子系统 25/27/28/29/30）';
    layers = [2];
    /** 尾调用链深度（≥20 层） */
    static CHAIN_DEPTH = 20;
    transform(ctx) {
        const intensity = ctx.config.intensity;
        // 改写比例：强度 1 → 5%，强度 5 → 55%
        const rewriteRate = Math.min(0.05 + (intensity - 1) * 0.125, 0.55);
        const runtime = this.buildRuntime(ctx);
        // 收集可安全改写的调用语句（倒序替换保持索引稳定）
        const targets = [];
        (0, helpers_1.forEachStatementList)(ctx.ast, (stmts) => {
            for (let i = 0; i < stmts.length; i++) {
                const stmt = stmts[i];
                if (stmt.type !== 'CallStatement')
                    continue;
                const expr = stmt.expression;
                if (!expr || expr.type !== 'CallExpression')
                    continue;
                const base = expr.base;
                if (!base || base.type !== 'Identifier')
                    continue;
                // 不改写我们自己的基础设施调用（防递归改写）
                if (this.isReservedName(String(base.name)))
                    continue;
                if (ctx.rng.next() < rewriteRate) {
                    targets.push({ stmts, index: i });
                }
            }
        });
        for (const t of targets.reverse()) {
            const stmt = t.stmts[t.index];
            const expr = stmt.expression;
            const base = expr.base;
            const args = expr.arguments;
            // f(a, b)  ⇒  __wd(f, a, b)
            // 概率分发器在 3 条等价路径中随机选择，全部最终调用 f 并保留错误语义
            const newArgs = [(0, helpers_1.createIdentifier)(base.name)];
            if (Array.isArray(args)) {
                for (const a of args)
                    newArgs.push(a);
            }
            expr.base = (0, helpers_1.createIdentifier)(runtime.name);
            expr.arguments = newArgs;
        }
        // 运行时注入到 chunk 头部（所有函数定义之前）
        if (targets.length > 0) {
            ctx.ast.body.unshift({ type: 'GungnirRawStatement', code: runtime.code });
            ctx.stats.functionsProxied += targets.length;
        }
        return ctx.ast;
    }
    /**
     * 生成混沌运行时（每次构建名称/种子/路径顺序不同 —— 多态）。
     */
    buildRuntime(ctx) {
        const name = (0, helpers_1.generateLuaIdentifier)(ctx.rng, '_cx', 8);
        const chain = [];
        const depth = ControlFlowChaosPlugin.CHAIN_DEPTH;
        // 【子系统 27】20 层尾调用链：每一层都是 return 尾调用，栈深度不变
        // 注意：必须自底向上发射（t1 先定义，t2 引用 t1 时才是可见局部）。
        // 若自顶向下发射，t_i 对 t_{i-1} 是前向引用 → 编译为全局访问 → 运行时 nil。
        for (let i = 1; i <= depth; i++) {
            const fn = `${name}t${i}`;
            // 最底层 t1 直接调用目标 f(...)（不能传 f 自身作参数）
            const body = i === 1 ? 'return f(...)' : `return ${name}t${i - 1}(f, ...)`;
            chain.push(`local ${fn} = function(f, ...) ${body} end`);
        }
        const entry = `${name}t${depth}`;
        const ms = `${name}ms`;
        const wseed = `${name}ws`;
        const cfi = `${name}cf`;
        const code = `
-- [Gungnir 子系统 25/27/28/29/30] 混沌分发运行时（每次构建随机生成）
-- 【子系统 28】多返回值堆栈状态机：状态编码在返回值数量中
local ${ms} = function(s)
  if s == 0 then return 1, 2 end
  if s == 1 then return 1, 2, 3 end
  if s == 2 then return 1, 2, 3, 4 end
  return 1, 2, 3, 4, 5
end
-- 【子系统 30】CFI 破坏：元表 __call 动态调用，静态调用图失效
local ${cfi} = setmetatable({}, { __call = function(_, f, ...) return f(...) end })
-- 【子系统 27】20 层尾调用链（每层 return 尾调用，栈深度不变）
${chain.join('\n')}
-- 概率权重种子（构建期随机派生，每次构建不同）
local ${wseed} = ${ctx.rng.int(1000000, 2147483000)}
-- 【子系统 25】概率加权控制流：3 条等价路径随机选择
-- 【子系统 28】路径选择经 select('#') 读取 __ms 栈上传递的隐式状态
-- 【子系统 29】路径 B：pcall 异常驱动，错误对象携带状态重抛
local ${name} = function(f, ...)
  ${wseed} = (${wseed} * 1103515245 + 12345) % 2147483648
  local __mstate = select('#', ${ms}(${wseed} % 4)) % 3
  local __r = (${wseed} + __mstate) % 3
  if __r == 0 then
    return ${entry}(f, ...)
  elseif __r == 1 then
    -- Lua 5.1：嵌套闭包不能引用外层 ...，改为 pcall 直传参数
    local __ok, __e = pcall(${entry}, f, ...)
    if __ok then return __e end
    -- 【子系统 29】错误值原样重抛（level 0 不附加位置，保留原始错误信息）
    return error(__e, 0)
  else
    return ${cfi}(f, ...)
  end
end
`;
        return { name, code };
    }
    isReservedName(name) {
        return name.startsWith('_cx') || name.startsWith('__t')
            || name.startsWith('_mt') || name.startsWith('_l');
    }
}
exports.ControlFlowChaosPlugin = ControlFlowChaosPlugin;
