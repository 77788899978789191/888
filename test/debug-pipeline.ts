/**
 * 诊断：hook 真实 Orchestrator 的每个插件，逐步打印产物，定位 string.char() 空参来源
 */
import * as fs from 'fs';
import * as path from 'path';
import { Orchestrator } from '../src/core/Orchestrator';
import { DEFAULT_CONFIG } from '../src/core/types';
import { LuaPrinter } from '../src/core/LuaPrinter';
import type { ObfuscationPlugin } from '../src/core/types';

const SAMPLE = path.resolve(__dirname, '..', '..', 'test', 'sample.lua');

function countEmptyCharCalls(src: string): number {
  const matches = src.match(/string\.char\(\s*\)/g);
  return matches ? matches.length : 0;
}

async function main(): Promise<void> {
  const source = fs.readFileSync(SAMPLE, 'utf-8');

  for (let iter = 0; iter < 25; iter++) {
    const seed = Math.floor(Math.random() * 2 ** 31);
    const config = {
      ...DEFAULT_CONFIG,
      input: SAMPLE,
      output: '/tmp/out.lua',
      intensity: 6,
      seed,
      verify: false,
      verbose: false,
    };

    // 创建真实 Orchestrator，包装每个插件的 transform
    const orch = new Orchestrator(config);
    const plugins = (orch as unknown as { plugins: ObfuscationPlugin[] }).plugins;
    const printer = new LuaPrinter();
    let firstEmpty: { plugin: string; line: string } | null = null;

    for (const p of plugins) {
      const orig = p.transform.bind(p);
      (p as { transform: (ctx: unknown) => unknown }).transform = (ctx: unknown) => {
        const result = orig(ctx as never);
        if (!firstEmpty) {
          try {
            const out = printer.print((ctx as { ast: unknown }).ast as never);
            const empty = countEmptyCharCalls(out);
            if (empty > 0) {
              const lines = out.split('\n');
              for (const line of lines) {
                if (/string\.char\(\s*\)/.test(line)) {
                  firstEmpty = { plugin: p.name, line: line.trim().slice(0, 200) };
                  break;
                }
              }
            }
          } catch { /* 打印失败忽略 */ }
        }
        return result;
      };
    }

    let output: string;
    try {
      output = await orch.obfuscate(source);
    } catch (e) {
      console.log(`iter ${iter}: build error:`, e instanceof Error ? e.message : e);
      continue;
    }

    const empty = countEmptyCharCalls(output);
    const fe = firstEmpty as { plugin: string; line: string } | null | undefined;
    if ((fe !== null && fe !== undefined) || empty > 0) {
      console.log(`\n=== iter ${iter} seed=${seed}: ${empty} empty string.char ===`);
      if (fe) {
        console.log(`  first after: ${fe.plugin}`);
        console.log(`  line: ${fe.line}`);
      }
      fs.writeFileSync('/tmp/out-bad.lua', output);
      break;
    }
  }
  console.log('done');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
