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
 * 调试：定位运行时 TAINT 累加来源（仅开发用）
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
    lua.lua_pushjsfunction(L, (...args) => {
        const parts = [];
        for (let i = 1; i < lua.lua_gettop(L) + 1; i++) {
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
const pool = [
    { id: 0, plaintext: Array.from(Buffer.from('483', 'ascii')), isNumber: true, original: '483' },
    { id: 1, plaintext: Array.from(Buffer.from('Hello', 'utf-8')), isNumber: false, original: 'Hello' },
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
// 找出 taint 变量名：local <name> = 0 且随后有 "<name> = <name> + 1"
let prologue = emission.prologue;
const assignRe = /local (\w+) = 0\n/g;
let m;
const candidates = [];
while ((m = assignRe.exec(prologue)) !== null) {
    if (prologue.includes(`${m[1]} = ${m[1]} + 1`) || prologue.includes(`${m[1]} = ${m[1]} + 2`)) {
        candidates.push(m[1]);
    }
}
console.log('TAINT 候选变量:', candidates.join(', '));
// 精确锁定：参与 `> 3` 比较的才是 TAINT
const taintVar = candidates.find(name => prologue.includes(`${name} > 3`));
console.log('TAINT 变量:', taintVar);
if (taintVar) {
    prologue = prologue.split(`${taintVar} = ${taintVar} + 1`).join(`${taintVar} = ${taintVar} + 1; __TICK(debug.traceback('', 2))`);
    prologue = prologue.split(`${taintVar} = ${taintVar} + 2`).join(`${taintVar} = ${taintVar} + 2; __TICK('PLUS2')`);
}
const testCode = `
local __DBG = {}
__TICK = function(n) __DBG[#__DBG + 1] = n end
${prologue}
__T = {}
__T.K = ${emission.fetchString}
print('K(1)=', tostring(__T.K(1)))
for i = 1, #__DBG do print('taint+', __DBG[i]) end
${emission.epilogue}
`;
const r = runLua(testCode);
console.log('运行:', r.ok ? 'OK' : 'FAIL');
for (const line of r.out)
    console.log('  [out]', line);
if (!r.ok)
    console.log('  [err]', r.err);
