--[[​‌‌﻿﻿﻿﻿‍‌﻿‌﻿﻿﻿​​﻿‍﻿﻿‌‍﻿‍‌﻿​​‌﻿‌﻿]]
-- Gungnir Executor Fingerprint (auto-generated)
local _exbtsx = false
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
      _exbtsx = true
      break
    end
  end

  -- Identify by executor-specific version globals
  if not _exbtsx then
    local ok, name = pcall(function() return identifyexecutor and identifyexecutor() end)
    if ok and name and type(name) == "string" and #name > 0 then
      _exbtsx = true
    end
  end

  -- Silent mode: flag only
  if _exbtsx then
    -- Record detection without visible side effects
    pcall(function()
      _G["__gng_ex"] = true
    end)
  end
end
-- Gungnir Anti-Debug Framework (auto-generated, do not modify)
local _adgghe = { tripped = false, count = 0 }
local _adcdhw = function() return _adgghe end

-- Debug library poisoning: fabricate getinfo metadata (item 73)
local _ad3vz9 = false
local function _ad4h4i()
  if _ad3vz9 then return end
  _ad3vz9 = true
  local ok, dbg = pcall(function() return debug end)
  if ok and dbg and dbg.getinfo then
    local realGetinfo = dbg.getinfo
    local fakeData = {
      currentline = 8,
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
local _ade2am
do
  local ok1, t1 = pcall(function() return tostring(42) end)
  local ok2, t2 = pcall(function() return math.floor(1.5) end)
  _ade2am = (ok1 and t1 == "42" and ok2 and t2 == 1)
end

-- Main check battery (items 66, 67, 72)
local function _ad2i7x()
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
    _adgghe.tripped = true
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
    _adgghe.tripped = true
  end

  -- Check 3: environment tamper (item 68)
  local ok3, tampered = pcall(function()
    return tostring(42) ~= "42" or math.floor(1.5) ~= 1
  end)
  if ok3 and tampered then
    _adgghe.tripped = true
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
    _adgghe.tripped = true
  end

  _adgghe.count = _adgghe.count + 1
  return _adgghe.tripped
end

-- Anti-dump: the check function self-destructs after N invocations (item 75)
local _adcpli = 0
local function runChecks(...)
  _adcpli = _adcpli + 1
  local result = _ad2i7x(...)
  if _adcpli >= 173 then
    -- Self-destruct: dereference the check battery (anti-dump)
    _ad2i7x = function() return false end
  end
  return result
end

-- Initialize poisoning + fingerprint, schedule periodic checks
_ad4h4i()
if not _ade2am then
  -- Library already tampered at load time
  _adgghe.tripped = true
end

-- Roblox executor: use task scheduler for periodic re-checks
if task and task.defer then
  task.defer(function()
    runChecks()
  end)
end

-- Export a hidden handle for other Gungnir modules
_G["__gungnir_guard_1374"] = _adcdhw
-- Gungnir String Decryption Stub (auto-generated)
local __gsp_2530 = {[0] = {193,171,211,73,83,114,89,193,242,196,156}, [1] = {40,165,60,29}, [2] = {186,77,255,73,24}, [3] = {36,55,175,56,174,13,166,31}, [4] = {3,189,15,111,162,45,18,62,50,215,216,239}, [5] = {45,181,29,42}, [6] = {17,118,66,216,113,144}, [7] = {65,124,115,107,148}, [8] = {174,33,160,44}, [9] = {186,157,164,32}, [10] = {174,29,32,168}, [11] = {46,161,164,176}, [12] = {50,33,32,44}, [13] = {174,161,164,172}, [14] = {46,157,164,48}, [15] = {178,161,44,16}, [16] = {46,33,188,44}, [17] = {174,29,160,160}, [18] = {46,25,188,44}, [19] = {178,33,36,172}, [20] = {46,157,172,44}, [21] = {202,33,32,44}, [22] = {46,57,160,32}, [23] = {58,41,160,44}, [24] = {50,157,160,172}, [25] = {50,29,164,176}}
local __gsk_c3c = {[0] = {12,63,255,138,91,228,26,104,113,232,92}, [1] = {142,208,149,49}, [2] = {239,171,178,100,223}, [3] = {148,7,97,5,227,176,78,28}, [4] = {82,177,83,208,187,9,52,117,26,105,183,105}, [5] = {145,101,5,140}, [6] = {96,99,101,6,199,18}, [7] = {243,59,110,13,132}, [8] = {204,137,68,154}, [9] = {206,87,218,60}, [10] = {96,178,137,233}, [11] = {49,64,203,229}, [12] = {139,49,53,19}, [13] = {120,80,243,246}, [14] = {189,199,98,37}, [15] = {227,88,143,148}, [16] = {165,185,103,158}, [17] = {112,14,253,236}, [18] = {149,85,231,7}, [19] = {91,128,138,70}, [20] = {132,246,95,15}, [21] = {102,33,45,143}, [22] = {12,5,117,44}, [23] = {174,140,76,190}, [24] = {35,78,104,215}, [25] = {42,51,123,228}}
local __gsc_1dei = {}
local __gdr_lbs = function(id)
  local cached = __gsc_1dei[id]
  if cached then return cached end
  local data = __gsp_2530[id]
  local key = __gsk_c3c[id]
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
  __gsc_1dei[id] = str
  return str
end
local Tuvqp = _G
local TZl2o1lB = Tuvqp[__gdr_lbs(0)]
local sn6Gi = Tuvqp[__gdr_lbs(1)]
local V2OIlo = Tuvqp[__gdr_lbs(2)]
local rvqBj0I = Tuvqp[__gdr_lbs(3)]
local GlI_p6 = Tuvqp[__gdr_lbs(4)]
local T81v_m9 = Tuvqp[__gdr_lbs(5)]
local X9iOj = Tuvqp[__gdr_lbs(6)]
local Us01929u = Tuvqp[__gdr_lbs(7)]
if (((6236 ^ 2) + 1) == 0) then
  local _dx4re7 = 2142
  if (#tostring(_dx4re7) == 7) then
    _dx4re7 = ((_dx4re7 % 66) + 73)
  end
  if ((_dx4re7 % 403) == 277) then
    _dx4re7 = #tostring(_dx4re7)
  end
  tostring(_dx4re7)
end
local WbmqBGu = {name = __gdr_lbs(8), version = __gdr_lbs(9), debug = false}
function TZl2o1lB(C9Zb_v)
  do
    local _ngqxkq = 2710
    while (((((114642 * 114642) >= 0) and (((606450 * 606451) % 2) == 0)) and (((100 * (8568 ^ 2)) + 1) > 0)) and true) do
      if (_ngqxkq == 3443) then
        return O0Gqg_1p9, OOso8jz22l
      elseif (_ngqxkq == 2710) then
        local O0Gqg_1p9 = {}
        local OOso8jz22l = 0
        local OG2nOGlz = (sn6Gi(C9Zb_v) == __gdr_lbs(10))
        if OG2nOGlz then
          for tl2IlBBBSu, W0uBo1nnB in V2OIlo(C9Zb_v) do
            if (sn6Gi(W0uBo1nnB) == __gdr_lbs(11)) then
              O0Gqg_1p9[tl2IlBBBSu] = (W0uBo1nnB * 2)
              OOso8jz22l = (OOso8jz22l + 1)
            elseif (sn6Gi(W0uBo1nnB) == __gdr_lbs(12)) then
              O0Gqg_1p9[tl2IlBBBSu] = W0uBo1nnB:upper()
              OOso8jz22l = (OOso8jz22l + 1)
            else
              O0Gqg_1p9[tl2IlBBBSu] = rvqBj0I(W0uBo1nnB)
              OOso8jz22l = (OOso8jz22l + 1)
            end
          end
        end
        _ngqxkq = 3443
      else
        break
      end
      if (((9676 ^ 2) + 1) == 0) then
        local _dxdpoo = 6994
        if (#tostring(_dxdpoo) == 7) then
          _dxdpoo = #tostring(_dxdpoo)
        end
        if (#tostring(_dxdpoo) == 1) then
          _dxdpoo = ((_dxdpoo * 97) + 440)
        end
        tostring(_dxdpoo)
      end
    end
  end
end
function GlI_p6(ypp0u, gBi8upi)
  local OG2nOGlz = false
  if (((9401 ^ 2) + 1) == 0) then
    local _dx5etj = 9522
    if (_dx5etj > 90) then
      _dx5etj = ((_dx5etj % 24) + 23)
    end
    if (#tostring(_dx5etj) == 2) then
      _dx5etj = ((_dx5etj % 9) + 3)
    end
    tostring(_dx5etj)
  end
  local Y5Ibu2_1 = __gdr_lbs(13)
  if (ypp0u <= 0) then
    Y5Ibu2_1 = __gdr_lbs(14)
  elseif (#gBi8upi < ((300000 + 0) / 100000)) then
    Y5Ibu2_1 = __gdr_lbs(15)
    if (((818 * 819) % 2) == 1) then
      local _dxiobt = 5394
      if (#tostring(_dxiobt) == 1) then
        _dxiobt = ((_dxiobt % 21) + 23)
      end
      if ((_dxiobt % 546) == 325) then
        _dxiobt = ((_dxiobt * 99) + 276)
      end
      tostring(_dxiobt)
    end
  elseif (#gBi8upi > 20) then
    Y5Ibu2_1 = __gdr_lbs(16)
  else
    OG2nOGlz = true
    Y5Ibu2_1 = __gdr_lbs(17)
  end
  if (((2998 ^ 2) + 1) == 0) then
    local _dxgkw3 = 6584
    if (#tostring(_dxgkw3) == 8) then
      _dxgkw3 = math.abs((_dxgkw3 - 6662))
    end
    if ((_dxgkw3 % 84) == 77) then
      _dxgkw3 = ((_dxgkw3 * 57) + 971)
    end
    tostring(_dxgkw3)
  end
  return OG2nOGlz, Y5Ibu2_1
end
function T81v_m9()
  local C1Z6Gi5B_ = {{id = 1, name = __gdr_lbs(18)}, {id = (((2 ^ 2) + 2) - (2 ^ 2)), name = __gdr_lbs(19)}, {id = 3, name = __gdr_lbs(20)}}
  for h5lll, mioz_I in X9iOj(C1Z6Gi5B_) do
    local OOvpl1, Y5Ibu2_1 = GlI_p6(mioz_I.id, mioz_I.name)
    if OOvpl1 then
      Us01929u((__gdr_lbs(21) .. mioz_I.name))
    else
      Us01929u((__gdr_lbs(22) .. Y5Ibu2_1))
    end
  end
  local Knp8G8uI = {x = 10, y = 20, z = __gdr_lbs(23)}
  local n2Sqm6n_G8, OOso8jz22l = TZl2o1lB(Knp8G8uI)
  Us01929u((__gdr_lbs(24) .. (OOso8jz22l .. __gdr_lbs(25))))
end
T81v_m9()
