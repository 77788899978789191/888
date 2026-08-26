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
 * GX-Cipher 隔离测试：小池 → emitRuntime → fengari 执行 → 对比解密结果
 */
const SeedEngine_1 = require("../src/core/SeedEngine");
const VMCodec_1 = require("../src/core/VMCodec");
const PolymorphicRuntime_1 = require("../src/core/PolymorphicRuntime");
const fengari = __importStar(require("fengari"));
const { lua, lauxlib, lualib, to_luastring } = fengari;
function runLua(code) {
    const captured = [];
    const L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(L);
    const f = to_luastring;
    // 暴露 print
    lua.lua_pushjsfunction(L, (...args) => {
        const parts = [];
        for (let i = 1; i < lua.lua_gettop(L) + 1; i++) {
            parts.push(String(lua.lua_tojsstring(L, i)));
        }
        captured.push(parts.join('\t'));
        return 0;
    });
    lua.lua_setglobal(L, f('print'));
    const status = lauxlib.luaL_dostring(L, f(code));
    const ok = status === lua.LUA_OK;
    let err = '';
    if (!ok)
        err = String(lua.lua_tojsstring(L, -1));
    return { ok, out: captured, err };
}
function main() {
    // 小池：3 个条目（1 数字 + 2 字符串）
    const pool = [
        { id: 0, plaintext: Array.from(Buffer.from('483', 'ascii')), isNumber: true, original: '483' },
        { id: 1, plaintext: Array.from(Buffer.from('Hello', 'utf-8')), isNumber: false, original: 'Hello' },
        { id: 2, plaintext: Array.from(Buffer.from('Lua 5.1 test', 'utf-8')), isNumber: false, original: 'Lua 5.1 test' },
    ];
    const seedEngine = new SeedEngine_1.SeedEngine('test');
    const layout = (0, VMCodec_1.buildLayout)(seedEngine, 3);
    const emission = (0, PolymorphicRuntime_1.emitRuntime)(seedEngine, layout, pool, {
        intensity: 3,
        timeBombTtl: 0,
        antiDebugMode: 'silent',
        coroutineCount: 220,
        builtAt: Date.now(),
    });
    // 暴露 K/KN 的测试载荷
    const testCode = `
${emission.prologue}
-- TEST: 暴露局部 K/KN
__T = {}
__T.K = ${emission.fetchString}
__T.KN = ${emission.fetchNumber}
do
  local s0 = __T.K(1)
  local s1 = __T.K(2)
  local n0 = __T.KN(0)
  print('K(1)=', s0, '#', #s0)
  print('K(2)=', s1, '#', #s1)
  print('KN(0)=', tostring(n0), type(n0))
  -- 二次调用（缓存路径）
  local s0b = __T.K(1)
  print('K(1) cached=', s0b, 'same=', s0 == s0b)
end
${emission.epilogue}
`;
    const r = runLua(testCode);
    console.log('运行:', r.ok ? 'OK' : 'FAIL');
    for (const line of r.out)
        console.log('  [out]', line);
    if (!r.ok)
        console.log('  [err]', r.err);
    // TS 侧对照：compileCipherProgram 模拟
    console.log('\n--- TS 侧模拟对照 ---');
    const junkDs = seedEngine.derive('junk-bytes');
    const junkStream = () => junkDs.nextU32() & 0xFF;
    for (const entry of pool) {
        const res = (0, VMCodec_1.compileCipherProgram)(layout, entry.plaintext, entry.id, junkStream);
        console.log(`pool[${entry.id}] "${entry.original.slice(0, 12)}" 程序 ${res.program.bytes.length}B 密文 ${res.ciphertext.length}B`);
    }
}
main();
