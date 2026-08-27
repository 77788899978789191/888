#!/usr/bin/env node
/** 守门算术诊断：打印 c6*c6 的实际值 */
const fs = require('fs');
const fengari = require('fengari');
const { lua, lauxlib, lualib, to_luastring } = fengari;

const file = process.argv[2] ?? '/tmp/stress-bad-hyph.lua';
let code = fs.readFileSync(file, 'utf-8');

code = code.replace(
  /(\n)(\s*)(if (\w+)\(4\) \* (\w+)\(5\) \^ 2 \+ 1 > 0 and (\w+)\(6\) \* (\w+)\(6\) >= 0 and (\w+)\(7\) \* (\w+)\(8\) \^ 2 \+ 1 > 0 and (\w+) then)/,
  (m, nl, ind, full, f) =>
    `${nl}${ind}local __c6 = ${f}(6)${nl}${ind}print('ARITH type=', type(__c6), 'val=', tostring(__c6), 'prod=', tostring(__c6 * __c6), 'cmp=', tostring(__c6 * __c6 >= 0), 'prod2=', tostring((__c6 + 0) * (__c6 + 0)), 'tonum=', tonumber(__c6))${nl}${ind}${full}`,
);

const captured = [];
const L = lauxlib.luaL_newstate();
lualib.luaL_openlibs(L);
lua.lua_pushjsfunction(L, () => {
  const n = lua.lua_gettop(L);
  const parts = [];
  for (let i = 1; i <= n; i++) parts.push(String(lua.lua_tojsstring(L, i)));
  captured.push(parts.join('\t'));
  return 0;
});
lua.lua_setglobal(L, to_luastring('print'));
const status = lauxlib.luaL_dostring(L, to_luastring(code));
console.log('status=', status);
if (status !== lua.LUA_OK) console.log('err=', String(lua.lua_tojsstring(L, -1)));
for (const c of captured) console.log('OUT:', c);
