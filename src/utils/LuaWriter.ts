/**
 * Project: Gungnir - Lua Code Writer
 *
 * Serializes the obfuscated AST back into Lua 5.1 source code.
 * Handles all node types including raw statements (GungnirRawStatement).
 */
import { Chunk, LuaNode } from '../core/types';

export class LuaWriter {
  private indentLevel = 0;
  private output = '';

  /**
   * Write a complete Chunk to Lua source code.
   */
  write(ast: Chunk): string {
    this.output = '';
    this.indentLevel = 0;
    this.writeStatements(ast.body);
    return this.output;
  }

  /**
   * Write a list of statements.
   */
  private writeStatements(statements: LuaNode[]): void {
    for (const stmt of statements) {
      this.writeStatement(stmt);
    }
  }

  /**
   * Write a single statement.
   */
  private writeStatement(node: LuaNode): void {
    const n = node as unknown as Record<string, unknown>;
    const type = String(n.type ?? '');

    switch (type) {
      case 'GungnirRawStatement':
        this.writeRaw(n);
        break;
      case 'LocalStatement':
        this.writeLocalStatement(n);
        break;
      case 'AssignmentStatement':
        this.writeAssignment(n);
        break;
      case 'CallStatement':
        this.writeCallStatement(n);
        break;
      case 'IfStatement':
        this.writeIfStatement(n);
        break;
      case 'WhileStatement':
        this.writeWhileStatement(n);
        break;
      case 'ForNumericStatement':
        this.writeForNumeric(n);
        break;
      case 'ForGenericStatement':
        this.writeForGeneric(n);
        break;
      case 'DoStatement':
        this.writeDoStatement(n);
        break;
      case 'ReturnStatement':
        this.writeReturn(n);
        break;
      case 'BreakStatement':
        this.writeBreak();
        break;
      case 'FunctionDeclaration':
      case 'LocalFunctionStatement':
        this.writeFunctionDeclaration(n);
        break;
      case 'RepeatStatement':
        this.writeRepeat(n);
        break;
      default:
        // Unknown node type - try to serialize as expression or skip
        this.writeExpression(node);
        this.output += '\n';
    }
  }

  /**
   * Write a raw statement (injected code).
   */
  private writeRaw(n: Record<string, unknown>): void {
    const code = String(n.code ?? '');
    this.output += code;
    if (!code.endsWith('\n')) {
      this.output += '\n';
    }
  }

  /**
   * Write local declaration.
   */
  private writeLocalStatement(n: Record<string, unknown>): void {
    const variables = (n.variables as { name: string }[] ?? []).map(v => v.name).join(', ');
    const init = n.init as LuaNode[] | undefined;
    if (init && init.length > 0) {
      const initStr = init.map(e => this.expressionToString(e)).join(', ');
      this.output += `${this.indent()}local ${variables} = ${initStr}\n`;
    } else {
      this.output += `${this.indent()}local ${variables}\n`;
    }
  }

  /**
   * Write assignment.
   */
  private writeAssignment(n: Record<string, unknown>): void {
    const variables = (n.variables as LuaNode[] ?? []).map(v => this.expressionToString(v)).join(', ');
    const init = (n.init as LuaNode[] ?? []).map(e => this.expressionToString(e)).join(', ');
    this.output += `${this.indent()}${variables} = ${init}\n`;
  }

  /**
   * Write call statement.
   */
  private writeCallStatement(n: Record<string, unknown>): void {
    const expr = this.expressionToString(n.expression as LuaNode);
    this.output += `${this.indent()}${expr}\n`;
  }

  /**
   * Write if statement.
   */
  private writeIfStatement(n: Record<string, unknown>): void {
    const clauses = n.clauses as { condition: LuaNode; body: LuaNode[] }[] ?? [];
    for (let i = 0; i < clauses.length; i++) {
      const clause = clauses[i];
      const keyword = i === 0 ? 'if' : 'elseif';
      const cond = this.expressionToString(clause.condition);
      this.output += `${this.indent()}${keyword} ${cond} then\n`;
      this.indentLevel++;
      this.writeStatements(clause.body);
      this.indentLevel--;
    }
    if (n.else_ && Array.isArray(n.else_) && (n.else_ as LuaNode[]).length > 0) {
      this.output += `${this.indent()}else\n`;
      this.indentLevel++;
      this.writeStatements(n.else_ as LuaNode[]);
      this.indentLevel--;
    }
    this.output += `${this.indent()}end\n`;
  }

  /**
   * Write while statement.
   */
  private writeWhileStatement(n: Record<string, unknown>): void {
    const cond = this.expressionToString(n.condition as LuaNode);
    this.output += `${this.indent()}while ${cond} do\n`;
    this.indentLevel++;
    this.writeStatements(n.body as LuaNode[] ?? []);
    this.indentLevel--;
    this.output += `${this.indent()}end\n`;
  }

  /**
   * Write numeric for loop.
   */
  private writeForNumeric(n: Record<string, unknown>): void {
    const varName = (n.variable as { name: string })?.name ?? 'i';
    const start = this.expressionToString(n.start as LuaNode);
    const end = this.expressionToString(n.end as LuaNode);
    const step = n.step ? this.expressionToString(n.step as LuaNode) : null;
    const stepStr = step ? `, ${step}` : '';
    this.output += `${this.indent()}for ${varName} = ${start}, ${end}${stepStr} do\n`;
    this.indentLevel++;
    this.writeStatements(n.body as LuaNode[] ?? []);
    this.indentLevel--;
    this.output += `${this.indent()}end\n`;
  }

  /**
   * Write generic for loop.
   */
  private writeForGeneric(n: Record<string, unknown>): void {
    const vars = (n.variables as { name: string }[] ?? []).map(v => v.name).join(', ');
    const iter = (n.iterators as LuaNode[] ?? []).map(e => this.expressionToString(e)).join(', ');
    this.output += `${this.indent()}for ${vars} in ${iter} do\n`;
    this.indentLevel++;
    this.writeStatements(n.body as LuaNode[] ?? []);
    this.indentLevel--;
    this.output += `${this.indent()}end\n`;
  }

  /**
   * Write do block.
   */
  private writeDoStatement(n: Record<string, unknown>): void {
    this.output += `${this.indent()}do\n`;
    this.indentLevel++;
    this.writeStatements(n.body as LuaNode[] ?? []);
    this.indentLevel--;
    this.output += `${this.indent()}end\n`;
  }

  /**
   * Write return statement.
   */
  private writeReturn(n: Record<string, unknown>): void {
    const args = (n.arguments as LuaNode[] ?? []).map(e => this.expressionToString(e)).join(', ');
    this.output += `${this.indent()}return ${args}\n`;
  }

  /**
   * Write break statement.
   */
  private writeBreak(): void {
    this.output += `${this.indent()}break\n`;
  }

  /**
   * Write function declaration.
   */
  private writeFunctionDeclaration(n: Record<string, unknown>): void {
    const isLocal = n.type === 'LocalFunctionStatement' || n.isLocal === true;
    const name = (n.identifier as { name: string })?.name ?? 'anonymous';
    const params = this.formatParameters(n.parameters as unknown[] ?? []);
    const localPrefix = isLocal ? 'local ' : '';
    this.output += `${this.indent()}${localPrefix}function ${name}(${params})\n`;
    this.indentLevel++;
    this.writeStatements(n.body as LuaNode[] ?? []);
    this.indentLevel--;
    this.output += `${this.indent()}end\n`;
  }

  /**
   * Write repeat-until.
   */
  private writeRepeat(n: Record<string, unknown>): void {
    this.output += `${this.indent()}repeat\n`;
    this.indentLevel++;
    this.writeStatements(n.body as LuaNode[] ?? []);
    this.indentLevel--;
    const cond = this.expressionToString(n.condition as LuaNode);
    this.output += `${this.indent()}until ${cond}\n`;
  }

  /**
   * Format function parameters.
   */
  private formatParameters(params: unknown[]): string {
    return params.map(p => {
      if (typeof p === 'object' && p !== null) {
        const obj = p as Record<string, unknown>;
        if (obj.type === 'VarargLiteral' || obj.value === '...') return '...';
        if (obj.name) return String(obj.name);
      }
      return String(p);
    }).join(', ');
  }

  /**
   * Convert an expression node to string.
   */
  private expressionToString(node: LuaNode): string {
    const n = node as unknown as Record<string, unknown>;
    const type = String(n.type ?? '');

    switch (type) {
      case 'NumericLiteral':
        return String(n.value);
      case 'StringLiteral':
        return this.quoteString(String(n.value ?? ''));
      case 'BooleanLiteral':
        return n.value ? 'true' : 'false';
      case 'NilLiteral':
        return 'nil';
      case 'Identifier':
        return String(n.name ?? '');
      case 'VarargLiteral':
        return '...';
      case 'BinaryExpression':
        return `(${this.expressionToString(n.left as LuaNode)} ${n.operator} ${this.expressionToString(n.right as LuaNode)})`;
      case 'UnaryExpression':
        return `${n.operator}(${this.expressionToString(n.argument as LuaNode)})`;
      case 'CallExpression': {
        const base = this.expressionToString(n.base as LuaNode);
        const args = (n.arguments as LuaNode[] ?? []).map(a => this.expressionToString(a)).join(', ');
        return `${base}(${args})`;
      }
      case 'MemberExpression': {
        const base = this.expressionToString(n.base as LuaNode);
        const ident = (n.identifier as { name: string })?.name ?? '';
        const indexer = n.indexer === '[' ? `[${this.expressionToString(n.identifier as LuaNode)}]` : `.${ident}`;
        return `${base}${indexer}`;
      }
      case 'IndexExpression': {
        const base = this.expressionToString(n.base as LuaNode);
        const index = this.expressionToString(n.index as LuaNode);
        return `${base}[${index}]`;
      }
      case 'TableConstructorExpression': {
        const fields = (n.fields as Record<string, unknown>[] ?? []).map(f => {
          if (f.type === 'TableKeyString') {
            const key = (f.key as { name: string })?.name ?? '';
            const val = this.expressionToString(f.value as LuaNode);
            return `${key} = ${val}`;
          }
          if (f.type === 'TableKey') {
            const key = this.expressionToString(f.key as LuaNode);
            const val = this.expressionToString(f.value as LuaNode);
            return `[${key}] = ${val}`;
          }
          // TableValue
          return this.expressionToString(f.value as LuaNode);
        }).join(', ');
        return `{${fields}}`;
      }
      case 'FunctionExpression': {
        const params = this.formatParameters(n.parameters as unknown[] ?? []);
        const body = n.body as LuaNode[] ?? [];
        let funcStr = `function(${params})\n`;
        this.indentLevel++;
        const savedOutput = this.output;
        this.output = '';
        this.writeStatements(body);
        funcStr += this.output;
        this.output = savedOutput;
        this.indentLevel--;
        funcStr += `${this.indent()}end`;
        return funcStr;
      }
      case 'GungnirRawStatement':
        return String(n.code ?? '');
      default:
        // Unknown expression type - try to serialize best effort
        if (n.value !== undefined) return String(n.value);
        if (n.name !== undefined) return String(n.name);
        return 'nil';
    }
  }

  /**
   * Write an expression (for expression statements).
   */
  private writeExpression(node: LuaNode): void {
    this.output += `${this.indent()}${this.expressionToString(node)}\n`;
  }

  /**
   * Quote a string as a Lua string literal.
   */
  private quoteString(str: string): string {
    const escaped = str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    return `"${escaped}"`;
  }

  /**
   * Get current indentation string.
   */
  private indent(): string {
    return '  '.repeat(this.indentLevel);
  }
}
