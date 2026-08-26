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
 * 调试：多构建循环，定位 GCHK 失败的具体构建（仅开发用）
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
for (let trial = 0; trial < 8; trial++) {
    const seedEngine = new SeedEngine_1.SeedEngine('test');
    const layout = (0, VMCodec_1.buildLayout)(seedEngine, 3);
    const emission = (0, PolymorphicRuntime_1.emitRuntime)(seedEngine, layout, pool, {
        intensity: 3,
        timeBombTtl: 0,
        antiDebugMode: 'silent',
        coroutineCount: 220,
        builtAt: Date.now(),
    });
    const paylVar = emission.prologue.match(/(\w+) = table\.concat\(parts\)/)?.[1] ?? null;
    const gchkVar = emission.prologue.match(/local function (\w+)\(s, h\)/)?.[1] ?? null;
    let prologue = emission.prologue;
    if (paylVar) {
        prologue = prologue.replace(`${paylVar} = table.concat(parts)`, `${paylVar} = table.concat(parts)\n__G = ${paylVar}`);
    }
    if (gchkVar) {
        prologue = prologue.replace(`if not ${gchkVar}() then`, `do local __r = ${gchkVar}() print('GCHK', tostring(__r)) end\nif not ${gchkVar}() then`);
    }
    const testCode = `
${prologue}
${emission.epilogue}
do
  if __G ~= nil then
    local t = {}
    for i = 1, #__G do t[#t + 1] = string.byte(__G, i) end
    print('PAYL bytes', table.concat(t, ','))
  end
end
`;
    const r = runLua(testCode);
    const gchkLine = r.out.find(l => l.startsWith('GCHK'));
    const bytesLine = r.out.find(l => l.startsWith('PAYL bytes'));
    const luaBytes = bytesLine
        ? bytesLine.split('\t')[1].split(',').map(Number)
        : [];
    const IH0 = 5381 + (seedEngine.derive('ih0').nextU32() % 100000);
    const sliceLen = Math.max(1, Math.ceil(luaBytes.length / 100));
    let ih = IH0;
    for (let st = 0; st < luaBytes.length; st += sliceLen) {
        const end = Math.min(st + sliceLen, luaBytes.length);
        ih = (0, VMCodec_1.ghash)(luaBytes.slice(st, end), ih);
    }
    const match = ih === emission.integrityHash;
    const gchkOk = gchkLine?.includes('true');
    console.log(`trial ${trial}: GCHK=${gchkOk ? 'OK' : 'FAIL'} tsHash=${ih} expected=${emission.integrityHash} hashMatch=${match} paylLen=${luaBytes.length}`);
    if (!gchkOk || !match) {
        // dump first divergence: 逐分片对比 Lua 内部哈希
        const dumpCode = `
${prologue}
${emission.epilogue}
`;
        void dumpCode;
    }
}
