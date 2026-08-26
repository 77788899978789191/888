"use strict";
/** 调试：GHSH（Lua）与 ghash（TS）逐位一致性 */
const fengari = require('fengari');
const { lua, lauxlib, lualib, to_luastring } = fengari;
const runLua = (code) => {
    const captured = [];
    const L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(L);
    lua.lua_pushjsfunction(L, (...args) => {
        const parts = [];
        for (let i = 1; i <= lua.lua_gettop(L); i++)
            parts.push(String(lua.lua_tojsstring(L, i)));
        captured.push(parts.join('\t'));
        return 0;
    });
    lua.lua_setglobal(L, to_luastring('print'));
    const status = lauxlib.luaL_dostring(L, to_luastring(code));
    return { ok: status === lua.LUA_OK, out: captured, err: status === lua.LUA_OK ? '' : lua.lua_tojsstring(L, -1) };
};
const mod = 2 ** 31 - 1;
const ghash = (bytes, seed = 5381) => {
    let h = seed % mod;
    for (const b of bytes)
        h = (h * 33 + b) % mod;
    return h;
};
// 场景 A：整数路径
const bytesA = [200, 100, 50, 25, 12, 6, 3, 1, 255, 128];
// 场景 B：MBA 浮点初始值（模拟 mbaConst pick=0 的 ((v*k))/k）
const code = `
local function GHSH(s, h)
  for j = 1, #s do h = (h * 33 + string.byte(s, j)) % 2147483647 end
  return h
end
local s = string.char(${bytesA.join(', ')})
print('A int  ', GHSH(s, 5381))
print('A float', GHSH(s, ((5381*54))/54))
print('B big  ', GHSH(s, ((2147483000*54))/54))
local big = string.rep('\\255', 40)
print('C rep40 int  ', GHSH(big, 5381))
print('C rep40 float', GHSH(big, (((5381*54))/54)))
print('types', math.type((((5381*54))/54)), math.type(GHSH(s, ((5381*54))/54)))
`;
const r = runLua(code);
console.log(r.out.join('\n'));
console.log('TS ghash A      :', ghash(bytesA));
console.log('TS ghash C(40)  :', ghash(new Array(40).fill(255)));
if (!r.ok)
    console.log('ERR:', r.err);
