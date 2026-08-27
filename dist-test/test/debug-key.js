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
 * 诊断：捕获失败构建，在 GlobalHiding 别名定义处注入调试打印
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const Orchestrator_1 = require("../src/core/Orchestrator");
const types_1 = require("../src/core/types");
const SAMPLE = path.resolve(__dirname, '..', '..', 'test', 'sample.lua');
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
    return { ok, out: captured, err };
}
async function main() {
    const source = fs.readFileSync(SAMPLE, 'utf-8');
    for (let iter = 0; iter < 40; iter++) {
        const config = {
            ...types_1.DEFAULT_CONFIG,
            input: SAMPLE,
            output: '/tmp/out.lua',
            intensity: 6,
            seed: Math.floor(Math.random() * 2 ** 31),
            verify: false,
            verbose: false,
        };
        const orch = new Orchestrator_1.Orchestrator(config);
        let output;
        try {
            output = await orch.obfuscate(source);
        }
        catch (e) {
            console.log(`iter ${iter}: 构建异常:`, e instanceof Error ? e.message : e);
            continue;
        }
        // fengari 原始执行（不插桩）
        const plain = runLua(output);
        if (plain.ok)
            continue;
        // 失败：插桩所有 `local _gxN = _geM[...]` 行，打印 key
        console.log(`\n=== iter ${iter} 失败: ${plain.err} ===`);
        const instrumented = output.replace(/^(local (_gx\w+) = (_ge\w+)\[)(.*)(\])$/gm, (full, head, alias, envVar, keyExpr, tail) => {
            return `${head}${keyExpr}${tail}
do local __dbgk = ${keyExpr} print('DBGKEY ${alias} key=', tostring(__dbgk), 'val=', tostring(${envVar}[__dbgk])) end`;
        });
        const dbg = runLua(instrumented);
        for (const line of dbg.out) {
            if (line.startsWith('DBGKEY'))
                console.log('  ', line);
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
