/**
 * Project: Gungnir-Absolute — 作用域提升共享工具（ScopeHoist）
 *
 * 【作用域安全核心，被 CFF / FunctionShredding 共用】
 *
 * 背景：控制流扁平化 / 函数片碎化都会把顺序语句拆进多个
 * if/elseif 分支（各自独立 Lua 作用域）。若不处理顶层
 * `local` 声明，声明（分支 A）与引用（分支 B）会被拆散——
 * B 中的名字静默退化成全局 nil（间歇性运行时崩溃根源：
 * "attempt to call/concat/arithmetic a nil value"）。
 *
 * 解法（CFF 战役验证过的 α-改名提升）：
 *  - 块内所有顶层局部声明提升为片段循环前的一次 `local`（全新
 *    不冲突名），原声明处改为赋值（`local a,b = f()` → `fa,fb = f()`
 *    完整保留多值调整语义），声明点之后的引用统一 α 改名到新名。
 *    引用先于声明点的保持原名（继续绑定外层作用域，与 Lua 语义一致）。
 *  - 同名遮蔽（重声明 / 嵌套函数 / 循环变量 / 参数）经统一改名后
 *    遮蔽结构同构保持，语义严格等价。
 *
 * raw 文本安全护栏：
 *  - GungnirRawStatement / GungnirRawExpression 的代码文本是
 *    不透明字符串，AST 改名无法触及。若其文本引用了任何将被提升
 *    的顶层 local 名（token 级匹配），提升后 raw 仍读旧名 → 全局
 *    nil。此类块直接判定「不安全」，调用方应放弃变换（保守跳过）。
 */
import {
  ObfuscationContext, LuaNode,
} from '../core/types';
import {
  walk, createIdentifier, createNilLiteral, collectIdentifierNames,
} from './helpers';

interface HoistedDecl {
  name: string;
  fresh: string;
}

export interface ScopeHoistResult {
  /** 提升声明（`local fv1, fv2, ...`）；无顶层 local 时为 null */
  decl: LuaNode | null;
  /** 改名后的语句序列（`local v = e` 已变为 `fv = e` 赋值） */
  newBody: LuaNode[];
}

/** 收集语句列表顶层的 local 声明名（LocalStatement 变量 + local function 名） */
function collectTopLevelLocalNames(body: LuaNode[]): Set<string> {
  const names = new Set<string>();
  for (const stmt of body) {
    const n = stmt as unknown as Record<string, unknown>;
    if (n.type === 'LocalStatement' && Array.isArray(n.variables)) {
      for (const v of n.variables as { name?: unknown }[]) {
        if (typeof v?.name === 'string') names.add(v.name);
      }
    } else if (
      (n.type === 'LocalFunctionStatement'
        || (n.type === 'FunctionDeclaration' && n.isLocal === true))
      && n.identifier
      && typeof (n.identifier as { name?: unknown }).name === 'string'
    ) {
      names.add(String((n.identifier as { name: string }).name));
    }
  }
  return names;
}

/**
 * 顶层 local 提升是否安全：
 * body 内任何 raw 节点的文本 token 都不得引用将被提升的名字。
 * （raw 内部自声明的 local 名即使撞名也会遮蔽外层——但 token
 *   匹配无法区分遮蔽与真引用，保守判不安全。）
 */
export function topLevelLocalsSafeToHoist(body: LuaNode[]): boolean {
  const names = collectTopLevelLocalNames(body);
  if (names.size === 0) return true;

  let safe = true;
  walk(body as unknown as LuaNode, (n) => {
    const nn = n as unknown as Record<string, unknown>;
    if (nn.type !== 'GungnirRawStatement' && nn.type !== 'GungnirRawExpression') return;
    const code = String(nn.code ?? '');
    if (!code) return;
    // Lua 标识符字符集切 token（词法级匹配，避免子串误报）
    const tokens = code.split(/[^A-Za-z0-9_]+/);
    for (const t of tokens) {
      if (names.has(t)) {
        safe = false;
        return;
      }
    }
  });
  return safe;
}

/**
 * 局部提升 + α 改名（作用域等价核心）。
 *
 * `local v1..vN = e1..eM` → `fv1..fvN = e1..eM`
 *  - init 先用「改名前映射」改名（`local x = x` 的右值 x 指外层 x）
 *  - local function f（f 体内可见，支持递归）：先激活再整树改名
 *  - 声明点之后的语句统一把活跃名替换为 fresh 名（嵌套函数/循环
 *    变量/参数的遮蔽结构经统一改名后同构保持）
 *
 * @param usedNames 调用方维护的「已用 fresh 名」集合（跨块去重），
 *                  会向其中追加本次生成的新名
 * @param prefix    fresh 名前缀（各插件用不同前缀便于溯源）
 */
export function hoistTopLevelLocals(
  ctx: ObfuscationContext,
  body: LuaNode[],
  usedNames: Set<string>,
  prefix: string,
): ScopeHoistResult {
  // 收集顶层声明（LocalStatement 变量 + local function 名）
  const decls: HoistedDecl[] = [];
  for (const stmt of body) {
    const n = stmt as unknown as Record<string, unknown>;
    if (n.type === 'LocalStatement' && Array.isArray(n.variables)) {
      for (const v of n.variables as { name?: unknown }[]) {
        if (typeof v?.name === 'string') decls.push({ name: v.name, fresh: '' });
      }
    } else if (
      (n.type === 'LocalFunctionStatement'
        || (n.type === 'FunctionDeclaration' && n.isLocal === true))
      && n.identifier
      && typeof (n.identifier as { name?: unknown }).name === 'string'
    ) {
      decls.push({ name: String((n.identifier as { name: string }).name), fresh: '' });
    }
  }

  if (decls.length === 0) {
    return { decl: null, newBody: body };
  }

  // fresh 名：全 chunk 标识符 + 调用方历史 去重
  const used = collectIdentifierNames(ctx.ast as unknown as LuaNode);
  for (const u of usedNames) used.add(u);
  for (const d of decls) {
    let fresh = prefix + ctx.rng.int(100000, 999999).toString(36);
    while (used.has(fresh)) fresh = prefix + ctx.rng.int(100000, 999999).toString(36);
    used.add(fresh);
    usedNames.add(fresh);
    d.fresh = fresh;
  }

  // 同名重声明队列（每个声明位点领取自己的 fresh 名）
  const declQueue = new Map<string, HoistedDecl[]>();
  for (const d of decls) {
    const q = declQueue.get(d.name) ?? [];
    q.push(d);
    declQueue.set(d.name, q);
  }

  const active = new Map<string, string>();
  const newBody: LuaNode[] = [];

  for (const stmt of body) {
    const n = stmt as unknown as Record<string, unknown>;

    if (n.type === 'LocalStatement') {
      const vars = n.variables as { name: string }[];
      const inits = (n.init as LuaNode[] | undefined) ?? [];

      // init 引用声明前绑定 → 用旧映射改名（`local x = x` 右值=外层 x）
      for (const e of inits) renameActiveIdentifiers(e, active);

      // 激活本语句声明的新名
      const freshVars: LuaNode[] = [];
      for (const v of vars) {
        const q = declQueue.get(v.name);
        const d = q ? q.shift() : undefined;
        if (!d) continue; // 理论不可达（decls 已全量收集）
        active.set(v.name, d.fresh);
        freshVars.push(createIdentifier(d.fresh));
      }

      // local v... = init...  →  fv... = init...（多值调整语义一致）
      newBody.push({
        type: 'AssignmentStatement',
        variables: freshVars,
        init: inits.length > 0 ? inits : [createNilLiteral()],
      } as never);
    } else if (
      n.type === 'LocalFunctionStatement'
      || (n.type === 'FunctionDeclaration' && n.isLocal === true)
    ) {
      const name = String((n.identifier as { name: string }).name);
      const q = declQueue.get(name);
      const d = q ? q.shift() : undefined;
      if (!d) {
        renameActiveIdentifiers(stmt as unknown as LuaNode, active);
        newBody.push(stmt);
        continue;
      }
      // local function f：f 在自身体内可见（递归）→ 先激活再整树改名
      active.set(name, d.fresh);
      renameActiveIdentifiers(stmt as unknown as LuaNode, active);

      // → fv = function(params) body end
      newBody.push({
        type: 'AssignmentStatement',
        variables: [createIdentifier(d.fresh)] as never,
        init: [{
          type: 'FunctionExpression',
          parameters: n.parameters,
          body: n.body,
        }] as never,
      } as never);
    } else {
      renameActiveIdentifiers(stmt as unknown as LuaNode, active);
      newBody.push(stmt);
    }
  }

  // 提升声明：local fv1, fv2, ...（无初值 = nil，与 local 声明语义一致）
  const decl: LuaNode = {
    type: 'LocalStatement',
    variables: decls.map(d => createIdentifier(d.fresh)) as never,
    init: [] as never,
  } as never;

  return { decl, newBody };
}

/**
 * 区域内活跃名统一改名。
 * 跳过 MemberExpression 的字段名位与 TableKeyString 键位（非变量引用）。
 * 遮蔽结构（嵌套 local/参数/循环变量）经统一改名后同构保持。
 */
export function renameActiveIdentifiers(node: LuaNode, active: Map<string, string>): void {
  if (active.size === 0) return;
  walk(node, (n, parent) => {
    const nn = n as unknown as Record<string, unknown>;
    if (nn.type !== 'Identifier') return;
    const fresh = active.get(String(nn.name));
    if (!fresh) return;
    const p = parent as unknown as Record<string, unknown> | null;
    if (p && p.type === 'MemberExpression' && p.identifier === n) return;
    if (p && p.type === 'TableKeyString' && p.key === n) return;
    nn.name = fresh;
  });
}
