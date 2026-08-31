/**
 * Project: Gungnir - Anti-Automation Analysis Shield
 *
 * Implements AA-01 through AA-09:
 *
 * AA-01: Anti-Symbolic Execution Shield (nonlinear constraints, Fermat, 5th+ degree)
 * AA-02: Anti-Taint Tracking (control-flow dependency propagation)
 * AA-03: Anti-AST/GNN Pattern Matching (adversarial nodes)
 * AA-04: Dead Code Elimination Counter (metatable side effects)
 * AA-05: Anti-Sandbox / Anti-Virtualization (tick, memory, service probes)
 * AA-06: AI-Level Opaque Predicates (prime, discrete log, factorization)
 * AA-07: Formal Verification Traps (state explosion, Peano, Ackermann)
 * AA-08: Memory Layout Randomization (table key order randomization)
 * AA-09: Anti-Beautify / Semicolon Traps (Prettier, StyLua crash)
 *
 * Layer 5: Anti-Automation Analysis Shield
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import {
  walk, createIdentifier, createNumericLiteral, createBinaryExpression,
  createStringLiteral,
} from '../utils/helpers';

// ============ AA-01: Anti-Symbolic Execution ============

class AntiSymbolicExecution {
  static generateStub(ctx: ObfuscationContext): string {
    ctx.stats.symbolicConstraintsInjected += 5;
    return `
-- AA-01: Anti-Symbolic Execution Shield
-- Nonlinear constraints that make SMT solvers (Z3, CVC4) time out
pcall(function()
  -- Fermat's Last Theorem special case: a^3 + b^3 == c^3 has no positive integer solutions
  local a, b, c = ${ctx.rng.int(2, 50)}, ${ctx.rng.int(2, 50)}, ${ctx.rng.int(2, 50)}
  if (a^3 + b^3) == c^3 then
    -- Unreachable for positive integers, but solver must prove it
    error("impossible")
  end
  -- 5th degree polynomial (no analytical solution per Abel-Ruffini)
  local x = ${ctx.rng.int(1, 100)}
  local poly = x^5 - ${ctx.rng.int(1, 10)}*x^4 + ${ctx.rng.int(1, 10)}*x^3 - ${ctx.rng.int(1, 10)}*x^2 + ${ctx.rng.int(1, 10)}*x - ${ctx.rng.int(1, 10)}
  if poly == 0 then error("unsolvable") end
  -- Circle equation: x^2 + y^2 == 1
  local y = ${ctx.rng.int(2, 50)}
  if x^2 + y^2 == 1 then error("on unit circle") end
end)
`.trim();
  }
}

// ============ AA-02: Anti-Taint Tracking ============

class AntiTaintTracking {
  static generateStub(ctx: ObfuscationContext): string {
    ctx.stats.taintCutoffPoints += 4;
    return `
-- AA-02: Anti-Taint Tracking (control-flow dependency, not data-flow)
local _att_sensitive = ${ctx.rng.int(1, 9999)}
pcall(function()
  -- Sensitive value propagates via branch conditions, not direct assignment
  local _att_branch = _att_sensitive % 2
  local _att_result
  if _att_branch == 0 then
    _att_result = _att_sensitive * 2
  else
    _att_result = _att_sensitive + 1
  end
  -- Another layer: result feeds into another branch
  if _att_result > 100 then
    _att_result = _att_result - 50
  else
    _att_result = _att_result + 50
  end
  return _att_result
end)
`.trim();
  }
}

// ============ AA-03: Anti-AST/GNN Pattern Matching ============

class AntiAstGnnMatching {
  static generateStub(ctx: ObfuscationContext): string {
    ctx.stats.adversarialAstNodes += 6;
    return `
-- AA-03: Anti-AST/GNN Pattern Matching (adversarial structural nodes)
do
  -- Deeply nested identity expressions that distort graph neural networks
  local _agn = (((((${ctx.rng.int(1, 100)} + 0) * 1) - 0) / 1) ^ 1)
  -- Redundant variable chains
  local _a1 = _agn
  local _a2 = _a1
  local _a3 = _a2
  local _a4 = _a3
  local _a5 = _a4
  -- Empty function calls that add nodes without semantics
  pcall(function() end)
  pcall(function() return function() end end)
  -- Self-referential table structure
  local _t = {}
  _t.self = _t
  _t.value = _a5
  pcall(function() return _t.self.value end)
end
`.trim();
  }
}

// ============ AA-04: DCE Counter ============

class DceCounter {
  static generateStub(ctx: ObfuscationContext): string {
    ctx.stats.dceCounterMeasures += 3;
    return `
-- AA-04: Dead Code Elimination Counter (metatable side effects)
local _dce_counter = 0
local _dce_proxy = setmetatable({}, {
  __index = function(_, k)
    _dce_counter = _dce_counter + 1  -- side effect on read
    return rawget({}, k)
  end,
  __newindex = function(_, k, v)
    _dce_counter = _dce_counter + 1  -- side effect on write
  end,
})
pcall(function()
  -- "Dead" code that actually has side effects via metatable
  local _x = _dce_proxy.something
  _dce_proxy.another = 42
  return _dce_counter
end)
`.trim();
  }
}

// ============ AA-05: Anti-Sandbox / Anti-Virtualization ============

class AntiSandboxVirtualization {
  static generateStub(ctx: ObfuscationContext): string {
    ctx.stats.sandboxProbesInjected += 4;
    return `
-- AA-05: Anti-Sandbox / Anti-Virtualization Detection
pcall(function()
  -- Tick jump detection (sandboxes accelerate/decelerate time)
  local _t1 = os.clock()
  local _sum = 0
  for i = 1, 10000 do _sum = _sum + i end
  local _t2 = os.clock()
  local _elapsed = _t2 - _t1
  -- Normal: < 0.1s for 10000 iterations; abnormal in sandboxes
  if _elapsed > 1.0 or _elapsed < 0.0001 then
    -- Potential sandbox detected
  end
  -- Memory size detection (VMs usually smaller)
  local _mem = collectgarbage and collectgarbage("count") or 0
  if _mem < 1024 then
    -- Potential constrained environment
  end
  -- Debug library completeness check
  if not debug or not debug.getinfo or not debug.traceback then
    -- Debug library incomplete (sandbox indicator)
  end
  return _elapsed, _mem
end)
`.trim();
  }
}

// ============ AA-06: AI-Level Opaque Predicates ============

class AiLevelOpaquePredicates {
  static generate(ctx: ObfuscationContext): LuaNode {
    const variant = ctx.rng.int(0, 2);
    ctx.stats.aiPredicatesGenerated++;

    if (variant === 0) {
      // Prime判定: is_prime(n) 复杂变体
      const n = ctx.rng.pick([104729, 104743, 104759, 104773, 104779]); // known primes
      return {
        type: 'CallExpression',
        base: createIdentifier('pcall'),
        arguments: [{
          type: 'FunctionExpression',
          parameters: [],
          body: [{
            type: 'LocalStatement',
            variables: [createIdentifier('_ai_prime')],
            init: [createNumericLiteral(n)],
          } as never, {
            type: 'LocalStatement',
            variables: [createIdentifier('_ai_isprime')],
            init: [createNumericLiteral(1)],
          } as never, {
            type: 'ForNumericStatement',
            variable: createIdentifier('_ai_i'),
            start: createNumericLiteral(2),
            end: createBinaryExpression('^', createIdentifier('_ai_prime'), createNumericLiteral(0.5)),
            step: createNumericLiteral(1),
            body: [{
              type: 'IfStatement',
              clauses: [{
                condition: createBinaryExpression('==',
                  createBinaryExpression('%', createIdentifier('_ai_prime'), createIdentifier('_ai_i')),
                  createNumericLiteral(0)),
                body: [{
                  type: 'AssignmentStatement',
                  variables: [createIdentifier('_ai_isprime')],
                  init: [createNumericLiteral(0)],
                } as never],
              }],
              else_: null,
            } as never],
          } as never],
        } as never],
      } as never;
    } else if (variant === 1) {
      // 离散对数: a^x % p == b (p是大素数)
      const p = 997;
      const a = ctx.rng.int(2, 50);
      const b = ctx.rng.int(1, p - 1);
      return createBinaryExpression('==',
        createBinaryExpression('%',
          createBinaryExpression('^', createNumericLiteral(a), createNumericLiteral(ctx.rng.int(10, 100))),
          createNumericLiteral(p)),
        createNumericLiteral(b));
    } else {
      // 大数分解: n = p * q
      const p = ctx.rng.pick([997, 991, 983, 977, 971]);
      const q = ctx.rng.pick([967, 953, 947, 941, 937]);
      return createBinaryExpression('==',
        createBinaryExpression('*', createNumericLiteral(p), createNumericLiteral(q)),
        createNumericLiteral(p * q));
    }
  }
}

// ============ AA-07: Formal Verification Traps ============

class FormalVerificationTraps {
  static generateStub(ctx: ObfuscationContext): string {
    ctx.stats.formalVerificationTraps += 3;
    return `
-- AA-07: Formal Verification Traps (state explosion, Ackermann, Peano)
pcall(function()
  -- Ackermann function (exponential state growth for verifiers)
  local function ackermann(m, n)
    if m == 0 then return n + 1
    elseif n == 0 then return ackermann(m - 1, 1)
    else return ackermann(m - 1, ackermann(m, n - 1)) end
  end
  -- Small input still causes massive state space explosion
  local _ack_result = ackermann(2, ${ctx.rng.int(2, 5)})
  -- Peano arithmetic encoding (successor function chain)
  local function peano_succ(n) return n + 1 end
  local _peano_val = peano_succ(peano_succ(peano_succ(${ctx.rng.int(1, 10)})))
  return _ack_result, _peano_val
end)
`.trim();
  }
}

// ============ AA-08: Memory Layout Randomization ============

class MemoryLayoutRandomizer {
  static generateStub(ctx: ObfuscationContext): string {
    ctx.stats.memoryLayoutRandomizations++;
    return `
-- AA-08: Memory Layout Randomization (table key order randomization)
local _mlr_keys = {"a", "b", "c", "d", "e", "f", "g", "h"}
-- Shuffle keys using runtime randomness (Lua table hash order)
local _mlr_table = {}
for i = #_mlr_keys, 1, -1 do
  local j = (os.clock() * 1000000 + i) % i + 1
  _mlr_keys[i], _mlr_keys[j] = _mlr_keys[j], _mlr_keys[i]
end
for _, k in ipairs(_mlr_keys) do
  _mlr_table[k] = ${ctx.rng.int(1, 9999)}
end
pcall(function() return _mlr_table end)
`.trim();
  }
}

// ============ AA-09: Anti-Beautify / Semicolon Traps ============

class AntiBeautifyTraps {
  static generateStub(ctx: ObfuscationContext): string {
    ctx.stats.beautifyTrapsInjected += 10;
    return `
-- AA-09: Anti-Beautify / Semicolon Traps (Prettier, StyLua crash)
do
  -- Invalid escape sequences that Lua tolerates but formatters choke on
  local _ab_str1 = "test\\!string\\:with\\#traps"
  -- Semicolon mazes
  local _ab_x = 1;;; local _ab_y = 2;;;
  -- \\r\\n vs \\n combinations
  local _ab_str2 = "line1\\r\\nline2\\nline3\\r"
  -- Long comment mismatches
  --[[ trap1 ]] --[[ trap2
  --]]
  -- Zero-width characters in strings (invisible to formatters)
  local _ab_str3 = "normal\\226\\128\\139string"
  -- Deeply nested parentheses
  local _ab_deep = ((((((${ctx.rng.int(1, 100)}))))))
  ;;;
end
`.trim();
  }
}

// ============ Main AntiAnalysis Plugin ============

export class AntiAnalysisPlugin implements ObfuscationPlugin {
  name = 'AntiAnalysis';
  description = 'Anti-automation analysis shield: anti-symbolic execution, anti-taint, anti-AST/GNN, DCE counter, anti-sandbox, AI predicates, formal verification traps, memory layout randomization, anti-beautify traps (AA-01~AA-09)';
  layers = [5];

  transform(ctx: ObfuscationContext): Chunk {
    const stubs: string[] = [];

    if (ctx.config.aaAntiSymbolicExecution) stubs.push(AntiSymbolicExecution.generateStub(ctx));
    if (ctx.config.aaAntiTaintTracking) stubs.push(AntiTaintTracking.generateStub(ctx));
    if (ctx.config.aaAntiAstGnnMatching) stubs.push(AntiAstGnnMatching.generateStub(ctx));
    if (ctx.config.aaDeadCodeEliminationCounter) stubs.push(DceCounter.generateStub(ctx));
    if (ctx.config.aaAntiSandboxVirtualization) stubs.push(AntiSandboxVirtualization.generateStub(ctx));
    if (ctx.config.aaFormalVerificationTraps) stubs.push(FormalVerificationTraps.generateStub(ctx));
    if (ctx.config.aaMemoryLayoutRandomization) stubs.push(MemoryLayoutRandomizer.generateStub(ctx));
    if (ctx.config.aaAntiBeautifySemicolonTraps) stubs.push(AntiBeautifyTraps.generateStub(ctx));

    // AA-06: AI-level opaque predicates injected into if statements
    if (ctx.config.aaAiOpaquePredicates) {
      this.injectAiPredicates(ctx);
    }

    if (stubs.length > 0) {
      const rawNode: LuaNode = { type: 'GungnirRawStatement', code: stubs.join('\n\n') };
      (ctx.ast.body as unknown as LuaNode[]).unshift(rawNode);
    }

    return ctx.ast;
  }

  private injectAiPredicates(ctx: ObfuscationContext): void {
    const rate = 0.15;
    walk(ctx.ast, (node) => {
      const n = node as unknown as Record<string, unknown>;
      if (n.type === 'IfStatement' && ctx.rng.next() < rate) {
        const clauses = n.clauses as { condition: LuaNode }[];
        if (clauses.length > 0) {
          const pred = AiLevelOpaquePredicates.generate(ctx);
          // Wrap: if pcall_result and original_condition then...
          clauses[0].condition = createBinaryExpression('and',
            createBinaryExpression('~=', pred, createNumericLiteral(0)),
            clauses[0].condition);
        }
      }
    });
  }
}
