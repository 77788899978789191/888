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
 * 单种子确定性复现：REPRO_FILE + REPRO_SEED 环境变量
 * 用法：REPRO_FILE=complex.lua REPRO_SEED=12345 node dist-test/test/repro.js
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const Orchestrator_1 = require("../src/core/Orchestrator");
const types_1 = require("../src/core/types");
const DIR = path.resolve(__dirname, '..', '..', 'test');
const FILE = process.env.REPRO_FILE ?? 'complex.lua';
const SEED = parseInt(process.env.REPRO_SEED ?? '0', 10);
function runLua(code) {
    const fengari = require('fengari');
    const { lua, lauxlib, lualib, to_luastring } = fengari;
    const captured = [];
    const L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(L);
    lua.lua_pushjsfunction(L, () => {
        const n = lua.lua_gettop(L);
        const parts = [];
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
    if (!ok)
        err = String(lua.lua_tojsstring(L, -1));
    const m = err.match(/:(\d+):/);
    let line = '';
    if (m)
        line = code.split('\n')[parseInt(m[1], 10) - 1]?.slice(0, 200) ?? '';
    return { ok, out: captured.join('\n'), err, line };
}
async function main() {
    const source = fs.readFileSync(path.join(DIR, FILE), 'utf-8');
    const config = {
        ...types_1.DEFAULT_CONFIG,
        input: FILE,
        output: '/tmp/repro.lua',
        intensity: 6,
        seed: SEED,
        verify: false,
        verbose: false,
    };
    const orch = new Orchestrator_1.Orchestrator(config);
    const output = await orch.obfuscate(source);
    fs.writeFileSync('/tmp/repro.lua', output);
    const r = runLua(output);
    console.log(`file=${FILE} seed=${SEED}`);
    console.log(`ok=${r.ok}`);
    if (!r.ok) {
        console.log(`err=${r.err}`);
        console.log(`line=${r.line}`);
    }
    else {
        console.log(`out=${JSON.stringify(r.out.slice(0, 200))}`);
    }
}
main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
