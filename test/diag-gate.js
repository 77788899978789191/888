#!/usr/bin/env node
/** 守门条件诊断：在用户代码入口 if 前注入打印 */
const fs = require('fs');
const fengari = require('fengari');
const { lua, lauxlib, lualib, to_luastring } = fengari;

const file = process.argv[2] ?? '/tmp/stress-bad-hyph.lua';
let code = fs.readFileSync(file, 'utf-8');

// 在用户代码守门 if 前注入诊断（d82S7JbZseu(4) * ... 模式）
code = code.replace(
  /(\n)(\s*)(if (\w+)\(4\) \* (\w+)\(5\) \^ 2 \+ 1 > 0 and (\w+)\(6\) \* (\w+)\(6\) >= 0 and (\w+)\(7\) \* (\w+)\(8\) \^ 2 \+ 1 > 0 and (\w+) then)/,
  (m, nl, ind, full, f, f2, f3, f4, f5, f6, gateVar) =>
    `${nl}${ind}print('GATE ${gateVar}=', tostring(${gateVar}), 'c4=', tostring(${f}(4)), 'c5=', tostring(${f}(5)), 'c6=', tostring(${f}(6)), 'c7=', tostring(${f}(7)), 'c8=', tostring(${f}(8)), 'cond1=', tostring(${f}(4) * ${f}(5) ^ 2 + 1 > 0), 'cond2=', tostring(${f}(6) * ${f}(6) >= 0))${nl}${ind}${full}`,
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
