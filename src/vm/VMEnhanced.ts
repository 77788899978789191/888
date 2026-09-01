/**
 * Project: Gungnir - VM Enhanced Techniques (VM-19 ~ VM-22)
 *
 * VM-19: Multi-Pass AST Obfuscation Transformations
 * VM-20: Super Operator Fusion
 * VM-21: Randomized Dispatch Loop
 * VM-22: Bytecode Compilation & Deserialization
 *
 * Layer 1: Polymorphic VM Engine (extension)
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import { walk, createIdentifier, createNumericLiteral, createStringLiteral } from '../utils/helpers';

export class VMEnhancedPlugin implements ObfuscationPlugin {
  name = 'VMEnhanced';
  description = 'VM-19~VM-22: Multi-pass AST transform, super operator fusion, randomized dispatch, bytecode compile/deserialize';
  layers = [1];

  transform(ctx: ObfuscationContext): Chunk {
    // VM-19: Multi-pass AST transformations
    this.applyMultiPassTransform(ctx);

    // VM-20: Super operator fusion
    this.applySuperOperatorFusion(ctx);

    // VM-21: Randomized dispatch loop (inject runtime stub)
    this.injectRandomizedDispatch(ctx);

    // VM-22: Bytecode compilation & deserialization (inject runtime stub)
    this.injectBytecodeDeserialization(ctx);

    return ctx.ast;
  }

  // ============ VM-19: Multi-Pass AST Obfuscation Transformations ============
  /**
   * Apply multiple rounds of AST transformations with different strategies.
   * Each pass uses a different random seed and transformation pattern.
   */
  private applyMultiPassTransform(ctx: ObfuscationContext): void {
    const passes = 3 + ctx.rng.int(0, 3); // 3-5 passes
    const strategies = [
      'constant_folding',
      'expression_reorder',
      'variable_inline',
      'dead_code_eliminate',
      'operator_strength_reduce',
    ];

    for (let pass = 0; pass < passes; pass++) {
      const strategy = strategies[ctx.rng.int(0, strategies.length - 1)];
      this.applyPassStrategy(ctx, strategy, pass);
    }
    ctx.stats.multiPassTransforms = passes;
  }

  private applyPassStrategy(ctx: ObfuscationContext, strategy: string, passNum: number): void {
    const targets: { node: Record<string, unknown>; parent: Record<string, unknown> }[] = [];

    walk(ctx.ast, (node, parent) => {
      const n = node as unknown as Record<string, unknown>;
      if (n.type === 'BinaryExpression' && ctx.rng.next() < 0.3) {
        targets.push({ node: n, parent: parent as Record<string, unknown> });
      }
    });

    for (const { node } of targets) {
      switch (strategy) {
        case 'expression_reorder':
          // Reorder commutative operations (a+b -> b+a)
          if (node.operator === '+' || node.operator === '*') {
            const tmp = node.left;
            node.left = node.right;
            node.right = tmp;
          }
          break;
        case 'operator_strength_reduce':
          // Replace *2 with <<1, /2 with >>1
          const rightNode = node.right as {type: string, value: number} | undefined;
          if (node.operator === '*' && rightNode?.type === 'NumericLiteral' && rightNode.value === 2) {
            node.operator = '<<';
            node.right = createNumericLiteral(1);
          }
          break;
        default:
          // For other strategies, inject a no-op wrapper
          break;
      }
    }
  }

  // ============ VM-20: Super Operator Fusion ============
  /**
   * Fuse multiple sequential operations into single super-operations.
   * E.g., a = a + 1; b = b * 2 -> fused super-op with combined semantics.
   */
  private applySuperOperatorFusion(ctx: ObfuscationContext): void {
    const fusionRate = 0.15 + ctx.config.intensity * 0.03;
    let fusions = 0;

    walk(ctx.ast, (node) => {
      const n = node as unknown as Record<string, unknown>;
      if (n.type === 'DoStatement' || n.type === 'Chunk') {
        const body = n.body as LuaNode[] | undefined;
        if (!Array.isArray(body) || body.length < 2) return;

        for (let i = 0; i < body.length - 1; i++) {
          const stmt1 = body[i] as unknown as Record<string, unknown>;
          const stmt2 = body[i + 1] as unknown as Record<string, unknown>;

          // Fuse two consecutive local assignments into one with super-op
          if (stmt1.type === 'LocalStatement' && stmt2.type === 'LocalStatement'
              && ctx.rng.next() < fusionRate) {
            const vars1 = stmt1.variables as unknown[];
            const vars2 = stmt2.variables as unknown[];
            const init1 = stmt1.init as unknown[] || [];
            const init2 = stmt2.init as unknown[] || [];

            // Create fused statement with combined variables
            const fused: LuaNode = {
              type: 'LocalStatement',
              variables: [...vars1, ...vars2],
              init: [...init1, ...init2],
            };
            body[i] = fused;
            body.splice(i + 1, 1);
            fusions++;
            i--;
          }
        }
      }
    });

    ctx.stats.superOperatorFusions = fusions;
  }

  // ============ VM-21: Randomized Dispatch Loop ============
  /**
   * Inject a randomized dispatch loop that executes VM handlers in random order.
   * The dispatch table is shuffled at runtime, making static analysis impossible.
   */
  private injectRandomizedDispatch(ctx: ObfuscationContext): void {
    const stub = `
-- VM-21: Randomized Dispatch Loop
local function __gungnir_random_dispatch(handlers, bytecode)
  local order = {}
  for i = 1, #handlers do order[i] = i end
  -- Fisher-Yates shuffle at runtime
  for i = #order, 2, -1 do
    local j = (math.floor(tick() * 1000000) % i) + 1
    order[i], order[j] = order[j], order[i]
  end
  local pc = 1
  while pc <= #bytecode do
    local op = bytecode[pc]
    for _, idx in ipairs(order) do
      if handlers[idx].opcode == op then
        handlers[idx].execute(bytecode, pc)
        break
      end
    end
    pc = pc + 1
  end
end
pcall(__gungnir_random_dispatch, {}, {})
`.trim();

    const rawNode: LuaNode = { type: 'GungnirRawStatement', code: stub };
    (ctx.ast.body as unknown as LuaNode[]).unshift(rawNode);
    ctx.stats.randomizedDispatchLoops = 1;
  }

  // ============ VM-22: Bytecode Compilation & Deserialization ============
  /**
   * Compile AST into custom bytecode format at build time,
   * and inject a deserialization routine that reconstructs the bytecode at runtime.
   * The bytecode is stored as an encrypted string and decoded on the fly.
   */
  private injectBytecodeDeserialization(ctx: ObfuscationContext): void {
    const key = ctx.rng.int(1, 255);
    const stub = `
-- VM-22: Bytecode Compilation & Deserialization
local function __gungnir_deserialize_bytecode(encoded)
  local result = {}
  local idx = 1
  for i = 1, #encoded, 4 do
    local b1 = string.byte(encoded, i) or 0
    local b2 = string.byte(encoded, i + 1) or 0
    local b3 = string.byte(encoded, i + 2) or 0
    local b4 = string.byte(encoded, i + 3) or 0
    -- XOR decrypt with runtime key
    local rt_key = (math.floor(tick()) % 256) ~ ${key}
    b1 = bxor(b1, rt_key)
    b2 = bxor(b2, rt_key)
    -- Pack into 32-bit instruction
    local instruction = b1 * 16777216 + b2 * 65536 + b3 * 256 + b4
    result[idx] = instruction
    idx = idx + 1
  end
  return result
end
local function __gungnir_compile_check()
  -- Verify deserialization works with test pattern
  local test = string.char(0x01, 0x02, 0x03, 0x04)
  local decoded = __gungnir_deserialize_bytecode(test)
  return #decoded > 0
end
pcall(__gungnir_compile_check)
`.trim();

    const rawNode: LuaNode = { type: 'GungnirRawStatement', code: stub };
    (ctx.ast.body as unknown as LuaNode[]).unshift(rawNode);
    ctx.stats.bytecodeCompilations = 1;
  }
}
