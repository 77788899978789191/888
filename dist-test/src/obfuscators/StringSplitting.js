"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringSplittingPlugin = void 0;
const helpers_1 = require("../utils/helpers");
class StringSplittingPlugin {
    name = 'StringSplitting';
    description = '字符串拆分重组 + string.char 编码混淆（子系统 49/50）';
    layers = [3];
    transform(ctx) {
        const intensity = ctx.config.intensity;
        const rate = Math.min(0.15 + intensity * 0.15, 0.9);
        const minLen = 8 - Math.min(intensity, 4); // 强度越高越短的串也拆
        (0, helpers_1.walk)(ctx.ast, (node, parent) => {
            const n = node;
            if (n.type !== 'StringLiteral')
                return;
            // f"str" 语法位不可替换（需字面量）
            const pt = String(parent?.type ?? '');
            if (pt === 'StringCallExpression')
                return;
            const value = typeof n.value === 'string' ? n.value : null;
            if (value === null || value.length < minLen)
                return;
            if (ctx.rng.next() > rate)
                return;
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
    splitString(ctx, node, value) {
        // 拆 2-6 段（随机，上限不超过串长——每段至少 1 字符）
        const segCount = ctx.rng.int(2, Math.max(2, Math.min(6, value.length)));
        // 切点必须严格递增且唯一：若允许重复（如 cuts=[1,1]），
        // 会产生空段 → string.char() 零参调用 → 运行时 key 拼接错误。
        // 从 1..len-1 的位置池中不重复抽取 segCount-1 个。
        const positions = [];
        for (let p = 1; p < value.length; p++)
            positions.push(p);
        ctx.rng.shuffle(positions);
        const cuts = positions.slice(0, segCount - 1).sort((a, b) => a - b);
        // 切段（每段长度 ≥1，由唯一切点保证）
        const segments = [];
        let prev = 0;
        for (const c of cuts) {
            segments.push(value.slice(prev, c));
            prev = c;
        }
        segments.push(value.slice(prev));
        // 关键正确性约束：table.concat 永远按 1..n 顺序读取数组部分，
        // 因此槽位键必须是恒等映射（[i]=seg[i-1]）——任何槽位置换都会
        // 产生乱码串。混淆性来自：随机切点 + 每段随机编码（字面量 /
        // string.char 字节流 / 后续 pass 替换）+ 字段文本顺序打散。
        const fields = [];
        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            const slot = i + 1; // 恒等槽位（语义正确性要求）
            let segNode;
            if (ctx.rng.bool()) {
                // 【子系统 50】string.char 字节流编码段
                const bytes = [];
                for (let b = 0; b < seg.length; b++) {
                    bytes.push((0, helpers_1.createNumericLiteral)(seg.charCodeAt(b) & 0xFF));
                }
                segNode = {
                    type: 'CallExpression',
                    base: {
                        type: 'MemberExpression',
                        indexer: '.',
                        base: (0, helpers_1.createIdentifier)('string'),
                        identifier: (0, helpers_1.createIdentifier)('char'),
                    },
                    arguments: bytes,
                };
            }
            else {
                // 字面量段
                segNode = { type: 'StringLiteral', value: seg, raw: this.quote(seg) };
            }
            fields.push({ key: (0, helpers_1.createNumericLiteral)(slot), value: segNode });
        }
        // 【子系统 49】字段文本顺序打散（键控字段与书写顺序无关，
        // 打散后视觉上仍呈乱序形态，但键保持 1..n 语义）
        ctx.rng.shuffle(fields);
        // 构造 { [slot] = seg, ... } 并包进 table.concat(...)
        const tableCtor = {
            type: 'TableConstructorExpression',
            fields: fields.map(f => ({ type: 'TableKey', key: f.key, value: f.value })),
        };
        // 原位变异节点：StringLiteral → CallExpression(table.concat({...}))
        node.type = 'CallExpression';
        node.base = {
            type: 'MemberExpression',
            indexer: '.',
            base: (0, helpers_1.createIdentifier)('table'),
            identifier: (0, helpers_1.createIdentifier)('concat'),
        };
        node.arguments = [tableCtor];
        delete node.value;
        delete node.raw;
    }
    /** Lua 单引号字面量（含转义） */
    quote(s) {
        let out = "'";
        for (const ch of s) {
            const c = ch.charCodeAt(0);
            if (ch === "'") {
                out += "\\'";
                continue;
            }
            if (ch === '\\') {
                out += '\\\\';
                continue;
            }
            if (c === 10) {
                out += '\\n';
                continue;
            }
            if (c === 13) {
                out += '\\r';
                continue;
            }
            if (c === 9) {
                out += '\\t';
                continue;
            }
            if (c >= 32 && c < 127) {
                out += ch;
                continue;
            }
            out += '\\' + String(c).padStart(3, '0');
        }
        return out + "'";
    }
}
exports.StringSplittingPlugin = StringSplittingPlugin;
