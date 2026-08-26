/**
 * Gungnir-Absolute — 端到端冒烟测试
 * 全流水线 → 输出合法性（luaparse 重解析）→ fengari 等价性执行
 */
import * as fs from 'fs';
import * as path from 'path';
import { Orchestrator } from '../src/core/Orchestrator';
import { DEFAULT_CONFIG } from '../src/core/types';

const SAMPLE = path.resolve(__dirname, '..', '..', 'test', 'sample.lua');

async function main(): Promise<void> {
  const source = fs.readFileSync(SAMPLE, 'utf-8');
  console.log('=== 输入 ===');
  console.log(source.slice(0, 200));

  const config = {
    ...DEFAULT_CONFIG,
    input: SAMPLE,
    output: '/tmp/out.lua',
    intensity: 6,
    seed: Math.floor(Math.random() * 2 ** 31),
    verbose: true,
  };

  const orch = new Orchestrator(config);
  const output = await orch.obfuscate(source);

  console.log('\n=== 输出统计 ===');
  console.log('输出长度:', output.length, '字节');
  console.log('输入长度:', source.length, '字节');
  console.log('膨胀率:', (output.length / source.length).toFixed(2) + 'x');

  const stats = orch.getStats();
  if (stats) {
    console.log('模块应用:', stats.modulesApplied.join(' → '));
    console.log('模块失败:', stats.modulesFailed.length ? stats.modulesFailed.join(', ') : '(无)');
  }

  // 合法性检查 1：luaparse 重解析
  const luaparse = require('luaparse');
  try {
    luaparse.parse(output, { luaVersion: '5.1' });
    console.log('\n✓ luaparse 重解析通过（语法合法 Lua 5.1）');
  } catch (e) {
    console.error('\n✗ luaparse 重解析失败:', e instanceof Error ? e.message : e);
    fs.writeFileSync('/tmp/out-bad.lua', output);
    process.exit(1);
  }

  // 合法性检查 2：fengari 运行时执行（等价性测试【子系统 15/95】）
  const fengari = require('fengari');
  const { lua, lauxlib, lualib } = fengari;

  const runLua = (code: string): { ok: boolean; out: string; err: string } => {
    const captured: string[] = [];
    const L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(L);
    // 劫持 print 收集输出
    const pushPrint = (): number => {
      const n = lua.lua_gettop(L);
      const parts: string[] = [];
      for (let i = 1; i <= n; i++) {
        parts.push(lua.lua_tojsstring(L, i));
      }
      captured.push(parts.join('\t'));
      return 0;
    };
    lua.lua_pushjsfunction(L, pushPrint);
    lua.lua_setglobal(L, fengari.to_luastring('print'));

    const status = lauxlib.luaL_dostring(L, fengari.to_luastring(code));
    const ok = status === lua.LUA_OK;
    let err = '';
    if (!ok) {
      err = lua.lua_tojsstring(L, -1) || String(status);
    }
    return { ok, out: captured.join('\n'), err };
  };

  console.log('\n=== fengari 等价性执行 ===');
  const origResult = runLua(source);
  console.log('原始输出:', JSON.stringify(origResult.out.slice(0, 120)));

  const obfResult = runLua(output);
  if (!obfResult.ok) {
    console.error('✗ 混淆产物运行失败:', obfResult.err);
    fs.writeFileSync('/tmp/out-bad.lua', output);
    process.exit(1);
  }
  console.log('混淆输出:', JSON.stringify(obfResult.out.slice(0, 120)));

  if (origResult.ok && origResult.out === obfResult.out) {
    console.log('✓✓ 等价性验证通过（输出完全一致）');
  } else {
    console.error('✗ 输出不一致！');
    console.error('  原始:', origResult.out.split('\n').slice(0, 20).join(' | '));
    console.error('  混淆:', obfResult.out.split('\n').slice(0, 20).join(' | '));
    fs.writeFileSync('/tmp/out-bad.lua', output);
    process.exit(1);
  }

  // 输出文件
  fs.writeFileSync('/tmp/out.lua', output);
  console.log('\n已写入 /tmp/out.lua');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
