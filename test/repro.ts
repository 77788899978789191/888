/**
 * 单种子确定性复现：REPRO_FILE + REPRO_SEED 环境变量
 * 用法：REPRO_FILE=complex.lua REPRO_SEED=12345 node dist-test/test/repro.js
 */
import * as fs from 'fs';
import * as path from 'path';
import { Orchestrator } from '../src/core/Orchestrator';
import { DEFAULT_CONFIG } from '../src/core/types';

const DIR = path.resolve(__dirname, '..', '..', 'test');
const FILE = process.env.REPRO_FILE ?? 'complex.lua';
const SEED = parseInt(process.env.REPRO_SEED ?? '0', 10);

function runLua(code: string): { ok: boolean; out: string; err: string; line: string } {
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
  const m = err.match(/:(\d+):/);
  let line = '';
  if (m) line = code.split('\n')[parseInt(m[1], 10) - 1]?.slice(0, 200) ?? '';
  return { ok, out: captured.join('\n'), err, line };
}

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
  const output = await orch.obfuscate(source);
  fs.writeFileSync('/tmp/repro.lua', output);
  const r = runLua(output);
  console.log(`file=${FILE} seed=${SEED}`);
  console.log(`ok=${r.ok}`);
  if (!r.ok) {
    console.log(`err=${r.err}`);
    console.log(`line=${r.line}`);
  } else {
    console.log(`out=${JSON.stringify(r.out.slice(0, 200))}`);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
