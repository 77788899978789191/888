/**
 * Test: Constant obfuscation correctness verification.
 * Simulates the generated expressions to confirm every transform
 * evaluates to the exact original value.
 */

// Evaluate a mini-expression AST (same node shapes the plugin emits)
function evalExpr(node: Record<string, unknown>): number {
  switch (node.type) {
    case 'NumericLiteral':
      return Number(node.value);
    case 'BinaryExpression': {
      const l = evalExpr(node.left as Record<string, unknown>);
      const r = evalExpr(node.right as Record<string, unknown>);
      switch (node.operator) {
        case '+': return l + r;
        case '-': return l - r;
        case '*': return l * r;
        case '/': return l / r;
        case '%': return l % r;
        case '^': return Math.pow(l, r);
        case '~': // Lua bitwise XOR emulation for small ints
          return floatToInt(l) ^ floatToInt(r);
        default: throw new Error(`unhandled op ${node.operator}`);
      }
    }
    case 'UnaryExpression':
      if (node.operator === '-') return -evalExpr(node.argument as Record<string, unknown>);
      if (node.operator === '~') {
        // Lua unary bitwise NOT: ~x == -x - 1 (on int64 domain)
        return -floatToInt(evalExpr(node.argument as Record<string, unknown>)) - 1;
      }
      if (node.operator === '#') {
        // table length
        const arg = node.argument as Record<string, unknown>;
        const fields = arg.fields as { value: unknown }[];
        return fields.length;
      }
      throw new Error(`unhandled unary ${node.operator}`);
    case 'TableConstructorExpression':
      return (node.fields as unknown[]).length;
    default:
      throw new Error(`unhandled node ${node.type}`);
  }
}

function floatToInt(f: number): number {
  // Lua's float→int conversion for bitwise ops (truncate toward zero)
  return f < 0 ? Math.ceil(f) : Math.floor(f);
}

// Load the actual plugin and drive it with a synthetic context
const { ConstantObfuscationPlugin } = require('../dist/obfuscators/ConstantObfuscation');

function makeContext(seed: number, intensity: number) {
  let state = seed >>> 0 || 0x9E3779B9;
  const rng = {
    next: () => {
      state ^= state << 13; state >>>= 0;
      state ^= state >>> 17;
      state ^= state << 5; state >>>= 0;
      return state / 0xFFFFFFFF;
    },
    int: (min: number, max: number) => Math.floor(rng.next() * (max - min + 1)) + min,
    pick: <T>(arr: T[]): T => arr[rng.int(0, arr.length - 1)],
    shuffle: <T>(arr: T[]): T[] => {
      const r = [...arr];
      for (let i = r.length - 1; i > 0; i--) {
        const j = rng.int(0, i);
        [r[i], r[j]] = [r[j], r[i]];
      }
      return r;
    },
    bool: () => rng.next() < 0.5,
  };
  return {
    ast: { type: 'Chunk', body: [] },
    config: { intensity, hotPathExemption: true },
    rng,
    symbols: new Map(),
    stringPool: [],
    stats: {
      nodesProcessed: 0, stringsEncrypted: 0, predicatesInjected: 0,
      identifiersRenamed: 0, blocksFlattened: 0, constantsObfuscated: 0,
      deadBlocksInjected: 0, globalsHidden: 0, functionsProxied: 0,
      modulesApplied: [], modulesFailed: [], pipelineOrder: [],
    },
  };
}

// Test values across magnitudes
const testValues = [
  2, 3, 7, 10, 42, 100, 999, 12345, 65535, 1000003,
  123456789, 2 ** 20 + 12345, 2 ** 30 + 777,
  -5, -42, -9999, -123456789,
  2.5, 3.14159, -0.5, 123.456,
];

const plugin = new ConstantObfuscationPlugin();
// Access private method via any-cast for testing
const pluginAny = plugin as unknown as {
  transformConstant: (ctx: unknown, value: number, intensity: number) => Record<string, unknown> | null;
};

let passed = 0;
let failed = 0;

for (const intensity of [5, 8, 10]) {
  for (let trial = 0; trial < 200; trial++) {
    const value = testValues[Math.floor(Math.random() * testValues.length)];
    const ctx = makeContext(trial * 7919 + intensity, intensity);

    const result = pluginAny.transformConstant(ctx, value, intensity);
    if (result === null) continue;

    try {
      const evaluated = evalExpr(result);
      // STRICT equality — no tolerance. Every transform must be
      // exactly value-preserving (floats only get exact transforms).
      if (evaluated === value) {
        passed++;
      } else {
        failed++;
        console.error(
          `FAIL (intensity=${intensity}): ${value} → ${evaluated} (drift: ${evaluated - value})`
        );
      }
    } catch (err) {
      failed++;
      console.error(`ERROR evaluating ${value}:`, err instanceof Error ? err.message : err);
    }
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All constant obfuscation transforms are value-preserving!');
