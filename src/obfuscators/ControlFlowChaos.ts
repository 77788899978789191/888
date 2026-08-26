/**
 * Project: Gungnir-Absolute — 控制流混沌（ControlFlowChaos）
 *
 * 【子系统 25：概率加权控制流】
 *  - 注入 __wd 分发器：同一调用逻辑 3 种等价路径（尾调用链 /
 *    pcall 异常驱动 / 元表 __call），运行时按 LCG 随机权重选择，
 *    执行路径不确定，每次运行不同。
 *
 * 【子系统 27：尾调用消除栈污染】
 *  - __tc0..__tc19：20 层纯尾调用链（return f(...)），
 *    栈深度恒定，调试器栈回溯只见最外层，无法显示完整调用路径。
 *
 * 【子系统 28：多返回值堆栈状态机】
 *  - __ms(s) 按状态返回不同数量的返回值（2/3/4/5 个），
 *    分发器经 select('#', ...) 读取栈上传递的隐式状态，
 *    状态机的状态由返回值数量和顺序编码，不依赖显式变量。
 *
 * 【子系统 29：异常驱动控制流】
 *  - 路径 B 将调用包裹进 pcall(function() ... end)：
 *    错误对象携带状态信息，catch 端解析；正常路径与异常路径的
 *    跳转不在静态控制流图中显示。error(err, 0) 保留原始错误值。
 *
 * 【子系统 30：控制流完整性破坏】
 *  - __cfi：setmetatable({}, {__call = ...}) 的元表调用，
 *    调用目标运行时动态计算，静态 CFI 分析无法建立调用图。
 *
 * 变换对象：CallStatement（调用语句，返回值被丢弃）——
 * 仅此类节点的改写可证明语义等价（值丢弃 + 错误值保留）。
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import {
  forEachStatementList, createIdentifier, generateLuaIdentifier,
} from '../utils/helpers';

export class ControlFlowChaosPlugin implements ObfuscationPlugin {
  name = 'ControlFlowChaos';
  description = '概率加权分发 + 20 层尾调用链 + 多返回值状态机 + pcall 异常驱动 + 元表 CFI 破坏（子系统 25/27/28/29/30）';
  layers = [2];

  /** 尾调用链深度（≥20 层） */
  private static readonly CHAIN_DEPTH = 20;

  transform(ctx: ObfuscationContext): Chunk {
    const intensity = ctx.config.intensity;
    // 改写比例：强度 1 → 5%，强度 5 → 55%
    const rewriteRate = Math.min(0.05 + (intensity - 1) * 0.125, 0.55);

    const runtime = this.buildRuntime(ctx);

    // 收集可安全改写的调用语句（倒序替换保持索引稳定）
    const targets: { stmts: LuaNode[]; index: number }[] = [];
    forEachStatementList(ctx.ast, (stmts) => {
      for (let i = 0; i < stmts.length; i++) {
        const stmt = stmts[i] as unknown as Record<string, unknown>;
        if (stmt.type !== 'CallStatement') continue;
        const expr = stmt.expression as Record<string, unknown> | undefined;
        if (!expr || expr.type !== 'CallExpression') continue;
        const base = expr.base as Record<string, unknown> | undefined;
        if (!base || base.type !== 'Identifier') continue;
        // 不改写我们自己的基础设施调用（防递归改写）
        if (this.isReservedName(String(base.name))) continue;
        if (ctx.rng.next() < rewriteRate) {
          targets.push({ stmts, index: i });
        }
      }
    });

    for (const t of targets.reverse()) {
      const stmt = t.stmts[t.index] as unknown as Record<string, unknown>;
      const expr = stmt.expression as Record<string, unknown>;
      const base = expr.base as { name: string };
      const args = expr.arguments as LuaNode[] | undefined;

      // f(a, b)  ⇒  __wd(f, a, b)
      // 概率分发器在 3 条等价路径中随机选择，全部最终调用 f 并保留错误语义
      const newArgs: LuaNode[] = [createIdentifier(base.name)];
      if (Array.isArray(args)) {
        for (const a of args) newArgs.push(a);
      }
      expr.base = createIdentifier(runtime.name);
      expr.arguments = newArgs;
    }

    // 运行时注入到 chunk 头部（所有函数定义之前）
    if (targets.length > 0) {
      (ctx.ast.body as unknown as LuaNode[]).unshift(
        { type: 'GungnirRawStatement', code: runtime.code } as never,
      );
      ctx.stats.functionsProxied += targets.length;
    }

    return ctx.ast;
  }

  /**
   * 生成混沌运行时（每次构建名称/种子/路径顺序不同 —— 多态）。
   */
  private buildRuntime(ctx: ObfuscationContext): { name: string; code: string } {
    const name = generateLuaIdentifier(ctx.rng, '_cx', 8);
    const chain: string[] = [];
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

  private isReservedName(name: string): boolean {
    return name.startsWith('_cx') || name.startsWith('__t')
      || name.startsWith('_mt') || name.startsWith('_l');
  }
}
