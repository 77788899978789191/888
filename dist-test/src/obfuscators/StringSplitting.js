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
        // 拆 2-6 段（随机）
        const segCount = ctx.rng.int(2, Math.min(6, Math.max(2, value.length)));
        const cuts = [];
        for (let i = 1; i < segCount; i++) {
            cuts.push(ctx.rng.int(1, value.length - 1));
        }
        cuts.sort((a, b) => a - b);
        // 切段
        const segments = [];
        let prev = 0;
        for (const c of cuts) {
            segments.push(value.slice(prev, c));
            prev = c;
        }
        segments.push(value.slice(prev));
        // 位置打散：段 i 放在随机槽位
        const slots = ctx.rng.shuffle(segments.map((_, i) => i + 1));
        const fields = [];
        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            const slot = slots[i];
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
