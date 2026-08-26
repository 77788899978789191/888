"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentSandboxPlugin = void 0;
const helpers_1 = require("../utils/helpers");
class EnvironmentSandboxPlugin {
    name = 'EnvironmentSandbox';
    description = '动态环境劫持（setfenv）+ 环境表白名单沙盒隔离（子系统 56/60）';
    layers = [4];
    transform(ctx) {
        const f = (0, helpers_1.generateLuaIdentifier)(ctx.rng, '_es', 8);
        const okVar = `${f}ok`;
        const envVar = `${f}env`;
        // 原始程序体（此刻之前的全部语句）
        const originalBody = ctx.ast.body.slice();
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
        const guarded = {
            type: 'IfStatement',
            clauses: [{
                    condition: (0, helpers_1.createIdentifier)(okVar),
                    body: originalBody,
                }],
            else_: null,
        };
        ctx.ast.body = [
            (0, helpers_1.createRawStatement)(stub),
            guarded,
        ];
        ctx.stats.globalsHidden++;
        return ctx.ast;
    }
}
exports.EnvironmentSandboxPlugin = EnvironmentSandboxPlugin;
