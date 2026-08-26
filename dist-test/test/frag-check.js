"use strict";
const frags = [1266073836, 581117201, 544176044, 1408321230, 1603437239, 45418097, 1608997741, 695796170, 1586841029, 1320091947, 231858737, 886865944, 1051336210, 1837755161, 1094266281, 1997248594];
const mult = 1482557992;
const mod = 2147483647;
let acc = 0;
for (const f of frags)
    acc = (acc * mult + f) % mod;
console.log('JS    :', acc, 'expected in lua file: 1151781480');
const fengari = require('fengari');
const { lua, lauxlib, lualib } = fengari;
const L = lauxlib.luaL_newstate();
lualib.luaL_openlibs(L);
const code = `
local frags = {${frags.join(',')}}
local mult, mod = ${mult}, ${mod}
local acc = 0
for i = 1, 16 do acc = (acc * mult + frags[i]) % mod end
print(acc)
print(math.type and math.type(acc) or 'lua51')
`;
const st = lauxlib.luaL_dostring(L, fengari.to_luastring(code));
if (st !== lua.LUA_OK)
    console.log('ERR', lua.lua_tojsstring(L, -1));
