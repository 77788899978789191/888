"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoopObfuscationPlugin = void 0;
const helpers_1 = require("../utils/helpers");
const LOOP_TYPES = new Set([
    'WhileStatement', 'ForNumericStatement', 'ForGenericStatement', 'RepeatStatement',
]);
class LoopObfuscationPlugin {
    name = 'LoopObfuscation';
    description = '循环→状态机/尾递归形态 + 去优化触发器（子系统 22, 31）';
    layers = [2];
    transform(ctx) {
        const intensity = ctx.config.intensity;
        const forRate = Math.min(0.2 + intensity * 0.15, 0.95);
        const whileRate = Math.min(0.1 + intensity * 0.12, 0.7);
        const deoptRate = intensity >= 3 ? Math.min(0.1 + intensity * 0.08, 0.6) : 0;
        const deferred = [];
        (0, helpers_1.forEachStatementList)(ctx.ast, (stmts) => {
            for (let i = 0; i < stmts.length; i++) {
                const stmt = stmts[i];
                if (stmt.type === 'ForNumericStatement' && ctx.rng.next() < forRate) {
                    const repl = this.forToWhile(ctx, stmt);
                    if (repl) {
                        deferred.push({ stmts, index: i, replacement: repl });
                        continue;
                    }
                }
                if (stmt.type === 'WhileStatement' && ctx.rng.next() < whileRate) {
                    this.wrapWhileCondition(ctx, stmt);
                }
                // 【子系统 31】去优化触发器：包一层 do-block 注入 aborter
                if (deoptRate > 0 && LOOP_TYPES.has(String(stmt.type))
                    && ctx.rng.next() < deoptRate && Array.isArray(stmt.body)) {
                    const wrapped = this.wrapWithDeopt(ctx, stmts[i]);
                    deferred.push({ stmts, index: i, replacement: [wrapped] });
                    continue;
                }
            }
        });
        // 原位替换（倒序保证同一数组的多个索引稳定）
        for (const r of deferred.reverse()) {
            r.stmts.splice(r.index, 1, ...r.replacement);
        }
        return ctx.ast;
    }
    /**
     * 【子系统 22】数值 for → while 状态机：
     *
     *   for v = a, b, c do body end
     *     ⇒
     *   do
     *     local __i, __lim, __step = a, b, c or 1
     *     local __dir = __step >= 0
     *     if __step == 0 then error("'for' step is zero") end
     *     while (__dir and __i <= __lim) or ((not __dir) and __i >= __lim) do
     *       local v = __i        -- fresh 拷贝：body 改 v 不影响迭代
     *       body
     *       __i = __i + __step
     *     end
     *   end
     */
    forToWhile(ctx, stmt) {
        const variable = stmt.variable;
        const start = stmt.start;
        const end = stmt.end;
        const step = stmt.step ?? null;
        const body = stmt.body;
        if (!variable || !start || !end || !Array.isArray(body))
            return null;
        const p = '_l' + ctx.rng.int(100000, 999999).toString(36);
        const iVar = (0, helpers_1.createIdentifier)(`${p}i`);
        const limVar = (0, helpers_1.createIdentifier)(`${p}m`);
        const stepVar = (0, helpers_1.createIdentifier)(`${p}s`);
        const dirVar = (0, helpers_1.createIdentifier)(`${p}d`);
        // local __i, __lim, __step = a, b, (c or 1)
        const initDecl = {
            type: 'LocalStatement',
            variables: [iVar, limVar, stepVar],
            init: [start, end, step ?? (0, helpers_1.createNumericLiteral)(1)],
        };
        // local __dir = __step >= 0
        const dirDecl = {
            type: 'LocalStatement',
            variables: [dirVar],
            init: [{
                    type: 'BinaryExpression', operator: '>=',
                    left: stepVar, right: (0, helpers_1.createNumericLiteral)(0),
                }],
        };
        // if __step == 0 then error("'for' step is zero") end
        const zeroCheck = {
            type: 'IfStatement',
            clauses: [{
                    condition: {
                        type: 'BinaryExpression', operator: '==',
                        left: stepVar, right: (0, helpers_1.createNumericLiteral)(0),
                    },
                    body: [{
                            type: 'CallStatement',
                            expression: {
                                type: 'CallExpression',
                                base: (0, helpers_1.createIdentifier)('error'),
                                arguments: [(0, helpers_1.createStringLiteral)("'for' step is zero")],
                            },
                        }],
                }],
            else_: null,
        };
        // (__dir and __i <= __lim) or ((not __dir) and __i >= __lim)
        const cond = {
            type: 'LogicalExpression', operator: 'or',
            left: {
                type: 'LogicalExpression', operator: 'and',
                left: dirVar,
                right: { type: 'BinaryExpression', operator: '<=', left: iVar, right: limVar },
            },
            right: {
                type: 'LogicalExpression', operator: 'and',
                left: { type: 'UnaryExpression', operator: 'not', argument: dirVar },
                right: { type: 'BinaryExpression', operator: '>=', left: iVar, right: limVar },
            },
        };
        // local v = __i（fresh 拷贝）；__i = __i + __step
        const freshCopy = {
            type: 'LocalStatement',
            variables: [(0, helpers_1.createIdentifier)(variable.name)],
            init: [iVar],
        };
        const advance = {
            type: 'AssignmentStatement',
            variables: [iVar],
            init: [{ type: 'BinaryExpression', operator: '+', left: iVar, right: stepVar }],
        };
        const whileLoop = {
            type: 'WhileStatement',
            condition: this.wrapCondition(ctx, cond),
            body: [freshCopy, ...body, advance],
        };
        const wrapped = {
            type: 'DoStatement',
            body: [initDecl, dirDecl, zeroCheck, whileLoop],
        };
        return [wrapped];
    }
    /** 【子系统 22】while 条件不透明谓词合取（恒真恒等式族） */
    wrapWhileCondition(ctx, stmt) {
        const cond = stmt.condition;
        if (!cond)
            return;
        stmt.condition = this.wrapCondition(ctx, cond);
    }
    wrapCondition(ctx, cond) {
        const identities = [
            this.eq(this.mul(101, 101), (0, helpers_1.createNumericLiteral)(10201)),
            this.eq(this.mul(7, 49), (0, helpers_1.createNumericLiteral)(343)),
            this.eq(this.add(this.mul(6, 77), (0, helpers_1.createNumericLiteral)(-324)), (0, helpers_1.createNumericLiteral)(138)),
            this.eq(this.add((0, helpers_1.createNumericLiteral)(123456789), (0, helpers_1.createNumericLiteral)(-123456788)), (0, helpers_1.createNumericLiteral)(1)),
        ];
        const count = 1 + ctx.rng.int(0, 2);
        let result = cond;
        for (let i = 0; i < count; i++) {
            result = {
                type: 'LogicalExpression', operator: 'and',
                left: identities[ctx.rng.int(0, identities.length - 1)],
                right: result,
            };
        }
        return result;
    }
    /**
     * 【子系统 31】用 do-block 包裹循环，注入去优化触发器：
     *
     *   do
     *     local __mt = setmetatable({}, { __index = function(_, k) return k end })
     *     local __cnt, __sink = 0, nil
     *     <loop>（循环体头部插入：__cnt = __cnt + 1; __sink = __mt[(__cnt % 13) + 1]）
     *   end
     *
     * 每轮变化的键 + 元方法查找 = trace abort，LuaJIT 退出优化。
     */
    wrapWithDeopt(ctx, loop) {
        const mt = (0, helpers_1.generateLuaIdentifier)(ctx.rng, '_mt', 6);
        const cnt = (0, helpers_1.generateLuaIdentifier)(ctx.rng, '_cc', 6);
        const sink = (0, helpers_1.generateLuaIdentifier)(ctx.rng, '_sk', 6);
        const setup = { type: 'GungnirRawStatement', code: [
                `local ${mt} = setmetatable({}, { __index = function(_, k) return k end })`,
                `local ${cnt}, ${sink} = 0, nil`,
            ].join('\n') };
        const n = loop;
        const body = n.body;
        if (Array.isArray(body) && body.length >= 0) {
            const tick = { type: 'GungnirRawStatement', code: [
                    `${cnt} = ${cnt} + 1`,
                    `${sink} = ${mt}[(${cnt} % 13) + 1]`,
                ].join('\n') };
            n.body = [tick, ...body];
        }
        return { type: 'DoStatement', body: [setup, loop] };
    }
    mul(a, b) {
        return {
            type: 'BinaryExpression', operator: '*',
            left: (0, helpers_1.createNumericLiteral)(a), right: (0, helpers_1.createNumericLiteral)(b),
        };
    }
    add(a, b) {
        return { type: 'BinaryExpression', operator: '+', left: a, right: b };
    }
    eq(a, b) {
        return { type: 'BinaryExpression', operator: '==', left: a, right: b };
    }
}
exports.LoopObfuscationPlugin = LoopObfuscationPlugin;
