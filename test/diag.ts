/**
 * 诊断：循环构建，GCHK 失败时逐字节对比 Lua PAYL 与 TS payloadBytes（临时开发用）
 */
import * as fs from 'fs';
import * as path from 'path';
import { Orchestrator } from '../src/core/Orchestrator';
import { DEFAULT_CONFIG } from '../src/core/types';
import { VMEnginePlugin } from '../src/obfuscators/VMEngine';
import { ghash } from '../src/core/VMCodec';

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
  const LOOPS = 24;
  let gchkFails = 0;
  let fragFails = 0;
  let fpFails = 0;

  for (let iter = 0; iter < LOOPS; iter++) {
    const config = {
      ...DEFAULT_CONFIG,
      input: SAMPLE,
      output: '/tmp/out.lua',
      intensity: 6,
      seed: 1000 + iter,
      verify: false,
    };
    const orch = new Orchestrator(config);
    await orch.obfuscate(source);
    const vmPlugin = orch.getPlugins().find(p => p.name === 'VMEngine') as VMEnginePlugin | undefined;
    const em = vmPlugin?.emission;
    if (!em) continue;

    const paylName = em.prologue.match(/(\w+) = table\.concat\(parts\)/)?.[1];
    const gchkName = paylName
      ? em.prologue.match(new RegExp(`local function (\\w+)\\(\\)\\s*\\n\\s*local \\w+ = ${paylName}`))?.[1]
      : undefined;
    if (!paylName || !gchkName) continue;

    let prologue = em.prologue;
    // 失败时导出 PAYL 字节
    prologue = prologue.replace(
      `${paylName} = table.concat(parts)`,
      `${paylName} = table.concat(parts)
do
  local t = {}
  for i = 1, #${paylName} do t[#t + 1] = string.byte(${paylName}, i) end
  print('PAYLHEX', table.concat(t, ','))
  print('GCHK_RES', tostring(${gchkName}()))
end`,
    );

    const initCode = `
${prologue}
${em.epilogue}
`;
    const r = runLua(initCode);
    const gchkLine = r.out.find(l => l.startsWith('GCHK_RES'));
    const gchkOk = gchkLine?.includes('true');

    // 污点来源判断：直接从 TAINT_INC 输出（不再插桩，粗判）
    if (!gchkOk) {
      gchkFails++;
      const hexLine = r.out.find(l => l.startsWith('PAYLHEX'));
      if (hexLine && em.payloadDebug) {
        const luaBytes = hexLine.split('\t')[1].split(',').map(Number);
        const tsBytes = em.payloadDebug;
        console.log(`\n=== 迭代 ${iter} GCHK 失败 ===`);
        console.log('长度: Lua', luaBytes.length, 'TS', tsBytes.length);
        if (luaBytes.length === tsBytes.length) {
          let firstDiff = -1;
          let diffs = 0;
          for (let i = 0; i < luaBytes.length; i++) {
            if (luaBytes[i] !== tsBytes[i]) {
              diffs++;
              if (firstDiff < 0) firstDiff = i;
            }
          }
          console.log('差异数:', diffs, '首个差异位置:', firstDiff);
          if (firstDiff >= 0) {
            console.log('Lua 字节 [first-4, first+8]:', luaBytes.slice(Math.max(0, firstDiff - 4), firstDiff + 8).join(','));
            console.log('TS  字节 [first-4, first+8]:', tsBytes.slice(Math.max(0, firstDiff - 4), firstDiff + 8).join(','));
          }
          // 用 TS ghash 复算 Lua 字节
          const sliceLen = Math.max(1, Math.ceil(luaBytes.length / 100));
          let ih = 5381; // 与 IH0 无关——仅检查自洽性用诊断
          console.log('TS payload 前 32 字节:', tsBytes.slice(0, 32).join(','));
          console.log('Lua PAYL  前 32 字节:', luaBytes.slice(0, 32).join(','));
          console.log('TS payload 尾 32 字节:', tsBytes.slice(-32).join(','));
          console.log('Lua PAYL  尾 32 字节:', luaBytes.slice(-32).join(','));
        } else {
          console.log('长度不一致!');
        }
      }
      if (iter >= 2) break; // 找到失败样本即停（前 2 次继续观察概率）
    }
  }
  console.log(`\n=== 统计（${LOOPS} 次或提前停止）===`);
  console.log('GCHK 失败:', gchkFails);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
