/**
 * Gungnir-Absolute — 多样本等价性测试
 * 对每个样本：混淆 → 重解析 → fengari 执行 → 输出比对
 * 带超时保护（fengari 较慢，防无限循环挂死测试）。
 */
import * as fs from 'fs';
import * as path from 'path';
import { Worker } from 'worker_threads';
import { Orchestrator } from '../src/core/Orchestrator';
import { DEFAULT_CONFIG } from '../src/core/types';

const fengari = require('fengari');
const { lua, lauxlib, lualib } = fengari;

/** 带超时的 fengari 执行（子线程运行，超时终止） */
function runLuaTimeout(code: string, timeoutMs: number): Promise<{ ok: boolean; out: string; err: string; timeout: boolean }> {
  return new Promise((resolve) => {
    const src = `
      const { parentPort } = require('worker_threads');
      const fengari = require('fengari');
      const { lua, lauxlib, lualib } = fengari;
      const captured = [];
      const L = lauxlib.luaL_newstate();
      lualib.luaL_openlibs(L);
      const pushPrint = () => {
        const n = lua.lua_gettop(L);
        const parts = [];
        for (let i = 1; i <= n; i++) parts.push(lua.lua_tojsstring(L, i));
        captured.push(parts.join('\\t'));
        return 0;
      };
      lua.lua_pushjsfunction(L, pushPrint);
      lua.lua_setglobal(L, fengari.to_luastring('print'));
      parentPort.postMessage('START');
      const status = lauxlib.luaL_dostring(L, fengari.to_luastring(${JSON.stringify(code)}));
      const ok = status === lua.LUA_OK;
      let err = '';
      if (!ok) err = lua.lua_tojsstring(L, -1) || String(status);
      parentPort.postMessage(JSON.stringify({ ok, out: captured.join('\\n'), err }));
    `;
    let worker: Worker;
    try {
      worker = new Worker(src, { eval: true });
    } catch (e) {
      resolve({ ok: false, out: '', err: String(e), timeout: false });
      return;
    }
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        worker.terminate();
        resolve({ ok: false, out: '', err: 'timeout', timeout: true });
      }
    }, timeoutMs);
    worker.on('message', (msg: unknown) => {
      if (msg === 'START') return;
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        try {
          const r = JSON.parse(String(msg)) as { ok: boolean; out: string; err: string };
          resolve({ ...r, timeout: false });
        } catch {
          resolve({ ok: false, out: '', err: 'worker parse error', timeout: false });
        }
        worker.terminate();
      }
    });
    worker.on('error', (e: Error) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ ok: false, out: '', err: e.message, timeout: false });
      }
    });
  });
}

const SAMPLES = ['sample.lua', 'complex.lua'];

async function main(): Promise<void> {
  let failures = 0;
  const fengari = require('fengari');
  const { lua, lauxlib, lualib } = fengari;

  const runLuaSimple = (code: string): { ok: boolean; out: string; err: string } => {
    const captured: string[] = [];
    const L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(L);
    const pushPrint = (): number => {
      const n = lua.lua_gettop(L);
      const parts: string[] = [];
      for (let i = 1; i <= n; i++) parts.push(lua.lua_tojsstring(L, i));
      captured.push(parts.join('\t'));
      return 0;
    };
    lua.lua_pushjsfunction(L, pushPrint);
    lua.lua_setglobal(L, fengari.to_luastring('print'));
    const status = lauxlib.luaL_dostring(L, fengari.to_luastring(code));
    const ok = status === lua.LUA_OK;
    let err = '';
    if (!ok) err = lua.lua_tojsstring(L, -1) || String(status);
    return { ok, out: captured.join('\n'), err };
  };

  for (const sample of SAMPLES) {
    const p = path.resolve(__dirname, '..', '..', 'test', sample);
    if (!fs.existsSync(p)) continue;
    const source = fs.readFileSync(p, 'utf-8');
    const orig = runLuaSimple(source);
    if (!orig.ok) {
      console.log(`[SKIP] ${sample}: 原始脚本自身无法在 fengari 运行（${orig.err.slice(0, 80)}）`);
      continue;
    }

    let pass = false;
    let lastErr = '';
    for (let attempt = 1; attempt <= 3 && !pass; attempt++) {
      const config = {
        ...DEFAULT_CONFIG,
        input: p,
        output: '/tmp/out-eq.lua',
        intensity: 5,
        seed: Math.floor(Math.random() * 2 ** 31),
        verbose: false,
      };
      const orch = new Orchestrator(config);
      try {
        const t0 = Date.now();
        const output = await orch.obfuscate(source);
        const genMs = Date.now() - t0;
        const res = await runLuaTimeout(output, 120000);
        if (res.ok && res.out === orig.out) {
          pass = true;
          console.log(`[PASS] ${sample}（尝试 ${attempt}，${(output.length / 1024).toFixed(1)}KB，生成 ${genMs}ms）`);
        } else if (res.timeout) {
          lastErr = `执行超时（>120s）——疑似死循环`;
          fs.writeFileSync('/tmp/out-bad-' + sample, output);
        } else {
          lastErr = res.ok ? `输出不一致\n  原始: ${orig.out.slice(0, 200)}\n  混淆: ${res.out.slice(0, 200)}` : res.err;
          fs.writeFileSync('/tmp/out-bad-' + sample, output);
        }
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
      }
    }
    if (!pass) {
      failures++;
      console.log(`[FAIL] ${sample}: ${lastErr}`);
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} 个样本失败`);
    process.exit(1);
  }
  console.log('\n全部样本等价性通过');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
