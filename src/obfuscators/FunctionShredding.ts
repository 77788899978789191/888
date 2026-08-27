/**
 * Project: Gungnir-Absolute — 函数片碎化（FunctionShredding）
 *
 * 【子系统 23：函数片碎化与内联反转】
 *  - 函数体拆为多个微型片段（片段数随强度 8-24），片段经
 *    状态机串联执行（片 ID 派发 + break 跳转）。片段在函数内的
 *    排布顺序随机（与执行顺序解耦）。
 *
 * 【子系统 57：函数融合与反内联分裂】
 *  - 独立的小函数（本地函数声明）融合进同一宿主函数，通过
 *    额外 tag 参数分发（合而不调用者可见）；大函数同轮被拆散，
 *    实现融合与分裂的双向动态平衡。
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import {
  walk, forEachStatementList, generateLuaIdentifier,
  createRawStatement, createIdentifier, createNumericLiteral,
  collectIdentifierNames,
} from '../utils/helpers';
import {
  hoistTopLevelLocals, topLevelLocalsSafeToHoist,
} from '../utils/ScopeHoist';

export class FunctionShreddingPlugin implements ObfuscationPlugin {
  name = 'FunctionShredding';
  description = '函数片碎化（状态机串联）+ 函数融合与反内联分裂（子系统 23/57）';
  layers = [2, 4];

  /** 本插件已生成的 fresh 名（跨块去重，防同名碰撞） */
  private usedFreshNames = new Set<string>();

  transform(ctx: ObfuscationContext): Chunk {
    const intensity = ctx.config.intensity;

    // 【23】函数体 → 片段状态机
    this.shredFunctionBodies(ctx, intensity);

    // 【57】小函数融合
    this.fuseFunctions(ctx, intensity);

    return ctx.ast;
  }

  // ================= 【子系统 23】函数片碎化 =================

  /**
   * function f(a) S1 S2 S3 S4 end →
   *   function f(a)
   *     local __frag = <start>
   *     while true do
   *       if __frag == <id3> then S3 __frag = <id1>   -- 片段物理乱序
   *       elseif __frag == <id1> then S1 __frag = <id2>
   *       elseif __frag == <id2> then S2 __frag = <id4>
   *       elseif __frag == <id4> then S4 break
   *       else break end
   *     end
   *   end
   *
   * 片段数 8-24（强度驱动）；片段 ID 与物理排布随机。
   */
  private shredFunctionBodies(ctx: ObfuscationContext, intensity: number): void {
    const rate = Math.min(0.15 + intensity * 0.08, 0.7);
    const minFrags = 4;
    const maxFrags = Math.min(8 + intensity * 2, 24);

    walk(ctx.ast, (node) => {
      const n = node as unknown as Record<string, unknown>;
      if (n.type !== 'FunctionDeclaration' && n.type !== 'FunctionExpression') return;
      const body = n.body as LuaNode[] | undefined;
      if (!Array.isArray(body) || body.length < minFrags) return;
      // 片段数 = 语句数（每语句一片），太少不值
      if (body.length > maxFrags + 4) return; // 过大函数交由 CFF 处理

      if (ctx.rng.next() > rate) return;

      this.shredBody(ctx, n);
      ctx.stats.blocksFlattened++;
    });
  }

  /**
   * 把函数体语句列表变异为片段状态机。
   *
   * 【作用域安全铁律】片段 = if/elseif 独立分支 = 独立 Lua 作用域。
   * 顶层 `local` 声明若不提升到函数作用域，声明（片段 A）与引用
   * （片段 B）会被拆散——B 中的名字静默退化成全局 nil（间歇性
   * 运行时崩溃根源：pcall(nil) → else 分支 return nil → 上游
   * table.concat(nil) 等连锁崩溃）。提升采用 ScopeHoist 共享的
   * α-改名方案（与 CFF 同源，经战役验证）。
   *
   * 【终结语句后缀铁律】return/break 必须是语句序列的连续后缀。
   * 非后缀出现 = 其后存在不可达死代码；片段化按原顺序执行全部
   * 普通语句后才进终结分支，会"激活"死代码（语义不等价）→ 放弃。
   */
  private shredBody(ctx: ObfuscationContext, fn: Record<string, unknown>): void {
    const body = fn.body as LuaNode[];
    if (body.length < 2) return;

    // 顶层 break 会绑到片段 while 循环而非原循环 → 放弃该函数体
    // （parser 不会产出函数体顶层 break，防御自身/上游插件产物）
    for (const s of body) {
      if (String((s as unknown as Record<string, unknown>).type) === 'BreakStatement') return;
    }

    // 每条语句一片；return 语句必须留在片段末尾（不可跨片移动语义）
    // 纯预检（不修改 AST）：return 之后不得再出现普通语句；
    // 普通语句（提升后成为片段）至少 2 条，否则切片无意义——
    // 必须在提升变异之前判定，避免「已改名未声明」的半成品状态
    let terminatorSeen = false;
    let normalCount = 0;
    for (const s of body) {
      const t = String((s as unknown as Record<string, unknown>).type ?? '');
      if (t === 'ReturnStatement') {
        terminatorSeen = true;
      } else {
        if (terminatorSeen) {
          // return 之后再出现普通语句 = 激活死代码风险 → 放弃
          return;
        }
        normalCount++;
      }
    }
    if (normalCount < 2) return;

    // raw 文本引用了将提升的顶层 local 名 → 无法触及改名 → 放弃
    // （必须在任何 AST 变异之前判定）
    if (!topLevelLocalsSafeToHoist(body)) return;

    // 【作用域安全】顶层 local 提升 + α 改名：片段内只剩赋值语句，
    // 跨片段引用全部绑定到函数作用域的 fresh 名
    const { decl, newBody } = hoistTopLevelLocals(
      ctx, body, this.usedFreshNames, '_hs',
    );

    // 提升后的语句再分流（LocalStatement 已变 AssignmentStatement；
    // ReturnStatement 原样保留；normal 数量与预检一致 ≥ 2，无回退路径）
    const terminators: LuaNode[] = [];
    const normal: LuaNode[] = [];
    for (const s of newBody) {
      const t = String((s as unknown as Record<string, unknown>).type ?? '');
      if (t === 'ReturnStatement') {
        terminators.push(s);
      } else {
        normal.push(s);
      }
    }

    // 片段 ID：大随机数（构建派生）
    const fragIds = normal.map(() => ctx.rng.int(1000, 999999));
    // 物理排布随机
    const order = ctx.rng.shuffle(normal.map((_, i) => i));

    const f = generateLuaIdentifier(ctx.rng, '_fs', 6);
    this.buildShreddedAst(fn, decl, normal, terminators, fragIds, order, f);
  }

  /**
   * AST 版片段状态机构建（正确路径）：
   * local fv1, fv2, ...            -- 提升声明（作用域安全）
   * local __s = id0
   * while true do
   *   if __s == id3 then S3 __s = id1
   *   elseif ...
   *   if __s == nil then TERM... break end
   * end
   */
  private buildShreddedAst(
    fn: Record<string, unknown>,
    decl: LuaNode | null,
    normal: LuaNode[],
    terminators: LuaNode[],
    fragIds: number[],
    order: number[],
    f: string,
  ): void {
    const st = `${f}s`;

    // if 链（物理顺序 = order，执行顺序 = 数组顺序）
    const clauses: { condition: LuaNode; body: LuaNode[] }[] = [];
    for (const physical of order) {
      const exec = physical;
      const id = fragIds[exec];
      const body: LuaNode[] = [normal[exec]];
      // 下一状态
      const next = exec + 1 < normal.length
        ? createNumericLiteral(fragIds[exec + 1])
        : { type: 'NilLiteral' } as LuaNode;
      body.push({
        type: 'AssignmentStatement',
        variables: [createIdentifier(st)],
        init: [next],
      } as unknown as LuaNode);
      clauses.push({
        condition: {
          type: 'BinaryExpression',
          operator: '==',
          left: createIdentifier(st),
          right: createNumericLiteral(id),
        } as unknown as LuaNode,
        body,
      });
    }

    // 终结分支：__s == nil
    const termBody: LuaNode[] = [...terminators];
    if (termBody.length === 0 || String((termBody[termBody.length - 1] as unknown as Record<string, unknown>).type) !== 'ReturnStatement') {
      termBody.push({ type: 'BreakStatement' } as LuaNode);
    }
    clauses.push({
      condition: {
        type: 'BinaryExpression',
        operator: '==',
        left: createIdentifier(st),
        right: { type: 'NilLiteral' } as LuaNode,
      } as unknown as LuaNode,
      body: termBody,
    });

    // while true do <if链> end
    const whileLoop: LuaNode = {
      type: 'WhileStatement',
      condition: { type: 'BooleanLiteral', value: true } as LuaNode,
      body: [
        {
          type: 'IfStatement',
          clauses,
          else_: null,
        } as unknown as LuaNode,
      ],
    } as unknown as LuaNode;

    // 变异函数体：提升声明在最前（函数作用域，全部片段可见）
    const stateDecl: LuaNode = {
      type: 'LocalStatement',
      variables: [createIdentifier(st)],
      init: [createNumericLiteral(fragIds[0])],
    } as unknown as LuaNode;
    fn.body = [...(decl ? [decl] : []), stateDecl, whileLoop];
  }

  // ================= 【子系统 57】函数融合 =================

  /**
   * 同一语句块内的多个本地函数声明融合为一个分发函数：
   *
   * local function a(x) ... end
   * local function b(y) ... end
   *   →
   * local function __fused(tag, ...)
   *   if tag == <idA> then local x = ... ...（a 体）
   *   elseif tag == <idB> then local y = ... ...（b 体）
   *   end
   * end
   * local a = function(...) return __fused(<idA>, ...) end
   * local b = function(...) return __fused(<idB>, ...) end
   *
   * 仅融合简单单参/无参函数（保守正确性）。
   */
  private fuseFunctions(ctx: ObfuscationContext, intensity: number): void {
    const rate = Math.min(0.1 + intensity * 0.05, 0.5);

    forEachStatementList(ctx.ast, (stmts) => {
      // 找连续的 local function 声明组（≥2）
      for (let i = 0; i < stmts.length - 1; i++) {
        const a = stmts[i] as unknown as Record<string, unknown>;
        const b = stmts[i + 1] as unknown as Record<string, unknown>;
        if (a.type !== 'FunctionDeclaration' || a.isLocal !== true) continue;
        if (b.type !== 'FunctionDeclaration' || b.isLocal !== true) continue;
        // 仅融合简单参数（≤2 显式参数、无 ...）
        const paramsA = (a.parameters as LuaNode[] | undefined) ?? [];
        const paramsB = (b.parameters as LuaNode[] | undefined) ?? [];
        const simple = (ps: LuaNode[]): boolean => ps.length <= 2
          && ps.every(p => String((p as unknown as Record<string, unknown>).type) === 'Identifier');
        if (!simple(paramsA) || !simple(paramsB)) continue;
        // 函数体不可过大（避免融合后超限）
        const bodyA = (a.body as LuaNode[] | undefined) ?? [];
        const bodyB = (b.body as LuaNode[] | undefined) ?? [];
        if (bodyA.length > 8 || bodyB.length > 8) continue;

        // 【作用域安全铁律】融合后 nameA/nameB 的声明移到融合函数之后，
        // 体内对这些名字的任何引用（交叉调用 b→a、递归 a→a）都会从
        // upvalue 退化为全局 nil 引用 → 拒绝融合
        const nameA = String((a.identifier as { name?: unknown })?.name ?? '');
        const nameB = String((b.identifier as { name?: unknown })?.name ?? '');
        const refs = new Set<string>();
        for (const s of bodyA) collectIdentifierNames(s, refs);
        for (const s of bodyB) collectIdentifierNames(s, refs);
        if (refs.has(nameA) || refs.has(nameB)) continue;

        if (ctx.rng.next() > rate) continue;

        this.fusePair(ctx, stmts, i, a, b);
        ctx.stats.functionsProxied++;
        break; // 每块一次（避免链式级联复杂化）
      }
    });
  }

  /** 融合相邻两个 local function 声明 */
  private fusePair(
    ctx: ObfuscationContext,
    stmts: LuaNode[],
    i: number,
    a: Record<string, unknown>,
    b: Record<string, unknown>,
  ): void {
    const nameA = String((a.identifier as { name?: unknown })?.name ?? '');
    const nameB = String((b.identifier as { name?: unknown })?.name ?? '');
    if (!nameA || !nameB) return;

    const f = generateLuaIdentifier(ctx.rng, '_fu', 6);
    const tagA = ctx.rng.int(1000, 999999);
    const tagB = ctx.rng.int(1000, 999999);

    const paramsA = (a.parameters as { name?: unknown }[] | undefined) ?? [];
    const paramsB = (b.parameters as { name?: unknown }[] | undefined) ?? [];

    // 分支体：参数从 ... 解包
    const buildBranch = (
      params: { name?: unknown }[],
      fnBody: LuaNode[],
    ): LuaNode[] => {
      const body: LuaNode[] = [];
      if (params.length > 0) {
        body.push(createRawStatement(
          `local ${params.map(p => String(p.name ?? '_')).join(', ')} = ...`,
        ) as LuaNode);
      }
      body.push(...fnBody);
      return body;
    };

    // 融合函数：__fused(tag, ...)
    const fused: LuaNode = {
      type: 'FunctionDeclaration',
      isLocal: true,
      identifier: createIdentifier(f),
      parameters: [
        createIdentifier(`${f}t`),
        { type: 'VarargLiteral', value: '...' } as LuaNode,
      ],
      body: [
        {
          type: 'IfStatement',
          clauses: [
            {
              condition: {
                type: 'BinaryExpression',
                operator: '==',
                left: createIdentifier(`${f}t`),
                right: createNumericLiteral(tagA),
              } as unknown as LuaNode,
              body: buildBranch(paramsA, (a.body as LuaNode[] | undefined) ?? []),
            },
            {
              condition: {
                type: 'BinaryExpression',
                operator: '==',
                left: createIdentifier(`${f}t`),
                right: createNumericLiteral(tagB),
              } as unknown as LuaNode,
              body: buildBranch(paramsB, (b.body as LuaNode[] | undefined) ?? []),
            },
          ],
          else_: null,
        } as unknown as LuaNode,
      ],
    } as unknown as LuaNode;

    // 替换原两条声明为：fused + 两个薄分发器
    const thinA: LuaNode = {
      type: 'LocalStatement',
      variables: [createIdentifier(nameA)],
      init: [{
        type: 'FunctionExpression',
        identifier: null,
        isLocal: false,
        parameters: [{ type: 'VarargLiteral', value: '...' } as LuaNode],
        body: [{
          type: 'ReturnStatement',
          arguments: [{
            type: 'CallExpression',
            base: createIdentifier(f),
            arguments: [
              createNumericLiteral(tagA),
              { type: 'VarargLiteral', value: '...' } as LuaNode,
            ],
          } as unknown as LuaNode],
        } as unknown as LuaNode],
      } as unknown as LuaNode],
    } as unknown as LuaNode;

    const thinB: LuaNode = {
      type: 'LocalStatement',
      variables: [createIdentifier(nameB)],
      init: [{
        type: 'FunctionExpression',
        identifier: null,
        isLocal: false,
        parameters: [{ type: 'VarargLiteral', value: '...' } as LuaNode],
        body: [{
          type: 'ReturnStatement',
          arguments: [{
            type: 'CallExpression',
            base: createIdentifier(f),
            arguments: [
              createNumericLiteral(tagB),
              { type: 'VarargLiteral', value: '...' } as LuaNode,
            ],
          } as unknown as LuaNode],
        } as unknown as LuaNode],
      } as unknown as LuaNode],
    } as unknown as LuaNode;

    stmts.splice(i, 2, fused, thinA, thinB);
  }
}
