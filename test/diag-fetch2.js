/**
 * 诊断：对 /tmp/repro.lua 的取值函数注入打印，定位 nil 返回来源
 * 用法：先 REPRO_FILE=complex.lua REPRO_SEED=<失败种子> node dist-test/test/repro.js
 *       然后 node dist-test/test/diag-fetch2.js
 */
const fs = require('fs');
const fengari = require('fengari');
const { lua, lauxlib, lualib, to_luastring } = fengari;

function runLua(code) {
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
  const ok = status === lua.LUA_OK;
  let err = '';
  if (!ok) err = String(lua.lua_tojsstring(L, -1));
  return { ok, out: captured, err };
}

function main() {
  let code = fs.readFileSync("/tmp/repro.lua", "utf-8");
  let patched = 0;
  const tryPatch = (re, rep) => {
    const before = code;
    code = code.replace(re, rep);
    if (code !== before) patched++;
  };

  // taint 毒化路径：if <taint> then return '\1DEAD\2' end
  tryPatch(
    /if (\w+) then return '\\1DEAD\\2' end/,
    "if $1 then print('DBGF taint id=', id) return '\\1DEAD\\2' end",
  );
  // TNT 计数毒化路径：if <cnt> > 3 then return '\1TNT\2' end
  tryPatch(
    /if (\w+) > 3 then return '\\1TNT\\2' end/,
    "print('DBGF tnt id=', id, 'cnt=', $1) if $1 > 3 then return '\\1TNT\\2' end",
  );
  // 无程序 / 无页映射
  tryPatch(
    /local prog = (\w+)\[id \+ 1\]\n(\s*)if prog == nil then return nil end/,
    "local prog = $1[id + 1]\n$2if prog == nil then print('DBGF no-prog id=', id) return nil end",
  );
  tryPatch(
    /local pm = (\w+)\[id \+ 1\]\n(\s*)if pm == nil then return nil end/,
    "local pm = $1[id + 1]\n$2if pm == nil then print('DBGF no-pm id=', id) return nil end",
  );
  // 解密失败分支（out 处为 pcall 错误消息）
  tryPatch(
    /if not ok or out == nil then\n(\s*)(\w+) = \2 \+ 1\n(\s*)return nil end/,
    "if not ok or out == nil then\n$1print('DBGF decrypt-fail id=', id, 'ok=', tostring(ok), 'err=', tostring(out))\n$3$2 = $2 + 1\n$3return nil end",
  );

  // 5) 数字取值：结果为 nil 时打印原始返回（string 条目被 number 取值引用）
  tryPatch(
    /(\w+) = function\(id\) return tonumber\((\w+)\(id\)\) end/,
    "$1 = function(id) local __r = tonumber($2(id)) if __r == nil then print('DBGN nil id=', id, 'raw=', tostring($2(id))) end return __r end",
  );

  console.log(`patched ${patched} 处`);
  const r = runLua(code);
  console.log('ok=', r.ok, 'err=', r.err.slice(0, 150));
  for (const line of r.out) {
    if (line.startsWith('DBGF') || line.startsWith('DBGN')) console.log('  ', line.slice(0, 220));
  }
}

main();
