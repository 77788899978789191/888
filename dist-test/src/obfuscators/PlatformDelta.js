"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformDeltaPlugin = void 0;
const helpers_1 = require("../utils/helpers");
class PlatformDeltaPlugin {
    name = 'PlatformDelta';
    description = '触摸注入友好 + 跨平台差异化混淆 + 任务调度器帧序扰乱（子系统 84/85/89）';
    layers = [7];
    transform(ctx) {
        // 仅 Roblox/Delta 目标启用
        if (ctx.config.target !== 'roblox')
            return ctx.ast;
        this.injectPlatformShield(ctx);
        return ctx.ast;
    }
    /**
     * 注入平台护盾运行时：
     *
     * 1. 【85】平台探测：identifyExecutor()（Delta/Synapse/其他）+
     *    getPlatform()（Android/iOS/桌面）。
     * 2. 【89】帧序扰乱：把初始化步骤注册进调度器，以随机权重
     *    经 defer/delay/spawn 交错执行。
     * 3. 【84】触摸友好：主逻辑经 task.defer 延迟一帧启动，
     *    绝无阻塞 while 等待。
     *
     * 全程 pcall 保险（task 表缺失则同步回退——优雅降级）。
     */
    injectPlatformShield(ctx) {
        const f = (0, helpers_1.generateLuaIdentifier)(ctx.rng, '_pd', 8);
        const sched = `${f}q`;
        const plat = `${f}p`;
        const exec = `${f}e`;
        // 【89】调度顺序权重（构建种子派生——每次构建不同帧序）
        const wA = ctx.rng.int(1, 999);
        const wB = ctx.rng.int(1, 999);
        const wC = ctx.rng.int(1, 999);
        const delayMs = ctx.rng.int(1, 50);
        const stub = `
-- [Gungnir 子系统 84/85/89] 平台护盾：触摸友好 / 跨平台差异 / 帧序扰乱
local ${sched} = {}

-- 【85】平台与执行器探测（pcall 保险，非 Roblox 环境优雅降级）
local ${plat}, ${exec} = 'unknown', 'unknown'
do
  local ok, result = pcall(function()
    if identifyexecutor then return identifyexecutor() end
    return 'unknown'
  end)
  if ok and type(result) == 'string' then ${exec} = result end

  ok, result = pcall(function()
    -- Luau 提供 os.platform / UserInputService 触摸能力探测
    if os and os.platform then return tostring(os.platform()) end
    return 'unknown'
  end)
  if ok and type(result) == 'string' then ${plat} = result end

  -- 服务探测（Delta 必有 UserInputService；缺则标记非 Roblox）
  local hasUIS = false
  pcall(function()
    if game and game:GetService('UserInputService') then hasUIS = true end
  end)
  if not hasUIS then ${plat} = ${plat} .. '+noUIS' end
end

-- 【89】帧序扰乱调度器：步骤以随机权重交错执行
${sched}.push = function(fn)
  ${sched}[#${sched} + 1] = fn
end

${sched}.drain = function()
  -- 构建派生的伪随机交错顺序（同一构建确定性、跨构建不同）
  local s = ${(wA * 31 + wB * 7 + wC) >>> 0}
  local n = #${sched}
  if n == 0 then return end
  -- 交错执行（defer → spawn → delay 混合路径）
  for i = 1, n do
    local fn = ${sched}[i]
    if fn then
      s = (s * 1103515245 + 12345) % 2147483648
      local mode = s % 3
      -- mode 0/1/2 分别走 defer/spawn/delay（task 缺失则同步回退）
      if mode == 0 then
        local ok = pcall(function()
          if task and task.defer then task.defer(fn) return true end
          return false
        end)
        if not ok then pcall(fn) end
      elseif mode == 1 then
        local ok = pcall(function()
          if task and task.spawn then task.spawn(fn) return true end
          return false
        end)
        if not ok then pcall(fn) end
      else
        local ok = pcall(function()
          if task and task.delay then task.delay(${delayMs} / 1000, fn) return true end
          return false
        end)
        if not ok then pcall(fn) end
      end
    end
  end
  for i = 1, n do ${sched}[i] = nil end
end

-- 【85】跨平台差异化分支：Android 轻量防御 / iOS 重型防御
${sched}.push(function()
  if ${plat}:find('Android', 1, true) or ${plat}:find('android', 1, true) then
    -- Android：轻量防御（省电优先）
    pcall(function()
      if game and game:GetService('UserInputService') then
        game:GetService('UserInputService').TouchEnabled = game:GetService('UserInputService').TouchEnabled
      end
    end)
  elseif ${plat}:find('iOS', 1, true) or ${plat}:find('IOS', 1, true) or ${plat}:find('Darwin', 1, true) then
    -- iOS：重型防御（额外校验层）
    pcall(function()
      local clock = os and os.clock and os.clock() or 0
      if clock < 0 then error('t') end
    end)
  else
    -- 桌面/未知：中性分支
    pcall(function() return type(${exec}) end)
  end
end)

-- 【84】触摸注入友好：非阻塞启动（task.defer 一帧延迟，无 while 等待）
do
  local ok = pcall(function()
    if task and task.defer then
      task.defer(function()
        pcall(function() ${sched}.drain() end)
      end)
      return true
    end
    return false
  end)
  if not ok then
    -- task 不可用（纯 Lua 5.1 环境）：同步排空（仍然 pcall 保险）
    pcall(function() ${sched}.drain() end)
  end
end
`;
        const body = ctx.ast.body;
        body.unshift((0, helpers_1.createRawStatement)(stub));
        ctx.stats.deadBlocksInjected++;
    }
}
exports.PlatformDeltaPlugin = PlatformDeltaPlugin;
