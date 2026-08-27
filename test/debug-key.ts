/**
 * 诊断：捕获失败构建，在 GlobalHiding 别名定义处注入调试打印
 */
import * as fs from 'fs';
import * as path from 'path';
import { Orchestrator } from '../src/core/Orchestrator';
import { DEFAULT_CONFIG } from '../src/core/types';

const SAMPLE = path.resolve(__dirname, '..', '..', 'test', 'sample.lua');

function runLua(code: string): { ok: boolean; out: string[]; err: string } {
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
  return { ok, out: captured, err };
}

async function main(): Promise<void> {
  const source = fs.readFileSync(SAMPLE, 'utf-8');

  for (let iter = 0; iter < 40; iter++) {
    const config = {
      ...DEFAULT_CONFIG,
      input: SAMPLE,
      output: '/tmp/out.lua',
      intensity: 6,
      seed: Math.floor(Math.random() * 2 ** 31),
      verify: false,
      verbose: false,
    };
    const orch = new Orchestrator(config);
    let output: string;
    try {
      output = await orch.obfuscate(source);
    } catch (e) {
      console.log(`iter ${iter}: 构建异常:`, e instanceof Error ? e.message : e);
      continue;
    }

    // fengari 原始执行（不插桩）
    const plain = runLua(output);
    if (plain.ok) continue;

    // 失败：插桩所有 `local _gxN = _geM[...]` 行，打印 key
    console.log(`\n=== iter ${iter} 失败: ${plain.err} ===`);
    const instrumented = output.replace(
      /^(local (_gx\w+) = (_ge\w+)\[)(.*)(\])$/gm,
      (full, head, alias, envVar, keyExpr, tail) => {
        return `${head}${keyExpr}${tail}
do local __dbgk = ${keyExpr} print('DBGKEY ${alias} key=', tostring(__dbgk), 'val=', tostring(${envVar}[__dbgk])) end`;
      },
    );
    const dbg = runLua(instrumented);
    for (const line of dbg.out) {
      if (line.startsWith('DBGKEY')) console.log('  ', line);
    }
    // 找出错行内容
    const lineMatch = plain.err.match(/:(\d+):/);
    if (lineMatch) {
      const lineNo = parseInt(lineMatch[1], 10);
      console.log('出错行:', output.split('\n')[lineNo - 1]?.slice(0, 160));
    }
    fs.writeFileSync('/tmp/out-bad.lua', output);
    break;
  }
  console.log('done');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
