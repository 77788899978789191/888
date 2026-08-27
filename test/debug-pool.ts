/**
 * 池一致性调试：构建后直接对比 VMEngine 池条目与 AST 中 K() 调用 id。
 * 若 K(208) 在池中对应 "314" 而 AST 用 208 替换字符串 → 收集/替换错位。
 */
import * as fs from 'fs';
import * as path from 'path';
import { Orchestrator } from '../src/core/Orchestrator';
import { DEFAULT_CONFIG } from '../src/core/types';

const DIR = path.resolve(__dirname, '..', '..', 'test');
const FILE = process.env.REPRO_FILE ?? 'complex.lua';
const SEED = parseInt(process.env.REPRO_SEED ?? '1016313696', 10);

async function main(): Promise<void> {
  const source = fs.readFileSync(path.join(DIR, FILE), 'utf-8');
  const config = {
    ...DEFAULT_CONFIG,
    input: FILE,
    output: '/tmp/repro.lua',
    intensity: 6,
    seed: SEED,
    verify: false,
    verbose: false,
  };
  const orch = new Orchestrator(config);
  // 拦截 VMEngine 的池
  const output = await orch.obfuscate(source);
  const vm = orch.getPlugins().find(p => p.name === 'VMEngine') as unknown as {
    emission: { poolSize: number } | null;
  };
  console.log('VM emission poolSize:', vm?.emission?.poolSize);
  fs.writeFileSync('/tmp/repro.lua', output);

  // 从产物反查：K 调用的 id 集合
  const callRe = /\b([A-Za-z_]\w*)\((\d+)\)/g;
  const counts = new Map<string, Set<number>>();
  let m: RegExpExecArray | null;
  while ((m = callRe.exec(output)) !== null) {
    if (!counts.has(m[1])) counts.set(m[1], new Set());
    counts.get(m[1])!.add(parseInt(m[2], 10));
  }
  for (const [fn, ids] of counts) {
    if (ids.size > 5) {
      const sorted = [...ids].sort((a, b) => a - b);
      console.log(`fn=${fn} ids(${sorted.length}): min=${sorted[0]} max=${sorted[sorted.length - 1]}`);
    }
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
