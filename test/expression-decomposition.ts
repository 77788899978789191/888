/**
 * Test: ExpressionDecomposition correctness verification.
 *
 * Drives the plugin's private buildExpression with random integer
 * operands across all supported operators and depths, then evaluates
 * the resulting tree and asserts STRICT equality with a op b.
 * Also verifies the tree actually reaches the requested nesting depth.
 */

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
        default: throw new Error(`unhandled op ${node.operator}`);
      }
    }
    default:
      throw new Error(`unhandled node ${node.type}`);
  }
}

function treeDepth(node: Record<string, unknown>): number {
  const left = node.left as Record<string, unknown> | undefined;
  const right = node.right as Record<string, unknown> | undefined;
  if (!left && !right) return 1;
  const ld = left ? treeDepth(left) : 0;
  const rd = right ? treeDepth(right) : 0;
  return 1 + Math.max(ld, rd);
}

function makeContext(seed: number) {
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
    shuffle: <T>(arr: T[]): T[] => [...arr],
    bool: () => rng.next() < 0.5,
  };
  return {
    ast: { type: 'Chunk', body: [] },
    config: { intensity: 7, hotPathExemption: true },
    rng,
    symbols: new Map(),
    stringPool: [],
    stats: {
      nodesProcessed: 0, stringsEncrypted: 0, predicatesInjected: 0,
      identifiersRenamed: 0, blocksFlattened: 0, constantsObfuscated: 0,
      expressionsDecomposed: 0, deadBlocksInjected: 0, globalsHidden: 0,
      functionsProxied: 0, modulesApplied: [], modulesFailed: [], pipelineOrder: [],
    },
  };
}

const { ExpressionDecompositionPlugin } = require('../dist/obfuscators/ExpressionDecomposition');
const plugin = new ExpressionDecompositionPlugin() as unknown as {
  buildExpression: (ctx: unknown, lv: number, op: string, rv: number, depth: number) => Record<string, unknown>;
};

const OPS = ['+', '-', '*', '%', '^'] as const;
const intOps = ['+', '-', '*', '%'] as const;

let passed = 0;
let failed = 0;

for (const depth of [3, 6, 10]) {
  for (let trial = 0; trial < 300; trial++) {
    // Mix of operator kinds; '^' only with safe small operands
    const op = trial % 4 === 3
      ? '^'
      : intOps[trial % intOps.length];
    let lv: number, rv: number;
    if (op === '^') {
      lv = ((trial * 37) % 9) - 4;   // -4..4
      rv = (trial % 3);               // 0..2
    } else {
      lv = ((trial * 7919) % 200001) - 100000;
      rv = ((trial * 104729) % 997) - 498;
      if (op === '%' && rv === 0) rv = 7;
    }

    const expected = op === '^' ? Math.pow(lv, rv) :
      op === '+' ? lv + rv :
      op === '-' ? lv - rv :
      op === '*' ? lv * rv :
      lv % rv;

    // Skip non-integer results (the plugin gates on these too)
    if (!Number.isInteger(expected) || Math.abs(expected) > 2 ** 51) continue;

    const ctx = makeContext(trial * 31 + depth);
    const tree = plugin.buildExpression(ctx, lv, op, rv, depth);

    try {
      const got = evalExpr(tree);
      if (got === expected) {
        // Depth sanity: 2*depth wraps + core ≈ 2*depth+1 levels
        const d = treeDepth(tree);
        if (d >= depth) {
          passed++;
        } else {
          failed++;
          console.error(`DEPTH FAIL: ${op} depth=${depth} got tree depth ${d}`);
        }
      } else {
        failed++;
        console.error(`VALUE FAIL: ${lv} ${op} ${rv} = ${expected}, got ${got} (depth ${depth})`);
      }
    } catch (err) {
      failed++;
      console.error(`ERROR: ${lv} ${op} ${rv}:`, err instanceof Error ? err.message : err);
    }
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All expression decompositions are exactly value-preserving.');
