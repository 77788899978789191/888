"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionClonesPlugin = void 0;
const helpers_1 = require("../utils/helpers");
class FunctionClonesPlugin {
    name = 'FunctionClones';
    description = '多态函数克隆 + 可变参数污染（子系统 58/59）';
    layers = [4];
    transform(ctx) {
        const intensity = ctx.config.intensity;
        const rate = Math.min(0.1 + intensity * 0.07, 0.55);
        // 顶层函数声明 → 3 克隆 + LCG 随机分发器
        (0, helpers_1.forEachStatementList)(ctx.ast, (stmts) => {
            for (let i = 0; i < stmts.length; i++) {
                const n = stmts[i];
                if (n.type !== 'FunctionDeclaration')
                    continue;
                if (n.isLocal === true)
                    continue;
                const id = n.identifier;
                if (!id || id.type !== 'Identifier')
                    continue; // 只处理简单名
                if (String(id.name ?? '') === '')
                    continue;
                if (ctx.rng.next() > rate)
                    continue;
                const setup = this.buildCloneSetup(ctx, n);
                if (setup.length > 0) {
                    // 克隆/权重声明插到函数声明之前（upvalue 捕获）
                    stmts.splice(i, 0, ...setup);
                    i += setup.length;
                    ctx.stats.functionsProxied++;
                }
            }
        });
        return ctx.ast;
    }
    /**
     * function f(a, b) BODY end ⇒（前置插入）
     *   local _c1 = function(a, b, ...) BODY end          -- 直通克隆
     *   local _c2 = function(...)                          -- pcall 克隆
     *     local ok, r = pcall(_c1, ...)
     *     if ok then return r end
     *     return _c1(...)
     *   end
     *   local _c3 = setmetatable({}, { __call =            -- __call 克隆
     *     function(_, ...) return _c1(...) end })
     *   local _w = <构建种子>
     * 并把原函数变异为分发器：
     *   function f(...)
     *     _w = (_w * 1103515245 + 12345) % 2147483648
     *     local _r = _w % 3
     *     if _r == 0 then return _c1(...)
     *     elseif _r == 1 then return _c2(...)
     *     else return _c3(...) end
     *   end
     *
     * 【59】分发器与全部克隆带 ... 形参污染。
     * _w 为分发器 upvalue —— LCG 状态跨调用演进（运行时路径随机）。
     */
    buildCloneSetup(ctx, fn) {
        const f = (0, helpers_1.generateLuaIdentifier)(ctx.rng, '_fc', 6);
        const c1 = `${f}a`;
        const c2 = `${f}b`;
        const c3 = `${f}c`;
        const w = `${f}w`;
        // 原参数与函数体（移入直通克隆）
        const params = fn.parameters ?? [];
        const body = fn.body ?? [];
        // 克隆 1：直通版（原始函数体 + ... 尾参污染【59】）
        const clone1Params = [...params];
        if (!clone1Params.some(p => String(p.type) === 'VarargLiteral')) {
            clone1Params.push({ type: 'VarargLiteral', value: '...' });
        }
        const clone1 = {
            type: 'FunctionExpression',
            identifier: null,
            isLocal: false,
            parameters: clone1Params,
            body,
        };
        // 克隆 2：pcall 重试版（错误吞噬后直调）
        const clone2 = {
            type: 'FunctionExpression',
            identifier: null,
            isLocal: false,
            parameters: [{ type: 'VarargLiteral', value: '...' }],
            body: [
                {
                    type: 'LocalStatement',
                    variables: [(0, helpers_1.createIdentifier)(`${f}ok`), (0, helpers_1.createIdentifier)(`${f}r`)],
                    init: [{
                            type: 'CallExpression',
                            base: (0, helpers_1.createIdentifier)('pcall'),
                            arguments: [
                                (0, helpers_1.createIdentifier)(c1),
                                { type: 'VarargLiteral', value: '...' },
                            ],
                        }],
                },
                {
                    type: 'IfStatement',
                    clauses: [{
                            condition: (0, helpers_1.createIdentifier)(`${f}ok`),
                            body: [
                                {
                                    type: 'ReturnStatement',
                                    arguments: [(0, helpers_1.createIdentifier)(`${f}r`)],
                                },
                            ],
                        }],
                    else_: null,
                },
                {
                    type: 'ReturnStatement',
                    arguments: [{
                            type: 'CallExpression',
                            base: (0, helpers_1.createIdentifier)(c1),
                            arguments: [{ type: 'VarargLiteral', value: '...' }],
                        }],
                },
            ],
        };
        // 克隆 3：__call 元表版
        const clone3 = {
            type: 'CallExpression',
            base: (0, helpers_1.createIdentifier)('setmetatable'),
            arguments: [
                { type: 'TableConstructorExpression', fields: [] },
                {
                    type: 'TableConstructorExpression',
                    fields: [{
                            type: 'TableKeyString',
                            key: (0, helpers_1.createIdentifier)('__call'),
                            value: {
                                type: 'FunctionExpression',
                                identifier: null,
                                isLocal: false,
                                parameters: [
                                    { type: 'Identifier', name: `${f}self` },
                                    { type: 'VarargLiteral', value: '...' },
                                ],
                                body: [
                                    {
                                        type: 'ReturnStatement',
                                        arguments: [{
                                                type: 'CallExpression',
                                                base: (0, helpers_1.createIdentifier)(c1),
                                                arguments: [{ type: 'VarargLiteral', value: '...' }],
                                            }],
                                    },
                                ],
                            },
                        }],
                },
            ],
        };
        // LCG 权重种子（构建随机）
        const seed = ctx.rng.int(100000, 2147483000);
        // 前置声明序列（分发器的 upvalue 源）
        const setup = [
            {
                type: 'LocalStatement',
                variables: [(0, helpers_1.createIdentifier)(c1)],
                init: [clone1],
            },
            {
                type: 'LocalStatement',
                variables: [(0, helpers_1.createIdentifier)(c2)],
                init: [clone2],
            },
            {
                type: 'LocalStatement',
                variables: [(0, helpers_1.createIdentifier)(c3)],
                init: [clone3],
            },
            (0, helpers_1.createRawStatement)(`local ${w} = ${seed}`),
        ];
        // 原函数变异为分发器（保留名字与位置）
        fn.parameters = [{ type: 'VarargLiteral', value: '...' }];
        fn.body = [
            (0, helpers_1.createRawStatement)(`${w} = (${w} * 1103515245 + 12345) % 2147483648`),
            (0, helpers_1.createRawStatement)(`local ${f}r = ${w} % 3`),
            (0, helpers_1.createRawStatement)([
                `if ${f}r == 0 then`,
                `  return ${c1}(...)`,
                `elseif ${f}r == 1 then`,
                `  return ${c2}(...)`,
                `else`,
                `  return ${c3}(...)`,
                `end`,
            ].join('\n')),
        ];
        return setup;
    }
}
exports.FunctionClonesPlugin = FunctionClonesPlugin;
