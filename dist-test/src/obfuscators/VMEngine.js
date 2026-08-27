"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VMEnginePlugin = void 0;
const SeedEngine_1 = require("../core/SeedEngine");
const VMCodec_1 = require("../core/VMCodec");
const PolymorphicRuntime_1 = require("../core/PolymorphicRuntime");
class VMEnginePlugin {
    name = 'VMEngine';
    description = 'Polymorphic VM: encrypts all constants into GX-Cipher pool, emits dual-interpreter runtime (subsystems 1-13, 26, 60-89)';
    layers = [1];
    /** 本构建的运行时发射结果（供验证器/报告使用） */
    emission = null;
    seedEngine = null;
    /** 常量池明细（供验证器做类型冲突检测【子系统 15c】） */
    pool = [];
    transform(ctx) {
        const intensity = Math.min(5, Math.max(1, Math.round(ctx.config.intensity / 2)));
        // ===== 阶段 1：收集常量池 =====
        const pool = [];
        const poolIndex = new Map();
        const minNumber = intensity >= 3 ? -2 : 2; // 小整数阈值（控制流用的 0/1 保留）
        /** 池条目明文上限（字节）：确保密文不跨 1KB 分页【子系统 87/34】 */
        const CHUNK = 1024;
        /** 字符串按 1KB 分块入池（每块独立加密），返回全部块 id */
        const internString = (value) => {
            const key = 'S:' + value;
            const existing = poolIndex.get(key);
            if (existing !== undefined)
                return existing;
            // 【字节忠实铁律】luaparse 'pseudo-latin1' 产出的 AST 字符串值：
            // 每个 UTF-16 code unit = 源码中的一个字节（0-255）。若用 'utf-8'
            // 编码，≥0x80 的 code unit 会被编码成 2 字节 → 字节串膨胀 →
            // 解密后的 Lua 字符串长度错误（#s 改变）。
            // 'latin1' 编码：code unit ↔ 字节 严格一一对应，字节级往返无损。
            const bytes = Array.from(Buffer.from(value, 'latin1'));
            const ids = [];
            for (let off = 0; off < bytes.length; off += CHUNK) {
                const chunk = bytes.slice(off, off + CHUNK);
                const id = pool.length;
                pool.push({
                    id,
                    plaintext: chunk,
                    isNumber: false,
                    original: chunk.length === bytes.length ? value : `chunk#${off / CHUNK}`,
                });
                ids.push(id);
            }
            poolIndex.set(key, ids);
            return ids;
        };
        const internNumber = (value) => {
            const canonical = String(value);
            const key = 'N:' + canonical;
            const existing = poolIndex.get(key);
            if (existing !== undefined)
                return existing[0];
            const id = pool.length;
            pool.push({
                id,
                plaintext: Array.from(Buffer.from(canonical, 'ascii')),
                isNumber: true,
                original: canonical,
            });
            poolIndex.set(key, [id]);
            return id;
        };
        // 统一的数字跳过规则（收集与替换两遍必须完全一致）
        const skipNumber = (value) => {
            if (!Number.isInteger(value))
                return false;
            if (value >= -1 && value <= 1)
                return true; // 0/1 永远保留（控制流）
            if (intensity < 4 && value >= minNumber && value <= 10)
                return true;
            return false;
        };
        // 第一遍遍历：收集（不修改）
        // parent 用于识别不可替换位置（StringCallExpression.argument）
        const seen = new Set();
        const collect = (node, parentType) => {
            if (!node || typeof node !== 'object')
                return;
            if (seen.has(node))
                return;
            seen.add(node);
            const n = node;
            const t = String(n.type ?? '');
            if (t === 'StringLiteral') {
                const value = String(n.value);
                // StringCallExpression 的 argument 是语法位置（f"str"），不可替换
                if (value.length > 0 && parentType !== 'StringCallExpression')
                    internString(value);
            }
            else if (t === 'NumericLiteral') {
                const value = Number(n.value);
                if (!Number.isFinite(value))
                    return;
                if (!skipNumber(value))
                    void internNumber(value);
            }
            for (const key of Object.keys(n)) {
                if (key === 'type' || key === 'loc' || key === 'range')
                    continue;
                const v = n[key];
                if (Array.isArray(v)) {
                    for (const item of v)
                        collect(item, t);
                }
                else if (v && typeof v === 'object' && 'type' in v) {
                    collect(v, t);
                }
            }
        };
        collect(ctx.ast, '');
        // ===== 阶段 2：构建种子与布局 =====
        // 【子系统 1】每构建全新 2048 位种子
        const seedEngine = new SeedEngine_1.SeedEngine(String(ctx.config.seed));
        this.seedEngine = seedEngine;
        // 【子系统 5/6】布局随机化
        const layout = (0, VMCodec_1.buildLayout)(seedEngine, intensity);
        // ===== 阶段 3：发射运行时 =====
        const opts = {
            intensity,
            timeBombTtl: 0,
            antiDebugMode: ctx.config.antiDebugMode === 'corrupt' ? 'corrupt' : 'silent',
            coroutineCount: Math.min(200 + intensity * 20, 300),
            builtAt: Date.now(),
        };
        const emission = (0, PolymorphicRuntime_1.emitRuntime)(seedEngine, layout, pool, opts);
        this.emission = emission;
        this.pool = pool;
        ctx.stats.stringsEncrypted += pool.filter(p => !p.isNumber).length;
        ctx.stats.constantsObfuscated += pool.filter(p => p.isNumber).length;
        // ===== 阶段 4：替换常量引用 → K()/KN() 调用 =====
        const K = emission.fetchString;
        const KN = emission.fetchNumber;
        const replaced = this.replaceReferences(ctx, poolIndex, K, KN, minNumber, intensity);
        ctx.stats.nodesProcessed += replaced;
        // ===== 阶段 5：组装输出 =====
        const ast = ctx.ast;
        const body = ast.body;
        // 载荷包裹进 do...end（作用域隔离【子系统 55】）
        const wrapped = { type: 'DoStatement', body };
        const rawPrologue = {
            type: 'GungnirRawStatement',
            code: emission.prologue + '\n',
        };
        const rawEpilogue = {
            type: 'GungnirRawStatement',
            code: emission.epilogue + '\n',
        };
        ast.body = [rawPrologue, wrapped, rawEpilogue];
        return ast;
    }
    /**
     * 替换 AST 中的常量引用为 K(idx)/KN(idx) 调用。
     * 返回替换次数。
     */
    replaceReferences(ctx, poolIndex, K, KN, minNumber, intensity) {
        // 与收集遍历完全一致的跳过规则
        const skipNumber = (value) => {
            if (!Number.isInteger(value))
                return false;
            if (value >= -1 && value <= 1)
                return true;
            if (intensity < 4 && value >= minNumber && value <= 10)
                return true;
            return false;
        };
        let count = 0;
        const seen = new Set();
        const visit = (node, parentType) => {
            if (!node || typeof node !== 'object')
                return;
            if (seen.has(node))
                return;
            seen.add(node);
            const n = node;
            const t = String(n.type ?? '');
            if (t === 'StringLiteral') {
                const value = String(n.value);
                if (parentType === 'StringCallExpression')
                    return; // 语法位置不可替换
                const ids = poolIndex.get('S:' + value);
                if (ids === undefined || ids.length === 0)
                    return;
                // 单块 → K(id)；多块 → K(id1)..K(id2)..（1KB 独立加密【子系统 34/87】）
                let expr = {
                    type: 'CallExpression',
                    base: { type: 'Identifier', name: K },
                    arguments: [{ type: 'NumericLiteral', value: ids[0], raw: String(ids[0]) }],
                };
                for (let ci = 1; ci < ids.length; ci++) {
                    expr = {
                        type: 'BinaryExpression',
                        operator: '..',
                        left: expr,
                        right: {
                            type: 'CallExpression',
                            base: { type: 'Identifier', name: K },
                            arguments: [{ type: 'NumericLiteral', value: ids[ci], raw: String(ids[ci]) }],
                        },
                    };
                }
                // 原地变形（保持父引用有效）
                for (const key of Object.keys(n))
                    delete n[key];
                Object.assign(n, expr);
                count++;
                return;
            }
            if (t === 'NumericLiteral') {
                const value = Number(n.value);
                if (!Number.isFinite(value))
                    return;
                if (skipNumber(value))
                    return;
                const ids = poolIndex.get('N:' + String(value));
                if (ids === undefined || ids.length === 0)
                    return;
                const call = {
                    type: 'CallExpression',
                    base: { type: 'Identifier', name: KN },
                    arguments: [{ type: 'NumericLiteral', value: ids[0], raw: String(ids[0]) }],
                };
                for (const key of Object.keys(n))
                    delete n[key];
                Object.assign(n, call);
                count++;
                return;
            }
            // 递归子节点
            for (const key of Object.keys(n)) {
                if (key === 'type' || key === 'loc' || key === 'range')
                    continue;
                const v = n[key];
                if (Array.isArray(v)) {
                    for (const item of v)
                        visit(item, t);
                }
                else if (v && typeof v === 'object' && 'type' in v) {
                    visit(v, t);
                }
            }
        };
        visit(ctx.ast, '');
        return count;
    }
}
exports.VMEnginePlugin = VMEnginePlugin;
