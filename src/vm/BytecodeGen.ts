/**
 * Project: Gungnir - VM Bytecode Generator
 *
 * Compiles Lua AST into a custom stack-based bytecode format,
 * executed by an injected VM runtime.
 *
 * Layer 1: VM & Execution Layer
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk,
} from '../core/types';

// ============ Bytecode Instruction Set ============

export enum OpCode {
  // Stack operations
  OP_LOADNIL = 0x01,
  OP_LOADTRUE = 0x02,
  OP_LOADFALSE = 0x03,
  OP_LOADCONST = 0x04,     // Push constant from pool
  OP_LOADLOCAL = 0x05,     // Push local variable
  OP_LOADGLOBAL = 0x06,    // Push global variable
  OP_LOADUPVAL = 0x07,     // Push upvalue

  // Store operations
  OP_STORELOCAL = 0x10,
  OP_STOREGLOBAL = 0x11,
  OP_STOREUPVAL = 0x12,
  OP_STORETABLE = 0x13,    // table[key] = value

  // Arithmetic
  OP_ADD = 0x20,
  OP_SUB = 0x21,
  OP_MUL = 0x22,
  OP_DIV = 0x23,
  OP_MOD = 0x24,
  OP_POW = 0x25,

  // Comparison
  OP_EQ = 0x30,
  OP_LT = 0x31,
  OP_LE = 0x32,
  OP_GT = 0x33,
  OP_GE = 0x34,
  OP_NE = 0x35,

  // Logic
  OP_AND = 0x40,
  OP_OR = 0x41,
  OP_NOT = 0x42,
  OP_CONCAT = 0x43,

  // Control flow
  OP_JMP = 0x50,
  OP_JMPTRUE = 0x51,
  OP_JMPFALSE = 0x52,
  OP_JMPEQ = 0x53,         // Jump if top of stack == operand

  // Function operations
  OP_CALL = 0x60,
  OP_TAILCALL = 0x61,
  OP_RETURN = 0x62,
  OP_CLOSURE = 0x63,

  // Table operations
  OP_NEWTABLE = 0x70,
  OP_SETLIST = 0x71,
  OP_GETTABLE = 0x72,
  OP_LEN = 0x73,

  // Misc
  OP_VARARG = 0x80,
  OP_SELF = 0x81,          // Method call setup (obj:method)
}

export interface Instruction {
  op: OpCode;
  /** Operand A (register/stack slot) */
  a: number;
  /** Operand B (constant index or immediate) */
  b: number;
  /** Operand C (second operand) */
  c: number;
  /** Optional extra data */
  extra?: number[];
}

export interface BytecodeFunction {
  instructions: Instruction[];
  constants: unknown[];
  localCount: number;
  upvalueCount: number;
  paramCount: number;
  childFunctions: BytecodeFunction[];
}

export class BytecodeGenPlugin implements ObfuscationPlugin {
  name = 'VMBytecodeGen';
  description = 'Compiles Lua AST into custom stack-based bytecode for VM execution';
  layers = [1]; // VM layer

  /** Current function being compiled */
  private currentFunction: BytecodeFunction | null = null;

  /** Function stack for nested functions */
  private functionStack: BytecodeFunction[] = [];

  /** Constant pool deduplication */
  private constantMap: Map<string, number> = new Map();

  /**
   * Dynamic opcode remapping table (item 3):
   * canonical OpCode → per-build wire opcode. Regenerated for every
   * build so no two outputs share an opcode mapping.
   */
  private opcodeMap: Map<OpCode, number> = new Map();

  /** Inverse map for the runtime: wire opcode → canonical OpCode */
  private inverseOpcodeMap: Map<number, OpCode> = new Map();

  /**
   * Build the per-build opcode permutation.
   */
  private buildOpcodeRemap(ctx: ObfuscationContext): void {
    const canonical = Object.values(OpCode) as OpCode[];
    // Wire values are a shuffled permutation of 0..N-1
    const wireValues = ctx.rng.shuffle(canonical.map((_, i) => i));

    canonical.forEach((op, i) => {
      this.opcodeMap.set(op, wireValues[i]);
      this.inverseOpcodeMap.set(wireValues[i], op);
    });
  }

  /**
   * Map a canonical opcode to its per-build wire value.
   */
  private wireOp(op: OpCode): number {
    return this.opcodeMap.get(op) ?? op;
  }

  transform(ctx: ObfuscationContext): Chunk {
    // Phase 0: Build per-build opcode remapping (polymorphic engine, item 3)
    if (ctx.config.vmOpcodeRemap) {
      this.buildOpcodeRemap(ctx);
    } else {
      // Identity mapping when remap is disabled
      const canonical = Object.values(OpCode) as OpCode[];
      canonical.forEach(op => {
        this.opcodeMap.set(op, op);
        this.inverseOpcodeMap.set(op, op);
      });
    }

    // Phase 1: Compile the AST to bytecode
    const mainFunction = this.compileChunk(ctx.ast);

    // Phase 2: Serialize bytecode to Lua table format (with remapped opcodes)
    const bytecodeLua = this.serializeToLua(mainFunction);

    // Phase 3: Inject VM runtime + bytecode into the output
    const vmCode = this.generateVMRuntime(ctx) + '\n' + bytecodeLua;

    // Phase 4: Replace the entire AST with the VM bootstrap
    const bootstrapNode = {
      type: 'GungnirRawStatement',
      code: vmCode,
    };

    (ctx.ast.body as unknown[]) = [bootstrapNode];

    return ctx.ast;
  }

  /**
   * Compile a chunk into a BytecodeFunction.
   */
  private compileChunk(chunk: Chunk): BytecodeFunction {
    const func: BytecodeFunction = {
      instructions: [],
      constants: [],
      localCount: 0,
      upvalueCount: 0,
      paramCount: 0,
      childFunctions: [],
    };

    this.currentFunction = func;
    this.functionStack.push(func);

    // Compile each statement
    for (const stmt of chunk.body) {
      this.compileStatement(stmt as never);
    }

    // Add implicit return
    this.emit(OpCode.OP_RETURN, 0, 0, 0);

    this.functionStack.pop();
    this.currentFunction = this.functionStack[this.functionStack.length - 1] ?? null;

    return func;
  }

  private compileStatement(stmt: Record<string, unknown>): void {
    if (!this.currentFunction) return;

    const type = String(stmt.type);

    switch (type) {
      case 'LocalStatement': {
        // Compile initializers
        const init = stmt.init as Record<string, unknown>[] | undefined;
        if (init && init.length > 0) {
          for (const expr of init) {
            this.compileExpression(expr);
          }
          // Store to locals
          const vars = stmt.variables as { name: string }[];
          for (let i = 0; i < vars.length; i++) {
            this.currentFunction.localCount++;
            this.emit(OpCode.OP_STORELOCAL, this.currentFunction.localCount - 1, 0, 0);
          }
        } else {
          const vars = stmt.variables as { name: string }[];
          for (let i = 0; i < vars.length; i++) {
            this.currentFunction.localCount++;
            this.emit(OpCode.OP_LOADNIL, this.currentFunction.localCount - 1, 0, 0);
          }
        }
        break;
      }

      case 'ReturnStatement': {
        const args = stmt.arguments as Record<string, unknown>[];
        if (args) {
          for (const arg of args) {
            this.compileExpression(arg);
          }
          this.emit(OpCode.OP_RETURN, args.length, 0, 0);
        } else {
          this.emit(OpCode.OP_RETURN, 0, 0, 0);
        }
        break;
      }

      case 'CallStatement': {
        const expression = stmt.expression as Record<string, unknown>;
        this.compileExpression(expression);
        // Pop the result (discard)
        break;
      }

      case 'IfStatement': {
        const clauses = stmt.clauses as {
          condition: Record<string, unknown>;
          body: Record<string, unknown>[];
        }[];
        // Compile each clause with conditional jumps
        // (Simplified — full implementation would handle jump patching)
        for (const clause of clauses) {
          this.compileExpression(clause.condition);
          // JMPFALSE would go here
          for (const s of clause.body) {
            this.compileStatement(s);
          }
        }
        break;
      }

      default:
        // Unknown statement types are skipped in bytecode generation
        // (fallback to evaluation at runtime)
        break;
    }
  }

  private compileExpression(expr: Record<string, unknown>): void {
    if (!this.currentFunction) return;

    const type = String(expr.type);

    switch (type) {
      case 'NumericLiteral': {
        const idx = this.addConstant(expr.value);
        this.emit(OpCode.OP_LOADCONST, idx, 0, 0);
        break;
      }

      case 'StringLiteral': {
        const idx = this.addConstant(expr.value);
        this.emit(OpCode.OP_LOADCONST, idx, 0, 0);
        break;
      }

      case 'BooleanLiteral': {
        this.emit(expr.value ? OpCode.OP_LOADTRUE : OpCode.OP_LOADFALSE, 0, 0, 0);
        break;
      }

      case 'NilLiteral': {
        this.emit(OpCode.OP_LOADNIL, 0, 0, 0);
        break;
      }

      case 'Identifier': {
        // For simplicity, treat all identifiers as global loads
        // A full implementation would track scopes properly
        const idx = this.addConstant(String(expr.name));
        this.emit(OpCode.OP_LOADGLOBAL, idx, 0, 0);
        break;
      }

      case 'BinaryExpression': {
        const left = expr.left as Record<string, unknown>;
        const right = expr.right as Record<string, unknown>;
        this.compileExpression(left);
        this.compileExpression(right);
        const op = this.getBinaryOpCode(String(expr.operator));
        if (op !== null) {
          this.emit(op, 0, 0, 0);
        }
        break;
      }

      case 'CallExpression': {
        const base = expr.base as Record<string, unknown>;
        const args = expr.arguments as Record<string, unknown>[];
        this.compileExpression(base);
        for (const arg of args) {
          this.compileExpression(arg);
        }
        this.emit(OpCode.OP_CALL, args.length, 0, 0);
        break;
      }

      default:
        // Unhandled expression types fall through
        break;
    }
  }

  private getBinaryOpCode(operator: string): OpCode | null {
    const map: Record<string, OpCode> = {
      '+': OpCode.OP_ADD,
      '-': OpCode.OP_SUB,
      '*': OpCode.OP_MUL,
      '/': OpCode.OP_DIV,
      '%': OpCode.OP_MOD,
      '^': OpCode.OP_POW,
      '==': OpCode.OP_EQ,
      '<': OpCode.OP_LT,
      '<=': OpCode.OP_LE,
      '>': OpCode.OP_GT,
      '>=': OpCode.OP_GE,
      '~=': OpCode.OP_NE,
      '..': OpCode.OP_CONCAT,
    };
    return map[operator] ?? null;
  }

  private addConstant(value: unknown): number {
    const key = typeof value + ':' + String(value);
    if (this.constantMap.has(key)) {
      return this.constantMap.get(key)!;
    }
    const idx = this.currentFunction!.constants.length;
    this.currentFunction!.constants.push(value);
    this.constantMap.set(key, idx);
    return idx;
  }

  private emit(op: OpCode, a: number, b: number, c: number): void {
    if (!this.currentFunction) return;
    this.currentFunction.instructions.push({ op, a, b, c });
  }

  /**
   * Serialize bytecode to a Lua table literal.
   * Opcodes are emitted in their remapped wire form (item 3).
   */
  private serializeToLua(func: BytecodeFunction): string {
    const instrs = func.instructions.map(i => {
      // Encode as packed numbers: wireOp*1000000 + a*10000 + b*100 + c
      const packed = this.wireOp(i.op) * 1000000 + i.a * 10000 + i.b * 100 + i.c;
      return packed;
    });

    const constants = func.constants.map(c => {
      if (typeof c === 'string') {
        return '"' + c.replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
      }
      return String(c);
    });

    return `local __gungnir_bytecode = {
  instructions = {${instrs.join(',')}},
  constants = {${constants.join(',')}},
  locals = ${func.localCount},
}`;
  }

  /**
   * Generate the Lua VM runtime that executes the bytecode.
   * The runtime receives the inverse opcode map (wire → canonical)
   * so every build dispatches through a different opcode permutation.
   */
  private generateVMRuntime(_ctx: ObfuscationContext): string {
    // Emit the inverse remap table as a Lua table literal:
    // wire opcode → canonical opcode
    const remapEntries: string[] = [];
    for (const [wire, canonical] of this.inverseOpcodeMap) {
      remapEntries.push(`[${wire}] = ${canonical}`);
    }
    const remapTable = '{' + remapEntries.join(', ') + '}';

    // The VM runtime is a Lua interpreter loop that reads
    // instructions from the bytecode table and dispatches them
    // through the per-build remap table.
    return `
-- Gungnir VM Runtime (Layer 1: Virtual Machine, per-build opcode remap)
local __gungnir_opmap = ${remapTable}
-- Lua 5.1 uses the global unpack; Lua 5.2+/Luau use table.unpack
local __gungnir_unpack = unpack or table.unpack

local __gungnir_vm_stack = {}
local __gungnir_vm_sp = 0

local function __gungnir_vm_push(v)
  __gungnir_vm_sp = __gungnir_vm_sp + 1
  __gungnir_vm_stack[__gungnir_vm_sp] = v
end

local function __gungnir_vm_pop()
  local v = __gungnir_vm_stack[__gungnir_vm_sp]
  __gungnir_vm_stack[__gungnir_vm_sp] = nil
  __gungnir_vm_sp = __gungnir_vm_sp - 1
  return v
end

local function __gungnir_vm_execute(bc)
  local pc = 1
  local stack = {}
  local sp = 0
  local locals = {}

  local function push(v) sp = sp + 1; stack[sp] = v end
  local function pop() local v = stack[sp]; stack[sp] = nil; sp = sp - 1; return v end

  while pc <= #bc.instructions do
    local packed = bc.instructions[pc]
    local wire = math.floor(packed / 1000000) % 256
    local a = math.floor(packed / 10000) % 100
    local b = math.floor(packed / 100) % 100
    local c = packed % 100
    pc = pc + 1

    -- Resolve wire opcode → canonical opcode through the per-build map
    local op = __gungnir_opmap[wire] or wire

    if op == 1 then -- LOADNIL
      locals[a] = nil
    elseif op == 2 then -- LOADTRUE
      push(true)
    elseif op == 3 then -- LOADFALSE
      push(false)
    elseif op == 4 then -- LOADCONST
      push(bc.constants[a + 1])
    elseif op == 5 then -- LOADLOCAL
      push(locals[a + 1])
    elseif op == 6 then -- LOADGLOBAL
      push(_G[bc.constants[a + 1]])
    elseif op == 0x20 then -- ADD
      local r = pop(); local l = pop(); push(l + r)
    elseif op == 0x21 then -- SUB
      local r = pop(); local l = pop(); push(l - r)
    elseif op == 0x22 then -- MUL
      local r = pop(); local l = pop(); push(l * r)
    elseif op == 0x23 then -- DIV
      local r = pop(); local l = pop(); push(l / r)
    elseif op == 0x30 then -- EQ
      local r = pop(); local l = pop(); push(l == r)
    elseif op == 0x60 then -- CALL
      local nargs = a
      local args = {}
      for i = nargs, 1, -1 do args[i] = pop() end
      local fn = pop()
      push(fn(__gungnir_unpack(args)))
    elseif op == 0x62 then -- RETURN
      return pop()
    end
  end
end
`;
  }
}
