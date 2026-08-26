"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BytecodeGenPlugin = exports.OpCode = void 0;
// ============ Bytecode Instruction Set ============
var OpCode;
(function (OpCode) {
    // Stack operations
    OpCode[OpCode["OP_LOADNIL"] = 1] = "OP_LOADNIL";
    OpCode[OpCode["OP_LOADTRUE"] = 2] = "OP_LOADTRUE";
    OpCode[OpCode["OP_LOADFALSE"] = 3] = "OP_LOADFALSE";
    OpCode[OpCode["OP_LOADCONST"] = 4] = "OP_LOADCONST";
    OpCode[OpCode["OP_LOADLOCAL"] = 5] = "OP_LOADLOCAL";
    OpCode[OpCode["OP_LOADGLOBAL"] = 6] = "OP_LOADGLOBAL";
    OpCode[OpCode["OP_LOADUPVAL"] = 7] = "OP_LOADUPVAL";
    // Store operations
    OpCode[OpCode["OP_STORELOCAL"] = 16] = "OP_STORELOCAL";
    OpCode[OpCode["OP_STOREGLOBAL"] = 17] = "OP_STOREGLOBAL";
    OpCode[OpCode["OP_STOREUPVAL"] = 18] = "OP_STOREUPVAL";
    OpCode[OpCode["OP_STORETABLE"] = 19] = "OP_STORETABLE";
    // Arithmetic
    OpCode[OpCode["OP_ADD"] = 32] = "OP_ADD";
    OpCode[OpCode["OP_SUB"] = 33] = "OP_SUB";
    OpCode[OpCode["OP_MUL"] = 34] = "OP_MUL";
    OpCode[OpCode["OP_DIV"] = 35] = "OP_DIV";
    OpCode[OpCode["OP_MOD"] = 36] = "OP_MOD";
    OpCode[OpCode["OP_POW"] = 37] = "OP_POW";
    // Comparison
    OpCode[OpCode["OP_EQ"] = 48] = "OP_EQ";
    OpCode[OpCode["OP_LT"] = 49] = "OP_LT";
    OpCode[OpCode["OP_LE"] = 50] = "OP_LE";
    OpCode[OpCode["OP_GT"] = 51] = "OP_GT";
    OpCode[OpCode["OP_GE"] = 52] = "OP_GE";
    OpCode[OpCode["OP_NE"] = 53] = "OP_NE";
    // Logic
    OpCode[OpCode["OP_AND"] = 64] = "OP_AND";
    OpCode[OpCode["OP_OR"] = 65] = "OP_OR";
    OpCode[OpCode["OP_NOT"] = 66] = "OP_NOT";
    OpCode[OpCode["OP_CONCAT"] = 67] = "OP_CONCAT";
    // Control flow
    OpCode[OpCode["OP_JMP"] = 80] = "OP_JMP";
    OpCode[OpCode["OP_JMPTRUE"] = 81] = "OP_JMPTRUE";
    OpCode[OpCode["OP_JMPFALSE"] = 82] = "OP_JMPFALSE";
    OpCode[OpCode["OP_JMPEQ"] = 83] = "OP_JMPEQ";
    // Function operations
    OpCode[OpCode["OP_CALL"] = 96] = "OP_CALL";
    OpCode[OpCode["OP_TAILCALL"] = 97] = "OP_TAILCALL";
    OpCode[OpCode["OP_RETURN"] = 98] = "OP_RETURN";
    OpCode[OpCode["OP_CLOSURE"] = 99] = "OP_CLOSURE";
    // Table operations
    OpCode[OpCode["OP_NEWTABLE"] = 112] = "OP_NEWTABLE";
    OpCode[OpCode["OP_SETLIST"] = 113] = "OP_SETLIST";
    OpCode[OpCode["OP_GETTABLE"] = 114] = "OP_GETTABLE";
    OpCode[OpCode["OP_LEN"] = 115] = "OP_LEN";
    // Misc
    OpCode[OpCode["OP_VARARG"] = 128] = "OP_VARARG";
    OpCode[OpCode["OP_SELF"] = 129] = "OP_SELF";
})(OpCode || (exports.OpCode = OpCode = {}));
class BytecodeGenPlugin {
    name = 'VMBytecodeGen';
    description = 'Compiles Lua AST into custom stack-based bytecode for VM execution';
    layers = [1]; // VM layer
    /** Current function being compiled */
    currentFunction = null;
    /** Function stack for nested functions */
    functionStack = [];
    /** Constant pool deduplication */
    constantMap = new Map();
    /**
     * Dynamic opcode remapping table (item 3):
     * canonical OpCode → per-build wire opcode. Regenerated for every
     * build so no two outputs share an opcode mapping.
     */
    opcodeMap = new Map();
    /** Inverse map for the runtime: wire opcode → canonical OpCode */
    inverseOpcodeMap = new Map();
    /**
     * Build the per-build opcode permutation.
     */
    buildOpcodeRemap(ctx) {
        const canonical = Object.values(OpCode);
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
    wireOp(op) {
        return this.opcodeMap.get(op) ?? op;
    }
    transform(ctx) {
        // Phase 0: Build per-build opcode remapping (polymorphic engine, item 3)
        if (ctx.config.vmOpcodeRemap) {
            this.buildOpcodeRemap(ctx);
        }
        else {
            // Identity mapping when remap is disabled
            const canonical = Object.values(OpCode);
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
        ctx.ast.body = [bootstrapNode];
        return ctx.ast;
    }
    /**
     * Compile a chunk into a BytecodeFunction.
     */
    compileChunk(chunk) {
        const func = {
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
            this.compileStatement(stmt);
        }
        // Add implicit return
        this.emit(OpCode.OP_RETURN, 0, 0, 0);
        this.functionStack.pop();
        this.currentFunction = this.functionStack[this.functionStack.length - 1] ?? null;
        return func;
    }
    compileStatement(stmt) {
        if (!this.currentFunction)
            return;
        const type = String(stmt.type);
        switch (type) {
            case 'LocalStatement': {
                // Compile initializers
                const init = stmt.init;
                if (init && init.length > 0) {
                    for (const expr of init) {
                        this.compileExpression(expr);
                    }
                    // Store to locals
                    const vars = stmt.variables;
                    for (let i = 0; i < vars.length; i++) {
                        this.currentFunction.localCount++;
                        this.emit(OpCode.OP_STORELOCAL, this.currentFunction.localCount - 1, 0, 0);
                    }
                }
                else {
                    const vars = stmt.variables;
                    for (let i = 0; i < vars.length; i++) {
                        this.currentFunction.localCount++;
                        this.emit(OpCode.OP_LOADNIL, this.currentFunction.localCount - 1, 0, 0);
                    }
                }
                break;
            }
            case 'ReturnStatement': {
                const args = stmt.arguments;
                if (args) {
                    for (const arg of args) {
                        this.compileExpression(arg);
                    }
                    this.emit(OpCode.OP_RETURN, args.length, 0, 0);
                }
                else {
                    this.emit(OpCode.OP_RETURN, 0, 0, 0);
                }
                break;
            }
            case 'CallStatement': {
                const expression = stmt.expression;
                this.compileExpression(expression);
                // Pop the result (discard)
                break;
            }
            case 'IfStatement': {
                const clauses = stmt.clauses;
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
    compileExpression(expr) {
        if (!this.currentFunction)
            return;
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
                const left = expr.left;
                const right = expr.right;
                this.compileExpression(left);
                this.compileExpression(right);
                const op = this.getBinaryOpCode(String(expr.operator));
                if (op !== null) {
                    this.emit(op, 0, 0, 0);
                }
                break;
            }
            case 'CallExpression': {
                const base = expr.base;
                const args = expr.arguments;
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
    getBinaryOpCode(operator) {
        const map = {
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
    addConstant(value) {
        const key = typeof value + ':' + String(value);
        if (this.constantMap.has(key)) {
            return this.constantMap.get(key);
        }
        const idx = this.currentFunction.constants.length;
        this.currentFunction.constants.push(value);
        this.constantMap.set(key, idx);
        return idx;
    }
    emit(op, a, b, c) {
        if (!this.currentFunction)
            return;
        this.currentFunction.instructions.push({ op, a, b, c });
    }
    /**
     * Serialize bytecode to a Lua table literal.
     * Opcodes are emitted in their remapped wire form (item 3).
     */
    serializeToLua(func) {
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
    generateVMRuntime(_ctx) {
        // Emit the inverse remap table as a Lua table literal:
        // wire opcode → canonical opcode
        const remapEntries = [];
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
exports.BytecodeGenPlugin = BytecodeGenPlugin;
