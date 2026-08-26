/**
 * Project: Gungnir - Utility Functions
 * RNG, string helpers, AST utilities
 */
import {
  LuaNode, Identifier, NumericLiteral, StringLiteral,
  BinaryExpression, CallExpression, MemberExpression,
  TableConstructorExpression, RngState
} from '../core/types';

// ============ Seeded RNG ============

export function createRng(seed: number): RngState {
  let state = seed >>> 0;
  if (state === 0) state = 0x9E3779B9;

  const next = (): number => {
    // xorshift128
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0xFFFFFFFF;
  };

  const int = (min: number, max: number): number => {
    return Math.floor(next() * (max - min + 1)) + min;
  };

  const pick = <T>(arr: T[]): T => {
    return arr[int(0, arr.length - 1)];
  };

  const shuffle = <T>(arr: T[]): T[] => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = int(0, i);
      const tmp = result[i];
      result[i] = result[j];
      result[j] = tmp;
    }
    return result;
  };

  const bool = (): boolean => next() < 0.5;

  return { seed, next, int, pick, shuffle, bool };
}

// ============ AST Node Builders ============

export function createIdentifier(name: string): Identifier {
  return { type: 'Identifier', name };
}

export function createNumericLiteral(value: number): NumericLiteral {
  return { type: 'NumericLiteral', value, raw: String(value) };
}

export function createStringLiteral(value: string): StringLiteral {
  return { type: 'StringLiteral', value, raw: `"${value}"` };
}

export function createBooleanLiteral(value: boolean) {
  return { type: 'BooleanLiteral', value };
}

export function createNilLiteral() {
  return { type: 'NilLiteral' };
}

export function createBinaryExpression(
  operator: string, left: LuaNode, right: LuaNode
): BinaryExpression {
  return { type: 'BinaryExpression', operator, left, right };
}

export function createCallExpression(
  base: LuaNode, args: LuaNode[]
): CallExpression {
  return { type: 'CallExpression', base, arguments: args };
}

export function createMemberExpression(
  base: LuaNode, indexer: '.' | ':', identifier: string
): MemberExpression {
  return {
    type: 'MemberExpression',
    indexer,
    identifier: createIdentifier(identifier),
    base,
  };
}

export function createTableConstructor(fields: {
  key: LuaNode | null; value: LuaNode;
}[]): TableConstructorExpression {
  return {
    type: 'TableConstructorExpression',
    fields: fields.map(f => ({
      type: f.key ? 'TableKey' : 'TableValue',
      key: f.key,
      value: f.value,
    })) as never,
  } as TableConstructorExpression;
}

// ============ AST Traversal ============

export function walk(
  node: LuaNode,
  visitor: (node: LuaNode, parent: LuaNode | null) => void,
  parent: LuaNode | null = null
): void {
  visitor(node, parent);
  const children = getChildren(node);
  for (const child of children) {
    walk(child, visitor, node);
  }
}

export function getChildren(node: LuaNode): LuaNode[] {
  const children: LuaNode[] = [];
  const n = node as unknown as Record<string, unknown>;

  for (const key of Object.keys(n)) {
    if (key === 'type' || key === 'range' || key === 'loc') continue;
    const value = n[key];

    if (isLuaNode(value)) {
      children.push(value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (isLuaNode(item)) {
          children.push(item);
        }
      }
    }
  }

  return children;
}

function isLuaNode(value: unknown): value is LuaNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof (value as Record<string, unknown>).type === 'string'
  );
}

// ============ 语句列表遍历（容器感知）============

/**
 * 遍历 AST 中所有「语句列表」容器（Chunk.body / DoStatement.body /
 * 函数体 body / 循环体 body / IfStatement.clauses[i].body / else_ 等）。
 * 回调可直接原位修改数组（替换/插入/删除语句）。
 *
 * 这是一切「按语句块变换」的插件的基础设施。
 */
export function forEachStatementList(
  node: LuaNode,
  visit: (stmts: LuaNode[], owner: Record<string, unknown>) => void,
): void {
  const n = node as unknown as Record<string, unknown>;
  const t = String(n.type ?? '');

  // 当前节点自身持有的语句列表
  if (t === 'Chunk' || t === 'DoStatement') {
    if (Array.isArray(n.body)) visit(n.body as LuaNode[], n);
  } else if (t === 'WhileStatement' || t === 'ForNumericStatement'
    || t === 'ForGenericStatement' || t === 'RepeatStatement') {
    if (Array.isArray(n.body)) visit(n.body as LuaNode[], n);
  } else if (t === 'FunctionDeclaration' || t === 'FunctionExpression') {
    if (Array.isArray(n.body)) visit(n.body as LuaNode[], n);
  } else if (t === 'IfStatement') {
    const clauses = n.clauses as { body: LuaNode[] }[] | undefined;
    if (Array.isArray(clauses)) {
      for (const clause of clauses) {
        if (Array.isArray(clause?.body)) visit(clause.body, clause as unknown as Record<string, unknown>);
      }
    }
    if (Array.isArray(n.else_)) visit(n.else_ as LuaNode[], n);
  }

  // 递归子节点
  for (const child of getChildren(node)) {
    forEachStatementList(child, visit);
  }
}

/** 创建原样输出 Lua 代码的原始语句节点（LuaPrinter 直通打印） */
export function createRawStatement(code: string): LuaNode {
  return { type: 'GungnirRawStatement', code } as unknown as LuaNode;
}

/** 收集语句内出现的所有标识符名（读写都算，用于依赖分析） */
export function collectIdentifierNames(node: LuaNode, into?: Set<string>): Set<string> {
  const set = into ?? new Set<string>();
  walk(node, (n) => {
    const nn = n as unknown as Record<string, unknown>;
    if (nn.type === 'Identifier' && typeof nn.name === 'string') {
      set.add(String(nn.name));
    }
  });
  return set;
}

/** 语句写入（声明/赋值）的变量名集合 */
export function collectWrittenNames(stmt: LuaNode): Set<string> {
  const out = new Set<string>();
  const n = stmt as unknown as Record<string, unknown>;
  if (n.type === 'LocalStatement' && Array.isArray(n.variables)) {
    for (const v of n.variables as { name?: unknown }[]) {
      if (typeof v?.name === 'string') out.add(v.name);
    }
  } else if (n.type === 'AssignmentStatement' && Array.isArray(n.variables)) {
    for (const v of n.variables as Record<string, unknown>[]) {
      if (v?.type === 'Identifier' && typeof v.name === 'string') out.add(String(v.name));
    }
    // 对 table.field / t[i] 的写入视为读 t（保守）
  } else if (n.type === 'FunctionDeclaration') {
    const id = n.identifier as { name?: unknown } | null;
    if (id && typeof id.name === 'string') out.add(id.name);
  } else if (n.type === 'CallStatement') {
    const base = (n.expression as Record<string, unknown> | undefined)?.base as Record<string, unknown> | undefined;
    // g = f() 形式不在这里；纯调用不写变量
    if (base?.type === 'MemberExpression') {
      // t.f() 视为读 t
    }
  }
  return out;
}

// ============ String Utilities ============

export function stringToBytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i) & 0xFF);
  }
  return bytes;
}

export function bytesToString(bytes: number[]): string {
  return bytes.map(b => String.fromCharCode(b)).join('');
}

export function xorBytes(data: number[], key: number[]): number[] {
  return data.map((byte, i) => byte ^ key[i % key.length]);
}

export function toLuaByteTable(bytes: number[]): string {
  return '{' + bytes.join(',') + '}';
}

export function generateLuaIdentifier(
  rng: RngState, prefix: string, length: number = 8
): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789';
  let result = prefix;
  for (let i = 0; i < length; i++) {
    result += chars[rng.int(0, chars.length - 1)];
  }
  return result;
}

// ============ Logger ============

export class Logger {
  constructor(private verbose: boolean) {}

  info(msg: string): void {
    if (this.verbose) console.log(`[INFO] ${msg}`);
  }

  warn(msg: string): void {
    console.warn(`[WARN] ${msg}`);
  }

  error(msg: string): void {
    console.error(`[ERROR] ${msg}`);
  }

  debug(msg: string): void {
    if (this.verbose) console.log(`[DEBUG] ${msg}`);
  }
}
