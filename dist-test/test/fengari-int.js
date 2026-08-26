"use strict";
/** fengari 整数运算与 JS 对比 */
const fengari = require('fengari');
const { lua, lauxlib, lualib, to_luastring } = fengari;
const L = lauxlib.luaL_newstate();
lualib.luaL_openlibs(L);
const captured = [];
lua.lua_pushjsfunction(L, (...args) => {
    const parts = [];
    for (let i = 1; i <= lua.lua_gettop(L); i++)
        parts.push(String(lua.lua_tojsstring(L, i)));
    captured.push(parts.join(' '));
    return 0;
});
lua.lua_setglobal(L, to_luastring('print'));
const code = `
print(2093771582 * 33 + 12)
print((2093771582 * 33 + 12) % 2147483647)
print(math.type(2093771582 * 33 + 12))
print(5381 * 33 + 200)
print(177773 * 33 + 100)
print(math.floor(69094462218 / 2147483647))
print(69094462218 % 2147483647)
print(2093771582 * 33)
print(2^53, 2^53 + 1)
print(math.maxinteger or 'n/a')
`;
lauxlib.luaL_dostring(L, to_luastring(code));
console.log(captured.join('\n'));
console.log('JS: 2093771582*33+12 =', 2093771582 * 33 + 12, '% =', (2093771582 * 33 + 12) % 2147483647);
