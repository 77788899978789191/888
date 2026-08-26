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
 * 诊断：定位 hmkSnXH2CO(0) 返回 nil 的原因（临时开发用）
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
    const config = {
        ...types_1.DEFAULT_CONFIG,
        input: SAMPLE,
        output: '/tmp/out.lua',
        intensity: 6,
        seed: 424242,
        verify: false,
    };
    const orch = new Orchestrator_1.Orchestrator(config);
    const output = await orch.obfuscate(source);
    // 找到常量解码器与污点计数器名字，注入诊断打印
    // 污点计数器：`CxS86daBVQJ = CxS86daBVQJ + 1` 模式
    const taint = output.match(/if (\w+) ~= (\w+) then (\w+) = \3 \+ 1 end/);
    const kn = output.match(/local (\w+), (\w+), (\w+), (\w+)\ndo/);
    const ids = [];
    const m = output.match(/if math\.sin\((\w+)\(0\)\)/);
    if (m)
        ids.push(m[1]);
    console.log('KN 声明:', kn?.slice(1));
    console.log('污点:', taint?.slice(1));
    console.log('解码器:', ids);
    // 在 KN 定义行（`X = function(id) return tonumber(...)`) 后插入诊断
    const decName = kn?.[2];
    let diag = output;
    if (decName && taint) {
        const t = taint[3];
        diag = output.replace(new RegExp(`${decName} = function`), `do print('TAINT_PRE', ${t}) end;\n${decName} = function`);
        // 在 payload 开始前（do 块结束后）打印每个 id 的解码结果
        diag = diag.replace(/^(--.*\n)*local /m, `local __diag = function() end\n`);
        // 更直接：在 epilogue 后跑一个测试块
        diag += `\ndo
      print('TAINT_POST', ${t})
      for i = 0, 33 do
        local ok, v = pcall(${decName}, i)
        print('ID', i, tostring(ok), tostring(v))
      end
    end\n`;
    }
    const r = runLua(diag);
    console.log(r.out.slice(0, 60).join('\n'));
    if (!r.ok)
        console.error('ERR:', r.err);
    fs.writeFileSync('/tmp/out-diag.lua', output);
}
main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
