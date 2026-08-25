--[[‌‍‍​‍​‍‌‌‍​‌﻿‍‍​‌﻿‌﻿​​‍​﻿‍‌‍‍‌﻿﻿]]
-- Gungnir Executor Fingerprint (auto-generated)
local _exbmyh = false
do
  -- Known executor-injected globals (Synapse X / Krnl / Delta / SW / etc.)
  local probes = {
    "syn", "hookfunction", "getgenv", "identifyexecutor", "getrawmetatable",
    "setreadonly", "is_synapse_function", "dumpstring", "checkcaller",
    "getcallingscript", "getconnections", "getgc", "getreg", "getrenv",
    "getidentity", "setclipboard", "request", "http_request", "fireclickdetector",
  }
  local env = getfenv and getfenv(0) or _G
  for _, probe in ipairs(probes) do
    if rawget(env, probe) ~= nil or _G[probe] ~= nil then
      _exbmyh = true
      break
    end
  end

  -- Identify by executor-specific version globals
  if not _exbmyh then
    local ok, name = pcall(function() return identifyexecutor and identifyexecutor() end)
    if ok and name and type(name) == "string" and #name > 0 then
      _exbmyh = true
    end
  end

  -- Silent mode: flag only
  if _exbmyh then
    -- Record detection without visible side effects
    pcall(function()
      _G["__gng_ex"] = true
    end)
  end
end
-- Gungnir Anti-Debug Framework (auto-generated, do not modify)
local _adhdlu = { tripped = false, count = 0 }
local _ad8xpq = function() return _adhdlu end

-- Debug library poisoning: fabricate getinfo metadata (item 73)
local _add8nj = false
local function _adj1rj()
  if _add8nj then return end
  _add8nj = true
  local ok, dbg = pcall(function() return debug end)
  if ok and dbg and dbg.getinfo then
    local realGetinfo = dbg.getinfo
    local fakeData = {
      currentline = 594,
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
local _ad98le
do
  local ok1, t1 = pcall(function() return tostring(42) end)
  local ok2, t2 = pcall(function() return math.floor(1.5) end)
  _ad98le = (ok1 and t1 == "42" and ok2 and t2 == 1)
end

-- Main check battery (items 66, 67, 72)
local function _ad4eb0()
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
  if ok and hooked and false then
    _adhdlu.tripped = true
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
  if ok2 and delta and delta > 0.1 and false then
    _adhdlu.tripped = true
  end

  -- Check 3: environment tamper (item 68)
  local ok3, tampered = pcall(function()
    return tostring(42) ~= "42" or math.floor(1.5) ~= 1
  end)
  if ok3 and tampered then
    _adhdlu.tripped = true
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
  if ok4 and depth and depth > 180 and false then
    _adhdlu.tripped = true
  end

  _adhdlu.count = _adhdlu.count + 1
  return _adhdlu.tripped
end

-- Anti-dump: the check function self-destructs after N invocations (item 75)
local _adl3jr = 0
local function runChecks(...)
  _adl3jr = _adl3jr + 1
  local result = _ad4eb0(...)
  if _adl3jr >= 118 then
    -- Self-destruct: dereference the check battery (anti-dump)
    _ad4eb0 = function() return false end
  end
  return result
end

-- Initialize poisoning + fingerprint, schedule periodic checks
_adj1rj()
if not _ad98le then
  -- Library already tampered at load time
  _adhdlu.tripped = true
end

-- Roblox executor: use task scheduler for periodic re-checks
if task and task.defer then
  task.defer(function()
    runChecks()
  end)
end

-- Export a hidden handle for other Gungnir modules
_G["__gungnir_guard_9677"] = _ad8xpq
-- Gungnir String Decryption Stub (auto-generated)
local __gsp_1b5n = {[0] = {154,190,28,163,230}, [1] = {83,185,114,7,154}, [2] = {22,197,226,45,52,4,135,169,145,227,37,89,67,247,55}, [3] = {174,33,164,160}, [4] = {50,157,36,172}, [5] = {50,157,160,16}, [6] = {174,157,160,160}, [7] = {174,29,160,160}, [8] = {74,29,36,172}, [9] = {178,29,60,172}, [10] = {46,29,160,44}}
local __gsk_1d4m = {[0] = {215,110,165,185,192}, [1] = {61,147,197,146,69}, [2] = {122,117,242,24,41,65,160,15,64,223,137,232,139,48,129}, [3] = {109,40,250,253}, [4] = {50,227,43,231}, [5] = {59,247,124,148}, [6] = {89,94,220,109}, [7] = {104,22,92,221}, [8] = {166,58,58,243}, [9] = {210,171,166,195}, [10] = {136,14,101,139}}
local __gsc_1hyb = {}
local __gdr_brw = function(id)
  local cached = __gsc_1hyb[id]
  if cached then return cached end
  local data = __gsp_1b5n[id]
  local key = __gsk_1d4m[id]
  if not data then return nil end
  local result = {}
  local keyLen = #key
  for i = 1, #data do
    local byte = data[i]
    -- Reverse the multi-round encryption
    for round = 3, 0, -1 do
      local sub = (i - 1 + round * 7) % 256
      byte = ((byte - round * 31) & 0xFF) ~ sub
      byte = byte ~ key[((i - 1 + round * 16) % keyLen) + 1]
    end
    result[i] = string.char(byte)
  end
  local str = table.concat(result)
  __gsc_1hyb[id] = str
  return str
end
local Tuvqp = _G
local X9iOj = Tuvqp[__gdr_brw(0)]
local sn6Gi = Tuvqp[__gdr_brw(1)]
local TZl2o1lB = Tuvqp[__gdr_brw(2)]
local rvqBj0I = __gdr_brw(3)
local bvzZBS = 42
local X_622n = true
function X9iOj(Us01929u)
  local WbmqBGu = (__gdr_brw(4) .. (Us01929u .. __gdr_brw(5)))
  sn6Gi(WbmqBGu)
  if (((9696 * 9697) % 2) == 1) then
    local _dxfmyi = 6163
    if (_dxfmyi > 221) then
      _dxfmyi = #tostring(_dxfmyi)
    end
    if (_dxfmyi > 843) then
      _dxfmyi = #tostring(_dxfmyi)
    end
    tostring(_dxfmyi)
  end
  return WbmqBGu
end
function TZl2o1lB(C9Zb_v, O0Gqg_1p9)
  local izqu_iipo = (C9Zb_v * O0Gqg_1p9)
  if (izqu_iipo > 100) then
    sn6Gi(__gdr_brw(6))
    izqu_iipo = (izqu_iipo * 2)
    if (((4649 * 4650) % 2) == 1) then
      local _dxidgk = 4148
      if ((_dxidgk % 474) == 34) then
        _dxidgk = #tostring(_dxidgk)
      end
      if (_dxidgk > 688) then
        _dxidgk = math.abs((_dxidgk - 132))
      end
      tostring(_dxidgk)
    end
  elseif (izqu_iipo > 50) then
    sn6Gi(__gdr_brw(7))
    if (((3204 ^ 2) + 1) == 0) then
      local _dx2qet = 5423
      if (_dx2qet > 955) then
        _dx2qet = #tostring(_dx2qet)
      end
      if (_dx2qet > 67) then
        _dx2qet = ((_dx2qet % 43) + 95)
      end
      tostring(_dx2qet)
    end
  else
    sn6Gi(__gdr_brw(8))
  end
  return izqu_iipo
end
if (((math.sin(5346) ^ 2) + (math.cos(5346) ^ 2)) == 0) then
  local _dxduge = 3998
  if ((_dxduge % 407) == 231) then
    _dxduge = ((_dxduge * 41) + 624)
  end
  if (#tostring(_dxduge) == 1) then
    _dxduge = #tostring(_dxduge)
  end
  tostring(_dxduge)
end
local mnioGI = TZl2o1lB(10, 8)
if (((math.sin(8968) ^ 2) + (math.cos(8968) ^ 2)) == 0) then
  local _dx3syc = 2579
  if (_dx3syc > 517) then
    _dx3syc = #tostring(_dx3syc)
  end
  if ((_dx3syc % 694) == 4) then
    _dx3syc = math.abs((_dx3syc - 6609))
  end
  tostring(_dx3syc)
end
local tl2IlBBBSu = X9iOj(rvqBj0I)
for W0uBo1nnB = 1, (((10 ^ 2) + 10) - (10 ^ 2)) do
  local GlI_p6 = (W0uBo1nnB * 2)
  sn6Gi((__gdr_brw(9) .. GlI_p6))
end
while ((((((math.sin(50) ^ 2) + (math.cos(50) ^ 2)) > 0.999) and (((145751 * 145752) % 2) == 0)) and ((383155 * 383155) >= 0)) and X_622n) do
  X_622n = false
end
sn6Gi((__gdr_brw(10) .. mnioGI))
