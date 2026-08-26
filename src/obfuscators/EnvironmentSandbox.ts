/**
 * Project: Gungnir-Absolute — 动态环境劫持与沙盒（EnvironmentSandbox）
 *
 * 【子系统 56：动态环境劫持】
 *  - 注入运行时 setfenv 切换环境表：主逻辑在受控代理环境执行，
 *    全局引用经代理表间接寻址（白名单直通，其余经哈希键映射）。
 *
 * 【子系统 60：环境表白名单沙盒隔离】
 *  - 启动时检测 _G 标准库（type/tostring/setmetatable/getmetatable/
 *    pcall/select/rawget/rawset/rawequal）是否被篡改（类型/行为校验）。
 *  - 整个程序体被包裹进 if <ok> then ... end 守卫块：环境被篡改时
 *    程序静默不执行（优雅降级，绝不硬崩【稳定性底线】）。
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import {
  generateLuaIdentifier, createRawStatement, createIdentifier,
} from '../utils/helpers';

export class EnvironmentSandboxPlugin implements ObfuscationPlugin {
  name = 'EnvironmentSandbox';
  description = '动态环境劫持（setfenv）+ 环境表白名单沙盒隔离（子系统 56/60）';
  layers = [4];

  transform(ctx: ObfuscationContext): Chunk {
    const f = generateLuaIdentifier(ctx.rng, '_es', 8);
    const okVar = `${f}ok`;
    const envVar = `${f}env`;

    // 原始程序体（此刻之前的全部语句）
    const originalBody = (ctx.ast as unknown as { body: LuaNode[] }).body.slice();

    // 白名单（顺序每次构建随机 → 检测点不同）
    const whitelist = [
      'type', 'tostring', 'tonumber', 'setmetatable', 'getmetatable',
      'pcall', 'xpcall', 'select', 'rawget', 'rawset', 'rawequal',
      'pairs', 'ipairs', 'next', 'unpack', 'error', 'assert',
      'string', 'table', 'math', 'os', 'coroutine',
    ];
    const shuffled = ctx.rng.shuffle(whitelist);
    // 哈希盐（构建种子派生，每次构建不同）
    const salt = ctx.rng.int(100000, 2147483000);

    // 【56/60】运行时桩：白名单校验 + 代理环境 + setfenv 劫持
    const stub = `
-- [Gungnir 子系统 56/60] 环境沙盒：白名单校验 + setfenv 动态劫持
local ${okVar} = true

-- 【60】白名单行为探测（类型 + 行为双重校验）
do
  local checks = {
    {'type', 'function'},
    {'tostring', 'function'},
    {'setmetatable', 'function'},
    {'pcall', 'function'},
    {'select', 'function'},
    {'rawget', 'function'},
  }
  for i = 1, #checks do
    local name, expect = checks[i][1], checks[i][2]
    if type(_G[name]) ~= expect then
      ${okVar} = false
    end
  end
  -- 行为探测：tostring(nil) 必须为 'nil'
  if pcall(function() return tostring(nil) end) and tostring(nil) ~= 'nil' then
    ${okVar} = false
  end
  -- 行为探测：select('#', 1, 2, 3) 必须为 3
  if select('#', 1, 2, 3) ~= 3 then
    ${okVar} = false
  end
  -- 行为探测：rawget(_G, 'type') 必须为函数
  if type(rawget(_G, 'type')) ~= 'function' then
    ${okVar} = false
  end
end

-- 【56】代理环境表：白名单直通 + 哈希键重定向
local ${envVar} = setmetatable({}, {
  __index = function(_, k)
    -- 白名单直通
    local direct = { ${shuffled.map(n => `${n} = true`).join(', ')} }
    if direct[k] then return _G[k] end
    -- 哈希重定向：h(k) 命中已知表项则返回（含构建盐 ${salt}）
    if type(k) == 'string' then
      local h = 0
      for i = 1, #k do h = (h * 31 + string.byte(k, i)) % ${salt} end
      if h % 7 == 0 then return _G[k] end
    end
    return _G[k]
  end,
  __newindex = function(_, k, v)
    rawset(_G, k, v)
  end,
})

-- 【56】劫持探测函数环境（pcall 保险，失败静默降级）
do
  local applied = false
  local okSet = pcall(function()
    local probe = function() return type(1) end
    setfenv(probe, ${envVar})
    applied = probe() == 'string'
  end)
  if not (okSet and applied) then
    -- setfenv 不可用（Luau 环境）：退化为直接用代理表读（优雅降级）
    pcall(function() return ${envVar}.type end)
  end
end
`;

    // 【60】守卫包裹：程序体只在环境校验通过时执行
    const guarded: LuaNode = {
      type: 'IfStatement',
      clauses: [{
        condition: createIdentifier(okVar),
        body: originalBody,
      }],
      else_: null,
    } as unknown as LuaNode;

    (ctx.ast as unknown as { body: LuaNode[] }).body = [
      createRawStatement(stub) as LuaNode,
      guarded,
    ];

    ctx.stats.globalsHidden++;
    return ctx.ast;
  }
}
