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

function isLuaNode(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof (value as Record<string, unknown>).type === 'string'
  );
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
