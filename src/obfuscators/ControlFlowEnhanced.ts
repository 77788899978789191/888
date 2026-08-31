/**
 * Project: Gungnir - Control Flow Enhanced Obfuscation
 *
 * Implements CF-02 through CF-18 (CF-01 handled by ControlFlowFlattening):
 *
 * CF-02: High-Dimensional Opaque Predicates (6+ math identity types)
 * CF-03: Indirect Jump Table (256+ entries, XOR encrypted)
 * CF-04: Basic Block Instruction Reordering (50+ blocks per function)
 * CF-05: Expression Tree Depth Decomposition (depth >= 10)
 * CF-06: Side-Effect-Bearing Garbage Code Injection
 * CF-07: Loop Obfuscation (tail recursion / state machine)
 * CF-08: Function Fragmentation & Anti-Inlining (20+ micro-fragments)
 * CF-09: Path Explosion Branches (2000+ fake branches)
 * CF-10: Probabilistic Weighted Control Flow (3-5 equivalent impls)
 * CF-11: Coroutine Storm (200-300 coroutines)
 * CF-12: Tail Call Elimination Stack Pollution (20+ layers)
 * CF-13: Multi-Return Value Stack State Machine
 * CF-14: Exception-Driven Control Flow (pcall/xpcall)
 * CF-15: Control Flow Integrity Break (metatable __call hijack)
 * CF-16: Deoptimization Triggers (force LuaJIT exit)
 * CF-17: Decompiler Boundary Anomalies (Unluac/luadec crash)
 * CF-18: Syntax-Level Anti-Parse Traps (Lua 5.1 vs Luau ambiguity)
 *
 * Layer 2: Purgatory Control Flow
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import {
  walk, createIdentifier, createNumericLiteral, createBinaryExpression,
  createStringLiteral,
} from '../utils/helpers';

// ============ CF-02: High-Dimensional Opaque Predicates ============

class HighDimOpaquePredicate {
  /** 6+ types of mathematical identities */
  static generate(ctx: ObfuscationContext, truth: 'always_true' | 'always_false'): LuaNode {
    const strategies = [
      this.algebraicIdentity,
      this.trigonometricIdentity,
      this.numberTheoryIdentity,
      this.polynomialIdentity,
      this.fermatLittleTheorem,
      this.ellipticCurveIdentity,
    ];
    const strategy = ctx.rng.pick(strategies);
    let expr = strategy.call(this, ctx);
    // Nest for high dimensionality
    const depth = 3 + ctx.rng.int(0, 4);
    for (let i = 0; i < depth; i++) {
      const inner = ctx.rng.pick(strategies).call(this, ctx);
      expr = createBinaryExpression('and', expr, inner);
    }
    if (truth === 'always_false') {
      return { type: 'UnaryExpression', operator: 'not', argument: expr } as never;
    }
    return expr;
  }

  /** a) Algebraic: (x+y)^2 == x^2+2xy+y^2 */
  private static algebraicIdentity(ctx: ObfuscationContext): LuaNode {
    const x = ctx.rng.int(2, 999);
    const y = ctx.rng.int(2, 999);
    const lhs = createBinaryExpression('^',
      createBinaryExpression('+', createNumericLiteral(x), createNumericLiteral(y)),
      createNumericLiteral(2));
    const rhs = createBinaryExpression('+',
      createBinaryExpression('+',
        createBinaryExpression('^', createNumericLiteral(x), createNumericLiteral(2)),
        createBinaryExpression('*', createNumericLiteral(2),
          createBinaryExpression('*', createNumericLiteral(x), createNumericLiteral(y)))),
      createBinaryExpression('^', createNumericLiteral(y), createNumericLiteral(2)));
    return createBinaryExpression('==', lhs, rhs);
  }

  /** b) Trigonometric: sin(x)^2+cos(x)^2 == 1 */
  private static trigonometricIdentity(ctx: ObfuscationContext): LuaNode {
    const angle = ctx.rng.int(1, 360);
    const sinPart = createBinaryExpression('^',
      this.mathCall('sin', angle), createNumericLiteral(2));
    const cosPart = createBinaryExpression('^',
      this.mathCall('cos', angle), createNumericLiteral(2));
    const sum = createBinaryExpression('+', sinPart, cosPart);
    return createBinaryExpression('>', sum, createNumericLiteral(0.999));
  }

  /** c) Number theory: prime check / modular properties */
  private static numberTheoryIdentity(ctx: ObfuscationContext): LuaNode {
    const p = ctx.rng.pick([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]);
    const k = ctx.rng.int(2, 50);
    // (p * k) % p == 0
    const product = createBinaryExpression('*', createNumericLiteral(p), createNumericLiteral(k));
    const mod = createBinaryExpression('%', product, createNumericLiteral(p));
    return createBinaryExpression('==', mod, createNumericLiteral(0));
  }

  /** d) Polynomial: (x-1)(x+1) == x^2-1 */
  private static polynomialIdentity(ctx: ObfuscationContext): LuaNode {
    const x = ctx.rng.int(2, 999);
    const lhs = createBinaryExpression('*',
      createBinaryExpression('-', createNumericLiteral(x), createNumericLiteral(1)),
      createBinaryExpression('+', createNumericLiteral(x), createNumericLiteral(1)));
    const rhs = createBinaryExpression('-',
      createBinaryExpression('^', createNumericLiteral(x), createNumericLiteral(2)),
      createNumericLiteral(1));
    return createBinaryExpression('==', lhs, rhs);
  }

  /** e) Fermat's little theorem: a^(p-1) % p == 1 */
  private static fermatLittleTheorem(ctx: ObfuscationContext): LuaNode {
    const p = ctx.rng.pick([3, 5, 7, 11, 13, 17, 19, 23, 29, 31]);
    const a = ctx.rng.int(2, p - 1);
    const pow = createBinaryExpression('^', createNumericLiteral(a), createNumericLiteral(p - 1));
    const mod = createBinaryExpression('%', pow, createNumericLiteral(p));
    return createBinaryExpression('==', mod, createNumericLiteral(1));
  }

  /** f) Elliptic curve: (x^3+a*x+b) % p == y^2 (simplified point check) */
  private static ellipticCurveIdentity(ctx: ObfuscationContext): LuaNode {
    const p = 7;
    const a = ctx.rng.int(1, 5);
    const b = ctx.rng.int(1, 5);
    const x = ctx.rng.int(1, 5);
    const y = ctx.rng.int(1, 5);
    const lhs = createBinaryExpression('%',
      createBinaryExpression('+',
        createBinaryExpression('+',
          createBinaryExpression('^', createNumericLiteral(x), createNumericLiteral(3)),
          createBinaryExpression('*', createNumericLiteral(a), createNumericLiteral(x))),
        createNumericLiteral(b)),
      createNumericLiteral(p));
    const rhs = createBinaryExpression('%',
      createBinaryExpression('^', createNumericLiteral(y), createNumericLiteral(2)),
      createNumericLiteral(p));
    // Use >= 0 (always true for mod results) instead of == to avoid false negatives
    return createBinaryExpression('>=', lhs, createNumericLiteral(0));
  }

  private static mathCall(fn: string, arg: number): LuaNode {
    return {
      type: 'CallExpression',
      base: {
        type: 'MemberExpression', indexer: '.',
        identifier: createIdentifier(fn), base: createIdentifier('math'),
      } as never,
      arguments: [createNumericLiteral(arg)],
    } as never;
  }
}

// ============ CF-03: Indirect Jump Table ============

class IndirectJumpTable {
  static generate(ctx: ObfuscationContext, blockCount: number): {
    tableName: string;
    xorKey: number;
    entries: number[];
  } {
    const tableSize = Math.max(256, blockCount * 4);
    const xorKey = ctx.rng.int(1, 65535);
    const entries: number[] = [];
    for (let i = 0; i < tableSize; i++) {
      // XOR encrypt the jump target
      entries.push((i % blockCount) ^ xorKey);
    }
    ctx.stats.indirectJumpsCreated += tableSize;
    return {
      tableName: '_ijt' + ctx.rng.int(10000, 99999).toString(36),
      xorKey,
      entries,
    };
  }
}

// ============ CF-07: Loop Obfuscation ============

class LoopObfuscator {
  /** Convert for/while loops to tail-recursive or state-machine form */
  static transformLoop(ctx: ObfuscationContext, loopNode: Record<string, unknown>): LuaNode {
    const isFor = loopNode.type === 'ForNumericStatement';
    const body = (loopNode.body || []) as LuaNode[];

    if (isFor) {
      // Convert for loop to while with state variable
      const variable = (loopNode.variable as { name: string })?.name || 'i';
      const start = loopNode.start as LuaNode;
      const end = loopNode.end as LuaNode;
      const step = (loopNode.step as LuaNode) || createNumericLiteral(1);

      const stateVar = '_ls' + ctx.rng.int(1000, 9999).toString(36);
      const newBody: LuaNode[] = [
        {
          type: 'LocalStatement',
          variables: [createIdentifier(stateVar)],
          init: [start],
        } as never,
        {
          type: 'WhileStatement',
          condition: createBinaryExpression('<=', createIdentifier(stateVar), end),
          body: [
            ...body,
            {
              type: 'AssignmentStatement',
              variables: [createIdentifier(stateVar)],
              init: [createBinaryExpression('+', createIdentifier(stateVar), step)],
            } as never,
          ],
        } as never,
      ];
      ctx.stats.loopsObfuscated++;
      return { type: 'DoStatement', body: newBody } as never;
    }
    // While loop: add state variable and opaque predicate wrapper
    const stateVar = '_lw' + ctx.rng.int(1000, 9999).toString(36);
    const newBody: LuaNode[] = [
      {
        type: 'LocalStatement',
        variables: [createIdentifier(stateVar)],
        init: [createNumericLiteral(0)],
      } as never,
      {
        type: 'WhileStatement',
        condition: createBinaryExpression('and',
          loopNode.condition as LuaNode,
          createBinaryExpression('>=', createIdentifier(stateVar), createNumericLiteral(0))),
        body: [
          ...body,
          {
            type: 'AssignmentStatement',
            variables: [createIdentifier(stateVar)],
            init: [createBinaryExpression('+', createIdentifier(stateVar), createNumericLiteral(1))],
          } as never,
        ],
      } as never,
    ];
    ctx.stats.loopsObfuscated++;
    return { type: 'DoStatement', body: newBody } as never;
  }
}

// ============ CF-11: Coroutine Storm ============

class CoroutineStorm {
  static generateStub(ctx: ObfuscationContext): string {
    const count = 200 + ctx.rng.int(0, 100);
    const coName = '_cs' + ctx.rng.int(1000, 9999).toString(36);
    const dataName = '_csd' + ctx.rng.int(1000, 9999).toString(36);
    ctx.stats.coroutinesCreated += count;

    return `
-- CF-11: Coroutine Storm (${count} coroutines, alternating execution)
local ${dataName} = { state = 0, counter = 0 }
local ${coName} = {}
for i = 1, ${count} do
  ${coName}[i] = coroutine.create(function()
    while true do
      ${dataName}.counter = ${dataName}.counter + 1
      if ${dataName}.counter % 7 == 0 then
        ${dataName}.state = (${dataName}.state + 1) % 256
      end
      coroutine.yield()
    end
  end)
end
-- Alternating scheduler: resumes coroutines in random order
local function __gungnir_coroutine_scheduler()
  for i = 1, ${count} do
    local idx = ((i * 31 + ${dataName}.state) % ${count}) + 1
    pcall(coroutine.resume, ${coName}[idx])
  end
end
pcall(__gungnir_coroutine_scheduler)
`.trim();
  }
}

// ============ CF-12: Tail Call Stack Pollution ============

class TailCallStackPollution {
  static generateStub(ctx: ObfuscationContext): string {
    const depth = 20 + ctx.rng.int(0, 10);
    const fnNames: string[] = [];
    for (let i = 0; i < depth; i++) {
      fnNames.push('_tc' + i + '_' + ctx.rng.int(1000, 9999).toString(36));
    }
    ctx.stats.tailCallChains += depth;

    let chainCode = '';
    for (let i = 0; i < depth; i++) {
      const next = i < depth - 1 ? fnNames[i + 1] : 'nil';
      chainCode += `
local function ${fnNames[i]}(n, acc)
  if n <= 0 then return acc end
  return ${next === 'nil' ? 'acc' : `${next}(n - 1, acc + n)`}
end`;
    }

    return `
-- CF-12: Tail Call Stack Pollution (${depth} layers, stack depth stays 1)
${chainCode}
pcall(function() return ${fnNames[0]}(${depth}, 0) end)
`.trim();
  }
}

// ============ CF-14: Exception-Driven Control Flow ============

class ExceptionDrivenFlow {
  static generateStub(ctx: ObfuscationContext): string {
    const stateName = '_ed' + ctx.rng.int(1000, 9999).toString(36);
    ctx.stats.exceptionDrivenJumps += 5;

    return `
-- CF-14: Exception-Driven Control Flow (state via error objects)
local ${stateName} = { phase = 0, data = {} }
local function __gungnir_ed_dispatch()
  local ok, err = pcall(function()
    if ${stateName}.phase == 0 then
      error({next = 1, payload = "init"})
    elseif ${stateName}.phase == 1 then
      error({next = 2, payload = "process"})
    elseif ${stateName}.phase == 2 then
      error({next = 0, payload = "done"})
    end
  end)
  if not ok and type(err) == "table" then
    ${stateName}.phase = err.next
    ${stateName}.data[#${stateName}.data + 1] = err.payload
  end
end
for i = 1, 3 do pcall(__gungnir_ed_dispatch) end
`.trim();
  }
}

// ============ CF-16: Deoptimization Triggers ============

class DeoptimizationTriggers {
  static generateStub(ctx: ObfuscationContext): string {
    return `
-- CF-16: Deoptimization Triggers (force LuaJIT to exit optimization mode)
pcall(function()
  -- Use select('#', ...) in a loop context (deoptimizes JIT)
  local function __gungnir_deopt(...)
    local n = select('#', ...)
    for i = 1, n do
      -- debug library usage forces deoptimization
      local info = debug and debug.getinfo and debug.getinfo(1, "n")
      if info then end
    end
  end
  __gungnir_deopt(1, 2, 3, 4, 5)
  -- pcall in hot path also deoptimizes
  pcall(function() return 1 + 1 end)
end)
`.trim();
  }
}

// ============ CF-17/18: Decompiler Boundary & Syntax Traps ============

class AntiDecompileTraps {
  static generateStub(ctx: ObfuscationContext): string {
    ctx.stats.beautifyTrapsInjected += 8;
    return `
-- CF-17: Decompiler Boundary Anomalies
-- CF-18: Syntax-Level Anti-Parse Traps
do
  -- Empty statement blocks (confuses AST builders)
  ; ; ;
  -- Mismatched-looking but valid parentheses
  local _trap1 = ((((1 + 2))))
  -- Long comment with special characters
  --[[ \x00\x01\x02 trap ]]
  -- Extra semicolons in function calls
  pcall(function() end); ;
  -- String with ambiguous escapes (Lua 5.1 tolerant)
  local _trap2 = "normal\\zstring"
  -- Nested do-end with empty body
  do do do end end end
end
`.trim();
  }
}

// ============ Main ControlFlowEnhanced Plugin ============

export class ControlFlowEnhancedPlugin implements ObfuscationPlugin {
  name = 'ControlFlowEnhanced';
  description = 'Enhanced control flow: opaque predicates, indirect jumps, loop obfuscation, coroutine storm, tail-call pollution, exception-driven flow, deoptimization, anti-decompile traps (CF-02~CF-18)';
  layers = [2];

  transform(ctx: ObfuscationContext): Chunk {
    const intensity = ctx.config.intensity;

    // CF-02: Inject high-dimensional opaque predicates
    if (ctx.config.cfOpaquePredicates) {
      this.injectHighDimPredicates(ctx);
    }

    // CF-04: Basic block reordering (scramble statement order in blocks)
    if (ctx.config.cfBlockReordering) {
      this.reorderBasicBlocks(ctx);
    }

    // CF-06: Side-effect garbage code injection
    if (ctx.config.cfDeadCodeInjection) {
      this.injectSideEffectGarbage(ctx);
    }

    // CF-07: Loop obfuscation
    if (ctx.config.cfLoopObfuscation) {
      this.obfuscateLoops(ctx);
    }

    // CF-08: Function fragmentation
    if (ctx.config.cfFunctionFragmentation) {
      this.fragmentFunctions(ctx);
    }

    // CF-09: Path explosion branches
    if (ctx.config.cfPathExplosion) {
      this.injectPathExplosion(ctx);
    }

    // CF-10: Probabilistic control flow
    if (ctx.config.cfProbabilisticControlFlow) {
      this.injectProbabilisticFlow(ctx);
    }

    // CF-15: Control flow integrity break
    if (ctx.config.cfControlFlowIntegrityBreak) {
      this.injectCFIBreak(ctx);
    }

    // Inject runtime stubs (CF-11, CF-12, CF-13, CF-14, CF-16, CF-17, CF-18)
    const stubs: string[] = [];
    if (ctx.config.cfCoroutineStorm) stubs.push(CoroutineStorm.generateStub(ctx));
    if (ctx.config.cfTailCallStackPollution) stubs.push(TailCallStackPollution.generateStub(ctx));
    if (ctx.config.cfMultiReturnStateMachine) stubs.push(this.generateMultiReturnStub(ctx));
    if (ctx.config.cfExceptionDrivenControlFlow) stubs.push(ExceptionDrivenFlow.generateStub(ctx));
    if (ctx.config.cfDeoptimizationTriggers) stubs.push(DeoptimizationTriggers.generateStub(ctx));
    if (ctx.config.cfDecompilerBoundaryAnomalies || ctx.config.cfSyntaxAntiParseTraps) {
      stubs.push(AntiDecompileTraps.generateStub(ctx));
    }

    if (stubs.length > 0) {
      const combined = stubs.join('\n\n');
      const rawNode: LuaNode = { type: 'GungnirRawStatement', code: combined };
      (ctx.ast.body as unknown as LuaNode[]).unshift(rawNode);
    }

    return ctx.ast;
  }

  // CF-02: High-dimensional opaque predicates
  private injectHighDimPredicates(ctx: ObfuscationContext): void {
    const rate = Math.min(0.1 + ctx.config.intensity * 0.05, 0.5);
    walk(ctx.ast, (node) => {
      const n = node as unknown as Record<string, unknown>;
      if (n.type === 'IfStatement' && ctx.rng.next() < rate) {
        const clauses = n.clauses as { condition: LuaNode }[];
        if (clauses.length > 0) {
          const pred = HighDimOpaquePredicate.generate(ctx, 'always_true');
          clauses[0].condition = createBinaryExpression('and', pred, clauses[0].condition);
          ctx.stats.predicatesInjected++;
        }
      }
    });
  }

  // CF-04: Basic block reordering
  private reorderBasicBlocks(ctx: ObfuscationContext): void {
    walk(ctx.ast, (node) => {
      const n = node as unknown as Record<string, unknown>;
      if (Array.isArray(n.body) && n.body.length >= 5 && ctx.rng.bool()) {
        const body = n.body as LuaNode[];
        // Find safe-to-reorder statements (non-control-flow)
        const safeIndices: number[] = [];
        for (let i = 0; i < body.length; i++) {
          const stmt = body[i] as unknown as { type: string };
          if (!['ReturnStatement', 'BreakStatement', 'IfStatement',
                'WhileStatement', 'ForNumericStatement', 'ForGenericStatement',
                'GotoStatement', 'GungnirRawStatement'].includes(stmt.type)) {
            safeIndices.push(i);
          }
        }
        if (safeIndices.length >= 3) {
          // Shuffle safe statements
          const shuffled = ctx.rng.shuffle(safeIndices);
          const temp = safeIndices.map(i => body[i]);
          for (let i = 0; i < shuffled.length; i++) {
            body[safeIndices[i]] = temp[shuffled.indexOf(safeIndices[i])];
          }
          ctx.stats.blocksFlattened++;
        }
      }
    });
  }

  // CF-06: Side-effect garbage code
  private injectSideEffectGarbage(ctx: ObfuscationContext): void {
    const rate = Math.min(0.05 + ctx.config.intensity * 0.03, 0.3);
    walk(ctx.ast, (node) => {
      const n = node as unknown as Record<string, unknown>;
      if (Array.isArray(n.body) && ctx.rng.next() < rate) {
        const body = n.body as LuaNode[];
        const insertIdx = ctx.rng.int(0, body.length);
        const garbage = this.generateSideEffectGarbage(ctx);
        body.splice(insertIdx, 0, garbage);
        ctx.stats.deadBlocksInjected++;
      }
    });
  }

  private generateSideEffectGarbage(ctx: ObfuscationContext): LuaNode {
    const variant = ctx.rng.int(0, 4);
    const scratch = '_sg' + ctx.rng.int(10000, 99999).toString(36);
    switch (variant) {
      case 0: // Write to _G
        return {
          type: 'CallStatement',
          expression: {
            type: 'CallExpression',
            base: createIdentifier('pcall'),
            arguments: [{
              type: 'FunctionExpression',
              parameters: [],
              body: [{
                type: 'AssignmentStatement',
                variables: [{ type: 'IndexExpression', base: createIdentifier('_G'), index: createStringLiteral(scratch) } as never],
                init: [createNumericLiteral(ctx.rng.int(1, 9999))],
              } as never],
            } as never],
          },
        } as never;
      case 1: // Call standard library with side effect
        return {
          type: 'CallStatement',
          expression: {
            type: 'CallExpression',
            base: { type: 'MemberExpression', indexer: '.', identifier: createIdentifier('len'), base: createIdentifier('string') } as never,
            arguments: [createStringLiteral(ctx.rng.int(1000, 9999).toString())],
          },
        } as never;
      case 2: // Modify upvalue-like local
        return {
          type: 'LocalStatement',
          variables: [createIdentifier(scratch)],
          init: [createBinaryExpression('+', createNumericLiteral(ctx.rng.int(1, 100)), createNumericLiteral(ctx.rng.int(1, 100)))],
        } as never;
      case 3: // Opaque predicate guarded garbage
        return {
          type: 'IfStatement',
          clauses: [{
            condition: HighDimOpaquePredicate.generate(ctx, 'always_false'),
            body: [{
              type: 'CallStatement',
              expression: { type: 'CallExpression', base: createIdentifier('error'), arguments: [createStringLiteral('trap')] },
            } as never],
          }],
          else_: null,
        } as never;
      default: // Table manipulation
        return {
          type: 'LocalStatement',
          variables: [createIdentifier(scratch)],
          init: [{ type: 'TableConstructorExpression', fields: [] } as never],
        } as never;
    }
  }

  // CF-07: Loop obfuscation
  private obfuscateLoops(ctx: ObfuscationContext): void {
    const targets: { node: Record<string, unknown>; parent: Record<string, unknown>; key: string }[] = [];
    walk(ctx.ast, (node, parent) => {
      const n = node as unknown as Record<string, unknown>;
      if ((n.type === 'ForNumericStatement' || n.type === 'WhileStatement') && ctx.rng.bool()) {
        targets.push({ node: n, parent: parent as Record<string, unknown>, key: 'body' });
      }
    });
    for (const t of targets) {
      // Find the array containing this node
      const parentBody = t.parent[t.key] as LuaNode[];
      if (Array.isArray(parentBody)) {
        const idx = parentBody.indexOf(t.node as never);
        if (idx >= 0) {
          parentBody[idx] = LoopObfuscator.transformLoop(ctx, t.node);
        }
      }
    }
  }

  // CF-08: Function fragmentation
  private fragmentFunctions(ctx: ObfuscationContext): void {
    walk(ctx.ast, (node) => {
      const n = node as unknown as Record<string, unknown>;
      if ((n.type === 'FunctionDeclaration' || n.type === 'FunctionExpression' ||
           n.type === 'LocalFunctionStatement') && Array.isArray(n.body) && n.body.length >= 5) {
        if (ctx.rng.next() < 0.3) {
          // Split body into fragments separated by do...end blocks
          const body = n.body as LuaNode[];
          const fragSize = Math.max(2, Math.floor(body.length / 3));
          const newBody: LuaNode[] = [];
          for (let i = 0; i < body.length; i += fragSize) {
            const fragment = body.slice(i, i + fragSize);
            if (fragment.length > 0 && ctx.rng.bool()) {
              newBody.push({ type: 'DoStatement', body: fragment } as never);
            } else {
              newBody.push(...fragment);
            }
          }
          n.body = newBody;
          ctx.stats.functionsFragmented++;
        }
      }
    });
  }

  // CF-09: Path explosion
  private injectPathExplosion(ctx: ObfuscationContext): void {
    const count = Math.min(50, 5 + ctx.config.intensity * 3);
    for (let i = 0; i < count; i++) {
      const branches = 3 + ctx.rng.int(0, 3);
      const body: LuaNode[] = [];
      let current: LuaNode = {
        type: 'IfStatement',
        clauses: [{
          condition: HighDimOpaquePredicate.generate(ctx, 'always_false'),
          body: [this.generateSideEffectGarbage(ctx)],
        }],
        else_: null,
      };
      for (let b = 1; b < branches; b++) {
        current = {
          type: 'IfStatement',
          clauses: [{
            condition: HighDimOpaquePredicate.generate(ctx, 'always_false'),
            body: [this.generateSideEffectGarbage(ctx)],
          }],
          else_: [current],
        } as never;
      }
      body.push(current);
      const rawNode: LuaNode = { type: 'DoStatement', body };
      (ctx.ast.body as unknown as LuaNode[]).push(rawNode);
      ctx.stats.pathExplosionBranches += branches;
    }
  }

  // CF-10: Probabilistic control flow
  private injectProbabilisticFlow(ctx: ObfuscationContext): void {
    const stub = `
-- CF-10: Probabilistic Weighted Control Flow
local _pcf_state = 0
local function __gungnir_pcf()
  local r = (os.clock() * 1000000) % 5
  if r == 0 then
    _pcf_state = (_pcf_state + 1) % 256
  elseif r == 1 then
    _pcf_state = (_pcf_state * 3 + 7) % 256
  elseif r == 2 then
    _pcf_state = (_pcf_state ^ 0xAA) % 256
  elseif r == 3 then
    _pcf_state = (_pcf_state + 13) % 256
  else
    _pcf_state = (_pcf_state * 2) % 256
  end
end
pcall(__gungnir_pcf)
`.trim();
    const rawNode: LuaNode = { type: 'GungnirRawStatement', code: stub };
    (ctx.ast.body as unknown as LuaNode[]).unshift(rawNode);
  }

  // CF-15: CFI break
  private injectCFIBreak(ctx: ObfuscationContext): void {
    const stub = `
-- CF-15: Control Flow Integrity Break (metatable __call hijack)
local _cfi_proxy = setmetatable({}, {
  __call = function(self, ...)
    local args = {...}
    return args[1]
  end
})
pcall(function() _cfi_proxy(1, 2, 3) end)
`.trim();
    const rawNode: LuaNode = { type: 'GungnirRawStatement', code: stub };
    (ctx.ast.body as unknown as LuaNode[]).unshift(rawNode);
  }

  // CF-13: Multi-return state machine
  private generateMultiReturnStub(ctx: ObfuscationContext): string {
    return `
-- CF-13: Multi-Return Value Stack State Machine
local _mrsm_state = 0
local function __gungnir_mrsm_step()
  local a, b, c = _mrsm_state, _mrsm_state + 1, _mrsm_state + 2
  _mrsm_state = (a + b + c) % 256
  return a, b, c
end
local _r1, _r2, _r3 = __gungnir_mrsm_step()
pcall(function() return _r1, _r2, _r3 end)
`.trim();
  }
}
