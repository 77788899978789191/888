"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClosureNestingPlugin = void 0;
const helpers_1 = require("../utils/helpers");
class ClosureNestingPlugin {
    name = 'ClosureNesting';
    description = '多级闭包 Upvalue 嵌套 + 函数双层包装隔离（子系统 54/55）';
    layers = [4];
    /** 闭包嵌套深度（≥5 层捕获，上限 7 保持栈安全） */
    static DEPTH_MIN = 5;
    static DEPTH_MAX = 7;
    transform(ctx) {
        const intensity = ctx.config.intensity;
        const rate = Math.min(0.08 + intensity * 0.06, 0.5);
        // 【54】把简单局部变量装箱进多层闭包 upvalue 链
        this.nestLocalsInClosures(ctx, rate);
        // 【55】把函数声明包装两层匿名函数
        this.wrapFunctionDeclarations(ctx, rate);
        return ctx.ast;
    }
    // ================= 【子系统 54】 =================
    /**
     * 选取局部数值/字符串初始化语句，把值藏进 5-7 层闭包链，
     * 通过逐层委托的访问器 upvalue 暴露：
     *
     * local v = 42 →
     *   local v
     *   do
     *     local l1 = (function() local up = 42
     *       local l2 = (function() local l3 = (function()
     *         ... 逐层捕获 up ...
     *       end)()
     *       return l3
     *     end)()
     *     v = l2()
     *   end
     */
    nestLocalsInClosures(ctx, rate) {
        (0, helpers_1.forEachStatementList)(ctx.ast, (stmts) => {
            const insertions = [];
            for (let i = 0; i < stmts.length; i++) {
                const n = stmts[i];
                if (n.type !== 'LocalStatement')
                    continue;
                const vars = n.variables ?? [];
                const init = n.init ?? [];
                if (vars.length !== 1 || init.length !== 1)
                    continue;
                const iv = init[0];
                if (!iv)
                    continue;
                const vt = String(iv.type ?? '');
                if (vt !== 'NumericLiteral' && vt !== 'StringLiteral')
                    continue;
                // 值必须可静态序列化
                const raw = vt === 'NumericLiteral'
                    ? String(iv.value)
                    : this.quote(String(iv.value ?? ''));
                if (ctx.rng.next() > rate)
                    continue;
                const v = String(vars[0].name ?? '');
                const code = this.buildClosureChain(ctx, v, raw, vt === 'StringLiteral');
                if (code) {
                    // 原语句改为纯声明（无初始化），闭包链语句随后赋值
                    n.init = [];
                    insertions.push({ at: i + 1, code });
                    ctx.stats.functionsProxied++;
                }
            }
            insertions.reverse();
            for (const ins of insertions) {
                stmts.splice(ins.at, 0, (0, helpers_1.createRawStatement)(ins.code));
            }
        });
    }
    /**
     * 构造 5-7 层闭包 upvalue 链：
     * L1 持有真实值（upvalue 源头），L2..LN 逐层捕获并转发，
     * 最外层立即调用取回值。每层随机加入无操作运算扰动
     * （扰动家族必须与值类型匹配：数值用算术恒等式，字符串用拼接恒等式）。
     */
    buildClosureChain(ctx, target, rawValue, isString) {
        const depth = ctx.rng.int(ClosureNestingPlugin.DEPTH_MIN, ClosureNestingPlugin.DEPTH_MAX);
        const f = (0, helpers_1.generateLuaIdentifier)(ctx.rng, '_cn', 6);
        // 最内层（L1）：持有真实值
        const inner = `${f}1`;
        // 恒等扰动（随机家族，类型安全：字符串不可做算术）
        const k = ctx.rng.int(2, 999);
        const noise = isString
            ? ctx.rng.pick([
                "(_v .. '')",
                "(('') .. _v)",
                "(_v .. string.rep('', 0))",
                `(_v .. '' .. '')`,
            ])
            : ctx.rng.pick([
                `(_v + ${k} - ${k})`,
                `(_v * 1)`,
                `(_v - 0)`,
                `(${k} + _v - ${k})`,
            ]);
        const lines = [];
        lines.push(`local ${inner} = (function() local _v = ${rawValue}`);
        lines.push(`  return function() return ${noise} end`);
        lines.push(`end)()`);
        // L2..LN：逐层捕获（每层是一次新的闭包，捕获上一层的函数为 upvalue）
        for (let i = 2; i <= depth; i++) {
            const cur = `${f}${i}`;
            const prev = `${f}${i - 1}`;
            // 随机转发模式（直接转发 / 括号转发 / 双重调用——语义等价）
            const mode = ctx.rng.int(0, 2);
            const forward = mode === 0
                ? `return ${prev}()`
                : mode === 1
                    ? `return (${prev})()`
                    : `local __r = ${prev}() return __r`;
            lines.push(`local ${cur} = function() ${forward} end`);
        }
        // 目标赋值：最外层调用取回
        lines.push(`${target} = ${f}${depth}()`);
        return lines.join('\n');
    }
    // ================= 【子系统 55】 =================
    /**
     * function f(a, b) ... end →
     *   local f
     *   do
     *     local __outer = (function()
     *       local __inner = (function(a, b, ...) ... end)
     *       return function(...) return __inner(...) end
     *     end)()
     *     f = function(...) return __outer(...) end
     *   end
     *
     * 两层匿名包装（外层隔离作用域，内层执行逻辑），
     * 参数经 ... 转发归一化。
     */
    wrapFunctionDeclarations(ctx, rate) {
        (0, helpers_1.walk)(ctx.ast, (node) => {
            const n = node;
            if (n.type !== 'FunctionDeclaration')
                return;
            if (n.isLocal === true)
                return; // local function 由另一形态处理
            const id = n.identifier;
            if (!id || typeof id.name !== 'string')
                return;
            // 跳过点分函数名（a.b.c 形式，重绑定复杂）
            if (String(n.name ?? '').includes('.'))
                return;
            if (ctx.rng.next() > rate)
                return;
            // 提取函数体为 raw（用源级重建——但 AST 不可直接序列化，
            // 改为：包装节点替代（保留原 body 引用）
            this.wrapInPlace(ctx, n);
            ctx.stats.functionsProxied++;
        });
    }
    /** 原位把 FunctionDeclaration 变异为双层包装形态 */
    wrapInPlace(ctx, fn) {
        const f = (0, helpers_1.generateLuaIdentifier)(ctx.rng, '_fw', 6);
        const outer = `${f}o`;
        const inner = `${f}i`;
        // 原 FunctionDeclaration 的 body/parameters 移入内层 FunctionExpression，
        // 外层用 GungnirRawExpression 组合。这里保守做法：
        // 把函数变异为「Raw 包装 + 保留原函数为局部」的形式。
        //
        // function f(a, b) BODY end
        //   →
        // f = (function()
        //   local _i = (function(a, b, ...) BODY end)
        //   local _o = function(...) return _i(...) end
        //   return function(...) return _o(...) end
        // end)()
        //
        // 由于 body 是 AST 数组（不可 raw 序列化），改用 AST 节点直接构建：
        const params = fn.parameters ?? [];
        const body = fn.body ?? [];
        // 内层函数：原参数 + ...（可变参数污染由 FunctionClones 处理，这里保持）
        const innerFn = {
            type: 'FunctionExpression',
            identifier: null,
            isLocal: false,
            parameters: params,
            body,
        };
        // 中间层：转发调用
        const midFn = {
            type: 'FunctionExpression',
            identifier: null,
            isLocal: false,
            parameters: [{ type: 'VarargLiteral', value: '...' }],
            body: [
                {
                    type: 'ReturnStatement',
                    arguments: [
                        {
                            type: 'CallExpression',
                            base: (0, helpers_1.createIdentifier)(inner),
                            arguments: [{ type: 'VarargLiteral', value: '...' }],
                        },
                    ],
                },
            ],
        };
        // 外层：再包一层转发
        const outerFn = {
            type: 'FunctionExpression',
            identifier: null,
            isLocal: false,
            parameters: [{ type: 'VarargLiteral', value: '...' }],
            body: [
                {
                    type: 'ReturnStatement',
                    arguments: [
                        {
                            type: 'CallExpression',
                            base: (0, helpers_1.createIdentifier)(outer),
                            arguments: [{ type: 'VarargLiteral', value: '...' }],
                        },
                    ],
                },
            ],
        };
        // 变异为：f = (function() local _i = INNER local _o = MID return OUTER end)()
        const wrapper = {
            type: 'AssignmentStatement',
            variables: [(0, helpers_1.createIdentifier)(String(fn.identifier.name))],
            init: [
                {
                    type: 'FunctionExpression',
                    identifier: null,
                    isLocal: false,
                    parameters: [],
                    body: [
                        { type: 'LocalStatement', variables: [(0, helpers_1.createIdentifier)(inner)], init: [innerFn] },
                        { type: 'LocalStatement', variables: [(0, helpers_1.createIdentifier)(outer)], init: [midFn] },
                        { type: 'ReturnStatement', arguments: [outerFn] },
                    ],
                },
            ],
        };
        // 原位替换所有字段
        for (const key of Object.keys(fn))
            delete fn[key];
        Object.assign(fn, wrapper);
    }
    /** Lua 单引号字面量 */
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
exports.ClosureNestingPlugin = ClosureNestingPlugin;
