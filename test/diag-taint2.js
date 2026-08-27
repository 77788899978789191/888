#!/usr/bin/env node
/**
 * 通用 taint 源定位：对混淆产物中所有 `TAINT = TAINT + n` 站点
 * 注入 debug.print 标记，运行后输出首个触发点及其堆栈。
 * 用法：node test/diag-taint2.js <产物.lua>
 */
const fs = require('fs');
const fengari = require('fengari');
const { lua, lauxlib, lualib, to_luastring } = fengari;

const file = process.argv[2] ?? '/tmp/repro.lua';
let code = fs.readFileSync(file, 'utf-8');

// 找出 taint 计数变量名：形如 `X = X + 1` 出现在 do 块里的赋值
// 模式：`<name> = <name> + <n>`（+ 可选空格）
const taintNames = new Set();
const re = /([A-Za-z_]\w*)\s*=\s*\1\s*\+\s*\d+/g;
let m;
while ((m = re.exec(code)) !== null) taintNames.add(m[1]);
console.log('[diag] taint 变量候选:', [...taintNames].join(', '));

// 找出真正的 taint 计数变量：K 函数中 `if X > n then return '\1TNT\2'`
const tntMatch = code.match(/if\s+([A-Za-z_]\w*)\s*>\s*[\d.]+\s*then\s+return\s+'\\1TNT\\2'/);
const taintVar = tntMatch ? tntMatch[1] : null;
console.log('[diag] taint 变量:', taintVar);

// 对每个 taint 递增语句注入打印（含行号）——只针对 taint 变量
let injectCount = 0;
code = code.replace(
  /([A-Za-z_]\w*)\s*=\s*\1\s*\+\s*(\d+)/g,
  (full, name, n) => {
    if (name !== taintVar) return full;
    injectCount++;
    return `${name} = ${name} + ${n}; io.write('[TAINT ' .. ${injectCount} .. ']\\n')`;
  },
);
console.log(`[diag] 注入 ${injectCount} 个 taint 探针`);

// 同时对 GCHK 失败链注入（if not GCHK() then）
let gchkCount = 0;
code = code.replace(/if not (\w+)\(\) then/g, (full, fn) => {
  if (!/^[A-Za-z_]\w*$/.test(fn)) return full;
  gchkCount++;
  return `if not ${fn}() then io.write('[GCHK-FAIL ' .. ${gchkCount} .. ']\\n')`;
});
console.log(`[diag] 注入 ${gchkCount} 个 GCHK 探针`);

const L = lauxlib.luaL_newstate();
lualib.luaL_openlibs(L);
lua.lua_pushjsfunction(L, () => {
  const n = lua.lua_gettop(L);
  const parts = [];
  for (let i = 1; i <= n; i++) parts.push(String(lua.lua_tojsstring(L, i)));
  process.stdout.write('[print] ' + parts.join('\t') + '\n');
  return 0;
});
lua.lua_setglobal(L, to_luastring('print'));

const status = lauxlib.luaL_dostring(L, to_luastring(code));
if (status !== lua.LUA_OK) {
  console.log('[err] ' + String(lua.lua_tojsstring(L, -1)));
}
