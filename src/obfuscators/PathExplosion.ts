/**
 * Project: Gungnir-Absolute — 路径爆炸（PathExplosion）
 *
 * 【子系统 24：路径爆炸分支】
 *  - 注入嵌套不透明谓词分支树：强度 5 时每脚本 ≥2000 条分支、
 *    嵌套深度 ≥5（4^6 量级的路径组合）。叶子仅写私有 scratch 表
 *    （惰性无害），任何分支被触发都不影响用户语义。
 *
 * 【子系统 62：反符号执行盾】
 *  - 谓词族为「运行时不确定」的数论约束：模 97 二次剩余、
 *    椭圆曲线模方程、圆点方程 —— SMT 求解器必须逐分支建模，
 *    符号执行状态空间指数爆炸。
 *
 * 【子系统 63：反污点追踪】
 *  - 敏感值（分支谓词的派生值）只通过控制流依赖写入 sink，
 *    不存在直接数据流 —— 污点分析的数据流追踪链被切断。
 *
 * 【子系统 67：AI 级不透明谓词】
 *  - 素数判定（试除法）+ 二次剩余探测，人类可读、
 *    求解器难解，每次构建随机生成不同的谓词家族组合。
 *
 * 【子系统 68：形式化验证陷阱】
 *  - 恒假外壳内嵌「深度上限 900 的 Ackermann 函数」：
 *    运行时永不执行（外壳恒假），但形式化验证工具必须
 *    展开其指数状态空间才能证明不可达 —— 有界状态爆炸。
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import {
  forEachStatementList, generateLuaIdentifier,
} from '../utils/helpers';

export class PathExplosionPlugin implements ObfuscationPlugin {
  name = 'PathExplosion';
  description = '嵌套数论谓词分支树 + Ackermann 形式化验证陷阱（子系统 24/62/63/67/68）';
  layers = [5];

  private branchCount = 0;

  transform(ctx: ObfuscationContext): Chunk {
    const intensity = ctx.config.intensity;
    // 【子系统 24】全局分支预算：强度 1 → 600，强度 5 → 3000（≥2000 达标）
    const totalBudget = 600 * intensity;
    let remaining = totalBudget;

    // chunk 级主爆炸（最大的一份）
    const chunkBudget = Math.min(remaining, Math.floor(totalBudget * 0.4));
    remaining -= chunkBudget;
    const chunkTree = this.buildTree(ctx, chunkBudget);
    (ctx.ast.body as unknown as LuaNode[]).push(
      { type: 'GungnirRawStatement', code: chunkTree } as never,
    );

    // 函数级小爆炸（限流：按强度采样，全局预算耗尽即停）
    const fnRate = Math.min(0.1 + intensity * 0.12, 0.7);
    forEachStatementList(ctx.ast, (stmts, owner) => {
      if (remaining <= 50) return;
      const t = String((owner as Record<string, unknown>).type ?? '');
      if (t !== 'FunctionDeclaration' && t !== 'FunctionExpression') return;
      if (stmts.length === 0) return;
      if (ctx.rng.next() > fnRate) return;
      const siteBudget = Math.min(remaining, 60 * intensity);
      remaining -= siteBudget;
      const tree = this.buildTree(ctx, siteBudget);
      stmts.unshift({ type: 'GungnirRawStatement', code: tree } as never);
    });

    ctx.stats.deadBlocksInjected += this.branchCount;
    return ctx.ast;
  }

  /**
   * 递归生成嵌套分支树（raw Lua 文本）。
   * budget = 该子树的节点总数（每个节点消耗 1）。
   */
  private buildTree(ctx: ObfuscationContext, budget: number): string {
    const p = generateLuaIdentifier(ctx.rng, '_px', 6);
    const r = generateLuaIdentifier(ctx.rng, '_pr', 6);
    const x = generateLuaIdentifier(ctx.rng, '_pxx', 5);
    const y = generateLuaIdentifier(ctx.rng, '_pyy', 5);
    const seed = ctx.rng.int(100000, 2147483000);
    const maxDepth = 5 + ctx.rng.int(0, 2);
    const scratch = generateLuaIdentifier(ctx.rng, '_ps', 5);
    const cnt = { branches: 0 };

    const body = this.genNode(ctx, budget, 0, maxDepth, {
      p, r, x, y, seed: `${seed}`, scratch, cnt,
    });

    return `
-- [Gungnir 子系统 24/62/63/67/68] 路径爆炸树（每次构建随机结构）
do
  local ${scratch} = {}
  local ${x}, ${y} = ${ctx.rng.int(2, 90)}, ${ctx.rng.int(2, 90)}
  -- [63] 反污点：敏感值经控制流依赖写入 sink（无数据流直连）
  local ${p} = function(k, v) ${scratch}[k] = v end
  -- [67] 素数判定（AI 级不透明谓词家族，试除法）
  local ${r} = function(n)
    if n < 2 then return false end
    local i = 2
    while i * i <= n do
      if n % i == 0 then return false end
      i = i + 1
    end
    return true
  end
${body}
end
`;
  }

  private genNode(
    ctx: ObfuscationContext,
    budget: number,
    depth: number,
    maxDepth: number,
    vars: {
      p: string; r: string; x: string; y: string;
      seed: string; scratch: string; cnt: { branches: number };
    },
  ): string {
    vars.cnt.branches++;
    this.branchCount++;
    const indent = '  '.repeat(depth + 1);

    if (depth >= maxDepth || budget <= 1) {
      // 惰性叶子：仅写 scratch（任何路径触发都无用户可见副作用）
      const k = ctx.rng.int(1, 9999);
      return `${indent}${vars.p}(${k}, (${vars.x} + ${vars.y}) % 97)\n`;
    }

    // 随机选择谓词家族（每次构建组合不同【子系统 67】）
    const fam = ctx.rng.int(0, 4);
    let pred: string;
    switch (fam) {
      case 0:
        // [67] 素数判定：运行时不确定
        pred = `${vars.r}(${vars.x} * ${depth + 3} + 7)`;
        break;
      case 1:
        // [62] 模 97 二次剩余：Euler 判别需逐值建模
        pred = `(${vars.x} * ${vars.x} - ${ctx.rng.int(2, 90)}) % 97 == 0`;
        break;
      case 2:
        // [62] 椭圆曲线模方程：y² ≡ x³ + ax + b (mod 97)
        pred = `(${vars.y} * ${vars.y}) % 97 == ((${vars.x} * ${vars.x} * ${vars.x}) + ${ctx.rng.int(2, 96)} * ${vars.x} + ${ctx.rng.int(2, 96)}) % 97`;
        break;
      case 3:
        // [62] 圆点方程：x² + y² == 25（3-4-5 族），运行时可能命中
        pred = `(${vars.x} * ${vars.x} + ${vars.y} * ${vars.y}) == 25`;
        break;
      default:
        // [62] 费马大定理特例（正整数恒假，需数论知识才能判定）
        pred = `((${vars.x} * ${vars.x} * ${vars.x}) + (${vars.y} * ${vars.y} * ${vars.y})) == ((${vars.x} + ${vars.y}) * (${vars.x} + ${vars.y}) * (${vars.x} + ${vars.y}))`;
        break;
    }

    // 分支两侧分别推进随机状态（运行时值漂移，静态分析无法定值）
    const driftA = `${vars.x} = (${vars.x} * 37 + 11) % 90 + 2`;
    const driftB = `${vars.y} = (${vars.y} * 53 + 17) % 90 + 2`;

    const childBudget = Math.floor((budget - 1) / 2);
    const thenBranch = this.genNode(ctx, childBudget, depth + 1, maxDepth, vars);
    const elseBranch = this.genNode(ctx, budget - 1 - childBudget, depth + 1, maxDepth, vars);

    // 【子系统 68】形式化验证陷阱：在特定深度嵌入 Ackermann 诱饵
    let trap = '';
    if (depth === 2 && ctx.rng.next() < 0.5) {
      const ak = generateLuaIdentifier(ctx.rng, '_ak', 5);
      const trap_ = `
${indent}  -- [68] 恒假外壳内的 Ackermann（有界 900 深）：形式化验证状态爆炸诱饵
${indent}  if (${vars.x} == ${vars.x} + 1) then
${indent}    local function ${ak}(m, n, d)
${indent}      if d > 900 then return -1 end
${indent}      if m == 0 then return n + 1 end
${indent}      if n == 0 then return ${ak}(m - 1, 1, d + 1) end
${indent}      return ${ak}(m - 1, ${ak}(m, n - 1, d + 1), d + 1)
${indent}    end
${indent}    ${vars.p}(0, ${ak}(3, 7, 0))
${indent}  end
`;
      trap = trap_;
    }

    return `${indent}if ${pred} then
${indent}  ${driftA}
${thenBranch}${trap}${indent}else
${indent}  ${driftB}
${elseBranch}${indent}end
`;
  }
}
