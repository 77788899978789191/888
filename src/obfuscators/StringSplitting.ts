/**
 * Project: Gungnir-Absolute — 字符串拆分重组（StringSplitting）
 *
 * 【子系统 49：字符串拆分重组】
 *  - 敏感字符串拆成 2-6 段，段顺序随机打散后以 `[n]=` 键控
 *    位置重组，运行时 table.concat 连接 —— 拆分方案（段数、
 *    顺序、键控形式）每次构建随机。
 *
 * 【子系统 50：编码混淆】
 *  - 部分段以 string.char(字节...) 形式编码（十进制字节流），
 *  - 部分段保留字面量 —— 多重编码方式随机叠加，解码逻辑
 *    内联在 concat 表达式中，不可单独提取。
 *
 * 注意：StringCallExpression（f"str" 语法位）的参数不可替换。
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import { walk, createNumericLiteral, createIdentifier } from '../utils/helpers';

export class StringSplittingPlugin implements ObfuscationPlugin {
  name = 'StringSplitting';
  description = '字符串拆分重组 + string.char 编码混淆（子系统 49/50）';
  layers = [3];

  transform(ctx: ObfuscationContext): Chunk {
    const intensity = ctx.config.intensity;
    const rate = Math.min(0.15 + intensity * 0.15, 0.9);
    const minLen = 8 - Math.min(intensity, 4); // 强度越高越短的串也拆

    walk(ctx.ast, (node, parent) => {
      const n = node as unknown as Record<string, unknown>;
      if (n.type !== 'StringLiteral') return;

      // f"str" 语法位不可替换（需字面量）
      const pt = String((parent as unknown as Record<string, unknown> | undefined)?.type ?? '');
      if (pt === 'StringCallExpression') return;

      const value = typeof n.value === 'string' ? n.value : null;
      if (value === null || value.length < minLen) return;
      if (ctx.rng.next() > rate) return;

      this.splitString(ctx, n, value);
      ctx.stats.stringsEncrypted++;
    });

    return ctx.ast;
  }

  /**
   * "hello world" (11 字节, 拆 3 段) ⇒
   *   table.concat({ [2] = string.char(119, 111), [1] = "hell",
   *                  [3] = "rld" })
   *
   * 段位置随机打散；约一半段以 string.char 字节流编码【50】。
   */
  private splitString(
    ctx: ObfuscationContext,
    node: Record<string, unknown>,
    value: string,
  ): void {
    // 拆 2-6 段（随机）
    const segCount = ctx.rng.int(2, Math.min(6, Math.max(2, value.length)));
    const cuts: number[] = [];
    for (let i = 1; i < segCount; i++) {
      cuts.push(ctx.rng.int(1, value.length - 1));
    }
    cuts.sort((a, b) => a - b);

    // 切段
    const segments: string[] = [];
    let prev = 0;
    for (const c of cuts) {
      segments.push(value.slice(prev, c));
      prev = c;
    }
    segments.push(value.slice(prev));

    // 位置打散：段 i 放在随机槽位
    const slots = ctx.rng.shuffle(segments.map((_, i) => i + 1));

    const fields: { key: LuaNode; value: LuaNode }[] = [];
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const slot = slots[i];
      let segNode: LuaNode;
      if (ctx.rng.bool()) {
        // 【子系统 50】string.char 字节流编码段
        const bytes: LuaNode[] = [];
        for (let b = 0; b < seg.length; b++) {
          bytes.push(createNumericLiteral(seg.charCodeAt(b) & 0xFF));
        }
        segNode = {
          type: 'CallExpression',
          base: {
            type: 'MemberExpression',
            indexer: '.',
            base: createIdentifier('string'),
            identifier: createIdentifier('char'),
          } as never,
          arguments: bytes,
        } as never;
      } else {
        // 字面量段
        segNode = { type: 'StringLiteral', value: seg, raw: this.quote(seg) } as never;
      }
      fields.push({ key: createNumericLiteral(slot), value: segNode });
    }

    // 构造 { [slot] = seg, ... } 并包进 table.concat(...)
    const tableCtor: LuaNode = {
      type: 'TableConstructorExpression',
      fields: fields.map(f => ({ type: 'TableKey', key: f.key, value: f.value })),
    } as never;

    // 原位变异节点：StringLiteral → CallExpression(table.concat({...}))
    node.type = 'CallExpression';
    node.base = {
      type: 'MemberExpression',
      indexer: '.',
      base: createIdentifier('table'),
      identifier: createIdentifier('concat'),
    } as never;
    node.arguments = [tableCtor];
    delete node.value;
    delete node.raw;
  }

  /** Lua 单引号字面量（含转义） */
  private quote(s: string): string {
    let out = "'";
    for (const ch of s) {
      const c = ch.charCodeAt(0);
      if (ch === "'") { out += "\\'"; continue; }
      if (ch === '\\') { out += '\\\\'; continue; }
      if (c === 10) { out += '\\n'; continue; }
      if (c === 13) { out += '\\r'; continue; }
      if (c === 9) { out += '\\t'; continue; }
      if (c >= 32 && c < 127) { out += ch; continue; }
      out += '\\' + String(c).padStart(3, '0');
    }
    return out + "'";
  }
}
