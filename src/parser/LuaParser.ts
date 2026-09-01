/**
 * Project: Gungnir - Lua 5.1 Lexer & Parser
 *
 * A complete recursive-descent parser for Lua 5.1 that produces
 * a structured AST compatible with all Gungnir obfuscation plugins
 * and the LuaWriter serializer.
 *
 * This is the CORE component that enables all advanced obfuscation
 * techniques: without a real parser, the CLI was wrapping source
 * as GungnirRawStatement and all AST-based plugins could not work.
 */

// ============ Token Types ============

export enum TokenType {
  // Literals
  Number = 'Number',
  String = 'String',
  Name = 'Name',

  // Keywords
  And = 'and',
  Break = 'break',
  Do = 'do',
  Else = 'else',
  Elseif = 'elseif',
  End = 'end',
  False = 'false',
  For = 'for',
  Function = 'function',
  If = 'if',
  In = 'in',
  Local = 'local',
  Nil = 'nil',
  Not = 'not',
  Or = 'or',
  Repeat = 'repeat',
  Return = 'return',
  Then = 'then',
  True = 'true',
  Until = 'until',
  While = 'while',

  // Symbols
  Plus = '+',
  Minus = '-',
  Star = '*',
  Slash = '/',
  Percent = '%',
  Caret = '^',
  Hash = '#',
  Ampersand = '&',
  Tilde = '~',
  Pipe = '|',
  LtLt = '<<',
  GtGt = '>>',
  SlashSlash = '//',
  EqEq = '==',
  TildeEq = '~=',
  LtEq = '<=',
  GtEq = '>=',
  Lt = '<',
  Gt = '>',
  Eq = '=',
  LParen = '(',
  RParen = ')',
  LBrace = '{',
  RBrace = '}',
  LBracket = '[',
  RBracket = ']',
  Semicolon = ';',
  Colon = ':',
  Comma = ',',
  Dot = '.',
  DotDot = '..',
  DotDotDot = '...',

  // Special
  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

// ============ AST Node Types (compatible with existing plugins) ============

export interface ASTNode {
  type: string;
  [key: string]: any;
}

export interface Chunk extends ASTNode {
  type: 'Chunk';
  body: ASTNode[];
}

export interface Identifier extends ASTNode {
  type: 'Identifier';
  name: string;
}

// ============ Lexer ============

const KEYWORDS: Record<string, TokenType> = {
  and: TokenType.And,
  break: TokenType.Break,
  do: TokenType.Do,
  else: TokenType.Else,
  elseif: TokenType.Elseif,
  end: TokenType.End,
  false: TokenType.False,
  for: TokenType.For,
  function: TokenType.Function,
  if: TokenType.If,
  in: TokenType.In,
  local: TokenType.Local,
  nil: TokenType.Nil,
  not: TokenType.Not,
  or: TokenType.Or,
  repeat: TokenType.Repeat,
  return: TokenType.Return,
  then: TokenType.Then,
  true: TokenType.True,
  until: TokenType.Until,
  while: TokenType.While,
};

export class Lexer {
  private source: string;
  private pos = 0;
  private line = 1;
  private column = 1;
  private tokens: Token[] = [];

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    while (this.pos < this.source.length) {
      this.skipWhitespaceAndComments();
      if (this.pos >= this.source.length) break;

      const ch = this.source[this.pos];
      const startLine = this.line;
      const startCol = this.column;

      // Number
      if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(this.source[this.pos + 1] || ''))) {
        this.readNumber(startLine, startCol);
        continue;
      }

      // String
      if (ch === '"' || ch === "'") {
        this.readString(ch, startLine, startCol);
        continue;
      }

      // Long string / long comment
      if (ch === '[' && (this.source[this.pos + 1] === '[' || this.source[this.pos + 1] === '=')) {
        this.readLongString(startLine, startCol);
        continue;
      }

      // Identifier / keyword
      if (/[a-zA-Z_]/.test(ch)) {
        this.readIdentifier(startLine, startCol);
        continue;
      }

      // Multi-char operators
      const twoChar = this.source.substr(this.pos, 2);
      const threeChar = this.source.substr(this.pos, 3);

      if (threeChar === '...') {
        this.addToken(TokenType.DotDotDot, '...', startLine, startCol);
        this.advance(3);
        continue;
      }
      if (threeChar === '<<=') { /* not in Lua 5.1 */ }

      const twoCharMap: Record<string, TokenType> = {
        '==': TokenType.EqEq,
        '~=': TokenType.TildeEq,
        '<=': TokenType.LtEq,
        '>=': TokenType.GtEq,
        '..': TokenType.DotDot,
        '<<': TokenType.LtLt,
        '>>': TokenType.GtGt,
        '//': TokenType.SlashSlash,
      };

      if (twoCharMap[twoChar]) {
        this.addToken(twoCharMap[twoChar], twoChar, startLine, startCol);
        this.advance(2);
        continue;
      }

      // Single-char symbols
      const singleCharMap: Record<string, TokenType> = {
        '+': TokenType.Plus,
        '-': TokenType.Minus,
        '*': TokenType.Star,
        '/': TokenType.Slash,
        '%': TokenType.Percent,
        '^': TokenType.Caret,
        '#': TokenType.Hash,
        '&': TokenType.Ampersand,
        '~': TokenType.Tilde,
        '|': TokenType.Pipe,
        '<': TokenType.Lt,
        '>': TokenType.Gt,
        '=': TokenType.Eq,
        '(': TokenType.LParen,
        ')': TokenType.RParen,
        '{': TokenType.LBrace,
        '}': TokenType.RBrace,
        '[': TokenType.LBracket,
        ']': TokenType.RBracket,
        ';': TokenType.Semicolon,
        ':': TokenType.Colon,
        ',': TokenType.Comma,
        '.': TokenType.Dot,
      };

      if (singleCharMap[ch]) {
        this.addToken(singleCharMap[ch], ch, startLine, startCol);
        this.advance(1);
        continue;
      }

      // Unknown character - skip
      this.advance(1);
    }

    this.addToken(TokenType.EOF, '', this.line, this.column);
    return this.tokens;
  }

  private skipWhitespaceAndComments(): void {
    while (this.pos < this.source.length) {
      const ch = this.source[this.pos];

      // Whitespace
      if (ch === ' ' || ch === '\t' || ch === '\r') {
        this.advance(1);
        continue;
      }
      if (ch === '\n') {
        this.line++;
        this.column = 1;
        this.pos++;
        continue;
      }

      // Short comment
      if (ch === '-' && this.source[this.pos + 1] === '-') {
        // Check if long comment
        if (this.source[this.pos + 2] === '[' && (this.source[this.pos + 3] === '[' || this.source[this.pos + 3] === '=')) {
          this.skipLongComment();
          continue;
        }
        // Short comment - skip to end of line
        while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
          this.advance(1);
        }
        continue;
      }

      break;
    }
  }

  private skipLongComment(): void {
    // Skip --[
    this.advance(3);
    let level = 0;
    while (this.source[this.pos] === '=') {
      level++;
      this.advance(1);
    }
    if (this.source[this.pos] !== '[') {
      // Not a long bracket, just skip rest of line
      while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
        this.advance(1);
      }
      return;
    }
    this.advance(1); // skip [

    const closePattern = ']' + '='.repeat(level) + ']';
    while (this.pos < this.source.length) {
      if (this.source.substr(this.pos, closePattern.length) === closePattern) {
        this.advance(closePattern.length);
        return;
      }
      if (this.source[this.pos] === '\n') {
        this.line++;
        this.column = 1;
      }
      this.advance(1);
    }
  }

  private readNumber(startLine: number, startCol: number): void {
    let num = '';
    const start = this.pos;

    // Hexadecimal
    if (this.source[this.pos] === '0' && (this.source[this.pos + 1] === 'x' || this.source[this.pos + 1] === 'X')) {
      num = this.source.substr(this.pos, 2);
      this.advance(2);
      while (this.pos < this.source.length && /[0-9a-fA-F]/.test(this.source[this.pos])) {
        num += this.source[this.pos];
        this.advance(1);
      }
      this.addToken(TokenType.Number, num, startLine, startCol);
      return;
    }

    // Decimal / float
    while (this.pos < this.source.length && /[0-9.]/.test(this.source[this.pos])) {
      num += this.source[this.pos];
      this.advance(1);
    }
    // Exponent
    if (this.pos < this.source.length && (this.source[this.pos] === 'e' || this.source[this.pos] === 'E')) {
      num += this.source[this.pos];
      this.advance(1);
      if (this.source[this.pos] === '+' || this.source[this.pos] === '-') {
        num += this.source[this.pos];
        this.advance(1);
      }
      while (this.pos < this.source.length && /[0-9]/.test(this.source[this.pos])) {
        num += this.source[this.pos];
        this.advance(1);
      }
    }

    this.addToken(TokenType.Number, num, startLine, startCol);
  }

  private readString(quote: string, startLine: number, startCol: number): void {
    this.advance(1); // skip opening quote
    let str = '';
    while (this.pos < this.source.length && this.source[this.pos] !== quote) {
      if (this.source[this.pos] === '\\') {
        this.advance(1);
        const esc = this.source[this.pos];
        switch (esc) {
          case 'n': str += '\n'; break;
          case 't': str += '\t'; break;
          case 'r': str += '\r'; break;
          case '\\': str += '\\'; break;
          case '"': str += '"'; break;
          case "'": str += "'"; break;
          case '0': str += '\0'; break;
          case 'a': str += '\x07'; break;
          case 'b': str += '\b'; break;
          case 'f': str += '\f'; break;
          case 'v': str += '\v'; break;
          case 'z': break; // skip whitespace
          case 'x': {
            this.advance(1);
            const hex = this.source.substr(this.pos, 2);
            str += String.fromCharCode(parseInt(hex, 16));
            this.advance(2);
            continue;
          }
          case 'u': {
            this.advance(1);
            if (this.source[this.pos] === '{') {
              this.advance(1);
              let hex = '';
              while (this.source[this.pos] !== '}') {
                hex += this.source[this.pos];
                this.advance(1);
              }
              this.advance(1); // skip }
              str += String.fromCodePoint(parseInt(hex, 16));
              continue;
            }
            break;
          }
          default:
            if (/[0-9]/.test(esc)) {
              let dec = esc;
              this.advance(1);
              while (this.pos < this.source.length && /[0-9]/.test(this.source[this.pos]) && dec.length < 3) {
                dec += this.source[this.pos];
                this.advance(1);
              }
              str += String.fromCharCode(parseInt(dec, 10));
              continue;
            }
            str += esc;
        }
        this.advance(1);
      } else {
        if (this.source[this.pos] === '\n') {
          this.line++;
          this.column = 1;
        }
        str += this.source[this.pos];
        this.advance(1);
      }
    }
    this.advance(1); // skip closing quote
    this.addToken(TokenType.String, str, startLine, startCol);
  }

  private readLongString(startLine: number, startCol: number): void {
    this.advance(1); // skip [
    let level = 0;
    while (this.source[this.pos] === '=') {
      level++;
      this.advance(1);
    }
    this.advance(1); // skip [
    // Skip first newline if present
    if (this.source[this.pos] === '\n') {
      this.line++;
      this.column = 1;
      this.advance(1);
    }

    let str = '';
    const closePattern = ']' + '='.repeat(level) + ']';
    while (this.pos < this.source.length) {
      if (this.source.substr(this.pos, closePattern.length) === closePattern) {
        this.advance(closePattern.length);
        break;
      }
      if (this.source[this.pos] === '\n') {
        this.line++;
        this.column = 1;
      }
      str += this.source[this.pos];
      this.advance(1);
    }
    this.addToken(TokenType.String, str, startLine, startCol);
  }

  private readIdentifier(startLine: number, startCol: number): void {
    let name = '';
    while (this.pos < this.source.length && /[a-zA-Z0-9_]/.test(this.source[this.pos])) {
      name += this.source[this.pos];
      this.advance(1);
    }
    const type = KEYWORDS[name] || TokenType.Name;
    this.addToken(type, name, startLine, startCol);
  }

  private addToken(type: TokenType, value: string, line: number, column: number): void {
    this.tokens.push({ type, value, line, column });
  }

  private advance(count: number): void {
    this.pos += count;
    this.column += count;
  }
}

// ============ Parser ============

export class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Chunk {
    const body = this.parseBlock();
    return { type: 'Chunk', body };
  }

  // ---- Token helpers ----

  private current(): Token {
    return this.tokens[this.pos];
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private next(): Token {
    return this.tokens[this.pos++];
  }

  private expect(type: TokenType): Token {
    const tok = this.current();
    if (tok.type !== type) {
      throw new Error(`Expected ${type} but got ${tok.type} ('${tok.value}') at line ${tok.line}:${tok.column}`);
    }
    return this.next();
  }

  private check(type: TokenType): boolean {
    return this.current().type === type;
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.next();
      return true;
    }
    return false;
  }

  private isBlockEnd(): boolean {
    const t = this.current().type;
    return t === TokenType.End || t === TokenType.Else || t === TokenType.Elseif
      || t === TokenType.Until || t === TokenType.EOF;
  }

  // ---- Block & Statements ----

  private parseBlock(): ASTNode[] {
    const statements: ASTNode[] = [];
    while (!this.isBlockEnd()) {
      const stmt = this.parseStatement();
      if (stmt) statements.push(stmt);
      this.match(TokenType.Semicolon);
    }
    return statements;
  }

  private parseStatement(): ASTNode | null {
    const tok = this.current();

    switch (tok.type) {
      case TokenType.If: return this.parseIfStatement();
      case TokenType.While: return this.parseWhileStatement();
      case TokenType.Do: return this.parseDoStatement();
      case TokenType.For: return this.parseForStatement();
      case TokenType.Repeat: return this.parseRepeatStatement();
      case TokenType.Function: return this.parseFunctionDeclaration();
      case TokenType.Local: return this.parseLocalStatement();
      case TokenType.Return: return this.parseReturnStatement();
      case TokenType.Break: return this.parseBreakStatement();
      case TokenType.Semicolon: this.next(); return null;
      default: return this.parseAssignmentOrCall();
    }
  }

  private parseIfStatement(): ASTNode {
    this.expect(TokenType.If);
    const clauses: { condition: ASTNode; body: ASTNode[] }[] = [];

    // First if clause
    const condition = this.parseExpression();
    this.expect(TokenType.Then);
    const body = this.parseBlock();
    clauses.push({ condition, body });

    // elseif clauses
    while (this.match(TokenType.Elseif)) {
      const cond = this.parseExpression();
      this.expect(TokenType.Then);
      const b = this.parseBlock();
      clauses.push({ condition: cond, body: b });
    }

    // else clause
    let else_: ASTNode[] = [];
    if (this.match(TokenType.Else)) {
      else_ = this.parseBlock();
    }

    this.expect(TokenType.End);
    return { type: 'IfStatement', clauses, else_ };
  }

  private parseWhileStatement(): ASTNode {
    this.expect(TokenType.While);
    const condition = this.parseExpression();
    this.expect(TokenType.Do);
    const body = this.parseBlock();
    this.expect(TokenType.End);
    return { type: 'WhileStatement', condition, body };
  }

  private parseDoStatement(): ASTNode {
    this.expect(TokenType.Do);
    const body = this.parseBlock();
    this.expect(TokenType.End);
    return { type: 'DoStatement', body };
  }

  private parseForStatement(): ASTNode {
    this.expect(TokenType.For);
    const varName = this.expect(TokenType.Name).value;

    if (this.match(TokenType.Eq)) {
      // Numeric for: for i = start, end [, step] do
      const start = this.parseExpression();
      this.expect(TokenType.Comma);
      const end = this.parseExpression();
      let step: ASTNode | null = null;
      if (this.match(TokenType.Comma)) {
        step = this.parseExpression();
      }
      this.expect(TokenType.Do);
      const body = this.parseBlock();
      this.expect(TokenType.End);
      return {
        type: 'ForNumericStatement',
        variable: { type: 'Identifier', name: varName },
        start, end, step, body,
      };
    } else {
      // Generic for: for k, v in iter do
      const variables: ASTNode[] = [{ type: 'Identifier', name: varName }];
      while (this.match(TokenType.Comma)) {
        variables.push({ type: 'Identifier', name: this.expect(TokenType.Name).value });
      }
      this.expect(TokenType.In);
      const iterators: ASTNode[] = [this.parseExpression()];
      while (this.match(TokenType.Comma)) {
        iterators.push(this.parseExpression());
      }
      this.expect(TokenType.Do);
      const body = this.parseBlock();
      this.expect(TokenType.End);
      return { type: 'ForGenericStatement', variables, iterators, body };
    }
  }

  private parseRepeatStatement(): ASTNode {
    this.expect(TokenType.Repeat);
    const body = this.parseBlock();
    this.expect(TokenType.Until);
    const condition = this.parseExpression();
    return { type: 'RepeatStatement', body, condition };
  }

  private parseFunctionDeclaration(): ASTNode {
    this.expect(TokenType.Function);
    const identifier = this.parseFunctionName();
    const { parameters, body } = this.parseFunctionBody();
    if (identifier.type === 'Identifier' && !identifier.isMethod) {
      return { type: 'FunctionDeclaration', identifier, parameters, body };
    }
    return { type: 'FunctionDeclaration', identifier, parameters, body };
  }

  private parseFunctionName(): ASTNode {
    let base: ASTNode = { type: 'Identifier', name: this.expect(TokenType.Name).value };

    while (this.match(TokenType.Dot)) {
      const prop = this.expect(TokenType.Name).value;
      base = {
        type: 'MemberExpression',
        indexer: '.',
        identifier: { type: 'Identifier', name: prop },
        base,
      };
    }

    let isMethod = false;
    if (this.match(TokenType.Colon)) {
      isMethod = true;
      const method = this.expect(TokenType.Name).value;
      base = {
        type: 'MemberExpression',
        indexer: ':',
        identifier: { type: 'Identifier', name: method },
        base,
      };
    }

    (base as any).isMethod = isMethod;
    return base;
  }

  private parseFunctionBody(): { parameters: ASTNode[]; body: ASTNode[] } {
    this.expect(TokenType.LParen);
    const parameters: ASTNode[] = [];

    if (!this.check(TokenType.RParen)) {
      do {
        if (this.check(TokenType.DotDotDot)) {
          parameters.push({ type: 'VarargLiteral' });
          this.next();
          break;
        }
        parameters.push({ type: 'Identifier', name: this.expect(TokenType.Name).value });
      } while (this.match(TokenType.Comma));
    }

    this.expect(TokenType.RParen);
    const body = this.parseBlock();
    this.expect(TokenType.End);
    return { parameters, body };
  }

  private parseLocalStatement(): ASTNode {
    this.expect(TokenType.Local);

    if (this.check(TokenType.Function)) {
      this.next();
      const identifier = { type: 'Identifier', name: this.expect(TokenType.Name).value };
      const { parameters, body } = this.parseFunctionBody();
      return { type: 'LocalFunctionStatement', identifier, parameters, body };
    }

    const variables: ASTNode[] = [{ type: 'Identifier', name: this.expect(TokenType.Name).value }];
    while (this.match(TokenType.Comma)) {
      variables.push({ type: 'Identifier', name: this.expect(TokenType.Name).value });
    }

    let init: ASTNode[] = [];
    if (this.match(TokenType.Eq)) {
      init.push(this.parseExpression());
      while (this.match(TokenType.Comma)) {
        init.push(this.parseExpression());
      }
    }

    return { type: 'LocalStatement', variables, init };
  }

  private parseReturnStatement(): ASTNode {
    this.expect(TokenType.Return);
    const args: ASTNode[] = [];
    if (!this.isBlockEnd() && !this.check(TokenType.Semicolon)) {
      args.push(this.parseExpression());
      while (this.match(TokenType.Comma)) {
        args.push(this.parseExpression());
      }
    }
    return { type: 'ReturnStatement', arguments: args };
  }

  private parseBreakStatement(): ASTNode {
    this.expect(TokenType.Break);
    return { type: 'BreakStatement' };
  }

  private parseAssignmentOrCall(): ASTNode {
    const startPos = this.pos;
    const expr = this.parseExpression();

    // Check if this is an assignment
    if (this.check(TokenType.Eq) || this.check(TokenType.Comma)) {
      // Could be assignment: var1, var2 = expr1, expr2
      // But we already parsed expr as primary... need to re-parse as lhs
      // For simplicity, handle single target assignment
      if (this.check(TokenType.Eq)) {
        this.next();
        const value = this.parseExpression();
        return {
          type: 'AssignmentStatement',
          variables: [expr],
          init: [value],
        };
      }
      // Multi-variable assignment
      if (this.check(TokenType.Comma)) {
        const variables: ASTNode[] = [expr];
        while (this.match(TokenType.Comma)) {
          variables.push(this.parseExpression());
        }
        this.expect(TokenType.Eq);
        const init: ASTNode[] = [this.parseExpression()];
        while (this.match(TokenType.Comma)) {
          init.push(this.parseExpression());
        }
        return { type: 'AssignmentStatement', variables, init };
      }
    }

    // It's a call statement
    return { type: 'CallStatement', expression: expr };
  }

  // ---- Expressions (Pratt parser) ----

  private parseExpression(): ASTNode {
    return this.parseSubexpression(0);
  }

  private parseSubexpression(minPrec: number): ASTNode {
    let left = this.parsePrefix();

    while (true) {
      const tok = this.current();
      const prec = this.getBinaryPrecedence(tok.type);

      if (prec === 0 || prec <= minPrec) break;

      this.next();
      const right = this.parseSubexpression(prec);
      left = {
        type: 'BinaryExpression',
        operator: tok.value,
        left,
        right,
      };
    }

    return left;
  }

  private getBinaryPrecedence(type: TokenType): number {
    switch (type) {
      case TokenType.Or: return 1;
      case TokenType.And: return 2;
      case TokenType.Lt: case TokenType.Gt: case TokenType.LtEq:
      case TokenType.GtEq: case TokenType.EqEq: case TokenType.TildeEq:
        return 3;
      case TokenType.DotDot: return 4;
      case TokenType.Plus: case TokenType.Minus: return 5;
      case TokenType.Star: case TokenType.Slash: case TokenType.Percent: return 6;
      case TokenType.Not: return 7; // unary only
      case TokenType.Caret: return 8;
      default: return 0;
    }
  }

  private parsePrefix(): ASTNode {
    const tok = this.current();

    // Unary operators
    if (tok.type === TokenType.Not || tok.type === TokenType.Minus || tok.type === TokenType.Hash) {
      this.next();
      const argument = this.parseSubexpression(7);
      return { type: 'UnaryExpression', operator: tok.value, argument };
    }

    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    const tok = this.current();

    switch (tok.type) {
      case TokenType.Number:
        this.next();
        return { type: 'NumericLiteral', value: parseFloat(tok.value), raw: tok.value };

      case TokenType.String:
        this.next();
        return { type: 'StringLiteral', value: tok.value, raw: JSON.stringify(tok.value) };

      case TokenType.True:
        this.next();
        return { type: 'BooleanLiteral', value: true };

      case TokenType.False:
        this.next();
        return { type: 'BooleanLiteral', value: false };

      case TokenType.Nil:
        this.next();
        return { type: 'NilLiteral' };

      case TokenType.DotDotDot:
        this.next();
        return { type: 'VarargLiteral' };

      case TokenType.LBrace:
        return this.parseTableConstructor();

      case TokenType.Function:
        this.next();
        const { parameters, body } = this.parseFunctionBody();
        return { type: 'FunctionExpression', parameters, body };

      case TokenType.LParen:
        this.next();
        const expr = this.parseExpression();
        this.expect(TokenType.RParen);
        return expr;

      case TokenType.Name:
        this.next();
        return this.parseSuffix({ type: 'Identifier', name: tok.value });

      default:
        throw new Error(`Unexpected token: ${tok.type} ('${tok.value}') at line ${tok.line}:${tok.column}`);
    }
  }

  private parseSuffix(node: ASTNode): ASTNode {
    while (true) {
      const tok = this.current();

      if (tok.type === TokenType.Dot) {
        this.next();
        const prop = this.expect(TokenType.Name).value;
        node = {
          type: 'MemberExpression',
          indexer: '.',
          identifier: { type: 'Identifier', name: prop },
          base: node,
        };
        continue;
      }

      if (tok.type === TokenType.Colon) {
        this.next();
        const method = this.expect(TokenType.Name).value;
        node = {
          type: 'MemberExpression',
          indexer: ':',
          identifier: { type: 'Identifier', name: method },
          base: node,
        };
        // Method call must have arguments
        if (this.check(TokenType.LParen) || this.check(TokenType.String) || this.check(TokenType.LBrace)) {
          node = this.parseCallArgs(node);
        }
        continue;
      }

      if (tok.type === TokenType.LBracket) {
        this.next();
        const index = this.parseExpression();
        this.expect(TokenType.RBracket);
        node = {
          type: 'MemberExpression',
          indexer: '[]',
          identifier: index,
          base: node,
        };
        continue;
      }

      if (tok.type === TokenType.LParen || tok.type === TokenType.String || tok.type === TokenType.LBrace) {
        node = this.parseCallArgs(node);
        continue;
      }

      break;
    }

    return node;
  }

  private parseCallArgs(base: ASTNode): ASTNode {
    const args: ASTNode[] = [];

    if (this.match(TokenType.LParen)) {
      if (!this.check(TokenType.RParen)) {
        args.push(this.parseExpression());
        while (this.match(TokenType.Comma)) {
          args.push(this.parseExpression());
        }
      }
      this.expect(TokenType.RParen);
    } else if (this.check(TokenType.String)) {
      args.push(this.parsePrimary());
    } else if (this.check(TokenType.LBrace)) {
      args.push(this.parseTableConstructor());
    }

    return { type: 'CallExpression', base, arguments: args };
  }

  private parseTableConstructor(): ASTNode {
    this.expect(TokenType.LBrace);
    const fields: ASTNode[] = [];

    while (!this.check(TokenType.RBrace)) {
      if (this.check(TokenType.Name) && this.tokens[this.pos + 1]?.type === TokenType.Eq) {
        // key = value
        const key = this.next().value;
        this.next(); // skip =
        const value = this.parseExpression();
        fields.push({
          type: 'TableKey',
          key: { type: 'StringLiteral', value: key },
          value,
        });
      } else if (this.check(TokenType.LBracket)) {
        // [expr] = value
        this.next();
        const key = this.parseExpression();
        this.expect(TokenType.RBracket);
        this.expect(TokenType.Eq);
        const value = this.parseExpression();
        fields.push({ type: 'TableKey', key, value });
      } else {
        // array element
        fields.push({ type: 'TableValue', value: this.parseExpression() });
      }

      if (!this.match(TokenType.Comma) && !this.match(TokenType.Semicolon)) break;
    }

    this.expect(TokenType.RBrace);
    return { type: 'TableConstructorExpression', fields };
  }
}

// ============ Convenience function ============

export function parseLua(source: string): Chunk {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  return parser.parse();
}
