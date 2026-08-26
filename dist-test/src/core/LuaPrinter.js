"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LuaPrinter = void 0;
/** Lua 5.1 二元运算符优先级（数值越大绑定越紧） */
const BINOP_PREC = {
    'or': 1, 'and': 2,
    '<': 3, '>': 3, '<=': 3, '>=': 3, '==': 3, '~=': 3,
    '..': 4,
    '+': 5, '-': 5,
    '*': 6, '/': 6, '%': 6,
    '^': 8,
};
/** 右结合运算符 */
const RIGHT_ASSOC = new Set(['^', '..']);
/** 一元运算符优先级（not/#/负号） */
const UNARY_PREC = 7;
class LuaPrinter {
    indent = 0;
    eol;
    constructor(eol = '\n') {
        this.eol = eol;
    }
    /** 打印整块 chunk */
    print(chunk) {
        const body = chunk.body ?? [];
        const parts = body.map(s => this.stmt(s));
        // 语句拼接：调用语句后紧跟 `(` 开头的语句必须补 `;` 防止语法粘连
        let out = '';
        for (let i = 0; i < parts.length; i++) {
            if (i > 0)
                out += this.eol;
            if (parts[i].startsWith('(') && this.startsWithCall(parts[i - 1] ?? '')) {
                out += ';' + this.eol + parts[i];
                continue;
            }
            out += parts[i];
        }
        return out + (out.endsWith(this.eol) ? '' : this.eol);
    }
    startsWithCall(s) {
        // 上一条语句以调用结尾（f(...)、f{...}、f"..."）时，
        // 紧随的 `(` 会被并入调用参数
        const t = s.trimEnd();
        return /\)\s*$|\}\s*$|"'\s*$/.test(t) && this.callsTail(t);
    }
    callsTail(s) {
        // 粗略启发：以 ) 或 } 结尾且语句头是调用形态
        return /^(?:local\s+[\w,.]+\s*=\s*)?(?:[\w.:"()\[\]{}\s]|do\b|end\b)*[)\}"]\s*$/.test(s) === true
            && /[\w.)\]"']\s*[({"]/.test(s);
    }
    // ============ 语句 ============
    stmt(node) {
        const type = String(node.type);
        switch (type) {
            case 'GungnirRawStatement':
                return String(node.code ?? '');
            case 'LocalStatement': {
                const vars = node.variables.map(v => this.ident(v)).join(', ');
                const init = node.init;
                const hasInit = Array.isArray(init) && init.length > 0;
                // 局部函数提升为 local function 形式由 FunctionDeclaration(isLocal) 处理
                return this.pad(`local ${vars}${hasInit ? ' = ' + init.map(e => this.expr(e)).join(', ') : ''}`);
            }
            case 'AssignmentStatement': {
                const vars = node.variables.map(v => this.expr(v)).join(', ');
                const init = node.init.map(e => this.expr(e)).join(', ');
                return this.pad(`${vars} = ${init}`);
            }
            case 'CallStatement':
                return this.pad(this.expr(node.expression));
            case 'DoStatement':
                return this.block('do', node.body, 'end');
            case 'WhileStatement':
                return this.block(`while ${this.expr(node.condition)} do`, node.body, 'end');
            case 'RepeatStatement':
                return this.block('repeat', node.body, `until ${this.expr(node.condition)}`);
            case 'IfStatement': {
                // luaparse 约定：else 是 condition 为 null 的子句
                const clauses = node.clauses ?? [];
                let out = '';
                clauses.forEach((cl, i) => {
                    if (cl.condition == null) {
                        out += this.pad('else') + this.eol;
                    }
                    else {
                        const kw = i === 0 ? 'if' : 'elseif';
                        out += this.pad(`${kw} ${this.expr(cl.condition)} then`) + this.eol;
                    }
                    this.indent++;
                    for (const s of cl.body)
                        out += this.stmt(s) + this.eol;
                    this.indent--;
                });
                if (node.else_ != null && Array.isArray(node.else_) && node.else_.length > 0) {
                    // 兼容自建节点的 else_ 字段
                    out += this.pad('else') + this.eol;
                    this.indent++;
                    for (const s of node.else_)
                        out += this.stmt(s) + this.eol;
                    this.indent--;
                }
                out += this.pad('end');
                return out;
            }
            case 'ForNumericStatement': {
                const v = this.ident(node.variable);
                const start = this.expr(node.start);
                const end = this.expr(node.end);
                const step = node.step != null ? `, ${this.expr(node.step)}` : '';
                return this.block(`for ${v} = ${start}, ${end}${step} do`, node.body, 'end');
            }
            case 'ForGenericStatement': {
                const vars = node.variables.map(v => this.ident(v)).join(', ');
                const iter = node.iterators.map(e => this.expr(e)).join(', ');
                return this.block(`for ${vars} in ${iter} do`, node.body, 'end');
            }
            case 'FunctionDeclaration': {
                // isLocal → local function；identifier 可能为点分链
                const name = this.funcName(node.identifier);
                const params = this.params(node.parameters);
                const kw = node.isLocal ? 'local function' : 'function';
                return this.block(`${kw} ${name}(${params})`, node.body, 'end');
            }
            case 'LocalFunctionStatement': {
                const name = this.ident(node.identifier);
                return this.block(`local function ${name}(${this.params(node.parameters)})`, node.body, 'end');
            }
            case 'ReturnStatement': {
                const args = node.arguments ?? [];
                return this.pad(args.length > 0 ? `return ${args.map(a => this.expr(a)).join(', ')}` : 'return');
            }
            case 'BreakStatement':
                return this.pad('break');
            case 'GotoStatement':
                return this.pad(`goto ${this.ident(node.label)}`);
            case 'LabelStatement':
                return this.pad(`::${this.ident(node.label)}::`);
            default:
                // 未知语句类型：显式报错而非静默输出垃圾
                throw new Error(`LuaPrinter: unsupported statement type: ${type}`);
        }
    }
    block(header, body, footer) {
        let out = this.pad(header) + this.eol;
        this.indent++;
        for (const s of body ?? [])
            out += this.stmt(s) + this.eol;
        this.indent--;
        out += this.pad(footer);
        return out;
    }
    pad(code) {
        return '  '.repeat(this.indent) + code;
    }
    ident(node) {
        return String(node.name);
    }
    params(list) {
        return (list ?? []).map(p => p.type === 'VarargLiteral' ? '...' : this.ident(p)).join(', ');
    }
    /** 函数名打印：Identifier 或 MemberExpression 点分链 */
    funcName(node) {
        if (node == null)
            throw new Error('LuaPrinter: function without name');
        if (node.type === 'Identifier')
            return this.ident(node);
        if (node.type === 'MemberExpression') {
            return this.expr(node);
        }
        throw new Error(`LuaPrinter: bad function name node: ${String(node.type)}`);
    }
    // ============ 表达式 ============
    expr(node) {
        if (node == null)
            return 'nil';
        const type = String(node.type);
        switch (type) {
            case 'GungnirRawExpression':
                return String(node.code ?? 'nil');
            case 'Identifier':
                return this.ident(node);
            case 'NumericLiteral': {
                // 优先使用原始字面量（保留 0x/科学计数法），校验可回环
                const raw = node.raw != null ? String(node.raw) : '';
                const value = Number(node.value);
                if (raw !== '' && Number.isFinite(Number(raw)) && Number(raw) === value) {
                    return this.stripUnder(raw);
                }
                return this.num(value);
            }
            case 'StringLiteral':
                return this.escapeString(String(node.value ?? ''));
            case 'BooleanLiteral':
                return node.value ? 'true' : 'false';
            case 'NilLiteral':
                return 'nil';
            case 'VarargLiteral':
                return '...';
            case 'ParentheticExpression':
                return `(${this.expr(node.expression)})`;
            case 'BinaryExpression':
            case 'LogicalExpression': {
                const op = String(node.operator);
                const left = this.wrapChild(node.left, this.expr(node.left), op, 'left');
                const right = this.wrapChild(node.right, this.expr(node.right), op, 'right');
                if (op === '..')
                    return `${left} .. ${right}`;
                return `${left} ${op} ${right}`;
            }
            case 'UnaryExpression': {
                const op = String(node.operator);
                const arg = this.expr(node.argument);
                const argPrec = this.childPrec(node.argument);
                // 一元优先级 7：参数为 ^ (8) 或另一一元 (7) 时必须加括号
                // `- -x`、`not not x` 需要分隔避免 `--` 注释/解析歧义
                const needParen = argPrec >= UNARY_PREC;
                const wrapped = needParen ? `(${arg})` : arg;
                if (op === 'not')
                    return `not ${wrapped}`;
                if (op === '-') {
                    // 防 `--x` 注释歧义：负号后跟负号表达式补空格
                    if (/^-/.test(wrapped))
                        return `- ${wrapped}`;
                    return `-${wrapped}`;
                }
                if (op === '#') {
                    if (/^-/.test(wrapped))
                        return `# ${wrapped}`;
                    return `#${wrapped}`;
                }
                return `${op}${wrapped}`;
            }
            case 'MemberExpression': {
                const base = this.exprMemberBase(node.base);
                const idx = this.ident(node.identifier);
                return `${base}${String(node.indexer)}${idx}`;
            }
            case 'IndexExpression': {
                const base = this.exprMemberBase(node.base);
                return `${base}[${this.expr(node.index)}]`;
            }
            case 'CallExpression': {
                const base = this.exprCallBase(node.base);
                const args = node.arguments.map(a => this.expr(a)).join(', ');
                return `${base}(${args})`;
            }
            case 'TableCallExpression': {
                const base = this.exprCallBase(node.base);
                return `${base}${this.expr(node.arguments)}`;
            }
            case 'StringCallExpression': {
                const base = this.exprCallBase(node.base);
                return `${base}${this.escapeString(String(node.argument.value ?? ''))}`;
            }
            case 'FunctionExpression': {
                const params = this.params(node.parameters);
                return this.inlineFunction(`function(${params})`, node.body);
            }
            case 'TableConstructorExpression': {
                const fields = node.fields ?? [];
                if (fields.length === 0)
                    return '{}';
                const parts = fields.map(f => {
                    switch (String(f.type)) {
                        case 'TableKey':
                            return `[${this.expr(f.key)}] = ${this.expr(f.value)}`;
                        case 'TableKeyString':
                            return `${this.ident(f.key)} = ${this.expr(f.value)}`;
                        default:
                            return this.expr(f.value);
                    }
                });
                // 含函数字段时多行输出，提高可读性（不影响合法性）
                if (fields.some(f => this.containsFunction(f.value))) {
                    return this.multilineTable(fields);
                }
                return `{${parts.join(', ')}}`;
            }
            default:
                throw new Error(`LuaPrinter: unsupported expression type: ${type}`);
        }
    }
    multilineTable(fields) {
        const parts = fields.map(f => {
            switch (String(f.type)) {
                case 'TableKey':
                    return `[${this.expr(f.key)}] = ${this.expr(f.value)}`;
                case 'TableKeyString':
                    return `${this.ident(f.key)} = ${this.expr(f.value)}`;
                default:
                    return this.expr(f.value);
            }
        });
        return `{${this.eol}${parts.map(p => '  '.repeat(this.indent + 1) + p).join(',' + this.eol)}${this.eol}${'  '.repeat(this.indent)}}`;
    }
    inlineFunction(header, body) {
        let out = header + this.eol;
        this.indent++;
        for (const s of body)
            out += this.stmt(s) + this.eol;
        this.indent--;
        out += '  '.repeat(this.indent) + 'end';
        return out;
    }
    /** 子表达式优先级（binop/logical 取其运算符优先级，一元取 7，其他 max） */
    childPrec(node) {
        const t = String(node.type);
        if (t === 'BinaryExpression' || t === 'LogicalExpression') {
            return BINOP_PREC[String(node.operator)] ?? 3;
        }
        if (t === 'UnaryExpression')
            return UNARY_PREC;
        return 99;
    }
    /**
     * 包装二元子节点。核心正确性逻辑：
     *  - 子优先级 < 父 → 括号
     *  - 子优先级 == 父：
     *      比较运算（非结合）→ 括号
     *      右结合（.. ^）左子 → 括号
     *      左结合运算右子 → 括号
     */
    wrapChild(child, rendered, parentOp, side) {
        const childPrec = this.childPrec(child);
        const parentPrec = BINOP_PREC[parentOp] ?? 3;
        if (childPrec < parentPrec)
            return `(${rendered})`;
        if (childPrec === parentPrec) {
            const isCmp = ['<', '>', '<=', '>=', '==', '~='].includes(parentOp);
            if (isCmp)
                return `(${rendered})`;
            if (RIGHT_ASSOC.has(parentOp)) {
                // 右结合：左子同级需括号（(a^b)^c ≠ a^b^c）
                return side === 'left' ? `(${rendered})` : rendered;
            }
            // 左结合：右子同级需括号（a-(b-c) ≠ a-b-c）
            return side === 'right' ? `(${rendered})` : rendered;
        }
        return rendered;
    }
    /** 成员访问基座：非前缀表达式（字面量/二元/函数）需括号 */
    exprMemberBase(base) {
        const t = String(base.type);
        const rendered = this.expr(base);
        if (t === 'Identifier' || t === 'MemberExpression' || t === 'IndexExpression' || t === 'CallExpression'
            || t === 'TableCallExpression' || t === 'StringCallExpression' || t === 'ParentheticExpression') {
            return rendered;
        }
        return `(${rendered})`;
    }
    /** 调用基座：非前缀表达式需括号（如 (function() end)()） */
    exprCallBase(base) {
        const t = String(base.type);
        const rendered = this.expr(base);
        if (t === 'Identifier' || t === 'MemberExpression' || t === 'IndexExpression' || t === 'CallExpression'
            || t === 'TableCallExpression' || t === 'StringCallExpression' || t === 'ParentheticExpression') {
            return rendered;
        }
        return `(${rendered})`;
    }
    containsFunction(node) {
        if (node == null)
            return false;
        if (String(node.type) === 'FunctionExpression')
            return true;
        for (const v of Object.values(node)) {
            if (typeof v !== 'object' || v === null)
                continue;
            if (Array.isArray(v)) {
                for (const item of v) {
                    if (item && typeof item === 'object' && this.containsFunction(item))
                        return true;
                }
            }
            else if (typeof v.type === 'string') {
                if (this.containsFunction(v))
                    return true;
            }
        }
        return false;
    }
    // ============ 字面量 ============
    num(value) {
        if (Number.isNaN(value))
            return '(0/0)';
        if (value === Infinity)
            return '(math.huge)';
        if (value === -Infinity)
            return '(-math.huge)';
        return String(value);
    }
    stripUnder(raw) {
        return raw.replace(/_/g, '');
    }
    /**
     * Lua 5.1 安全字符串转义：
     *  - 可打印 ASCII 直接输出
     *  - \" \' \\ \n \r \t \a \b \f \v 快捷转义
     *  - 其余一律 \ddd 十进制转义（Lua 5.1 无 \x）
     *  - 128-255 输出 \ddd 避免 UTF-8 编码歧义
     */
    escapeString(value) {
        let out = '"';
        for (let i = 0; i < value.length; i++) {
            const c = value.charCodeAt(i);
            if (c === 34) {
                out += '\\"';
                continue;
            } // "
            if (c === 92) {
                out += '\\\\';
                continue;
            } // backslash
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
            if (c === 7) {
                out += '\\a';
                continue;
            }
            if (c === 8) {
                out += '\\b';
                continue;
            }
            if (c === 12) {
                out += '\\f';
                continue;
            }
            if (c === 11) {
                out += '\\v';
                continue;
            }
            if (c >= 32 && c < 127) {
                out += value[i];
                continue;
            }
            out += '\\' + String(c);
        }
        return out + '"';
    }
}
exports.LuaPrinter = LuaPrinter;
