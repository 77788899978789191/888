"use strict";
/**
 * 诊断：GHSH 算术在 fengari int/float 两种类型路径下与 TS 的差异（临时开发用）
 */
function runLua(code) {
    const fengari = require('fengari');
    const { lua, lauxlib, lualib, to_luastring } = fengari;
    const captured = [];
    const L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(L);
    lua.lua_pushjsfunction(L, () => {
        const n = lua.lua_gettop(L);
        const parts = [];
        for (let i = 1; i <= n; i++)
            parts.push(String(lua.lua_tojsstring(L, i)));
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
// TS 参考实现（与 VMCodec.ghash 相同）
function ghashTS(bytes, seed) {
    const mod = 2 ** 31 - 1;
    let h = seed % mod;
    for (let i = 0; i < bytes.length; i++) {
        h = (h * 33 + (bytes[i] & 0xFF)) % mod;
    }
    return h;
}
function main() {
    // 模拟多页载荷：2000 字节伪随机数据
    let s = 12345;
    const bytes = [];
    for (let i = 0; i < 2000; i++) {
        s = (Math.imul(s, 1103515245) + 12345) >>> 0;
        bytes.push(s & 0xFF);
    }
    const luaStr = bytes.map(b => b).join(',');
    const IH0 = 5381 + 98765 % 100000; // ~104246
    // fengari：整数类型路径（h0 为整数字面量）
    const codeInt = `
local bytes = {${luaStr}}
local s = table.concat((function()
  local t = {}
  for i = 1, #bytes do t[i] = string.char(bytes[i]) end
  return t
end)())
local function GHSH(s, h)
  for j = 1, #s do h = (h * 33 + string.byte(s, j)) % 2147483647 end
  return h
end
local h = ${IH0}
local n = #s
local sl = math.ceil(n / 100)
local st = 1
while st <= n do
  h = GHSH(string.sub(s, st, math.min(st + sl - 1, n)), h)
  st = st + sl
end
print('INT_PATH', h, math.type and math.type(h) or '?')
`;
    const rInt = runLua(codeInt);
    // fengari：浮点类型路径（h0 为 .0 字面量）
    const codeFloat = codeInt.replace(`local h = ${IH0}`, `local h = ${IH0}.0`).replace('print(\'INT_PATH\'', "print('FLOAT_PATH'");
    const rFloat = runLua(codeFloat);
    // TS：分片哈希
    const sliceLen = Math.max(1, Math.ceil(bytes.length / 100));
    let ih = IH0;
    for (let st = 0; st < bytes.length; st += sliceLen) {
        const end = Math.min(st + sliceLen, bytes.length);
        ih = ghashTS(bytes.slice(st, end), ih);
    }
    // TS：不分片直接哈希（对照）
    const whole = ghashTS(bytes, IH0);
    console.log('fengari INT  :', rInt.out.join(' '), rInt.err);
    console.log('fengari FLOAT:', rFloat.out.join(' '), rFloat.err);
    console.log('TS 分片      :', ih);
    console.log('TS 不分片    :', whole);
}
main();
