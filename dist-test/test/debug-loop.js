"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Gungnir-Absolute — 间歇性失败猎手
 * 用不同种子循环构建并执行，捕获失败现场（种子 + 产物 + 错误行）。
 * 用法：node dist-test/test/debug-loop.js <样本> <次数>
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const worker_threads_1 = require("worker_threads");
const Orchestrator_1 = require("../src/core/Orchestrator");
const types_1 = require("../src/core/types");
const sample = process.argv[2] ?? 'sample.lua';
const runs = parseInt(process.argv[3] ?? '12', 10);
function runLuaTimeout(code, timeoutMs) {
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
        let worker;
        try {
            worker = new worker_threads_1.Worker(src, { eval: true });
        }
        catch (e) {
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
        worker.on('message', (msg) => {
            if (msg === 'START')
                return;
            if (!settled) {
                settled = true;
                clearTimeout(timer);
                try {
                    const r = JSON.parse(String(msg));
                    resolve({ ...r, timeout: false });
                }
                catch {
                    resolve({ ok: false, out: '', err: 'parse error', timeout: false });
                }
                worker.terminate();
            }
        });
        worker.on('error', (e) => {
            if (!settled) {
                settled = true;
                clearTimeout(timer);
                resolve({ ok: false, out: '', err: e.message, timeout: false });
            }
        });
    });
}
async function main() {
    const p = path.resolve(__dirname, '..', '..', 'test', sample);
    const source = fs.readFileSync(p, 'utf-8');
    let fail = 0;
    for (let i = 0; i < runs; i++) {
        const seed = 1000 + i * 7919;
        const config = {
            ...types_1.DEFAULT_CONFIG,
            input: p,
            output: '/tmp/dbg-out.lua',
            intensity: 5,
            seed,
            verbose: false,
            // 关闭内部验证重试——我们直接检查首次产物
            verify: false,
            polymorphicPipeline: true,
        };
        try {
            const orch = new Orchestrator_1.Orchestrator(config);
            const output = await orch.obfuscate(source);
            const res = await runLuaTimeout(output, 90000);
            if (res.ok) {
                console.log(`seed=${seed} OK (${(output.length / 1024).toFixed(0)}KB)`);
            }
            else {
                fail++;
                const tag = `seed=${seed} FAIL: ${res.err}`;
                console.log(tag);
                fs.writeFileSync(`/tmp/dbg-fail-${seed}.lua`, output);
                // 提取错误行上下文
                const m = res.err.match(/:(\d+):/);
                if (m) {
                    const ln = parseInt(m[1], 10);
                    const lines = output.split('\n');
                    console.log('--- 上下文 ---');
                    for (let k = Math.max(0, ln - 4); k < Math.min(lines.length, ln + 2); k++) {
                        console.log(`${k + 1}${k + 1 === ln ? '>' : ' '} ${lines[k]}`);
                    }
                    console.log('--- /上下文 ---');
                }
            }
        }
        catch (e) {
            fail++;
            console.log(`seed=${seed} EXCEPTION: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    console.log(`\n失败率: ${fail}/${runs}`);
    process.exit(fail > 0 ? 1 : 0);
}
main().catch(e => { console.error('Fatal:', e); process.exit(1); });
