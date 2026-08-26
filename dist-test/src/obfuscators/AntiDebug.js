"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AntiDebugPlugin = void 0;
class AntiDebugPlugin {
    name = 'AntiDebug';
    description = 'Injects runtime anti-debug, anti-hook, integrity verification, and debug-library poisoning framework';
    layers = [6];
    transform(ctx) {
        const stub = this.generateStub(ctx);
        const rawNode = {
            type: 'GungnirRawStatement',
            code: stub,
        };
        // Inject at the top of the chunk — after global hiding declarations
        // but before any user code
        const body = ctx.ast.body;
        body.unshift(rawNode);
        return ctx.ast;
    }
    generateStub(ctx) {
        const n = () => '_ad' + ctx.rng.int(100000, 999999).toString(36);
        const [guard, init, checks, count, fingerprint, poisoned, state] = [n(), n(), n(), n(), n(), n(), n()];
        const corrupt = ctx.config.antiDebugMode === 'corrupt';
        const executorEnv = ctx.config.target === 'roblox';
        return `
-- Gungnir Anti-Debug Framework (auto-generated, do not modify)
local ${state} = { tripped = false, count = 0 }
local ${guard} = function() return ${state} end

-- Debug library poisoning: fabricate getinfo metadata (item 73)
local ${poisoned} = false
local function ${init}()
  if ${poisoned} then return end
  ${poisoned} = true
  local ok, dbg = pcall(function() return debug end)
  if ok and dbg and dbg.getinfo then
    local realGetinfo = dbg.getinfo
    local fakeData = {
      currentline = ${ctx.rng.int(1, 999)},
      source = "=[Gungnir]",
      short_src = "Gungnir",
      what = "Gungnir",
      linedefined = 0,
      namewhat = "",
      nups = 0,
    }
    dbg.getinfo = function(...)
      local info = realGetinfo(...)
      if type(info) == "table" then
        for k, v in pairs(fakeData) do info[k] = v end
      end
      return info
    end
  end
end

-- Core library fingerprint verification (item 68)
local ${fingerprint}
do
  local ok1, t1 = pcall(function() return tostring(42) end)
  local ok2, t2 = pcall(function() return math.floor(1.5) end)
  ${fingerprint} = (ok1 and t1 == "42" and ok2 and t2 == 1)
end

-- Main check battery (items 66, 67, 72)
local function ${checks}()
  -- Check 1: debug.sethook presence (item 72)
  local ok, hooked = pcall(function()
    local d = debug
    if d and d.sethook then
      -- Attempt to read current hook — if a debugger set one, this trips
      local info = d.getinfo and d.getinfo(1, "f")
      return info == nil
    end
    return false
  end)
  if ok and hooked and ${corrupt ? 'true' : 'false'} then
    ${state}.tripped = true
  end

  -- Check 2: timing side-channel — single-step detection (item 67)
  local ok2, delta = pcall(function()
    local t0 = os.clock()
    local x = 0
    for i = 1, 1000 do x = x + i end
    return os.clock() - t0
  end)
  -- Normal execution: 1000 iterations take well under 0.1s.
  -- A debugger single-stepping inflates this by orders of magnitude.
  if ok2 and delta and delta > 0.1 and ${corrupt ? 'true' : 'false'} then
    ${state}.tripped = true
  end

  -- Check 3: environment tamper (item 68)
  local ok3, tampered = pcall(function()
    return tostring(42) ~= "42" or math.floor(1.5) ~= 1
  end)
  if ok3 and tampered then
    ${state}.tripped = true
  end

  -- Check 4: stack depth anomaly (item 70)
  local ok4, depth = pcall(function()
    local level = 0
    while true do
      if not debug.getinfo(level + 1, "") then break end
      level = level + 1
      if level > 200 then break end
    end
    return level
  end)
  if ok4 and depth and depth > 180 and ${corrupt ? 'true' : 'false'} then
    ${state}.tripped = true
  end

  ${state}.count = ${state}.count + 1
  return ${state}.tripped
end

-- Anti-dump: the check function self-destructs after N invocations (item 75)
local ${count} = 0
local function runChecks(...)
  ${count} = ${count} + 1
  local result = ${checks}(...)
  if ${count} >= ${ctx.rng.int(50, 200)} then
    -- Self-destruct: dereference the check battery (anti-dump)
    ${checks} = function() return false end
  end
  return result
end

-- Initialize poisoning + fingerprint, schedule periodic checks
-- (pcall-guarded: the defense framework itself must never break the script)
pcall(${init})
if not ${fingerprint} then
  -- Library already tampered at load time
  ${state}.tripped = true
end

${executorEnv
            ? `-- Roblox executor: use task scheduler for periodic re-checks
if task and task.defer then
  pcall(function()
    task.defer(function()
      runChecks()
    end)
  end)
end`
            : `-- Generic environment: coroutine-based periodic checks
do
  local co = coroutine.create(function()
    while true do
      runChecks()
      coroutine.yield()
    end
  end)
  pcall(coroutine.resume, co)
end`}

-- Export a hidden handle for other Gungnir modules
pcall(function()
  _G["__gungnir_guard_${ctx.rng.int(1000, 9999)}"] = ${guard}
end)
`.trim();
    }
}
exports.AntiDebugPlugin = AntiDebugPlugin;
