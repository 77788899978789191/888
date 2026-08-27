/**
 * Gungnir-Absolute — 压力回归测试（stress）
 *
 * 目的：捕获间歇性运行时失败（多态引擎的随机种子空间大，
 * 单次冒烟无法覆盖）。策略：多样本 × 多随机种子全量构建，
 * 每个产物经 fengari 等价性执行（原始输出 == 混淆输出）。
 *
 * 样本：
 *  - sample.lua      基础混合
 *  - complex.lua     控制流密集（CFF 候选）
 *  - hyph.lua        字符串字节 / table.concat 边界
 *  - roblox_full.lua Roblox API（注入桩环境后执行）
 *
 * 【子系统 15/95：执行等价性测试】
 */
import * as fs from 'fs';
import * as path from 'path';
import { Orchestrator } from '../src/core/Orchestrator';
import { DEFAULT_CONFIG } from '../src/core/types';

const DIR = path.resolve(__dirname, '..', '..', 'test');

/** Roblox 全局桩（注入 fengari，使 roblox_full.lua 可脱离引擎执行） */
const ROBLOX_STUBS = `
local __mk = function(id, name)
  return { UserId = id, Name = name }
end
local __players = { __mk(100, 'Alice'), __mk(200, 'Bob'), __mk(300, 'Carol') }
game = {
  GetService = function(self, s)
    if s == 'Players' then
      return { GetPlayers = function() return __players end }
    elseif s == 'RunService' then
      return { IsRunning = function() return true end }
    end
    return {}
  end,
}
`;

interface RunResult { ok: boolean; out: string; err: string }

function runLua(code: string): RunResult {
  const fengari = require('fengari');
  const { lua, lauxlib, lualib, to_luastring } = fengari;
  const captured: string[] = [];
  const L = lauxlib.luaL_newstate();
  lualib.luaL_openlibs(L);
  lua.lua_pushjsfunction(L, () => {
    const n = lua.lua_gettop(L);
    const parts: string[] = [];
    for (let i = 1; i <= n; i++) {
      parts.push(String(lua.lua_tojsstring(L, i)));
    }
    captured.push(parts.join('\t'));
    return 0;
  });
  lua.lua_setglobal(L, to_luastring('print'));
  const status = lauxlib.luaL_dostring(L, to_luastring(code));
  const ok = status === lua.LUA_OK;
  let err = '';
  if (!ok) err = String(lua.lua_tojsstring(L, -1));
  return { ok, out: captured.join('\n'), err };
}

async function main(): Promise<void> {
  const iterations = parseInt(process.env.ITERS ?? '25', 10);
  const only = process.env.SAMPLE ?? '';
  const samples: { file: string; prelude: string }[] = [
    { file: 'sample.lua', prelude: '' },
    { file: 'complex.lua', prelude: '' },
    { file: 'hyph.lua', prelude: '' },
    { file: 'roblox_full.lua', prelude: ROBLOX_STUBS },
  ].filter(s => !only || s.file === only || s.file === `${only}.lua`);

  let total = 0;
  let passed = 0;
  const failures: { file: string; iter: number; seed: number; err: string }[] = [];

  for (const sample of samples) {
    const source = fs.readFileSync(path.join(DIR, sample.file), 'utf-8');
    const orig = runLua(sample.prelude + source);
    if (!orig.ok) {
      console.log(`[SKIP] ${sample.file}: 样本自身无法执行: ${orig.err.slice(0, 120)}`);
      continue;
    }

    for (let iter = 0; iter < iterations; iter++) {
      total++;
      const seed = Math.floor(Math.random() * 2 ** 31);
      const config = {
        ...DEFAULT_CONFIG,
        input: sample.file,
        output: '/tmp/out.lua',
        intensity: 6,
        seed,
        verify: false,
        verbose: false,
      };
      let output: string;
      try {
        const orch = new Orchestrator(config);
        output = await orch.obfuscate(source);
      } catch (e) {
        failures.push({
          file: sample.file, iter, seed,
          err: `构建异常: ${e instanceof Error ? e.message : String(e)}`,
        });
        continue;
      }

      // 语法合法性（luaparse 重解析，Lua 5.1）
      try {
        const luaparse = require('luaparse');
        luaparse.parse(output, { luaVersion: '5.1' });
      } catch (e) {
        failures.push({
          file: sample.file, iter, seed,
          err: `语法: ${e instanceof Error ? e.message : String(e)}`,
        });
        fs.writeFileSync(`/tmp/stress-bad-${sample.file}-${seed}`, output);
        continue;
      }

      // 等价性执行
      const obf = runLua(sample.prelude + output);
      if (!obf.ok) {
        failures.push({
          file: sample.file, iter, seed,
          err: `运行: ${obf.err.slice(0, 200)}`,
        });
        fs.writeFileSync(`/tmp/stress-bad-${sample.file}-${seed}`, output);
        continue;
      }
      if (obf.out !== orig.out) {
        failures.push({
          file: sample.file, iter, seed,
          err: `输出不等价\n  原始: ${orig.out.slice(0, 150)}\n  混淆: ${obf.out.slice(0, 150)}`,
        });
        fs.writeFileSync(`/tmp/stress-bad-${sample.file}-${seed}`, output);
        continue;
      }
      passed++;
    }
    console.log(`[OK ] ${sample.file}: ${iterations} 轮完成`);
  }

  console.log(`\n=== 汇总: ${passed}/${total} 通过 ===`);
  if (failures.length > 0) {
    for (const f of failures.slice(0, 10)) {
      console.log(`✗ ${f.file} seed=${f.seed}: ${f.err}`);
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
