"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathExplosionPlugin = void 0;
const helpers_1 = require("../utils/helpers");
class PathExplosionPlugin {
    name = 'PathExplosion';
    description = '嵌套数论谓词分支树 + Ackermann 形式化验证陷阱（子系统 24/62/63/67/68）';
    layers = [5];
    branchCount = 0;
    transform(ctx) {
        const intensity = ctx.config.intensity;
        // 【子系统 24】全局分支预算：强度 1 → 600，强度 5 → 3000（≥2000 达标）
        const totalBudget = 600 * intensity;
        let remaining = totalBudget;
        // chunk 级主爆炸（最大的一份）
        const chunkBudget = Math.min(remaining, Math.floor(totalBudget * 0.4));
        remaining -= chunkBudget;
        const chunkTree = this.buildTree(ctx, chunkBudget);
        ctx.ast.body.push({ type: 'GungnirRawStatement', code: chunkTree });
        // 函数级小爆炸（限流：按强度采样，全局预算耗尽即停）
        const fnRate = Math.min(0.1 + intensity * 0.12, 0.7);
        (0, helpers_1.forEachStatementList)(ctx.ast, (stmts, owner) => {
            if (remaining <= 50)
                return;
            const t = String(owner.type ?? '');
            if (t !== 'FunctionDeclaration' && t !== 'FunctionExpression')
                return;
            if (stmts.length === 0)
                return;
            if (ctx.rng.next() > fnRate)
                return;
            const siteBudget = Math.min(remaining, 60 * intensity);
            remaining -= siteBudget;
            const tree = this.buildTree(ctx, siteBudget);
            stmts.unshift({ type: 'GungnirRawStatement', code: tree });
        });
        ctx.stats.deadBlocksInjected += this.branchCount;
        return ctx.ast;
    }
    /**
     * 递归生成嵌套分支树（raw Lua 文本）。
     * budget = 该子树的节点总数（每个节点消耗 1）。
     */
    buildTree(ctx, budget) {
        const p = (0, helpers_1.generateLuaIdentifier)(ctx.rng, '_px', 6);
        const r = (0, helpers_1.generateLuaIdentifier)(ctx.rng, '_pr', 6);
        const x = (0, helpers_1.generateLuaIdentifier)(ctx.rng, '_pxx', 5);
        const y = (0, helpers_1.generateLuaIdentifier)(ctx.rng, '_pyy', 5);
        const seed = ctx.rng.int(100000, 2147483000);
        const maxDepth = 5 + ctx.rng.int(0, 2);
        const scratch = (0, helpers_1.generateLuaIdentifier)(ctx.rng, '_ps', 5);
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
    genNode(ctx, budget, depth, maxDepth, vars) {
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
        let pred;
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
            const ak = (0, helpers_1.generateLuaIdentifier)(ctx.rng, '_ak', 5);
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
exports.PathExplosionPlugin = PathExplosionPlugin;
