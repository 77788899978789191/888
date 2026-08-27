"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.topLevelLocalsSafeToHoist = topLevelLocalsSafeToHoist;
exports.hoistTopLevelLocals = hoistTopLevelLocals;
exports.renameActiveIdentifiers = renameActiveIdentifiers;
const helpers_1 = require("./helpers");
/** 收集语句列表顶层的 local 声明名（LocalStatement 变量 + local function 名） */
function collectTopLevelLocalNames(body) {
    const names = new Set();
    for (const stmt of body) {
        const n = stmt;
        if (n.type === 'LocalStatement' && Array.isArray(n.variables)) {
            for (const v of n.variables) {
                if (typeof v?.name === 'string')
                    names.add(v.name);
            }
        }
        else if ((n.type === 'LocalFunctionStatement'
            || (n.type === 'FunctionDeclaration' && n.isLocal === true))
            && n.identifier
            && typeof n.identifier.name === 'string') {
            names.add(String(n.identifier.name));
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
function topLevelLocalsSafeToHoist(body) {
    const names = collectTopLevelLocalNames(body);
    if (names.size === 0)
        return true;
    let safe = true;
    (0, helpers_1.walk)(body, (n) => {
        const nn = n;
        if (nn.type !== 'GungnirRawStatement' && nn.type !== 'GungnirRawExpression')
            return;
        const code = String(nn.code ?? '');
        if (!code)
            return;
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
function hoistTopLevelLocals(ctx, body, usedNames, prefix) {
    // 收集顶层声明（LocalStatement 变量 + local function 名）
    const decls = [];
    for (const stmt of body) {
        const n = stmt;
        if (n.type === 'LocalStatement' && Array.isArray(n.variables)) {
            for (const v of n.variables) {
                if (typeof v?.name === 'string')
                    decls.push({ name: v.name, fresh: '' });
            }
        }
        else if ((n.type === 'LocalFunctionStatement'
            || (n.type === 'FunctionDeclaration' && n.isLocal === true))
            && n.identifier
            && typeof n.identifier.name === 'string') {
            decls.push({ name: String(n.identifier.name), fresh: '' });
        }
    }
    if (decls.length === 0) {
        return { decl: null, newBody: body };
    }
    // fresh 名：全 chunk 标识符 + 调用方历史 去重
    const used = (0, helpers_1.collectIdentifierNames)(ctx.ast);
    for (const u of usedNames)
        used.add(u);
    for (const d of decls) {
        let fresh = prefix + ctx.rng.int(100000, 999999).toString(36);
        while (used.has(fresh))
            fresh = prefix + ctx.rng.int(100000, 999999).toString(36);
        used.add(fresh);
        usedNames.add(fresh);
        d.fresh = fresh;
    }
    // 同名重声明队列（每个声明位点领取自己的 fresh 名）
    const declQueue = new Map();
    for (const d of decls) {
        const q = declQueue.get(d.name) ?? [];
        q.push(d);
        declQueue.set(d.name, q);
    }
    const active = new Map();
    const newBody = [];
    for (const stmt of body) {
        const n = stmt;
        if (n.type === 'LocalStatement') {
            const vars = n.variables;
            const inits = n.init ?? [];
            // init 引用声明前绑定 → 用旧映射改名（`local x = x` 右值=外层 x）
            for (const e of inits)
                renameActiveIdentifiers(e, active);
            // 激活本语句声明的新名
            const freshVars = [];
            for (const v of vars) {
                const q = declQueue.get(v.name);
                const d = q ? q.shift() : undefined;
                if (!d)
                    continue; // 理论不可达（decls 已全量收集）
                active.set(v.name, d.fresh);
                freshVars.push((0, helpers_1.createIdentifier)(d.fresh));
            }
            // local v... = init...  →  fv... = init...（多值调整语义一致）
            newBody.push({
                type: 'AssignmentStatement',
                variables: freshVars,
                init: inits.length > 0 ? inits : [(0, helpers_1.createNilLiteral)()],
            });
        }
        else if (n.type === 'LocalFunctionStatement'
            || (n.type === 'FunctionDeclaration' && n.isLocal === true)) {
            const name = String(n.identifier.name);
            const q = declQueue.get(name);
            const d = q ? q.shift() : undefined;
            if (!d) {
                renameActiveIdentifiers(stmt, active);
                newBody.push(stmt);
                continue;
            }
            // local function f：f 在自身体内可见（递归）→ 先激活再整树改名
            active.set(name, d.fresh);
            renameActiveIdentifiers(stmt, active);
            // → fv = function(params) body end
            newBody.push({
                type: 'AssignmentStatement',
                variables: [(0, helpers_1.createIdentifier)(d.fresh)],
                init: [{
                        type: 'FunctionExpression',
                        parameters: n.parameters,
                        body: n.body,
                    }],
            });
        }
        else {
            renameActiveIdentifiers(stmt, active);
            newBody.push(stmt);
        }
    }
    // 提升声明：local fv1, fv2, ...（无初值 = nil，与 local 声明语义一致）
    const decl = {
        type: 'LocalStatement',
        variables: decls.map(d => (0, helpers_1.createIdentifier)(d.fresh)),
        init: [],
    };
    return { decl, newBody };
}
/**
 * 区域内活跃名统一改名。
 * 跳过 MemberExpression 的字段名位与 TableKeyString 键位（非变量引用）。
 * 遮蔽结构（嵌套 local/参数/循环变量）经统一改名后同构保持。
 */
function renameActiveIdentifiers(node, active) {
    if (active.size === 0)
        return;
    (0, helpers_1.walk)(node, (n, parent) => {
        const nn = n;
        if (nn.type !== 'Identifier')
            return;
        const fresh = active.get(String(nn.name));
        if (!fresh)
            return;
        const p = parent;
        if (p && p.type === 'MemberExpression' && p.identifier === n)
            return;
        if (p && p.type === 'TableKeyString' && p.key === n)
            return;
        nn.name = fresh;
    });
}
