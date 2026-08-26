/**
 * Project: Gungnir-Absolute — 动态类型迷踪（TypeMaze）
 *
 * 【子系统 45：动态类型迷踪】
 *  - 同一变量在不同路径被赋予不同 Lua 类型（number/string/table/
 *    boolean），紧随其后用 type() 分派恢复真实值 —— 干扰静态类型
 *    推断与调试器的类型显示。
 *
 * 【子系统 64：反 AST/GNN 模式匹配】
 *  - 注入「对抗性节点」：插入看似正常但改变 AST 结构的嵌套
 *    （函数值→立即调用→表装箱→type 分派），使基于 GNN 的
 *    反混淆分类器无法建立稳定的节点 embedding。
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import {
  forEachStatementList, generateLuaIdentifier, createRawStatement,
} from '../utils/helpers';

export class TypeMazePlugin implements ObfuscationPlugin {
  name = 'TypeMaze';
  description = '动态类型迷踪 + 反 AST/GNN 对抗节点（子系统 45/64）';
  layers = [3, 5];

  transform(ctx: ObfuscationContext): Chunk {
    const intensity = ctx.config.intensity;
    const rate = Math.min(0.1 + intensity * 0.07, 0.6);

    // 收集所有整数字面量赋值场景，装箱为类型迷踪
    forEachStatementList(ctx.ast, (stmts) => {
      const insertions: { at: number; code: string }[] = [];

      for (let i = 0; i < stmts.length; i++) {
        const n = stmts[i] as unknown as Record<string, unknown>;
        if (n.type !== 'LocalStatement') continue;
        const vars = (n.variables as { name?: unknown }[] | undefined) ?? [];
        const init = (n.init as Record<string, unknown>[] | undefined) ?? [];
        if (vars.length !== 1 || init.length !== 1) continue;
        const iv = init[0];
        if (!iv || iv.type !== 'NumericLiteral') continue;
        const value = Number(iv.value);
        if (!Number.isInteger(value) || value < 0 || value > 0x7FFF) continue;

        if (ctx.rng.next() > rate) continue;

        // 【45/64】装箱：v = type 分派恢复（number/string/table 三路径）
        const v = String(vars[0].name ?? '');
        const code = this.boxLiteral(ctx, v, value);
        if (code) {
          // 变异原语句为占位（0），再跟类型分派语句恢复
          (iv as { value?: number; raw?: string }).value = 0;
          (iv as { value?: number; raw?: string }).raw = '0';
          insertions.push({ at: i + 1, code });
          ctx.stats.constantsObfuscated++;
        }
      }

      // 倒序插入避免索引位移
      insertions.reverse();
      for (const ins of insertions) {
        stmts.splice(ins.at, 0, createRawStatement(ins.code) as LuaNode);
      }
    });

    return ctx.ast;
  }

  /**
   * local v = 42 →
   *   local v = 0
   *   do
   *     local __box = (42 - 42 + 42)      -- 对抗性节点【64】
   *     local __t = type(__box)
   *     if __t == 'number' then v = __box
   *     elseif __t == 'string' then v = tonumber(__box) or __box
   *     elseif __t == 'table' then v = __box[1]
   *     else v = 42 end
   *   end
   *
   * 随机家族选择保证每次构建装箱形态不同【45】。
   */
  private boxLiteral(ctx: ObfuscationContext, target: string, value: number): string | null {
    const f = generateLuaIdentifier(ctx.rng, '_tm', 6);
    const box = `${f}b`;
    const ty = `${f}t`;

    // 【64】对抗性节点：值经无操作运算链（改变 AST 结构但语义不变）
    const k = ctx.rng.int(1, 999);
    const a = ctx.rng.int(1, 999);
    const family = ctx.rng.int(0, 2);

    let ctor: string;
    switch (family) {
      case 0:
        // (value + a) - a —— 加消元
        ctor = `(${value} + ${a}) - ${a}`;
        break;
      case 1:
        // (value * 1) + (k - k) —— 乘法恒等 + 零消元
        ctor = `(${value} * 1) + (${k} - ${k})`;
        break;
      default:
        // (value ^ 2 > -1) and value —— 短路恒真
        ctor = `((${value} * ${value}) > -1) and ${value} or ${value}`;
        break;
    }

    // 【45】类型迷踪分派：三条不同类型路径恢复同一值
    return [
      `do`,
      `  local ${box} = ${ctor}`,
      `  local ${ty} = type(${box})`,
      `  if ${ty} == 'number' then ${target} = ${box}`,
      `  elseif ${ty} == 'string' then ${target} = tonumber(${box}) or ${value}`,
      `  elseif ${ty} == 'table' then ${target} = ${box}[1] or ${value}`,
      `  elseif ${ty} == 'boolean' then ${target} = ${box} and ${value} or ${value}`,
      `  else ${target} = ${value} end`,
      `end`,
    ].join('\n');
  }
}
