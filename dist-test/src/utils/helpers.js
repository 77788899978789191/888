"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
exports.createRng = createRng;
exports.createIdentifier = createIdentifier;
exports.createNumericLiteral = createNumericLiteral;
exports.createStringLiteral = createStringLiteral;
exports.createBooleanLiteral = createBooleanLiteral;
exports.createNilLiteral = createNilLiteral;
exports.createBinaryExpression = createBinaryExpression;
exports.createCallExpression = createCallExpression;
exports.createMemberExpression = createMemberExpression;
exports.createTableConstructor = createTableConstructor;
exports.walk = walk;
exports.getChildren = getChildren;
exports.forEachStatementList = forEachStatementList;
exports.createRawStatement = createRawStatement;
exports.collectIdentifierNames = collectIdentifierNames;
exports.collectWrittenNames = collectWrittenNames;
exports.stringToBytes = stringToBytes;
exports.bytesToString = bytesToString;
exports.xorBytes = xorBytes;
exports.toLuaByteTable = toLuaByteTable;
exports.generateLuaIdentifier = generateLuaIdentifier;
// ============ Seeded RNG ============
function createRng(seed) {
    let state = seed >>> 0;
    if (state === 0)
        state = 0x9E3779B9;
    const next = () => {
        // xorshift128
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        state >>>= 0;
        return state / 0xFFFFFFFF;
    };
    const int = (min, max) => {
        return Math.floor(next() * (max - min + 1)) + min;
    };
    const pick = (arr) => {
        return arr[int(0, arr.length - 1)];
    };
    const shuffle = (arr) => {
        const result = [...arr];
        for (let i = result.length - 1; i > 0; i--) {
            const j = int(0, i);
            const tmp = result[i];
            result[i] = result[j];
            result[j] = tmp;
        }
        return result;
    };
    const bool = () => next() < 0.5;
    return { seed, next, int, pick, shuffle, bool };
}
// ============ AST Node Builders ============
function createIdentifier(name) {
    return { type: 'Identifier', name };
}
function createNumericLiteral(value) {
    return { type: 'NumericLiteral', value, raw: String(value) };
}
function createStringLiteral(value) {
    return { type: 'StringLiteral', value, raw: `"${value}"` };
}
function createBooleanLiteral(value) {
    return { type: 'BooleanLiteral', value };
}
function createNilLiteral() {
    return { type: 'NilLiteral' };
}
function createBinaryExpression(operator, left, right) {
    return { type: 'BinaryExpression', operator, left, right };
}
function createCallExpression(base, args) {
    return { type: 'CallExpression', base, arguments: args };
}
function createMemberExpression(base, indexer, identifier) {
    return {
        type: 'MemberExpression',
        indexer,
        identifier: createIdentifier(identifier),
        base,
    };
}
function createTableConstructor(fields) {
    return {
        type: 'TableConstructorExpression',
        fields: fields.map(f => ({
            type: f.key ? 'TableKey' : 'TableValue',
            key: f.key,
            value: f.value,
        })),
    };
}
// ============ AST Traversal ============
function walk(node, visitor, parent = null) {
    visitor(node, parent);
    const children = getChildren(node);
    for (const child of children) {
        walk(child, visitor, node);
    }
}
function getChildren(node) {
    const children = [];
    const n = node;
    for (const key of Object.keys(n)) {
        if (key === 'type' || key === 'range' || key === 'loc')
            continue;
        const value = n[key];
        if (isLuaNode(value)) {
            children.push(value);
        }
        else if (Array.isArray(value)) {
            for (const item of value) {
                if (isLuaNode(item)) {
                    children.push(item);
                }
            }
        }
    }
    return children;
}
function isLuaNode(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'type' in value &&
        typeof value.type === 'string');
}
// ============ 语句列表遍历（容器感知）============
/**
 * 遍历 AST 中所有「语句列表」容器（Chunk.body / DoStatement.body /
 * 函数体 body / 循环体 body / IfStatement.clauses[i].body / else_ 等）。
 * 回调可直接原位修改数组（替换/插入/删除语句）。
 *
 * 这是一切「按语句块变换」的插件的基础设施。
 */
function forEachStatementList(node, visit) {
    const n = node;
    const t = String(n.type ?? '');
    // 当前节点自身持有的语句列表
    if (t === 'Chunk' || t === 'DoStatement') {
        if (Array.isArray(n.body))
            visit(n.body, n);
    }
    else if (t === 'WhileStatement' || t === 'ForNumericStatement'
        || t === 'ForGenericStatement' || t === 'RepeatStatement') {
        if (Array.isArray(n.body))
            visit(n.body, n);
    }
    else if (t === 'FunctionDeclaration' || t === 'FunctionExpression') {
        if (Array.isArray(n.body))
            visit(n.body, n);
    }
    else if (t === 'IfStatement') {
        const clauses = n.clauses;
        if (Array.isArray(clauses)) {
            for (const clause of clauses) {
                if (Array.isArray(clause?.body))
                    visit(clause.body, clause);
            }
        }
        if (Array.isArray(n.else_))
            visit(n.else_, n);
    }
    // 递归子节点
    for (const child of getChildren(node)) {
        forEachStatementList(child, visit);
    }
}
/** 创建原样输出 Lua 代码的原始语句节点（LuaPrinter 直通打印） */
function createRawStatement(code) {
    return { type: 'GungnirRawStatement', code };
}
/** 收集语句内出现的所有标识符名（读写都算，用于依赖分析） */
function collectIdentifierNames(node, into) {
    const set = into ?? new Set();
    walk(node, (n) => {
        const nn = n;
        if (nn.type === 'Identifier' && typeof nn.name === 'string') {
            set.add(String(nn.name));
        }
    });
    return set;
}
/** 语句写入（声明/赋值）的变量名集合 */
function collectWrittenNames(stmt) {
    const out = new Set();
    const n = stmt;
    if (n.type === 'LocalStatement' && Array.isArray(n.variables)) {
        for (const v of n.variables) {
            if (typeof v?.name === 'string')
                out.add(v.name);
        }
    }
    else if (n.type === 'AssignmentStatement' && Array.isArray(n.variables)) {
        for (const v of n.variables) {
            if (v?.type === 'Identifier' && typeof v.name === 'string')
                out.add(String(v.name));
        }
        // 对 table.field / t[i] 的写入视为读 t（保守）
    }
    else if (n.type === 'FunctionDeclaration') {
        const id = n.identifier;
        if (id && typeof id.name === 'string')
            out.add(id.name);
    }
    else if (n.type === 'CallStatement') {
        const base = n.expression?.base;
        // g = f() 形式不在这里；纯调用不写变量
        if (base?.type === 'MemberExpression') {
            // t.f() 视为读 t
        }
    }
    return out;
}
// ============ String Utilities ============
function stringToBytes(str) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
        bytes.push(str.charCodeAt(i) & 0xFF);
    }
    return bytes;
}
function bytesToString(bytes) {
    return bytes.map(b => String.fromCharCode(b)).join('');
}
function xorBytes(data, key) {
    return data.map((byte, i) => byte ^ key[i % key.length]);
}
function toLuaByteTable(bytes) {
    return '{' + bytes.join(',') + '}';
}
function generateLuaIdentifier(rng, prefix, length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789';
    let result = prefix;
    for (let i = 0; i < length; i++) {
        result += chars[rng.int(0, chars.length - 1)];
    }
    return result;
}
// ============ Logger ============
class Logger {
    verbose;
    constructor(verbose) {
        this.verbose = verbose;
    }
    info(msg) {
        if (this.verbose)
            console.log(`[INFO] ${msg}`);
    }
    warn(msg) {
        console.warn(`[WARN] ${msg}`);
    }
    error(msg) {
        console.error(`[ERROR] ${msg}`);
    }
    debug(msg) {
        if (this.verbose)
            console.log(`[DEBUG] ${msg}`);
    }
}
exports.Logger = Logger;
