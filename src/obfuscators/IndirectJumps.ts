/**
 * Project: Gungnir-Absolute — 间接跳转与反解析（IndirectJumps）
 *
 * 【子系统 18：间接跳转表】
 *  - 后处理控制流扁平化（CFF）产物：把 `__state == N` 的直接比较
 *    改写为 `__JT[__state] == scramble(N)`——跳转目标存入随机
 *    生成的哈希表，经动态索引间接跳转。表内容构建期打乱，
 *    每次构建不同。
 *
 * 【子系统 19：基本块指令乱序】
 *  - 保守依赖分析：仅重排「写入集互不相交、且初始化表达式
 *    不引用组内任何被写名字」的连续 local 语句组 —— 可证明
 *    顺序无关，乱序后语义逐点等价。
 *
 * 【子系统 32：反编译器边界异常】
 *  - 注入深嵌套括号（200+ 层）与巨型混合键表构造器：
 *    Unluac 类工具递归下降解析时栈溢出或状态机异常。
 *
 * 【子系统 33：语法级反解析陷阱】
 *  - 利用 Lua 5.1 与 Luau 解析差异：连续分号、空 do-end、
 *    冗余括号组合 —— AST 构建器在 5.1/Luau 方言切换时歧义。
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import {
  forEachStatementList, createIdentifier, createNumericLiteral,
  generateLuaIdentifier, collectIdentifierNames,
} from '../utils/helpers';

export class IndirectJumpsPlugin implements ObfuscationPlugin {
  name = 'IndirectJumps';
  description = 'CFF 跳转表加密 + 独立语句组乱序 + 反编译器边界异常 + 语法级反解析陷阱（子系统 18/19/32/33）';
  layers = [2, 5];

  transform(ctx: ObfuscationContext): Chunk {
    const intensity = ctx.config.intensity;

    // ===== 【子系统 18】CFF 派发循环 → 间接跳转表 =====
    this.rewriteCffDispatch(ctx, intensity);

    // ===== 【子系统 19】独立 local 语句组乱序 =====
    this.shuffleIndependentLocals(ctx, intensity);

    // ===== 【子系统 32/33】反编译器/反解析噪声 =====
    if (intensity >= 3) {
      this.injectParserTraps(ctx);
    }

    return ctx.ast;
  }

  /**
   * 【子系统 18】检测 CFF 输出签名并改写为间接跳转表：
   *
   *   local __s = 3
   *   while true do
   *     if __s == 3 then ... __s = 7
   *     elseif __s == 7 then ... __s = 1 ... end
   *
   *     ⇒
   *   local __s = 3
   *   local __JT = {}
   *   __JT[3] = 517   -- 打乱后的比较值（构建期随机）
   *   __JT[7] = 233
   *   ...
   *   while true do
   *     if __JT[__s] == 517 then ... __s = 7
   *     elseif __JT[__s] == 233 then ... __s = 1 ... end
   */
  private rewriteCffDispatch(ctx: ObfuscationContext, intensity: number): void {
    const rate = Math.min(0.3 + intensity * 0.14, 0.95);
    const jtName = generateLuaIdentifier(ctx.rng, '_jt', 6);

    forEachStatementList(ctx.ast, (stmts) => {
      // CFF 签名：DoStatement{ body: [LocalStatement, WhileStatement] }
      for (let i = 0; i < stmts.length; i++) {
        const n = stmts[i] as unknown as Record<string, unknown>;
        if (n.type !== 'DoStatement' || !Array.isArray(n.body)) continue;
        const inner = n.body as LuaNode[];
        if (inner.length !== 2) continue;
        const local = inner[0] as unknown as Record<string, unknown>;
        const loop = inner[1] as unknown as Record<string, unknown>;
        if (local.type !== 'LocalStatement' || loop.type !== 'WhileStatement') continue;
        if (ctx.rng.next() > rate) continue;

        const stateVar = (local.variables as { name?: unknown }[] | undefined)?.[0];
        if (!stateVar || typeof stateVar.name !== 'string') continue;
        const stateName = String(stateVar.name);

        // while true do if ... end end
        const cond = loop.condition as Record<string, unknown> | undefined;
        if (!cond || cond.type !== 'BooleanLiteral' || cond.value !== true) continue;
        const loopBody = loop.body as LuaNode[] | undefined;
        if (!Array.isArray(loopBody) || loopBody.length !== 1) continue;
        const ifNode = loopBody[0] as unknown as Record<string, unknown>;
        if (ifNode.type !== 'IfStatement') continue;
        const clauses = ifNode.clauses as
          { condition: Record<string, unknown>; body: LuaNode[] }[] | undefined;
        if (!Array.isArray(clauses) || clauses.length < 2) continue;

        // 全部 clause 条件必须是 `stateVar == NumericLiteral`
        let allMatch = true;
        for (const clause of clauses) {
          const c = clause.condition;
          if (!c || c.type !== 'BinaryExpression' || c.operator !== '==') { allMatch = false; break; }
          const left = c.left as Record<string, unknown> | undefined;
          const right = c.right as Record<string, unknown> | undefined;
          if (!left || left.type !== 'Identifier' || left.name !== stateName) { allMatch = false; break; }
          if (!right || right.type !== 'NumericLiteral') { allMatch = false; break; }
        }
        if (!allMatch) continue;

        // 改写条件 + 收集跳转表条目（每个站点独立条目集）
        const entries: string[] = [];
        for (const clause of clauses) {
          const c = clause.condition as Record<string, unknown>;
          const origId = (c.right as { value: number }).value;
          const scrambled = ctx.rng.int(100000, 99999999);
          entries.push(`${jtName}[${origId}] = ${scrambled}`);
          c.left = {
            type: 'IndexExpression',
            base: createIdentifier(jtName),
            index: createIdentifier(stateName),
          } as never;
          c.right = createNumericLiteral(scrambled);
        }

        // 跳转表构建注入到 local 声明之后
        const tableCode = `local ${jtName} = {}\n${entries.join('\n')}`;
        (n.body as LuaNode[]).splice(1, 0, { type: 'GungnirRawStatement', code: tableCode } as never);
      }
    });
  }

  /**
   * 【子系统 19】独立 local 语句组乱序。
   * 安全条件（可证明顺序无关）：
   *  1. 组内每条语句的写入名（被声明变量）在组内全局唯一；
   *  2. 任何语句的初始化表达式引用的名字 ∩ 组内任何写入名 = ∅。
   */
  private shuffleIndependentLocals(ctx: ObfuscationContext, intensity: number): void {
    const rate = Math.min(0.2 + intensity * 0.15, 0.8);
    let shuffled = 0;

    forEachStatementList(ctx.ast, (stmts) => {
      if (ctx.rng.next() > rate) return;

      // 找出连续 LocalStatement 的最大游程，然后做双向依赖检查
      const groups: { start: number; end: number; stmts: LuaNode[] }[] = [];
      let i = 0;
      while (i < stmts.length) {
        const n = stmts[i] as unknown as Record<string, unknown>;
        if (n.type !== 'LocalStatement') { i++; continue; }

        // 收集连续游程（初始化含函数调用的语句终止游程：调用副作用顺序不可乱）
        let j = i;
        const run: LuaNode[] = [];
        while (j < stmts.length) {
          const m = stmts[j] as unknown as Record<string, unknown>;
          if (m.type !== 'LocalStatement') break;
          const vars = m.variables as { name?: unknown }[] | undefined;
          if (!vars || vars.length === 0) break;
          if (initHasCall(m)) break;
          run.push(stmts[j]);
          j++;
        }
        if (run.length >= 2) {
          // 双向依赖分析：任意两条语句 i≠j，
          // reads_i ∩ writes_j = ∅（乱序后任意相对顺序都安全）
          const writes: string[][] = run.map((s, k) =>
            ((s as unknown as Record<string, unknown>).variables as { name?: unknown }[])
              .map(v => String(v?.name ?? `__w${k}`)));
          const reads: Set<string>[] = run.map(s => {
            const inits = (s as unknown as Record<string, unknown>).init as LuaNode[] | undefined;
            if (!inits || inits.length === 0) return new Set<string>();
            return collectIdentifierNames({ type: 'DoStatement', body: [...inits] } as never);
          });
          // 写入名必须两两不相交（含同语句内部）
          let ok = true;
          const seen = new Set<string>();
          for (const w of writes) {
            for (const name of w) {
              if (seen.has(name)) { ok = false; break; }
              seen.add(name);
            }
            if (!ok) break;
          }
          if (ok) {
            for (let a = 0; a < run.length && ok; a++) {
              for (let b = 0; b < run.length && ok; b++) {
                if (a === b) continue;
                for (const w of writes[b]) {
                  if (reads[a].has(w)) { ok = false; break; }
                }
              }
            }
          }
          if (ok) groups.push({ start: i, end: j, stmts: run });
        }
        i = j > i ? j : i + 1;
      }

      // 倒序乱序（索引稳定）
      for (const g of groups.reverse()) {
        const order = ctx.rng.shuffle(g.stmts.map((_, k) => k));
        const reordered = order.map(k => g.stmts[k]);
        stmts.splice(g.start, g.end - g.start, ...reordered);
        shuffled++;
      }
    });

    if (shuffled > 0) {
      ctx.stats.blocksFlattened += shuffled;
    }
  }

  /**
   * 【子系统 32/33】注入反编译器/反解析噪声。
   * - 深嵌套括号（32 层，PUC-Lua LUAI_MAXCCALLS 安全界内）：
   *   Unluac 等递归下降工具的深度异常点。
   * - 巨型混合键表：解析器状态机异常。
   * - 连续分号 + 空 do-end + 冗余括号：5.1/Luau 方言歧义。
   */
  private injectParserTraps(ctx: ObfuscationContext): void {
    const sink = generateLuaIdentifier(ctx.rng, '_pt', 6);

    // 深嵌套括号 —— 反编译器边界异常（深度保持在 PUC-Lua 语法层栈界内）
    const depth = 24 + ctx.rng.int(0, 8);
    const parens = '('.repeat(depth) + '0' + ')'.repeat(depth);
    let code = `local ${sink} = ${parens}\n`;

    // 巨型混合键表构造器（200 个混合键字段）
    const fields: string[] = [];
    for (let i = 0; i < 200; i++) {
      const k = ctx.rng.int(0, 9999);
      if (i % 3 === 0) fields.push(`[${k}] = ${ctx.rng.int(1, 999)}`);
      else if (i % 3 === 1) fields.push(`[${ctx.rng.int(0, 9999)}] = ${ctx.rng.int(1, 999)}`);
      else fields.push(`${ctx.rng.int(1, 999)}`);
    }
    code += `local ${sink}t = {${fields.join(', ')}}\n`;

    // 空 do-end 链 + 冗余括号 + 尾分号 —— 语法级反解析（Luau/5.1 方言差异点）
    // 注：连续裸分号在 luaparse 中非法，改用等价的 do-end 链 + 单尾分号
    code += 'do end do end do end do end do end\n';
    code += `local ${sink}2 = ((((1)))) + (((2)));\n`;
    code += `local ${sink}3 = (function() return (function() return ((3)) end)() end)();\n`;

    (ctx.ast.body as unknown as LuaNode[]).push(
      { type: 'GungnirRawStatement', code } as never,
    );
  }
}

/** 初始化表达式是否含函数调用（副作用顺序不可乱） */
function initHasCall(stmt: Record<string, unknown>): boolean {
  const inits = stmt.init as LuaNode[] | undefined;
  if (!inits || inits.length === 0) return false;
  let found = false;
  const scan = (node: unknown): void => {
    if (found || !node || typeof node !== 'object') return;
    const n = node as Record<string, unknown>;
    const t = String(n.type ?? '');
    if (t === 'CallExpression' || t === 'TableCallExpression' || t === 'StringCallExpression') {
      found = true;
      return;
    }
    for (const key of Object.keys(n)) {
      if (key === 'type' || key === 'loc' || key === 'range') continue;
      const v = n[key];
      if (Array.isArray(v)) {
        for (const item of v) if (item && typeof item === 'object') scan(item);
      } else if (v && typeof v === 'object') {
        scan(v);
      }
    }
  };
  for (const init of inits) scan(init);
  return found;
}
