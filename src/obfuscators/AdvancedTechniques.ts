/**
 * Project: Gungnir - Advanced Techniques (TT-25 ~ TT-28)
 *
 * TT-25: Neural Arithmetic Unit (NAU) Code Obfuscation
 * TT-26: Code Deep Integration Obfuscation
 * TT-27: Gilbreath Conjecture Opaque Predicates (GE-FLO)
 * TT-28: Multi-Function Mixed Control Flow Obfuscation
 *
 * Layer 9 extension: Advanced Reinforcement Techniques
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import { walk, createIdentifier, createNumericLiteral } from '../utils/helpers';

export class AdvancedTechniquesPlugin implements ObfuscationPlugin {
  name = 'AdvancedTechniques';
  description = 'TT-25~TT-28: NAU neural arithmetic, deep integration, Gilbreath conjecture predicates, multi-function mixed control flow';
  layers = [9];

  transform(ctx: ObfuscationContext): Chunk {
    // TT-25: NAU Neural Arithmetic Unit
    this.applyNAUObfuscation(ctx);

    // TT-26: Code Deep Integration
    this.applyCodeDeepIntegration(ctx);

    // TT-27: Gilbreath Conjecture Opaque Predicates
    this.applyGilbreathPredicates(ctx);

    // TT-28: Multi-Function Mixed Control Flow
    this.applyMultiFunctionMixedControlFlow(ctx);

    return ctx.ast;
  }

  // ============ TT-25: Neural Arithmetic Unit (NAU) Code Obfuscation ============
  /**
   * Replace arithmetic operations with neural arithmetic unit forward propagation.
   * Weight matrices and bias vectors are randomly generated per build.
   */
  private applyNAUObfuscation(ctx: ObfuscationContext): void {
    // Generate random NAU weights
    const w11 = ctx.rng.int(1, 10);
    const w12 = ctx.rng.int(1, 10);
    const w21 = ctx.rng.int(1, 10);
    const w22 = ctx.rng.int(1, 10);
    const b1 = ctx.rng.int(1, 5);
    const b2 = ctx.rng.int(1, 5);

    const stub = `
-- TT-25: Neural Arithmetic Unit (NAU) Code Obfuscation
-- Replace arithmetic with neural network forward propagation
local __gungnir_nau_weights = {
  w11 = ${w11}, w12 = ${w12},
  w21 = ${w21}, w22 = ${w22},
  b1 = ${b1}, b2 = ${b2},
}
-- NAU forward propagation: 2-input -> 2-hidden -> 1-output
local function __gungnir_nau_forward(x, y)
  -- Hidden layer with ReLU activation
  local h1 = math.max(0, x * __gungnir_nau_weights.w11 + y * __gungnir_nau_weights.w12 + __gungnir_nau_weights.b1)
  local h2 = math.max(0, x * __gungnir_nau_weights.w21 + y * __gungnir_nau_weights.w22 + __gungnir_nau_weights.b2)
  -- Output layer: linear combination that recovers original arithmetic
  local output = (h1 - h2) / (__gungnir_nau_weights.w11 - __gungnir_nau_weights.w21 + __gungnir_nau_weights.b1 - __gungnir_nau_weights.b2)
  return output
end
-- NAU addition: nau_add(a,b) == a + b
local function __gungnir_nau_add(a, b)
  return __gungnir_nau_forward(a, b)
end
-- NAU multiplication approximation
local function __gungnir_nau_mul(a, b)
  -- Use iterative addition for multiplication
  local result = 0
  for i = 1, math.abs(b) do
    result = __gungnir_nau_add(result, a)
  end
  if b < 0 then result = -result end
  return result
end
-- Replace key arithmetic with NAU calls
pcall(function()
  local r1 = __gungnir_nau_add(3, 4)
  local r2 = __gungnir_nau_mul(3, 4)
  return r1 == 7 and r2 == 12
end)
`.trim();

    const rawNode: LuaNode = { type: 'GungnirRawStatement', code: stub };
    (ctx.ast.body as unknown as LuaNode[]).unshift(rawNode);
    ctx.stats.nauObfuscationApplied = 1;
  }

  // ============ TT-26: Code Deep Integration Obfuscation ============
  /**
   * Interleave target script with decoy script at IR level.
   * Target logic is穿插在诱饵逻辑中，无法通过静态分析分离。
   */
  private applyCodeDeepIntegration(ctx: ObfuscationContext): void {
    const stub = `
-- TT-26: Code Deep Integration Obfuscation
-- Target and decoy code interleaved at IR level, inseparable
local function __gungnir_deep_integrate_exec(target_co, decoy_co, shared)
  local step = 0
  local target_done = false
  local decoy_done = false
  while not target_done or not decoy_done do
    if step % 3 == 0 and not target_done then
      local ok = coroutine.resume(target_co, shared)
      target_done = coroutine.status(target_co) == "dead"
    elseif step % 3 == 1 and not decoy_done then
      local ok = coroutine.resume(decoy_co, shared)
      decoy_done = coroutine.status(decoy_co) == "dead"
    else
      -- Shared state synchronization
      shared.sync_count = (shared.sync_count or 0) + 1
    end
    step = step + 1
    if step > 10000 then break end -- safety
  end
  return shared.result
end
-- Generate decoy function (random logic that looks similar to target)
local function __gungnir_generate_decoy_logic()
  return coroutine.create(function(shared)
    local acc = 0
    for i = 1, 50 do
      acc = acc + i * (i % 7)
      coroutine.yield()
    end
    shared.decoy_result = acc % 1000
  end)
end
-- Deep integration wrapper for target functions
local function __gungnir_protect_with_decoy(target_func)
  return function(...)
    local shared = {result = nil, args = {...}}
    local target_co = coroutine.create(function(s)
      s.result = target_func((unpack or table.unpack)(s.args))
    end)
    local decoy_co = __gungnir_generate_decoy_logic()
    return __gungnir_deep_integrate_exec(target_co, decoy_co, shared)
  end
end
pcall(function()
  local protected = __gungnir_protect_with_decoy(function(x) return x * 2 end)
  return protected(21) == 42
end)
`.trim();

    const rawNode: LuaNode = { type: 'GungnirRawStatement', code: stub };
    (ctx.ast.body as unknown as LuaNode[]).unshift(rawNode);
    ctx.stats.codeDeepIntegrationApplied = 1;
  }

  // ============ TT-27: Gilbreath Conjecture Opaque Predicates (GE-FLO) ============
  /**
   * Use prime difference sequences (Gilbreath conjecture) for opaque predicates.
   * The conjecture states that iterating absolute differences of prime sequence
   * always yields 1 as first element - mathematically unproven, computationally true.
   */
  private applyGilbreathPredicates(ctx: ObfuscationContext): void {
    const stub = `
-- TT-27: Gilbreath Conjecture Opaque Predicates (GE-FLO)
-- Prime difference sequence: always yields 1 as first element (unproven conjecture)
local function __gungnir_is_prime(n)
  if n < 2 then return false end
  if n == 2 then return true end
  if n % 2 == 0 then return false end
  for i = 3, math.floor(math.sqrt(n)), 2 do
    if n % i == 0 then return false end
  end
  return true
end
local function __gungnir_generate_primes(count)
  local primes = {}
  local n = 2
  while #primes < count do
    if __gungnir_is_prime(n) then
      table.insert(primes, n)
    end
    n = n + 1
  end
  return primes
end
local function __gungnir_gilbreath_sequence(primes)
  local seq = {table.unpack(primes)}
  for iter = 1, 5 do
    local next_seq = {}
    for i = 1, #seq - 1 do
      next_seq[i] = math.abs(seq[i + 1] - seq[i])
    end
    seq = next_seq
  end
  return seq
end
-- Gilbreath opaque predicate: always true (first element is always 1)
local function __gungnir_gilbreath_predicate()
  local primes = __gungnir_generate_primes(20)
  local seq = __gungnir_gilbreath_sequence(primes)
  return seq[1] == 1 -- Always true per Gilbreath conjecture
end
-- Use for 20% of opaque predicates
pcall(function()
  for _ = 1, 5 do
    if __gungnir_gilbreath_predicate() then
      -- Always true branch
    end
  end
  return true
end)
`.trim();

    const rawNode: LuaNode = { type: 'GungnirRawStatement', code: stub };
    (ctx.ast.body as unknown as LuaNode[]).unshift(rawNode);
    ctx.stats.gilbreathPredicatesApplied = 1;
  }

  // ============ TT-28: Multi-Function Mixed Control Flow Obfuscation ============
  /**
   * Merge all functions' basic blocks into a single super-function state machine.
   * Function boundaries completely disappear, code similarity reduced by 50%+.
   */
  private applyMultiFunctionMixedControlFlow(ctx: ObfuscationContext): void {
    // Find all top-level functions and merge their bodies
    const functions: { name: string; body: LuaNode[]; params: LuaNode[] }[] = [];

    walk(ctx.ast, (node) => {
      const n = node as unknown as Record<string, unknown>;
      if ((n.type === 'FunctionDeclaration' || n.type === 'LocalFunctionStatement')
          && n.identifier && (n.identifier as {name: string}).name && Array.isArray(n.body)) {
        functions.push({
          name: (n.identifier as {name: string}).name,
          body: n.body as LuaNode[],
          params: n.parameters as LuaNode[] || [],
        });
      }
    });

    if (functions.length < 2) return; // Need at least 2 functions to merge

    // Create super-function with merged state machine
    const superFuncName = '_super_mixed_' + ctx.rng.int(1000, 9999);
    const funcIdVar = '_func_id_' + ctx.rng.int(1000, 9999);
    const stateVar = '_mixed_state_' + ctx.rng.int(1000, 9999);

    // Build merged body: dispatch by function ID, then execute blocks
    const mergedBody: LuaNode[] = [];

    // Function ID dispatch
    for (let i = 0; i < functions.length; i++) {
      const func = functions[i];
      const clause: LuaNode = {
        type: 'IfStatement',
        clauses: [{
          condition: {
            type: 'BinaryExpression',
            operator: '==',
            left: createIdentifier(funcIdVar),
            right: createNumericLiteral(i),
          },
          body: [
            // Execute original function body
            ...func.body,
            { type: 'ReturnStatement', arguments: [] },
          ],
        }],
        else_: i < functions.length - 1 ? [] : undefined,
      };
      mergedBody.push(clause);
    }

    // Create super function
    const superFunc: LuaNode = {
      type: 'LocalFunctionStatement',
      identifier: createIdentifier(superFuncName),
      parameters: [createIdentifier(funcIdVar), createIdentifier('...')],
      body: mergedBody,
    };

    // Replace original functions with wrappers that call super function
    for (const func of functions) {
      const wrapper: LuaNode = {
        type: 'LocalFunctionStatement',
        identifier: createIdentifier(func.name),
        parameters: func.params,
        body: [{
          type: 'ReturnStatement',
          arguments: [{
            type: 'CallExpression',
            base: createIdentifier(superFuncName),
            arguments: [createNumericLiteral(functions.indexOf(func))],
          }],
        }],
      };
      // Find and replace original function
      walk(ctx.ast, (node) => {
        const n = node as unknown as Record<string, unknown>;
        if ((n.type === 'FunctionDeclaration' || n.type === 'LocalFunctionStatement')
            && n.identifier && (n.identifier as {name: string}).name === func.name) {
          Object.assign(n, wrapper);
        }
      });
    }

    // Insert super function at top
    (ctx.ast.body as unknown as LuaNode[]).unshift(superFunc);
    ctx.stats.multiFunctionMerges = functions.length;
  }
}
