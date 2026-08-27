--[[﻿‍﻿‍​﻿‌‌​﻿‌﻿‌‌​‌﻿​‍‍‌﻿‍​﻿​﻿﻿﻿﻿﻿‍]]
-- GUNGNIR-ABSOLUTE GX-VM RUNTIME (polymorphic build)
-- [2/4/5/6/7/8/9/10/11/12/13/26/60/66/70/71/72/73/74/75/76/77/78/79/81/83/85/86/87/88/89]
local kxdCcjtp0TH, Y2G98JHK7Om9, zMdiYW0iMcE, C7vfLNTI5kz
do
local wb9XkzlWSqIvL = {}
local JFTOifo356lOX = nil
local Y1tOebnoONhsL = {}
local tDW6yxYCU12k = {}
local pmTdRIBEezw0z = {}
local tMS_In2fy7O = {}
local sY8vMepnno = 0
local TXnGuMwBPHEj = false
local dRbjDnwMWv3 = 0
local GGBOEPZUaE = ((4815+25)-25)
local z4bY3Z3Fq04 = (((3494*82))/82)
local oX2RBvzXV8FO2 = (((44*38))/38)
local ImF0iEegtxxV = (5)
local Igzf4J8ipa8lf = (((67*68))/68)
local EWIbBal1VlRT = 0
local AVbhmW4fbOt = 0

-- [子系统 1] 种子 16 片段闭包重组（散布存储，运行时校验）
local J3fCSn243nMNz = {}
J3fCSn243nMNz[1] = function(...) return (843358289) end
J3fCSn243nMNz[2] = function(...) return ((362065173+36)-36) end
J3fCSn243nMNz[3] = function(...) return (1820953939) end
J3fCSn243nMNz[4] = function(...) return (934233599) end
J3fCSn243nMNz[5] = function(...) return ((511459401+44)-44) end
J3fCSn243nMNz[6] = function(...) return (1435630434) end
J3fCSn243nMNz[7] = function(...) return ((1247646991+71)-71) end
J3fCSn243nMNz[8] = function(...) return (1916489106) end
J3fCSn243nMNz[9] = function(...) return ((644859654+83)-83) end
J3fCSn243nMNz[10] = function(...) return ((486821303+10)-10) end
J3fCSn243nMNz[11] = function(...) return (903442090) end
J3fCSn243nMNz[12] = function(...) return ((1252889736+73)-73) end
J3fCSn243nMNz[13] = function(...) return ((1445812048+61)-61) end
J3fCSn243nMNz[14] = function(...) return (((1781323*84))/84) end
J3fCSn243nMNz[15] = function(...) return (60981048) end
J3fCSn243nMNz[16] = function(...) return (1485225272) end
local RfV15ikLg1 = (1826049549)
local UKK1fQkaFkQ5j = (2147483647)
-- 算术一致性：累加器必须以浮点初值启动（0.0）。
-- fengari/Lua 5.3 整数路径为 32 位回绕，与 TS/Lua 5.1 的双精度运算分歧；
-- 强制浮点链后，fengari(验证) / Gloop 5.1(目标) / TS(编码) 三方逐位一致。
local TQDHq_1Gvav5G = 0.0
for mJY_pXgkMK3E = 1, 16 do
  TQDHq_1Gvav5G = (TQDHq_1Gvav5G * RfV15ikLg1 + J3fCSn243nMNz[mJY_pXgkMK3E]()) % UKK1fQkaFkQ5j
end
local cMasZlXbX300 = (1221563794)
if TQDHq_1Gvav5G ~= cMasZlXbX300 then sY8vMepnno = sY8vMepnno + 1 end

-- [子系统 11] 构建指纹 8 处嵌入（防嫁接）
local iwDa7JV65nlv = {}
iwDa7JV65nlv[1] = (function() return (1342527203) end)()
iwDa7JV65nlv[2] = (function() return ((925273147+79)-79) end)()
iwDa7JV65nlv[3] = (function() return (1175844999) end)()
iwDa7JV65nlv[4] = (function() return ((790399458+47)-47) end)()
iwDa7JV65nlv[5] = (function() return (1759102793) end)()
iwDa7JV65nlv[6] = (function() return (((26427150*44))/44) end)()
iwDa7JV65nlv[7] = (function() return (1910626175) end)()
iwDa7JV65nlv[8] = (function() return (2034474585) end)()
local coltL2xmKs = (31)
-- 浮点累加器（同上：规避 fengari 32 位整数回绕，三方一致）
local pVh47vHaXE9m = 0.0
for mJY_pXgkMK3E = 1, 8 do pVh47vHaXE9m = (pVh47vHaXE9m * coltL2xmKs + iwDa7JV65nlv[mJY_pXgkMK3E]) % UKK1fQkaFkQ5j end
local xENLPLOzKjKWG = ((1371106431+43)-43)
if (pVh47vHaXE9m * (3854964250)) % UKK1fQkaFkQ5j ~= xENLPLOzKjKWG then sY8vMepnno = sY8vMepnno + 1 end

-- [子系统 2/38] 操作码映射与 S 盒：种子派生，二进制中不存表
local glhgGJfbG52F = {}
do
  local pi = {}
  for x = 0, 255 do pi[x] = x end
  local s = (297300743)
  for x = 255, 1, -1 do
    s = (s * 1664525 + 1013904223) % 4294967296
    local j = s % (x + 1)
    pi[x], pi[j] = pi[j], pi[x]
  end
  for c = 0, 31 do glhgGJfbG52F[pi[c]] = c end
end
local z6eS5G27VKcJ, IRj0_vzcfyj6 = {}, {}
do
  for x = 0, 255 do z6eS5G27VKcJ[x] = x end
  local s = ((1763008685+64)-64)
  for x = 255, 1, -1 do
    s = (s * 1664525 + 1013904223) % 4294967296
    local j = s % (x + 1)
    z6eS5G27VKcJ[x], z6eS5G27VKcJ[j] = z6eS5G27VKcJ[j], z6eS5G27VKcJ[x]
  end
  for x = 0, 255 do IRj0_vzcfyj6[z6eS5G27VKcJ[x]] = x end
end
local YpQJ3DmSlpj91 = {}
for a = 0, 255 do
  local row = {}
  local b = 0
  while b < 256 do
    local x, y, r, p = a, b, 0, 1
    for _ = 1, 8 do
      if x % 2 ~= y % 2 then r = r + p end
      x = (x - x % 2) / 2
      y = (y - y % 2) / 2
      p = p * 2
    end
    row[b] = r
    b = b + 1
  end
  YpQJ3DmSlpj91[a] = row
end

-- [子系统 2] 操作码轮换参数（仿射双射：奇乘子 mod 256）
local _P6wyI4UjzSnb = 39
local FLMqhKGumS = 165
local GlwPHtPfY78d = 61
local En8an0CFoVmt4 = 0
local CXeGj90D0K9 = glhgGJfbG52F
local function Pa55mZRwQN()
  local ok, c = pcall(os.clock)
  if ok and c then return (math.floor(c * 1000) % 2) end
  return 0
end

-- [子系统 7/13] 算术形态（MBA 等价实现，自变异切换）
local LakxghWFe2 = function(x, y) return (x + y) % 256 end
local YeXoEUgzMx7 = function(x, y) return (x - y + 512) % 256 end
local KS35YlXS9d3 = function(x, y) return (x * 3 + y * 3 - (x + y + y)) % 256 end
local bdRfTZ2I9Yz9C = function(x, y) return (x + 255 - y + 1) % 256 end

-- [子系统 70] 完整性哈希（100 分片链）
local function SkzKeHeh10rKb(s, h)
  -- 33.0 强制浮点链：h*33 可能超 fengari 32 位整数范围（2^36），
  -- 浮点（双精度）与 TS ghash / Lua 5.1 逐位一致
  for j = 1, #s do h = (h * 33.0 + string.byte(s, j)) % 2147483647 end
  return h
end
local Z4RcRfffjIU = (((35774*25))/25)
local v975znL5QDy = (1588002944)
local function fDwaXs40Y6()
  local pl = JFTOifo356lOX
  if not pl or #pl == 0 then return true end
  local h = Z4RcRfffjIU
  local n = #pl
  local sl = math.ceil(n / 100)
  local st = 1
  while st <= n do
    h = SkzKeHeh10rKb(string.sub(pl, st, math.min(st + sl - 1, n)), h)
    st = st + sl
  end
  return h == v975znL5QDy
end

-- [子系统 12] 守卫程序（guard logic 字节码化）：TICK/JZ/SYNC/TRAP
local e33e0fVoNtk = "\000\005\000\251K\235\000*\171\233\000\1721\235\003\002\228\230\000\237O\131\000Zl\163\001\136=<\000^C\183\000\209\238\002\000\155\248Z\000"

-- [子系统 74] 时间炸弹
do
  local ttl = (((0*41))/41)
  if ttl > 0 then
    local now = nil
    local ok1, t1 = pcall(function() return tick() end)
    if ok1 and type(t1) == 'number' then now = t1 end
    if not now then
      local ok2, t2 = pcall(os.time)
      if ok2 and type(t2) == 'number' then now = t2 end
    end
    if now and now > (1787790410) then TXnGuMwBPHEj = true end
  end
end

-- [子系统 60] 环境表白名单沙盒
do
  local okge, env = pcall(function() return getfenv and getfenv(1) or _G end)
  if okge and type(env) == 'table' then
    local must = { {'pcall','function'}, {'string','table'}, {'math','table'}, {'type','function'}, {'select','function'} }
    for _, m in ipairs(must) do
      local okv, v = pcall(function() return env[m[1]] end)
      if not okv or type(v) ~= m[2] then sY8vMepnno = sY8vMepnno + 1 end
    end
  end
end

-- [子系统 77] 反钩子：debug.gethook 预置检测
do
  local ok, h = pcall(function() return debug and debug.gethook and debug.gethook() end)
  if ok and h ~= nil then sY8vMepnno = sY8vMepnno + 1 end
end

-- [子系统 72] 时序侧信道：校准环执行时间检测
do
  local ok0, c0 = pcall(os.clock)
  if ok0 and type(c0) == 'number' then
    local x = 0
    for j = 1, ((25000+55)-55) do x = (x * 33 + j) % 2147483647 end
    local ok1, c1 = pcall(os.clock)
    if ok1 and type(c1) == 'number' then
      if (c1 - c0) > (1.5) then sY8vMepnno = sY8vMepnno + 1 end
    end
  end
end

-- [子系统 66] tick 跳变（沙箱时间加速）检测
do
  local ok0, t0 = pcall(function() return tick() end)
  if ok0 and type(t0) == 'number' then
    local x = 0
    for j = 1, 10000 do x = (x + j) % 16777216 end
    local ok1, t1 = pcall(function() return tick() end)
    if ok1 and type(t1) == 'number' then
      if t1 < t0 or (t1 - t0) > 60 then sY8vMepnno = sY8vMepnno + 1 end
    end
  end
end

-- [子系统 73] 环境全局对象篡改检测（仅 Roblox 环境生效）
local YmgETj6OzD1 = (function()
  local ok, g = pcall(function() return game end)
  return ok and g ~= nil
end)()
if YmgETj6OzD1 then
  local ok2, t = pcall(function() return type(game) end)
  if ok2 and t ~= 'userdata' and t ~= 'table' then sY8vMepnno = sY8vMepnno + 1 end
  local ok3, ws = pcall(function() return game.GetService and game:GetService('Workspace') end)
  if not ok3 or ws == nil then sY8vMepnno = sY8vMepnno + 1 end
end

-- [子系统 78] 调试库污染：debug.getinfo 返回伪造源/行号
do
  local ok, gi = pcall(function() return debug and debug.getinfo end)
  if ok and type(gi) == 'function' then
    pcall(function()
      debug.getinfo = function(f, w)
        local info = gi(f, w)
        if type(info) == 'table' then
          info.source = "@1wvcoon"
          if info.short_src ~= nil then info.short_src = "@1wvcoon" end
          info.currentline = 79336
          if info.linedefined ~= nil then info.linedefined = 79343 end
        end
        return info
      end
    end)
  end
end

-- [子系统 83/86] Dark Dex 诱饵实例树 + 反收录随机指纹
local dO8aIcNTLV = {}
do
  local dnames = {'_8LZSKZ_7850', '_13PFLKU_1022', '_1NRFG36_3464', '_9F7SKJ_8797', '_1M8JIT4_3219', '_15XBQO4_8563', '_U3MOG4_4434', '_1YZO48D_6046', '_FCO72T_4174', '_16SO3PC_4303', '_1X6FU50_2085', '_TZ7AN0_9323'}
  KtYRrwA5DV = YmgETj6OzD1 and 8 or 4
  for j = 1, #dnames do
    local nm = dnames[j]
    pcall(function()
      if rawget(_G, nm) == nil then
        local proxy
        proxy = setmetatable({}, {
          __index = function(t, k)
            if type(k) == 'string' and #k < 64 then return proxy end
            return nil
          end,
          __tostring = function() return "@1wvcoon" end,
          __metatable = 'The metatable is locked',
        })
        rawset(_G, nm, proxy)
        dO8aIcNTLV[#dO8aIcNTLV + 1] = nm
      end
    end)
  end
end

-- [子系统 6] 双解释器：runA（if 链，线性字节串）/ runB（链表树 + 分发表）
local UOW_GYzMPiwDS = {}
local Td1oJ5VquHDtN = UOW_GYzMPiwDS
local Pi_yShURRL8gg = {}
local HESWSXN3GyK5s = {}

local function lHRPztgIeIe(progStr)
  local n = string.byte(progStr, 2) + string.byte(progStr, 3) * 256
  local idx = {}
  local head, prev
  local inv = glhgGJfbG52F
  local level = 0
  local cnt = 0
  for i = 0, n - 1 do
    local lv = math.floor(i / _P6wyI4UjzSnb)
    while level < lv do
      local ni = {}
      for w = 0, 255 do ni[(FLMqhKGumS * w + GlwPHtPfY78d) % 256] = inv[w] end
      inv = ni
      level = level + 1
    end
    local base = 4 + i * 8
    local w = string.byte(progStr, base + 0)
    local node = { op = inv[w], a = string.byte(progStr, base + 7), b = string.byte(progStr, base + 3), nx = nil }
    if head == nil then head = node else prev.nx = node end
    prev = node
    idx[i] = node
    cnt = cnt + 1
  end
  return { head = head, idx = idx, dt = Td1oJ5VquHDtN, n = cnt }
end

-- [子系统 8] 运行时指令置换：树节点段等价重写
local function whWDhIOB2T1(tr)
  if tr == nil or tr.head == nil then return end
  local seg = tr.head
  local k = 0
  while seg and k < 3 do
    if seg.op == 11 then
      -- MOV a b（R[a]=R[b]）→ STORS a b（SCAT[a]=R[b]）+ LOADS a（R[a]=SCAT[a]）
      -- 注意不能用 XORI 重写：XORI 的 b 是立即数，语义不等价
      local nn = { op = 24, a = seg.a, b = 0, nx = seg.nx }
      seg.op = 25
      seg.nx = nn
      k = k + 1
    elseif seg.op == 0 then
      local nn = { op = 0, a = 0, b = 0, nx = seg.nx }
      seg.nx = nn
      k = k + 1
    end
    seg = seg.nx
    k = k + 1
  end
end

-- [子系统 7] 解释器自变异
local vnYcXfWIzro5P
vnYcXfWIzro5P = function()
  GGBOEPZUaE = GGBOEPZUaE + z4bY3Z3Fq04
  -- (a) 算法形态切换（FADD/FSUB 等价实现互换）
  if (dRbjDnwMWv3 % 2) == 0 then
    LakxghWFe2, KS35YlXS9d3 = KS35YlXS9d3, LakxghWFe2
  else
    YeXoEUgzMx7, bdRfTZ2I9Yz9C = bdRfTZ2I9Yz9C, YeXoEUgzMx7
  end
  -- (b) 树程序操作码对换 + 独立分发表重排（语义保持）
  local seen = 0
  for id, tr in pairs(tMS_In2fy7O) do
    if seen >= 4 then break end
    if tr.dt == Td1oJ5VquHDtN then
      local cp = {}
      for k, v in pairs(Td1oJ5VquHDtN) do cp[k] = v end
      tr.dt = cp
    end
    local x, y = 2 + math.floor((id * 7) % 29), 2 + math.floor((id * 13 + 5) % 29)
    if x ~= y and tr.dt[x] ~= nil and tr.dt[y] ~= nil then
      tr.dt[x], tr.dt[y] = tr.dt[y], tr.dt[x]
      local nd = tr.head
      while nd do
        if nd.op == x then nd.op = y
        elseif nd.op == y then nd.op = x end
        nd = nd.nx
      end
    end
    -- (c) 指令置换
    whWDhIOB2T1(tr)
    seen = seen + 1
  end
  -- (d) 缓存洗牌【子系统 10】
  local old = wb9XkzlWSqIvL
  local fresh = {}
  local shift = 1 + math.floor(dRbjDnwMWv3 % (Igzf4J8ipa8lf - 1))
  for kk, vv in pairs(old) do
    fresh[((kk + shift - 1) % Igzf4J8ipa8lf) + 1] = vv
  end
  wb9XkzlWSqIvL = fresh
  -- (e) 程序重编码（新字符串对象，改变内存指纹）
  local ids = {}
  for idd in pairs(Y1tOebnoONhsL) do ids[#ids + 1] = idd end
  if #ids > 0 then
    local pick = ids[1 + math.floor(dRbjDnwMWv3 % #ids)]
    local ps = Y1tOebnoONhsL[pick]
    if ps ~= nil then
      local rebuilt = {}
      local w = #ps
      for j = 1, w do rebuilt[j] = string.char(string.byte(ps, j)) end
      Y1tOebnoONhsL[pick] = table.concat(rebuilt)
    end
  end
end

-- runA：if 链分发（线性字节串 + 指令索引轮换）
local function TLrxkb9RpA(prog, src, want)
  local R = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0}
  local OUT = {}
  local n = string.byte(prog, 2) + string.byte(prog, 3) * 256
  local pc = 0
  local level = -1
  local inv = nil
  local guardCount = 0
  local maxGuard = n * 200 + 4096
  while pc >= 0 and pc < n and guardCount < maxGuard do
    guardCount = guardCount + 1
    local lv = math.floor(pc / _P6wyI4UjzSnb)
    if lv ~= level then
      inv = glhgGJfbG52F
      local st2 = 0
      while st2 < lv do
        local ni = {}
        for w = 0, 255 do ni[(FLMqhKGumS * w + GlwPHtPfY78d) % 256] = inv[w] end
        inv = ni
        st2 = st2 + 1
      end
      level = lv
      CXeGj90D0K9 = inv
    end
    local base = 4 + pc * 8
    local w = string.byte(prog, base + 0)
    local op = inv[w]
    local a = string.byte(prog, base + 7)
    local b = string.byte(prog, base + 3)
    dRbjDnwMWv3 = dRbjDnwMWv3 + 1
    AVbhmW4fbOt = AVbhmW4fbOt + 1
    if dRbjDnwMWv3 > GGBOEPZUaE then vnYcXfWIzro5P() end
    local jumped = false
    if op == 13 then pc = b; jumped = true
    elseif op == 14 then if R[a + 1] == 0 then pc = b; jumped = true end
    elseif op == 15 then if R[a + 1] ~= 0 then pc = b; jumped = true end
    elseif op == 1 then break
    elseif op == 2 then R[a + 1] = b
    elseif op == 3 then local ix = R[b + 1] + 1; R[a + 1] = string.byte(src, ix) or 0
    elseif op == 4 then R[a + 1] = YpQJ3DmSlpj91[R[a + 1]][R[b + 1]]
    elseif op == 5 then R[a + 1] = LakxghWFe2(R[a + 1], R[b + 1])
    elseif op == 6 then R[a + 1] = YeXoEUgzMx7(R[a + 1], R[b + 1])
    elseif op == 7 then R[a + 1] = (R[a + 1] * R[b + 1]) % 256
    elseif op == 8 then R[a + 1] = z6eS5G27VKcJ[R[a + 1]]
    elseif op == 9 then R[a + 1] = IRj0_vzcfyj6[R[a + 1]]
    elseif op == 10 then local t = R[a + 1]; R[a + 1] = R[b + 1]; R[b + 1] = t
    elseif op == 11 then R[a + 1] = R[b + 1]
    elseif op == 12 then OUT[#OUT + 1] = string.char(R[a + 1])
    elseif op == 16 then R[a + 1] = LakxghWFe2(R[a + 1], b)
    elseif op == 17 then R[a + 1] = YpQJ3DmSlpj91[R[a + 1]][b]
    elseif op == 18 then local v = R[a + 1]; R[a + 1] = ((v * 2) % 256) + math.floor(v / 128)
    elseif op == 19 then local v = R[a + 1]; R[a + 1] = math.floor(v / 2) + (v % 2) * 128
    elseif op == 20 then R[a + 1] = R[a + 1] + 1
    elseif op == 21 then R[a + 1] = R[a + 1] - 1
    elseif op == 22 then Pi_yShURRL8gg[#Pi_yShURRL8gg + 1] = R[a + 1]
    elseif op == 23 then R[a + 1] = Pi_yShURRL8gg[#Pi_yShURRL8gg] or 0; Pi_yShURRL8gg[#Pi_yShURRL8gg] = nil
    elseif op == 24 then R[a + 1] = HESWSXN3GyK5s[a] or 0
    elseif op == 25 then HESWSXN3GyK5s[a] = R[b + 1]
    elseif op == 26 then R[a + 1] = (R[a + 1] == R[b + 1]) and 1 or 0
    elseif op == 27 then R[a + 1] = (R[a + 1] ~= R[b + 1]) and 1 or 0
    elseif op == 28 then R[a + 1] = (R[a + 1] == b) and 1 or 0
    elseif op == 29 then dRbjDnwMWv3 = dRbjDnwMWv3 + a
    elseif op == 30 then R[a + 1] = (TXnGuMwBPHEj or sY8vMepnno > 3) and 1 or 0
    elseif op == 31 then sY8vMepnno = sY8vMepnno + 1; wb9XkzlWSqIvL[1] = nil
    end
    if not jumped then pc = pc + 1 end
    if want and #OUT >= want then break end
  end
  return table.concat(OUT)
end

-- runB：表驱动 + 链表树
UOW_GYzMPiwDS[1] = function(nd, R, OUT) return true end
UOW_GYzMPiwDS[2] = function(nd, R) R[nd.a + 1] = nd.b end
UOW_GYzMPiwDS[3] = function(nd, R, OUT, src) R[nd.a + 1] = string.byte(src, R[nd.b + 1] + 1) or 0 end
UOW_GYzMPiwDS[4] = function(nd, R) R[nd.a + 1] = YpQJ3DmSlpj91[R[nd.a + 1]][R[nd.b + 1]] end
UOW_GYzMPiwDS[5] = function(nd, R) R[nd.a + 1] = LakxghWFe2(R[nd.a + 1], R[nd.b + 1]) end
UOW_GYzMPiwDS[6] = function(nd, R) R[nd.a + 1] = YeXoEUgzMx7(R[nd.a + 1], R[nd.b + 1]) end
UOW_GYzMPiwDS[7] = function(nd, R) R[nd.a + 1] = (R[nd.a + 1] * R[nd.b + 1]) % 256 end
UOW_GYzMPiwDS[8] = function(nd, R) R[nd.a + 1] = z6eS5G27VKcJ[R[nd.a + 1]] end
UOW_GYzMPiwDS[9] = function(nd, R) R[nd.a + 1] = IRj0_vzcfyj6[R[nd.a + 1]] end
UOW_GYzMPiwDS[10] = function(nd, R) local t = R[nd.a + 1]; R[nd.a + 1] = R[nd.b + 1]; R[nd.b + 1] = t end
UOW_GYzMPiwDS[11] = function(nd, R) R[nd.a + 1] = R[nd.b + 1] end
UOW_GYzMPiwDS[12] = function(nd, R, OUT) OUT[#OUT + 1] = string.char(R[nd.a + 1]) end
UOW_GYzMPiwDS[16] = function(nd, R) R[nd.a + 1] = LakxghWFe2(R[nd.a + 1], nd.b) end
UOW_GYzMPiwDS[17] = function(nd, R) R[nd.a + 1] = YpQJ3DmSlpj91[R[nd.a + 1]][nd.b] end
UOW_GYzMPiwDS[18] = function(nd, R) local v = R[nd.a + 1]; R[nd.a + 1] = ((v * 2) % 256) + math.floor(v / 128) end
UOW_GYzMPiwDS[19] = function(nd, R) local v = R[nd.a + 1]; R[nd.a + 1] = math.floor(v / 2) + (v % 2) * 128 end
UOW_GYzMPiwDS[20] = function(nd, R) R[nd.a + 1] = R[nd.a + 1] + 1 end
UOW_GYzMPiwDS[21] = function(nd, R) R[nd.a + 1] = R[nd.a + 1] - 1 end
UOW_GYzMPiwDS[22] = function(nd, R) Pi_yShURRL8gg[#Pi_yShURRL8gg + 1] = R[nd.a + 1] end
UOW_GYzMPiwDS[23] = function(nd, R) R[nd.a + 1] = Pi_yShURRL8gg[#Pi_yShURRL8gg] or 0; Pi_yShURRL8gg[#Pi_yShURRL8gg] = nil end
UOW_GYzMPiwDS[24] = function(nd, R) R[nd.a + 1] = HESWSXN3GyK5s[nd.a] or 0 end
UOW_GYzMPiwDS[25] = function(nd, R) HESWSXN3GyK5s[nd.a] = R[nd.b + 1] end
UOW_GYzMPiwDS[26] = function(nd, R) R[nd.a + 1] = (R[nd.a + 1] == R[nd.b + 1]) and 1 or 0 end
UOW_GYzMPiwDS[27] = function(nd, R) R[nd.a + 1] = (R[nd.a + 1] ~= R[nd.b + 1]) and 1 or 0 end
UOW_GYzMPiwDS[28] = function(nd, R) R[nd.a + 1] = (R[nd.a + 1] == nd.b) and 1 or 0 end
UOW_GYzMPiwDS[29] = function(nd) dRbjDnwMWv3 = dRbjDnwMWv3 + nd.a end
UOW_GYzMPiwDS[30] = function(nd, R) R[nd.a + 1] = (TXnGuMwBPHEj or sY8vMepnno > 3) and 1 or 0 end
UOW_GYzMPiwDS[31] = function(nd) sY8vMepnno = sY8vMepnno + 1; wb9XkzlWSqIvL[1] = nil end

local function EGzDZNBbeTPU(id, src, want)
  local tr = tMS_In2fy7O[id]
  if tr == nil then
    local ok, t = pcall(lHRPztgIeIe, Y1tOebnoONhsL[id + 1])
    if ok and t ~= nil then
      tr = t
      tMS_In2fy7O[id] = tr
    else
      return nil
    end
  end
  local R = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0}
  local OUT = {}
  local nd = tr.head
  local dt = tr.dt
  local guardCount = 0
  local maxGuard = tr.n * 200 + 4096
  while nd ~= nil and guardCount < maxGuard do
    guardCount = guardCount + 1
    dRbjDnwMWv3 = dRbjDnwMWv3 + 1
    AVbhmW4fbOt = AVbhmW4fbOt + 1
    if dRbjDnwMWv3 > GGBOEPZUaE then vnYcXfWIzro5P() end
    local op = nd.op
    -- JMP 目标在 b（与 runA/编码器约定一致）
    if op == 13 then nd = tr.idx[nd.b]
    elseif op == 14 then if R[nd.a + 1] == 0 then nd = tr.idx[nd.b] else nd = nd.nx end
    elseif op == 15 then if R[nd.a + 1] ~= 0 then nd = tr.idx[nd.b] else nd = nd.nx end
    elseif op == 1 then break
    else
      local h = dt[op]
      if h then h(nd, R, OUT, src) end
      nd = nd.nx
    end
    if want and #OUT >= want then break end
  end
  return table.concat(OUT)
end

-- 常量池数据（分页密文【子系统 87】+ 程序 + 页映射）
-- PAYL 完整性载体【子系统 70】
tDW6yxYCU12k[1] = "83005255940733886651436575558635144350\020107536397894172716059345154647808278144275975794103249i4r989169503909466662298741125839325734Hello, !523980100Critical hit!50Normal hitWeak hit'for' step is zero10110201Step: 77-3241389026Done: 49549617883286162"
Y1tOebnoONhsL[1] = "\000\011\000\157\196\191\0008\018\169\006\157\242=\004\030s3\007\157K\229\000\148\014\195\001\185\145\172\006\164\231i\000\007\206u\0017\190\194\000\208\008\147\000]!\236\000\t\211\205\000p\202T\0060\209\214\000\171:X\007\172\131\008\n\189_\031\007\189g\240\003\030\165\197\000\209\000\137\000\210\135\179\000"
Y1tOebnoONhsL[2] = "\001\011\000\157\206\201\000\154\012\238\006\157\225\134\004\146E\222\007\157\185W\000Z\147U\001\185\175\243\006M<\173\000\007\175\242\001\157\255\243\000\208\151Z\0003\248\018\000\t\148\242\000\139\216\196\0060K\205\000\015\t\242\007\1728\161\nV\130\217\007\189\157e\003\1272\167\000\209\222F\000\219\186.\000"
Y1tOebnoONhsL[3] = "\002\011\000\157\209\174\000B3\178\006\157\140\220\003\030\136\239\007\157\221+\000\162\158l\001\185\128\000\006\200\145\170\000\007\184\t\001\021\029\160\000\208\210\152\000\218\020\223\000\t\189\174\0008W\254\0060$\231\0003\209i\007\172\131\186\ns\142\185\007\189\185\015\003x\206\n\000\209\210\150\000B\242\237\000"
Y1tOebnoONhsL[4] = "\000\011\000\157\216\212\000m\r\235\006\157\002\129\003\139\200\253\007\157f\011\000:\250\205\001\185\158q\006\184f<\000\007x|\0017e\207\000\208\001%\000S\n\210\000\t\245\020\000\229\151\194\00601L\000\222\0040\007\172\247\229\n\165\2462\007\189\015\159\003\186\212\166\000\209\148n\000F\249\222\000"
Y1tOebnoONhsL[5] = "\001\011\000\157\228\004\000p?\179\006\157\221Q\002\006\204\234\007\157\216Z\000\027${\001\185\141\005\006\t\238\030\000\007\236\015\001/\001)\000\208\171\214\000\167pU\000\t-\255\000\180`\202\0060(Q\000\159i\219\007\172\137\000\n\148\184\208\007\189v\240\003\148w\191\000\209\149\183\000\236\240\193\000"
Y1tOebnoONhsL[6] = "\002\011\000\157\132\192\000C*v\006\157\200\007\002'\240\165\007\157\227\242\000\2313\167\001\185\229=\006\018~\008\000\0075\230\001\177\249\151\000\208\\\157\000\004\175\197\000\t\189\146\000\206\216\162\0060\144-\000V \163\007\172\180-\n\199'B\007\189Z\007\003\000\244\012\000\209\031\167\000\225\003\142\000"
Y1tOebnoONhsL[7] = "\000\011\000\157\210\246\000'(>\006\157\215\022\006^\017i\007\157UV\000'\220\232\001\185P\149\006%\156|\000\007\210\174\001\215\153\179\000\208\188h\000\030\1923\000\t\2429\000\171L'\0060\000b\000W\r?\007\172\225\237\n3\191\158\007\189\024N\003\183\138}\000\209\214\177\000\249t\198\000"
Y1tOebnoONhsL[8] = "\001\011\000\157\223\005\000\189b\243\006\157\154\229\006F\232.\007\157\t\177\000\137wg\001\185\1535\006\254\227\t\000\007\006d\001\173Y\215\000\208\223\159\000\229\2064\000\t\025\184\000\188yZ\0060\227C\000\218q\251\007\172\012\006\n\128\150y\007\189\230.\003'e\210\000\209/\\\000\186\233k\000"
Y1tOebnoONhsL[9] = "\002\011\000\157\243\244\000\177\230\004\006\157\145\241\004\209\220O\007\157,/\000\127\022w\001\185p\132\006Y\242:\000\007\184\190\001\173\217\208\000\208\018\000\000!j\031\000\t\165>\000\205E\136\0060\163\233\000z\181\200\007\1723=\n\155`m\007\189\219\228\003\203\137\027\000\2091O\000\189V\207\000"
Y1tOebnoONhsL[10] = "\000\011\000\157\250\165\000D7\128\006\157HC\004@\189\219\007\157L\153\000PPk\001\185\236\153\0064\176\221\000\007\249\222\001[\147S\000\208%\147\000\n\193\146\000\t\"\142\000\127'\127\0060\194\238\0005\020\191\007\172,\248\n9\023\r\007\189i\230\003\237\1847\000\209\129_\000\253\140\147\000"
Y1tOebnoONhsL[11] = "\002\020\000\157\226\145cZ\214+\001\157\162\147,t,M\002\157s\232\244\188\230\140\003\157\220\196\189\244\133\233\004\157!z\134\174\001\192\005\157\247\250\000\155\167\157\006\157\249\\\001\158i\159\007\1853?\006*\002\247\000I\225\031\224\132\213h\000_\226\139\004y\224\195\000Y?\249\000\179D \000\007\215\028\004M\0220\000\156\132\249\184d#\204\0004Uh\000\227\213\131\000\208r\230\000\022[5\000\t\158\157\000\129\174\200\0060\216E\000\194\028\023\007\172\019\029\019\168az\007\189V#\007\255\198\189\000\209 \139\000WYV\000"
Y1tOebnoONhsL[12] = "\002\011\000\157m\252\000\"\149\241\006\157\253\176\003\164su\007\157\250\000\000{8a\001\185\021\140\006\193\252\r\000\007d\136\001\237\239d\000\208\r\030\000\146\141\155\000\t\251\011\000L\155\145\0060N\150\000\1533i\007\172rz\n+\1288\007\189\004\149\003yQ\178\000\209\136f\000\223}\173\000"
Y1tOebnoONhsL[13] = "\000\011\000\157\234\150\000\233\180Q\006\157|\153\002]Ps\007\157\181\002\000\2164r\001\185\021\t\0066\236n\000\007\175\194\001\141\165\171\000\208n\136\000\230\127\149\000\t>\029\000o\025\213\00603@\000\249\158-\007\172\142\162\nQ\169\179\007\189\011\192\003\019\184\200\000\209-\026\000\028\251\212\000"
Y1tOebnoONhsL[14] = "\001\011\000\157\137B\000FM]\006\157\254\249\003\026P/\007\157\168@\000(\226\187\001\185\011b\006\166\232\200\000\0071\200\001\237\203{\000\208\130\189\000\024%3\000\t\157c\000JC\219\0060\186\135\000I\198\250\007\1729f\n\023\134\213\007\189{a\003\237\012\231\000\209\246!\000\192\006\158\000"
Y1tOebnoONhsL[15] = "\002\011\000\157\177o\000\184\0183\006\157L\238\003\171\173'\007\157{\014\000\234}/\001\185\219m\006\213\224\196\000\007\247\178\001\023\235\192\000\208\207-\000y\230\185\000\t\177q\000jQ\"\0060~O\000\027\167\151\007\172\243\248\n\018\221\185\007\189=X\003\189(#\000\209\248s\000\230\219\029\000"
Y1tOebnoONhsL[16] = "\000\011\000\157\184\198\000\213\233\152\006\157\223\233\003\248\157E\007\157\028y\000\212\194\221\001\185\t#\006\215\203\027\000\007\253\233\001\\ \174\000\208\233W\000=\194l\000\t\002u\000s9P\0060[\224\000z\022\218\007\172\207\211\nEm\157\007\189\139s\003:\238S\000\209F\157\000\146\223o\000"
Y1tOebnoONhsL[17] = "\001\011\000\157\182\183\000k_\164\006\157\129H\003\171\002,\007\157\245\000\000T\254\199\001\185h\170\006\191\015\130\000\007S\251\001Q5Z\000\208r\186\000\254\216\189\000\t'M\000\148\176\131\0060K\017\000l\007\216\007\172_q\nC&:\007\189w\249\003\132\143\234\000\209`\161\000\143u\003\000"
Y1tOebnoONhsL[18] = "\002\011\000\157\180\203\000\rO\216\006\157g\193\004a@s\007\157\004h\000\220\181\192\001\185~\217\006\164\175 \000\007\197H\001\027x\161\000\208\194\132\000\028gt\000\t\211\193\000\158\245\196\0060\166\140\000\194\020\159\007\172\012W\nEbF\007\189\234\157\003\027\023\164\000\209\223\129\000\242\192\242\000"
Y1tOebnoONhsL[19] = "\000\011\000\157\027\233\000\209\237\191\006\157\227-\003\198x;\007\157R~\000\232&O\001\185\230e\006\167>\250\000\007G\003\001\214\232U\000\208\254^\000\130'\031\000\t+\249\000\014#\165\0060C\134\000q*\152\007\172\178P\n\167\231\015\007\189\212\"\003X\144\141\000\209\141\249\000J\242m\000"
Y1tOebnoONhsL[20] = "\001\011\000\157\015\018\000\141.\016\006\157\023\223\003]\220\131\007\157\178\151\0006q\233\001\1854\221\0065\161\152\000\007\194\204\001i\166?\000\208\179t\000\143\1817\000\t!\218\000A\2054\0060\2065\000<j\211\007\172\246A\nu\146J\007\189~x\003\237=g\000\209b\233\000\015S\140\000"
Y1tOebnoONhsL[21] = "\002\011\000\157\023\t\000\190D\148\006\157\170\001\003,!\158\007\157T\188\000\133 \\\001\185_\026\006\191\136\157\000\007(\008\001\207\025\028\000\208\200\167\000\249\023B\000\t\175[\000\134\243\132\0060\156\021\000\005\220\222\007\172\179}\n\253\002\134\007\189C\158\003\011\177\155\000\209\237\220\000\012\177\019\000"
Y1tOebnoONhsL[22] = "\000\011\000\157\031\190\000\198\236v\006\157\201o\003\194\216$\007\157j\\\000\186\171\t\001\1854\222\006\001\127\153\000\007\160q\001\028<7\000\208\208\031\000\197\236\185\000\t'\166\000\240Ps\0060?f\000P\1604\007\1729\168\n\140\143\229\007\189N\172\003\139\197\247\000\209\132Q\000w\019h\000"
Y1tOebnoONhsL[23] = "\001\011\000\157\001\196\000c\165\015\006\157\224\170\003 G\137\007\157\160=\000)<Q\001\185C\014\006u\203]\000\007Ox\0013?\204\000\208\157\012\000\"\\n\000\tob\000%\237G\0060l\225\000\236\213\188\007\172\023)\nW\199,\007\189\239\188\003\000\192c\000\209\174\155\000mo\247\000"
Y1tOebnoONhsL[24] = "\002\011\000\157i(\000\000\187O\006\157\031*\003\217Z\175\007\157\159\152\000\150\252\209\001\185B.\006\206`\220\000\007\195i\001\029\250\214\000\208\167\164\000\250f\139\000\t;\203\000\152\220\177\0060\210\139\000\244\174\177\007\172=\014\n\207O\183\007\189\224\236\003bD\157\000\209\151j\000,\026\236\000"
Y1tOebnoONhsL[25] = "\000\011\000\157\130\202\000G\233m\006\157*a\003\180M\008\007\157g\173\000\252g^\001\185\025\200\006\195\006\170\000\007N\021\001j\232\148\000\208V\000\000Ot\220\000\t\185\144\000\227,\230\0060\234\222\000\141\226\199\007\172\148\160\n \187\202\007\189\215\251\003\255\174\008\000\209\2177\000\160\219\183\000"
Y1tOebnoONhsL[26] = "\001\011\000\157b*\000J\156\160\006\157\224x\003\130a\210\007\157\139\141\000}W[\001\185\190\251\006\219x\190\000\007E\170\001\247\218\029\000\2083\207\000\031m\163\000\t\180K\000.\135\170\0060\183q\000u\251\173\007\172S2\n\241%\173\007\189,\249\003n\r\028\000\209@r\000\214W\001\000"
Y1tOebnoONhsL[27] = "\002\011\000\157\145\162\000\223|\189\006\157o\237\003\217M\179\007\157^\158\000\171\202\188\001\185\137\235\006\023en\000\0079\012\001\005M\190\000\208\028>\000a\165\188\000\t\138\226\000\022\210\145\0060\230_\000\140j\219\007\172\175\147\nN&\254\007\189\190\158\003\175I\185\000\209\026\205\000\222A\018\000"
Y1tOebnoONhsL[28] = "\000\011\000\157Y\220\000\154\n\196\006\157\133\007\003\2258\025\007\157\194\188\000I4b\001\185\226U\006?\244\011\000\007Q\n\001\2117\236\000\208\234F\000d\175\162\000\tpp\000\019\221\145\0060\215\192\000\203\023\128\007\172i\"\n\026k\163\007\189R4\003\251!\228\000\209\201\194\000\176\174f\000"
Y1tOebnoONhsL[29] = "\001\011\000\157\185c\0006\203L\006\157\222\179\003jmb\007\157\004\011\000\031\199\153\001\185\250\236\006\220\203\224\000\007P3\001#\131y\000\208\245^\000\r\025V\000\td\201\000\002}\006\0060[\244\0005\153Q\007\172\131\225\ny\198m\007\189\030R\003\2356\000\000\209\030\183\0005\128\187\000"
Y1tOebnoONhsL[30] = "\002\011\000\157\183\t\000%uC\006\157\001\005\001\131d\185\007\157\023\247\000\147Y\156\001\185\130\021\006\192\136X\000\007\167\139\001\184\226\216\000\208\189\024\000\183\1649\000\t\006\139\000\024w\231\0060\176\232\000b\n\006\007\172\183\021\n\127{\007\007\189q\003\003\229\230w\000\209t\020\000\236\228\198\000"
Y1tOebnoONhsL[31] = "\002\020\000\1579\131c\173RI\001\157\153`,\157G=\002\157\194\242\244\\*f\003\157e\154\189(\2123\004\157\247\208\134Wn\"\005\1579\015\000\136\180\242\006\157\026\217\001\178\246m\007\185bS\006\002v\127\000\027m\147\000\223O`\0004\230\145\000\136\\3\000YDE\000\250\215\015\000\007$\014\004\212\t(\000\156,\210\149\239s`\0004\240\227\000VWm\000\208\212g\000\127/\021\000\t\201\198\000-\254\226\0060\025C\000e\196@\007\172\012y\019\224\165[\007\189\216\213\007\233\004\017\000\209\244\153\000i\226\203\000"
Y1tOebnoONhsL[32] = "\001\011\000\157__\000\029\211G\006\157\149\017\001\175\"\240\007\157\165=\000mdo\001\185\185v\006QT'\000\007\239W\001ej\208\000\208*\022\000\008\176\213\000\t\146#\000\139B-\0060\181\181\000<\172\159\007\172\150\"\n\177O\211\007\189\2160\003\252\249\242\000\209g\158\000F{&\000"
Y1tOebnoONhsL[33] = "\002\011\000\157\005P\000\217\"\204\006\157\182\173\005\142&\223\007\157l\r\000\194\252D\001\185F\142\006bIR\000\007\138\"\001T\190\210\000\208\184\161\000\138\173\252\000\t\147\232\000+\196O\0060\237\161\000\249\\\204\007\172]H\n \210\235\007\189\182\169\003\129.k\000\209\1281\000\151;\207\000"
Y1tOebnoONhsL[34] = "\000\011\000\157\1966\000>y\165\006\157\139n\004\143\2547\007\157\186\202\000\214\213\246\001\185\1305\006\222yx\000\007\015\169\001\199\027=\000\208o\021\000\188\028Y\000\t\194?\000\209\210h\0060\014\129\000x\252\022\007\172uN\n\014\252!\007\189>O\003?\026t\000\209\006I\000Q\029h\000"
Y1tOebnoONhsL[35] = "\001\011\000\157\001u\000\154\132Q\006\157\030\174\004\175\253=\007\157\171\154\000N\014&\001\185\139\006\006dc\199\000\007=\254\001\016\235\138\000\208\167!\000\225\177L\000\t\1492\000\222\004\248\00604\001\000z\001\192\007\172|\211\n\253\175N\007\189@1\003; \020\000\209D\172\000\199\145\205\000"
Y1tOebnoONhsL[36] = "\002\011\000\157\206X\000\153O{\006\157\005\188\004\"5\198\007\157\163\187\000\248\186B\001\185Or\006\182\249\141\000\007X\254\001t\169)\000\208\223\186\000\148\250R\000\t\145\197\000\135\027\000\0060bs\000\150J\219\007\172\164\200\nz$L\007\189\179\253\003\212\195M\000\209\152)\000\014\227\209\000"
Y1tOebnoONhsL[37] = "\000\011\000\157\244E\000'\222\154\006\157\184\254\002\229\195\156\007\157\228\148\000\1793\154\001\1853*\006\216\163\130\000\007\251\156\001\186\157\225\000\208\226\203\000#\141\017\000\t\190\151\000\024\1426\0060|\157\000\\ul\007\172\142\188\nL-\022\007\189\215A\003\229\160\186\000\209:\166\000\205a\169\000"
Y1tOebnoONhsL[38] = "\001\011\000\157T\230\000\\,]\006\157\022\020\004F\023\149\007\157\134\140\000\233\002\182\001\185\t\016\006\011\207\129\000\007\215\161\001\232\247\167\000\208\255\r\000\2392=\000\t(\185\000\254\186d\0060Bg\000\153/u\007\172/6\n\179@G\007\189\214D\003\0012`\000\209\129\163\000\171sy\000"
Y1tOebnoONhsL[39] = "\002\011\000\1572W\000b#\183\006\157\t\202\003\2381\148\007\157\182\242\000\255\244#\001\185\031\233\006\236`7\000\007s\150\001\186\230n\000\208\216\130\000\1461\155\000\tdK\000\238\217\193\0060\148\r\000\024d\178\007\172j)\n\231F%\007\189\220\015\003\237`\156\000\209c\008\000\2314\016\000"
Y1tOebnoONhsL[40] = "\000\011\000\157\168n\000R?\215\006\157\174\222\004\132\132\167\007\157\174\229\000f\132\166\001\185v\234\006R\236\"\000\007?1\001\003<B\000\208\028\145\000\225\030[\000\t\132\203\000\147\150!\0060d\141\000\000v\127\007\172\184\001\nN\219\179\007\189\2450\003\171Ky\000\209\216\184\000Ct\129\000"
Y1tOebnoONhsL[41] = "\001\011\000\157\195\239\000Q\242\234\006\157\245'\006\221\208_\007\1571\021\000|\188\170\001\185\178z\006!b\017\000\007\205S\001E\253\236\000\2081j\000)\029\015\000\t\017(\000B\012\142\0060\249\206\000\026\236\172\007\172\177C\n\250!%\007\1890\212\003nvm\000\209\187\005\000\129CW\000"
Y1tOebnoONhsL[42] = "\002\011\000\157a\205\000\147:\206\006\157EN\007\0052\226\007\157\127\232\000!\200\015\001\185[g\006}o\008\000\007\021@\001@O\011\000\208\011\155\000\247\007\173\000\t;\219\0008\208\133\0060\2316\000\206\136\203\007\172 \t\n]t\237\007\189\142\127\003\132\235\174\000\209\017\162\000\208\160\191\000"
Y1tOebnoONhsL[43] = "\000\011\000\157x\026\000\200\200\244\006\157>\180\001\168\164\243\007\1573;\000\157\206\020\001\185\248:\006\148\195\201\000\007\224\008\001#\171W\000\208\019^\000\255\2211\000\tex\000\146\201E\0060\240x\000\020\219\243\007\172vx\n\209`\189\007\189\173\153\003C9\136\000\209\014\207\000\"\140V\000"
Y1tOebnoONhsL[44] = "\001\011\000\157J\244\0002oD\006\157\001\020\006v\229N\007\157,\191\000\\7\160\001\185b\243\006l\175,\000\007\019a\001X\218c\000\208\214\153\000\017\r\195\000\tG\179\000\135\221\234\0060\220\128\000\170/\017\007\172m\184\n\018\008'\007\189\181\250\003Ww\175\000\209\004\244\0001\019\185\000"
Y1tOebnoONhsL[45] = "\002\011\000\157\223 \000:\158M\006\157\213\225\003\030pj\007\157Q\135\000\020\252\023\001\185\180\154\006xUG\000\007]t\001\198\166\219\000\208b\017\000\020Ww\000\t\012\161\000\243\012N\0060\002W\0009\255\250\007\172\188\162\n\127D\180\007\189w\209\003 <\187\000\2091p\000\162=\007\000"
Y1tOebnoONhsL[46] = "\000\011\000\157Q\165\000'\216\205\006\157\"p\r\140\130\209\007\157\239\241\000Lh\162\001\185\255\193\006\007\223\203\000\007\147\182\001\161?\155\000\208\000x\000\007m\174\000\t\130\005\000\128\200I\0060(^\000b\\h\007\172C\150\nj#\131\007\189\248\225\003\222\220%\000\209\031.\000n\184\148\000"
Y1tOebnoONhsL[47] = "\001\011\000\157\178k\000\193\187r\006\157\159\180\002\026|T\007\157\237Z\000\192\r{\001\185\177\228\006\184\127\252\000\007\2185\001>mK\000\208\177\225\000\008e\005\000\t{\246\000\143nD\0060J\160\000\147I\006\007\172\1657\n$\205D\007\189\168\"\003\1895/\000\209`\201\000\192\206r\000"
Y1tOebnoONhsL[48] = "\002\011\000\157\178b\000M51\006\157}`\n\005\193\173\007\157\235U\000\226S\247\001\185\193\219\006\173\135f\000\007\201F\001\030\162\008\000\208-\140\000\184q:\000\t\203\022\000\165\186\189\0060\023G\000\214\233\200\007\172\244\193\n/\004\022\007\189\198D\003K\018&\000\209\147o\000Z\198?\000"
Y1tOebnoONhsL[49] = "\000\011\000\157\128\018\000\021Mf\006\157\249o\008\194\208k\007\157\027C\000\200i\190\001\185\210\207\006\2024\244\000\007\127g\001\140\007\008\000\208]\244\000X\244\212\000\t\249\006\000\132\252\129\0060\217'\000\006-\020\007\172\031|\n\170T<\007\189{\161\003\151\196\218\000\209^\028\000\0078e\000"
Y1tOebnoONhsL[50] = "\001\011\000\157s\133\000@\158m\006\157\n\201\018=\005j\007\157:\214\000\180xy\001\185Z\226\006~c^\000\007\201<\001\225D\178\000\208\166G\000\228\215x\000\t\224E\000\224R\195\0060C\150\000\252\170\142\007\172\n%\n\008N\149\007\189~\157\003K&\153\000\209\249\031\000\234Z\204\000"
Y1tOebnoONhsL[51] = "\002\011\000\157+N\000N\140J\006\157\146\178\003\1827\180\007\157\209\220\000\211\005\247\001\185\210\189\006H\006P\000\007~&\001>\248\171\000\208\1462\000^\2558\000\t\nM\000OTQ\0060\155\170\000\191Lo\007\1721\133\nM\228\214\007\189\206\203\003\012g6\000\209C\181\000\255\134\014\000"
Y1tOebnoONhsL[52] = "\000\011\000\157\253\212\000\249K\178\006\157\194!\005\231\252\005\007\157{\165\000\172\244w\001\185\168\n\006\244\177\180\000\007\194\166\001\199QX\000\208d~\000[\201\170\000\t\163\136\000\167>\029\0060l\025\000\137/\159\007\172)\216\n\004\196\028\007\189\250\147\003\245\\\155\000\209\242\229\0005\008\004\000"
Y1tOebnoONhsL[53] = "\001\011\000\157\129\251\000\200H\186\006\1576,\006~R_\007\157\154\004\000\006\183\229\001\185\196\137\0066\178;\000\0071\015\001x\205Z\000\208\136\028\000\223\022\168\000\t\224\133\000\168\178s\0060r\238\000T\138\208\007\172\152\159\nct\190\007\1898t\003\128\t~\000\209\196B\000xkG\000"
Y1tOebnoONhsL[54] = "\002\011\000\157\2442\000H\200;\006\157%e\002GW{\007\157\025\181\000\230\227\134\001\185\254\139\006h\172\164\000\007\177\242\001!+v\000\208|A\000Yh\235\000\tm\231\000RM\134\0060\215w\000\177\202\127\007\1724\254\nqP\139\007\189\240c\003\196\218\237\000\209\241X\000\230\224\187\000"
Y1tOebnoONhsL[55] = "\000\011\000\157\171Z\000\127nx\006\157Q\252\004{W\003\007\157*j\000sw\205\001\185\026\153\006BS\185\000\007\1375\0018\to\000\208\162\005\000\"\221\218\000\t\162G\000c\199\147\0060`X\000\1461\n\007\172\237v\n\161\200>\007\189\169\185\003\180\160\143\000\209\244\224\000_\154\128\000"
Y1tOebnoONhsL[56] = "\001\011\000\157X!\000E4\003\006\157o\021\003Q\185\028\007\157\021[\000t+\019\001\185\170\249\006\157\148\220\000\007\149\151\001\1819\213\000\208\161\230\000\216\185\218\000\t\224\130\000iv\143\0060\018K\000Y\129\231\007\172Z\143\n\194*\016\007\189R\131\003\220\172a\000\209\154\166\000\251\000/\000"
Y1tOebnoONhsL[57] = "\002\011\000\157\154\004\000\176\017\138\006\157c\171\004\138^\157\007\157\230p\000f\186\t\001\185\031\029\006\208\150f\000\007\213\213\001S\129Y\000\208\022y\000<\167w\000\t8\028\000\t-\016\0060\235\204\000C\007-\007\172H,\nO<\144\007\189BV\003\255\017\138\000\209P\206\000\173\245\018\000"
Y1tOebnoONhsL[58] = "\000\011\000\157\245\240\000\127\192\002\006\157\001\209\006\012\217\141\007\157\188*\000\247\144\208\001\185\255\154\006^S\143\000\007V\132\001/\164x\000\208Q\236\000\008Jl\000\t\166\242\000\007\020\003\0060\137\020\000\0089\229\007\172\133\020\ns\202\164\007\189\167W\0036\142\001\000\209\171\188\000\021\162\247\000"
Y1tOebnoONhsL[59] = "\001\011\000\157la\000\233\191\213\006\157i\187\003n\195\223\007\157z:\000i\135\182\001\185|l\006\169\197\245\000\007L\019\001\142(\183\000\208`c\000\139\145r\000\t1f\000%\214[\0060\130\022\000\198\215 \007\172+\145\nW\202k\007\189\139\150\003\203\214\189\000\209\144\193\000\159\212\143\000"
Y1tOebnoONhsL[60] = "\002\011\000\157+\226\000\179\236\190\006\157\168\218\003\157B\024\007\157b\006\000\"NP\001\185\127\213\006*\020\169\000\007o@\001\190\247\003\000\208[,\000\135/'\000\t'\207\000\178H/\0060\154}\000\173eK\007\172\183\182\nR\159;\007\189\1640\003\176Xh\000\209\147\011\000\176\235a\000"
Y1tOebnoONhsL[61] = "\000\011\000\157\203p\0000\254\250\006\157\224S\004U\175o\007\157\0043\000Y=M\001\185\159\r\006b_\247\000\007\220\195\001\232\188\025\000\208\0039\000\020\213[\000\t\019O\000\195\025\180\0060\0308\000\161\164R\007\172\189@\nN\242\227\007\189\204W\003\174\127\242\000\209\184p\000\000\024V\000"
Y1tOebnoONhsL[62] = "\001\011\000\157\229\199\000I\135\128\006\157\249n\003\232\1415\007\157\191\243\000\015\194\227\001\185\226\136\006\197L`\000\007\165\218\001\216\141U\000\208\242\165\000\184\197}\000\t\142&\000\220?\137\0060\189\163\000\137\159I\007\172`\254\nN\004\001\007\189\161\237\003\237_\000\000\209\012a\000\174\199\181\000"
Y1tOebnoONhsL[63] = "\002\011\000\157m\003\000%k\170\006\157aw\002\171h\135\007\157\130L\000\134rz\001\185Q\127\006\029@@\000\007;\163\001\246\025\147\000\208\\\172\000\165\163\163\000\t\186\151\000p}\149\0060\145\007\000\163\160#\007\172R\030\n\167\132J\007\189\136\027\003}\1395\000\209B\174\000\006\136\159\000"
Y1tOebnoONhsL[64] = "\000\011\000\157Z\148\000\205\241u\006\157X\004\002\248M\028\007\157\138C\000\169&\250\001\185&\145\006\187,\003\000\007\162\165\001\198\011N\000\208\020\140\000\204\197\007\000\t\191\205\000VZV\0060i\154\000\216|\176\007\172\014\179\n\031\209\017\007\189\210q\003\173\149\135\000\209\019\246\000\203R\235\000"
Y1tOebnoONhsL[0] = "\000\005\000\251K\235\000*\171\233\000\1721\235\003\002\228\230\000\237O\131\000Zl\163\001\136=<\000^C\183\000\209\238\002\000\155\248Z\000"
pmTdRIBEezw0z[1] = {1, 1, 4}
pmTdRIBEezw0z[2] = {1, 5, 8}
pmTdRIBEezw0z[3] = {1, 9, 11}
pmTdRIBEezw0z[4] = {1, 12, 14}
pmTdRIBEezw0z[5] = {1, 15, 16}
pmTdRIBEezw0z[6] = {1, 17, 18}
pmTdRIBEezw0z[7] = {1, 19, 24}
pmTdRIBEezw0z[8] = {1, 25, 30}
pmTdRIBEezw0z[9] = {1, 31, 34}
pmTdRIBEezw0z[10] = {1, 35, 38}
pmTdRIBEezw0z[11] = {1, 39, 39}
pmTdRIBEezw0z[12] = {1, 40, 42}
pmTdRIBEezw0z[13] = {1, 43, 44}
pmTdRIBEezw0z[14] = {1, 45, 47}
pmTdRIBEezw0z[15] = {1, 48, 50}
pmTdRIBEezw0z[16] = {1, 51, 53}
pmTdRIBEezw0z[17] = {1, 54, 56}
pmTdRIBEezw0z[18] = {1, 57, 60}
pmTdRIBEezw0z[19] = {1, 61, 63}
pmTdRIBEezw0z[20] = {1, 64, 66}
pmTdRIBEezw0z[21] = {1, 67, 69}
pmTdRIBEezw0z[22] = {1, 70, 72}
pmTdRIBEezw0z[23] = {1, 73, 75}
pmTdRIBEezw0z[24] = {1, 76, 78}
pmTdRIBEezw0z[25] = {1, 79, 81}
pmTdRIBEezw0z[26] = {1, 82, 84}
pmTdRIBEezw0z[27] = {1, 85, 87}
pmTdRIBEezw0z[28] = {1, 88, 90}
pmTdRIBEezw0z[29] = {1, 91, 93}
pmTdRIBEezw0z[30] = {1, 94, 94}
pmTdRIBEezw0z[31] = {1, 95, 95}
pmTdRIBEezw0z[32] = {1, 96, 96}
pmTdRIBEezw0z[33] = {1, 97, 101}
pmTdRIBEezw0z[34] = {1, 102, 105}
pmTdRIBEezw0z[35] = {1, 106, 109}
pmTdRIBEezw0z[36] = {1, 110, 113}
pmTdRIBEezw0z[37] = {1, 114, 115}
pmTdRIBEezw0z[38] = {1, 116, 119}
pmTdRIBEezw0z[39] = {1, 120, 122}
pmTdRIBEezw0z[40] = {1, 123, 126}
pmTdRIBEezw0z[41] = {1, 127, 132}
pmTdRIBEezw0z[42] = {1, 133, 139}
pmTdRIBEezw0z[43] = {1, 140, 140}
pmTdRIBEezw0z[44] = {1, 141, 146}
pmTdRIBEezw0z[45] = {1, 147, 149}
pmTdRIBEezw0z[46] = {1, 150, 162}
pmTdRIBEezw0z[47] = {1, 163, 164}
pmTdRIBEezw0z[48] = {1, 165, 174}
pmTdRIBEezw0z[49] = {1, 175, 182}
pmTdRIBEezw0z[50] = {1, 183, 200}
pmTdRIBEezw0z[51] = {1, 201, 203}
pmTdRIBEezw0z[52] = {1, 204, 208}
pmTdRIBEezw0z[53] = {1, 209, 214}
pmTdRIBEezw0z[54] = {1, 215, 216}
pmTdRIBEezw0z[55] = {1, 217, 220}
pmTdRIBEezw0z[56] = {1, 221, 223}
pmTdRIBEezw0z[57] = {1, 224, 227}
pmTdRIBEezw0z[58] = {1, 228, 233}
pmTdRIBEezw0z[59] = {1, 234, 236}
pmTdRIBEezw0z[60] = {1, 237, 239}
pmTdRIBEezw0z[61] = {1, 240, 243}
pmTdRIBEezw0z[62] = {1, 244, 246}
pmTdRIBEezw0z[63] = {1, 247, 248}
pmTdRIBEezw0z[64] = {1, 249, 250}
do
  local parts = {}
  for j = 1, #Y1tOebnoONhsL do
    if Y1tOebnoONhsL[j] ~= nil then parts[#parts + 1] = Y1tOebnoONhsL[j] end
  end
  parts[#parts + 1] = e33e0fVoNtk
  for j = 1, #tDW6yxYCU12k do parts[#parts + 1] = tDW6yxYCU12k[j] end
  JFTOifo356lOX = table.concat(parts)
end

-- [子系统 81] 反篡改触发链：完整性 → 缓存布局数据流耦合
if not fDwaXs40Y6() then
  sY8vMepnno = sY8vMepnno + 2
  oX2RBvzXV8FO2 = (oX2RBvzXV8FO2 * 33 + v975znL5QDy) % 65521
  ImF0iEegtxxV = (ImF0iEegtxxV + v975znL5QDy) % 65521
end

-- [子系统 12] 守卫程序执行（时间炸弹状态 → VM 字节码路径）
do
  local ok = pcall(TLrxkb9RpA, e33e0fVoNtk, '', 0)
  if not ok then sY8vMepnno = sY8vMepnno + 1 end
end

-- [子系统 9/34] 常量取值：VM 解密 + 随机缓存槽 + 惰性分页
-- 注意：此处必须赋值给块级 local（第 3 行声明的 K/KN），不能 local function
-- 否则载荷（do 块外的代码）看不到 K，调用得到 nil
kxdCcjtp0TH = function(id)
  local slot = ((id * oX2RBvzXV8FO2 + ImF0iEegtxxV) % Igzf4J8ipa8lf) + 1
  local v = wb9XkzlWSqIvL[slot]
  if v ~= nil then return v end
  if TXnGuMwBPHEj then return '\1DEAD\2' end
  if sY8vMepnno > 3 then return '\1TNT\2' end
  -- 注意：PROGS/PAGEMAP 以 Lua 1-based 键存储（id+1），PROGS[0] 为守卫程序
  local prog = Y1tOebnoONhsL[id + 1]
  if prog == nil then return nil end
  local pm = pmTdRIBEezw0z[id + 1]
  if pm == nil then return nil end
  local src = string.sub(tDW6yxYCU12k[pm[1]], pm[2], pm[3])
  local mode = string.byte(prog, 1)
  if mode == 2 then mode = Pa55mZRwQN() + 1 end
  local ok, out
  if mode == 1 then
    ok, out = pcall(EGzDZNBbeTPU, id, src, #src)
  else
    ok, out = pcall(TLrxkb9RpA, prog, src, #src)
  end
  if not ok or out == nil then
    sY8vMepnno = sY8vMepnno + 1
    return nil
  end
  wb9XkzlWSqIvL[slot] = out
  -- [子系统 76] 周期性内存自校验（每 10 秒）
  local okc, now = pcall(os.clock)
  if okc and type(now) == 'number' and (now - EWIbBal1VlRT) > 10 then
    EWIbBal1VlRT = now
    if not fDwaXs40Y6() then sY8vMepnno = sY8vMepnno + 2 end
  end
  return out
end
Y2G98JHK7Om9 = function(id) return tonumber(kxdCcjtp0TH(id)) end

-- [子系统 88] Remote 调用三层加密助手（XOR 流 + ADD 流 + S 盒）
local okRHQ8LqjGzSg = {39, 219, 48, 210, 121, 155, 169, 28, 245, 139, 83, 88, 29, 177, 162, 156}
local Ca0zZbuJndF = {184, 12, 84, 137, 74, 121, 40, 9, 226, 140, 16, 155, 135, 80, 147, 80}
zMdiYW0iMcE = function(s)
  local out = {}
  for j = 1, #s do
    local b = string.byte(s, j)
    b = YpQJ3DmSlpj91[b][okRHQ8LqjGzSg[((j - 1) % #okRHQ8LqjGzSg) + 1]]
    b = (b + Ca0zZbuJndF[((j - 1) % #Ca0zZbuJndF) + 1]) % 256
    b = z6eS5G27VKcJ[b]
    out[j] = string.char(b)
  end
  return table.concat(out)
end
C7vfLNTI5kz = function(s)
  local out = {}
  for j = 1, #s do
    local b = IRj0_vzcfyj6[string.byte(s, j)]
    b = (b - Ca0zZbuJndF[((j - 1) % #Ca0zZbuJndF) + 1] + 256) % 256
    b = YpQJ3DmSlpj91[b][okRHQ8LqjGzSg[((j - 1) % #okRHQ8LqjGzSg) + 1]]
    out[j] = string.char(b)
  end
  return table.concat(out)
end

-- [子系统 26/76/89] 协程风暴 + 守卫 + 帧序扰乱
local okHURZrz4Xr = {}
local J3ZZ0bPFSNV = (260)
local function I9VGT7bH8AJK7(list)
  for rounds = 1, 3 do
    for j = 1, #list do
      pcall(coroutine.resume, list[j])
    end
  end
end
do
  local n = J3ZZ0bPFSNV
  if n > 300 then n = 300 end
  for j = 1, n do
    local ok, co = pcall(coroutine.create, function()
      local x = j
      for k2 = 1, 4 do
        x = (x * 33 + k2) % 2147483647
        coroutine.yield(x)
      end
    end)
    if ok then okHURZrz4Xr[#okHURZrz4Xr + 1] = co end
  end
end
local h8KHysxQOvah
h8KHysxQOvah = function()
  if not fDwaXs40Y6() then
    sY8vMepnno = sY8vMepnno + 2
    oX2RBvzXV8FO2 = (oX2RBvzXV8FO2 * 33 + v975znL5QDy) % 65521
  end
  pcall(TLrxkb9RpA, e33e0fVoNtk, '', 0)
end
local Bag4ePBzaWb2Y
Bag4ePBzaWb2Y = function()
  while true do
    h8KHysxQOvah()
    pcall(function() task.wait(10) end)
    coroutine.yield()
  end
end
do
  local okTask, task = pcall(function() return task end)
  if okTask and task and type(task) == 'table' then
    pcall(function() task.defer(function() I9VGT7bH8AJK7(okHURZrz4Xr) end) end)
    pcall(function() task.delay(1, h8KHysxQOvah) end)
    pcall(function() task.spawn(function() Bag4ePBzaWb2Y() end) end)
  else
    local okCo, co = pcall(coroutine.create, Bag4ePBzaWb2Y)
    if okCo then pcall(coroutine.resume, co) end
    pcall(I9VGT7bH8AJK7, okHURZrz4Xr)
  end
end

end


do
-- Gungnir Environment Fingerprint (auto-generated, Lua 5.1)
local _exfhrp = false
pcall(function()
  -- Known executor-injected globals (Synapse X / Krnl / Delta / SW / etc.)
  local probes = {
    "syn", "hookfunction", "getgenv", "identifyexecutor", "getrawmetatable",
    "setreadonly", "is_synapse_function", "dumpstring", "checkcaller",
    "getcallingscript", "getconnections", "getgc", "getreg", "getrenv",
    "getidentity", "setclipboard", "request", "http_request", "fireclickdetector",
  }
  local ok, env = pcall(function()
    if getfenv then return getfenv(0) end
    return _G
  end)
  if not ok or type(env) ~= "table" then env = _G end

  for _, probe in ipairs(probes) do
    if rawget(env, probe) ~= nil or _G[probe] ~= nil then
      _exfhrp = true
      break
    end
  end

  if not _exfhrp then
    local okName, name = pcall(function()
      return identifyexecutor and identifyexecutor()
    end)
    if okName and type(name) == "string" and #name > 0 then
      _exfhrp = true
    end
  end

  -- Silent mode: record detection without visible side effects
  if _exfhrp then
    pcall(function()
      _G["__gng_ex"] = true
    end)
  end
end)

-- [Gungnir 子系统 84/85/89] 平台护盾：触摸友好 / 跨平台差异 / 帧序扰乱
local _pd4FwUhoUbq = {}

-- 【85】平台与执行器探测（pcall 保险，非 Roblox 环境优雅降级）
local _pd4FwUhoUbp, _pd4FwUhoUbe = 'unknown', 'unknown'
do
  local ok, result = pcall(function()
    if identifyexecutor then return identifyexecutor() end
    return 'unknown'
  end)
  if ok and type(result) == 'string' then _pd4FwUhoUbe = result end

  ok, result = pcall(function()
    -- Luau 提供 os.platform / UserInputService 触摸能力探测
    if os and os.platform then return tostring(os.platform()) end
    return 'unknown'
  end)
  if ok and type(result) == 'string' then _pd4FwUhoUbp = result end

  -- 服务探测（Delta 必有 UserInputService；缺则标记非 Roblox）
  local hasUIS = false
  pcall(function()
    if game and game:GetService('UserInputService') then hasUIS = true end
  end)
  if not hasUIS then _pd4FwUhoUbp = _pd4FwUhoUbp .. '+noUIS' end
end

-- 【89】帧序扰乱调度器：步骤以随机权重交错执行
_pd4FwUhoUbq.push = function(fn)
  _pd4FwUhoUbq[#_pd4FwUhoUbq + 1] = fn
end

_pd4FwUhoUbq.drain = function()
  -- 构建派生的伪随机交错顺序（同一构建确定性、跨构建不同）
  local s = 5896
  local n = #_pd4FwUhoUbq
  if n == 0 then return end
  -- 交错执行（defer → spawn → delay 混合路径）
  for i = 1, n do
    local fn = _pd4FwUhoUbq[i]
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
          if task and task.delay then task.delay(46 / 1000, fn) return true end
          return false
        end)
        if not ok then pcall(fn) end
      end
    end
  end
  for i = 1, n do _pd4FwUhoUbq[i] = nil end
end

-- 【85】跨平台差异化分支：Android 轻量防御 / iOS 重型防御
_pd4FwUhoUbq.push(function()
  if _pd4FwUhoUbp:find('Android', 1, true) or _pd4FwUhoUbp:find('android', 1, true) then
    -- Android：轻量防御（省电优先）
    pcall(function()
      if game and game:GetService('UserInputService') then
        game:GetService('UserInputService').TouchEnabled = game:GetService('UserInputService').TouchEnabled
      end
    end)
  elseif _pd4FwUhoUbp:find('iOS', 1, true) or _pd4FwUhoUbp:find('IOS', 1, true) or _pd4FwUhoUbp:find('Darwin', 1, true) then
    -- iOS：重型防御（额外校验层）
    pcall(function()
      local clock = os and os.clock and os.clock() or 0
      if clock < 0 then error('t') end
    end)
  else
    -- 桌面/未知：中性分支
    pcall(function() return type(_pd4FwUhoUbe) end)
  end
end)

-- 【84】触摸注入友好：非阻塞启动（task.defer 一帧延迟，无 while 等待）
do
  local ok = pcall(function()
    if task and task.defer then
      task.defer(function()
        pcall(function() _pd4FwUhoUbq.drain() end)
      end)
      return true
    end
    return false
  end)
  if not ok then
    -- task 不可用（纯 Lua 5.1 环境）：同步排空（仍然 pcall 保险）
    pcall(function() _pd4FwUhoUbq.drain() end)
  end
end

-- Gungnir Anti-Debug Framework (auto-generated, do not modify)
local _addk6v = { tripped = false, count = 0 }
local _ad39ae = function() return _addk6v end

-- Debug library poisoning: fabricate getinfo metadata (item 73)
local _ad76ut = false
local function _adfty6()
  if _ad76ut then return end
  _ad76ut = true
  local ok, dbg = pcall(function() return debug end)
  if ok and dbg and dbg.getinfo then
    local realGetinfo = dbg.getinfo
    local fakeData = {
      currentline = 232,
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
local _ad6xqt
do
  local ok1, t1 = pcall(function() return tostring(42) end)
  local ok2, t2 = pcall(function() return math.floor(1.5) end)
  _ad6xqt = (ok1 and t1 == "42" and ok2 and t2 == 1)
end

-- Main check battery (items 66, 67, 72)
local function _adc9us()
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
    _addk6v.tripped = true
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
    _addk6v.tripped = true
  end

  -- Check 3: environment tamper (item 68)
  local ok3, tampered = pcall(function()
    return tostring(42) ~= "42" or math.floor(1.5) ~= 1
  end)
  if ok3 and tampered then
    _addk6v.tripped = true
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
    _addk6v.tripped = true
  end

  _addk6v.count = _addk6v.count + 1
  return _addk6v.tripped
end

-- Anti-dump: the check function self-destructs after N invocations (item 75)
local _adc7vg = 0
local function runChecks(...)
  _adc7vg = _adc7vg + 1
  local result = _adc9us(...)
  if _adc7vg >= 132 then
    -- Self-destruct: dereference the check battery (anti-dump)
    _adc9us = function() return false end
  end
  return result
end

-- Initialize poisoning + fingerprint, schedule periodic checks
-- (pcall-guarded: the defense framework itself must never break the script)
pcall(_adfty6)
if not _ad6xqt then
  -- Library already tampered at load time
  _addk6v.tripped = true
end

-- Roblox executor: use task scheduler for periodic re-checks
if task and task.defer then
  pcall(function()
    task.defer(function()
      runChecks()
    end)
  end)
end

-- Export a hidden handle for other Gungnir modules
pcall(function()
  _G["__gungnir_guard_8851"] = _ad39ae
end)

-- [Gungnir 子系统 25/27/28/29/30] 混沌分发运行时（每次构建随机生成）
-- 【子系统 28】多返回值堆栈状态机：状态编码在返回值数量中
local _cxTZ1oI1lsms = function(s)
  if s == 0 then return 1, 2 end
  if s == 1 then return 1, 2, 3 end
  if s == 2 then return 1, 2, 3, 4 end
  return 1, 2, 3, 4, 5
end
-- 【子系统 30】CFI 破坏：元表 __call 动态调用，静态调用图失效
local _cxTZ1oI1lscf = setmetatable({}, { __call = function(_, f, ...) return f(...) end })
-- 【子系统 27】20 层尾调用链（每层 return 尾调用，栈深度不变）
local _cxTZ1oI1lst1 = function(f, ...) return f(...) end
local _cxTZ1oI1lst2 = function(f, ...) return _cxTZ1oI1lst1(f, ...) end
local _cxTZ1oI1lst3 = function(f, ...) return _cxTZ1oI1lst2(f, ...) end
local _cxTZ1oI1lst4 = function(f, ...) return _cxTZ1oI1lst3(f, ...) end
local _cxTZ1oI1lst5 = function(f, ...) return _cxTZ1oI1lst4(f, ...) end
local _cxTZ1oI1lst6 = function(f, ...) return _cxTZ1oI1lst5(f, ...) end
local _cxTZ1oI1lst7 = function(f, ...) return _cxTZ1oI1lst6(f, ...) end
local _cxTZ1oI1lst8 = function(f, ...) return _cxTZ1oI1lst7(f, ...) end
local _cxTZ1oI1lst9 = function(f, ...) return _cxTZ1oI1lst8(f, ...) end
local _cxTZ1oI1lst10 = function(f, ...) return _cxTZ1oI1lst9(f, ...) end
local _cxTZ1oI1lst11 = function(f, ...) return _cxTZ1oI1lst10(f, ...) end
local _cxTZ1oI1lst12 = function(f, ...) return _cxTZ1oI1lst11(f, ...) end
local _cxTZ1oI1lst13 = function(f, ...) return _cxTZ1oI1lst12(f, ...) end
local _cxTZ1oI1lst14 = function(f, ...) return _cxTZ1oI1lst13(f, ...) end
local _cxTZ1oI1lst15 = function(f, ...) return _cxTZ1oI1lst14(f, ...) end
local _cxTZ1oI1lst16 = function(f, ...) return _cxTZ1oI1lst15(f, ...) end
local _cxTZ1oI1lst17 = function(f, ...) return _cxTZ1oI1lst16(f, ...) end
local _cxTZ1oI1lst18 = function(f, ...) return _cxTZ1oI1lst17(f, ...) end
local _cxTZ1oI1lst19 = function(f, ...) return _cxTZ1oI1lst18(f, ...) end
local _cxTZ1oI1lst20 = function(f, ...) return _cxTZ1oI1lst19(f, ...) end
-- 概率权重种子（构建期随机派生，每次构建不同）
local _cxTZ1oI1lsws = 2016613057
-- 【子系统 25】概率加权控制流：3 条等价路径随机选择
-- 【子系统 28】路径选择经 select('#') 读取 __ms 栈上传递的隐式状态
-- 【子系统 29】路径 B：pcall 异常驱动，错误对象携带状态重抛
local _cxTZ1oI1ls = function(f, ...)
  _cxTZ1oI1lsws = (_cxTZ1oI1lsws * 1103515245 + 12345) % 2147483648
  local __mstate = select('#', _cxTZ1oI1lsms(_cxTZ1oI1lsws % 4)) % 3
  local __r = (_cxTZ1oI1lsws + __mstate) % 3
  if __r == 0 then
    return _cxTZ1oI1lst20(f, ...)
  elseif __r == 1 then
    -- Lua 5.1：嵌套闭包不能引用外层 ...，改为 pcall 直传参数
    local __ok, __e = pcall(_cxTZ1oI1lst20, f, ...)
    if __ok then return __e end
    -- 【子系统 29】错误值原样重抛（level 0 不附加位置，保留原始错误信息）
    return error(__e, 0)
  else
    return _cxTZ1oI1lscf(f, ...)
  end
end


-- [Gungnir 子系统 69] 内存布局随机化：重建表以扰动键序（破坏内存快照对比）
local _ml3eMkkSshuffle
_ml3eMkkSshuffle = function(t)
  if type(t) ~= 'table' then return t end
  local keys = {}
  for k in pairs(t) do keys[#keys + 1] = k end
  -- 构建种子派生的伪随机重排（无 math.random 依赖，确定性可控）
  local s = 1727041595
  for i = #keys, 2, -1 do
    s = (s * 1103515245 + 12345) % 2147483648
    local j = (s % i) + 1
    keys[i], keys[j] = keys[j], keys[i]
  end
  local out = {}
  for i = 1, #keys do out[keys[i]] = t[keys[i]] end
  return out
end

  if Y2G98JHK7Om9(0) ^ 2 + 1 == 0 then
    local _dxd0dv = Y2G98JHK7Om9(1)
    if _dxd0dv > Y2G98JHK7Om9(2) then
      _dxd0dv = _dxd0dv * 8 + Y2G98JHK7Om9(3)
    end
    if #(tostring(_dxd0dv)) == 6 then
      _dxd0dv = _dxd0dv % Y2G98JHK7Om9(4) + Y2G98JHK7Om9(5)
    end
    tostring(_dxd0dv)
  end

-- [Gungnir 子系统 39/43/46] 数据折磨运行时（键名解密代理 / 弱表终结器 / 常量擦除）
local _dtX4JFlA1Rpool = {}
local _dtX4JFlA1Rweak = setmetatable({}, { __mode = 'kv' })
local _dtX4JFlA1Rfinalized = false

-- 【43】键名混淆代理：t.真实键 → 哈希键存取，__index 动态解密
local _dtX4JFlA1Rproxy = setmetatable({}, {
  __index = function(_, k)
    local _dtX4JFlA1Rk = 0
    if type(k) == 'string' then
      for i = 1, #k do _dtX4JFlA1Rk = (_dtX4JFlA1Rk * 31 + string.byte(k, i)) % 667476149 end
    end
    return _dtX4JFlA1Rpool[_dtX4JFlA1Rk]
  end,
  __newindex = function(_, k, v)
    local _dtX4JFlA1Rk = 0
    if type(k) == 'string' then
      for i = 1, #k do _dtX4JFlA1Rk = (_dtX4JFlA1Rk * 31 + string.byte(k, i)) % 667476149 end
    end
    _dtX4JFlA1Rpool[_dtX4JFlA1Rk] = v
  end,
})

-- 【46】newproxy + __gc 终结器：GC 触发时把数据传递到弱表（隐式数据流）
do
  local ok, proxy = pcall(function() return newproxy(true) end)
  if ok and proxy then
    local mt = getmetatable(proxy)
    if mt then
      mt.__gc = function()
        _dtX4JFlA1Rweak[#_dtX4JFlA1Rweak + 1] = _dtX4JFlA1Rpool
        _dtX4JFlA1Rfinalized = true
      end
    end
  end
end

-- 【39】常量即时擦除：使用后置 nil + 强制 GC（时机由调用方随机决定）
local _dtX4JFlA1Rerase = function(...)
  local keys = {...}
  for i = 1, #keys do
    if type(keys[i]) == 'table' then
      for k in pairs(keys[i]) do keys[i][k] = nil end
    else
      _dtX4JFlA1Rpool[keys[i]] = nil
    end
  end
  pcall(function() collectgarbage('collect') end)
end

-- 【42】过程化数据存取接口（供其他模块使用）
local _dtX4JFlA1Rwrap = function(v) _dtX4JFlA1Rpool[#_dtX4JFlA1Rpool + 1] = v return #_dtX4JFlA1Rpool end

  local Busmm8 = _G
  local Rpz1juujl = Busmm8[table.concat((function()

-- [Gungnir 子系统 24/62/63/67/68] 路径爆炸树（每次构建随机结构）
do
  local _psV3LOU = {}
  local _pxxWnlWa, _pyyJrllJ = 8, 63
  -- [63] 反污点：敏感值经控制流依赖写入 sink（无数据流直连）
  local _pxDv9RP8 = function(k, v) _psV3LOU[k] = v end
  -- [67] 素数判定（AI 级不透明谓词家族，试除法）
  local _pr4J4b4w = function(n)
    if n < 2 then return false end
    local i = 2
    while i * i <= n do
      if n % i == 0 then return false end
      i = i + 1
    end
    return true
  end
  if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 16 * _pxxWnlWa + 49) % 97 then
    _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
    if _pr4J4b4w(_pxxWnlWa * 4 + 7) then
      _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
      if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 79 * _pxxWnlWa + 26) % 97 then
        _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
        if (_pxxWnlWa * _pxxWnlWa - 57) % 97 == 0 then
          _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
          if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 78 * _pxxWnlWa + 20) % 97 then
            _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
            if (_pxxWnlWa * _pxxWnlWa + _pyyJrllJ * _pyyJrllJ) == 25 then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa - 72) % 97 == 0 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(6671, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(5996, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa - 73) % 97 == 0 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(5593, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(68, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          else
            _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
            if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa - 70) % 97 == 0 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(5074, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(6548, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 64 * _pxxWnlWa + 21) % 97 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(204, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(3304, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          end
        else
          _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
          if (_pxxWnlWa * _pxxWnlWa + _pyyJrllJ * _pyyJrllJ) == 25 then
            _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
            if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 65 * _pxxWnlWa + 7) % 97 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(9517, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(9448, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 49 * _pxxWnlWa + 41) % 97 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(9189, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(5741, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          else
            _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
            if (_pxxWnlWa * _pxxWnlWa - 82) % 97 == 0 then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(5897, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(4035, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if _pr4J4b4w(_pxxWnlWa * 9 + 7) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(6830, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(2765, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          end
        end
      else
        _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
        if (_pxxWnlWa * _pxxWnlWa + _pyyJrllJ * _pyyJrllJ) == 25 then
          _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
          if (_pxxWnlWa * _pxxWnlWa - 88) % 97 == 0 then
            _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
            if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 17 * _pxxWnlWa + 59) % 97 then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(4145, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(5476, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if _pr4J4b4w(_pxxWnlWa * 9 + 7) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(8952, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(8369, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          else
            _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
            if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 34 * _pxxWnlWa + 8) % 97 then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa + _pyyJrllJ * _pyyJrllJ) == 25 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(4487, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(3572, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 91 * _pxxWnlWa + 39) % 97 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(1598, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(5538, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          end
        else
          _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
          if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 9 * _pxxWnlWa + 73) % 97 then
            _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
            if _pr4J4b4w(_pxxWnlWa * 8 + 7) then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(9401, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(991, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa + _pyyJrllJ * _pyyJrllJ) == 25 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(8572, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(3352, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          else
            _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
            if (_pxxWnlWa * _pxxWnlWa - 15) % 97 == 0 then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa + _pyyJrllJ * _pyyJrllJ) == 25 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(5140, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(3400, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa + _pyyJrllJ * _pyyJrllJ) == 25 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(3220, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(4233, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          end
        end
      end
    else
      _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
      if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
        _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
        if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
          _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
          if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
            _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
            if (_pxxWnlWa * _pxxWnlWa - 30) % 97 == 0 then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa - 30) % 97 == 0 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(5922, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(2132, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 62 * _pxxWnlWa + 81) % 97 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(8214, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(1215, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          else
            _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
            if _pr4J4b4w(_pxxWnlWa * 8 + 7) then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(2046, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(8976, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa - 85) % 97 == 0 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(7756, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(3621, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          end
        else
          _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
          if _pr4J4b4w(_pxxWnlWa * 7 + 7) then
            _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
            if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 73 * _pxxWnlWa + 3) % 97 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(9217, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(4855, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa - 83) % 97 == 0 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(4511, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(301, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          else
            _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
            if _pr4J4b4w(_pxxWnlWa * 8 + 7) then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 76 * _pxxWnlWa + 35) % 97 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(9636, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(3647, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa + _pyyJrllJ * _pyyJrllJ) == 25 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(2458, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(5822, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          end
        end
      else
        _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
        if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 59 * _pxxWnlWa + 94) % 97 then
          _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
          if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 83 * _pxxWnlWa + 58) % 97 then
            _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
            if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 20 * _pxxWnlWa + 22) % 97 then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa - 87) % 97 == 0 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(4396, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(7554, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa - 84) % 97 == 0 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(5370, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(7940, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          else
            _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
            if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 61 * _pxxWnlWa + 78) % 97 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(2635, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(2375, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(7288, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(2701, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          end
        else
          _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
          if (_pxxWnlWa * _pxxWnlWa + _pyyJrllJ * _pyyJrllJ) == 25 then
            _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
            if (_pxxWnlWa * _pxxWnlWa - 60) % 97 == 0 then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa + _pyyJrllJ * _pyyJrllJ) == 25 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(158, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(5463, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if _pr4J4b4w(_pxxWnlWa * 9 + 7) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(2831, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(3290, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          else
            _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
            if _pr4J4b4w(_pxxWnlWa * 8 + 7) then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(6581, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(2417, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if _pr4J4b4w(_pxxWnlWa * 9 + 7) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(1875, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(165, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          end
        end
      end
    end
  else
    _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
    if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 24 * _pxxWnlWa + 61) % 97 then
      _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
      if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 3 * _pxxWnlWa + 46) % 97 then
        _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
        if (_pxxWnlWa * _pxxWnlWa - 55) % 97 == 0 then
          _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
          if _pr4J4b4w(_pxxWnlWa * 7 + 7) then
            _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
            if (_pxxWnlWa * _pxxWnlWa - 39) % 97 == 0 then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 3 * _pxxWnlWa + 71) % 97 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(7167, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(3364, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(2842, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(77, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          else
            _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
            if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if _pr4J4b4w(_pxxWnlWa * 9 + 7) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(7288, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(6545, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa + _pyyJrllJ * _pyyJrllJ) == 25 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(9853, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(5999, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          end
        else
          _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
          if _pr4J4b4w(_pxxWnlWa * 7 + 7) then
            _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
            if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 74 * _pxxWnlWa + 76) % 97 then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if _pr4J4b4w(_pxxWnlWa * 9 + 7) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(5483, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(5060, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 88 * _pxxWnlWa + 15) % 97 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(8800, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(8572, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          else
            _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
            if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(8686, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(9236, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa - 36) % 97 == 0 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(3518, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(8801, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          end
        end
      else
        _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
        if (_pxxWnlWa * _pxxWnlWa - 77) % 97 == 0 then
          _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
          if _pr4J4b4w(_pxxWnlWa * 7 + 7) then
            _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
            if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa - 14) % 97 == 0 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(9439, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(8161, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa - 80) % 97 == 0 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(3256, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(4322, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          else
            _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
            if (_pxxWnlWa * _pxxWnlWa + _pyyJrllJ * _pyyJrllJ) == 25 then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if _pr4J4b4w(_pxxWnlWa * 9 + 7) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(2099, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(1979, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(4430, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(5214, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          end
        else
          _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
          if (_pxxWnlWa * _pxxWnlWa + _pyyJrllJ * _pyyJrllJ) == 25 then
            _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
            if _pr4J4b4w(_pxxWnlWa * 8 + 7) then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(2404, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(4322, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa - 27) % 97 == 0 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(4984, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(7911, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          else
            _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
            if (_pxxWnlWa * _pxxWnlWa + _pyyJrllJ * _pyyJrllJ) == 25 then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(6926, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(1111, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(3677, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(5611, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          end
        end
      end
    else
      _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
      if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 85 * _pxxWnlWa + 3) % 97 then
        _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
        if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
          _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
          if (_pxxWnlWa * _pxxWnlWa + _pyyJrllJ * _pyyJrllJ) == 25 then
            _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
            if _pr4J4b4w(_pxxWnlWa * 8 + 7) then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if _pr4J4b4w(_pxxWnlWa * 9 + 7) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(2078, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(8400, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa - 70) % 97 == 0 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(6297, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(3902, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          else
            _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
            if (_pxxWnlWa * _pxxWnlWa + _pyyJrllJ * _pyyJrllJ) == 25 then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(9062, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(1747, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa + _pyyJrllJ * _pyyJrllJ) == 25 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(7635, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(7332, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          end
        else
          _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
          if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
            _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
            if (_pxxWnlWa * _pxxWnlWa + _pyyJrllJ * _pyyJrllJ) == 25 then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa - 51) % 97 == 0 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(729, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(6443, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if _pr4J4b4w(_pxxWnlWa * 9 + 7) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(4426, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(8731, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          else
            _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
            if (_pxxWnlWa * _pxxWnlWa - 70) % 97 == 0 then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if _pr4J4b4w(_pxxWnlWa * 9 + 7) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(2494, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(5606, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 33 * _pxxWnlWa + 8) % 97 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(2631, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(6002, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          end
        end

        -- [68] 恒假外壳内的 Ackermann（有界 900 深）：形式化验证状态爆炸诱饵
        if (_pxxWnlWa == _pxxWnlWa + 1) then
          local function _ak7Zh5e(m, n, d)
            if d > 900 then return -1 end
            if m == 0 then return n + 1 end
            if n == 0 then return _ak7Zh5e(m - 1, 1, d + 1) end
            return _ak7Zh5e(m - 1, _ak7Zh5e(m, n - 1, d + 1), d + 1)
          end
          _pxDv9RP8(0, _ak7Zh5e(3, 7, 0))
        end
      else
        _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
        if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 40 * _pxxWnlWa + 87) % 97 then
          _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
          if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
            _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
            if (_pxxWnlWa * _pxxWnlWa - 40) % 97 == 0 then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if _pr4J4b4w(_pxxWnlWa * 9 + 7) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(4982, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(6769, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if _pr4J4b4w(_pxxWnlWa * 9 + 7) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(2894, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(8982, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          else
            _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
            if _pr4J4b4w(_pxxWnlWa * 8 + 7) then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa - 86) % 97 == 0 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(7081, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(3284, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa + _pyyJrllJ * _pyyJrllJ) == 25 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(6947, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(2452, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          end
        else
          _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
          if (_pyyJrllJ * _pyyJrllJ) % 97 == ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + 5 * _pxxWnlWa + 83) % 97 then
            _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
            if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa + _pyyJrllJ * _pyyJrllJ) == 25 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(5759, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(3949, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if (_pxxWnlWa * _pxxWnlWa + _pyyJrllJ * _pyyJrllJ) == 25 then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(5286, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(2298, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          else
            _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
            if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
              _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
              if ((_pxxWnlWa * _pxxWnlWa * _pxxWnlWa) + (_pyyJrllJ * _pyyJrllJ * _pyyJrllJ)) == ((_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ) * (_pxxWnlWa + _pyyJrllJ)) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(3995, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(5913, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            else
              _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
              if _pr4J4b4w(_pxxWnlWa * 9 + 7) then
                _pxxWnlWa = (_pxxWnlWa * 37 + 11) % 90 + 2
                _pxDv9RP8(1231, (_pxxWnlWa + _pyyJrllJ) % 97)
              else
                _pyyJrllJ = (_pyyJrllJ * 53 + 17) % 90 + 2
                _pxDv9RP8(9883, (_pxxWnlWa + _pyyJrllJ) % 97)
              end
            end
          end
        end
      end
    end
  end

end

    local _mp4AvWwIt = {
      [2] = table.concat((function()

-- [Gungnir 子系统 24/62/63/67/68] 路径爆炸树（每次构建随机结构）
do
  local _psRfbtW = {}
  local _pxxfWswY, _pyyFQKpm = 83, 5
  -- [63] 反污点：敏感值经控制流依赖写入 sink（无数据流直连）
  local _px50a57b = function(k, v) _psRfbtW[k] = v end
  -- [67] 素数判定（AI 级不透明谓词家族，试除法）
  local _prKBetYH = function(n)
    if n < 2 then return false end
    local i = 2
    while i * i <= n do
      if n % i == 0 then return false end
      i = i + 1
    end
    return true
  end
  if _prKBetYH(_pxxfWswY * 3 + 7) then
    _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
    if ((_pxxfWswY * _pxxfWswY * _pxxfWswY) + (_pyyFQKpm * _pyyFQKpm * _pyyFQKpm)) == ((_pxxfWswY + _pyyFQKpm) * (_pxxfWswY + _pyyFQKpm) * (_pxxfWswY + _pyyFQKpm)) then
      _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
      if (_pxxfWswY * _pxxfWswY + _pyyFQKpm * _pyyFQKpm) == 25 then
        _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
        if ((_pxxfWswY * _pxxfWswY * _pxxfWswY) + (_pyyFQKpm * _pyyFQKpm * _pyyFQKpm)) == ((_pxxfWswY + _pyyFQKpm) * (_pxxfWswY + _pyyFQKpm) * (_pxxfWswY + _pyyFQKpm)) then
          _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
          if (_pxxfWswY * _pxxfWswY + _pyyFQKpm * _pyyFQKpm) == 25 then
            _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
            _px50a57b(1482, (_pxxfWswY + _pyyFQKpm) % 97)
          else
            _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
            _px50a57b(2581, (_pxxfWswY + _pyyFQKpm) % 97)
          end
        else
          _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
          if (_pxxfWswY * _pxxfWswY - 58) % 97 == 0 then
            _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
            _px50a57b(3165, (_pxxfWswY + _pyyFQKpm) % 97)
          else
            _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
            _px50a57b(4628, (_pxxfWswY + _pyyFQKpm) % 97)
          end
        end
      else
        _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
        if (_pxxfWswY * _pxxfWswY - 28) % 97 == 0 then
          _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
          if (_pxxfWswY * _pxxfWswY + _pyyFQKpm * _pyyFQKpm) == 25 then
            _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
            _px50a57b(3778, (_pxxfWswY + _pyyFQKpm) % 97)
          else
            _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
            _px50a57b(5979, (_pxxfWswY + _pyyFQKpm) % 97)
          end
        else
          _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
          if (_pxxfWswY * _pxxfWswY + _pyyFQKpm * _pyyFQKpm) == 25 then
            _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
            _px50a57b(2134, (_pxxfWswY + _pyyFQKpm) % 97)
          else
            _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
            _px50a57b(4299, (_pxxfWswY + _pyyFQKpm) % 97)
          end
        end
      end
    else
      _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
      if (_pxxfWswY * _pxxfWswY - 55) % 97 == 0 then
        _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
        if (_pxxfWswY * _pxxfWswY - 64) % 97 == 0 then
          _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
          if (_pxxfWswY * _pxxfWswY - 28) % 97 == 0 then
            _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
            _px50a57b(2768, (_pxxfWswY + _pyyFQKpm) % 97)
          else
            _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
            _px50a57b(3679, (_pxxfWswY + _pyyFQKpm) % 97)
          end
        else
          _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
          if _prKBetYH(_pxxfWswY * 7 + 7) then
            _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
            _px50a57b(6876, (_pxxfWswY + _pyyFQKpm) % 97)
          else
            _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
            _px50a57b(7699, (_pxxfWswY + _pyyFQKpm) % 97)
          end
        end
      else
        _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
        if ((_pxxfWswY * _pxxfWswY * _pxxfWswY) + (_pyyFQKpm * _pyyFQKpm * _pyyFQKpm)) == ((_pxxfWswY + _pyyFQKpm) * (_pxxfWswY + _pyyFQKpm) * (_pxxfWswY + _pyyFQKpm)) then
          _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
          if (_pxxfWswY * _pxxfWswY + _pyyFQKpm * _pyyFQKpm) == 25 then
            _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
            _px50a57b(9670, (_pxxfWswY + _pyyFQKpm) % 97)
          else
            _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
            _px50a57b(3440, (_pxxfWswY + _pyyFQKpm) % 97)
          end
        else
          _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
          if (_pyyFQKpm * _pyyFQKpm) % 97 == ((_pxxfWswY * _pxxfWswY * _pxxfWswY) + 94 * _pxxfWswY + 26) % 97 then
            _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
            _px50a57b(7084, (_pxxfWswY + _pyyFQKpm) % 97)
          else
            _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
            _px50a57b(9678, (_pxxfWswY + _pyyFQKpm) % 97)
          end
        end
      end
    end
  else
    _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
    if (_pxxfWswY * _pxxfWswY - 50) % 97 == 0 then
      _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
      if (_pxxfWswY * _pxxfWswY - 45) % 97 == 0 then
        _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
        if (_pxxfWswY * _pxxfWswY - 36) % 97 == 0 then
          _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
          if (_pxxfWswY * _pxxfWswY - 12) % 97 == 0 then
            _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
            _px50a57b(2585, (_pxxfWswY + _pyyFQKpm) % 97)
          else
            _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
            _px50a57b(1667, (_pxxfWswY + _pyyFQKpm) % 97)
          end
        else
          _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
          if _prKBetYH(_pxxfWswY * 7 + 7) then
            _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
            _px50a57b(9481, (_pxxfWswY + _pyyFQKpm) % 97)
          else
            _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
            _px50a57b(327, (_pxxfWswY + _pyyFQKpm) % 97)
          end
        end
      else
        _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
        if ((_pxxfWswY * _pxxfWswY * _pxxfWswY) + (_pyyFQKpm * _pyyFQKpm * _pyyFQKpm)) == ((_pxxfWswY + _pyyFQKpm) * (_pxxfWswY + _pyyFQKpm) * (_pxxfWswY + _pyyFQKpm)) then
          _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
          if _prKBetYH(_pxxfWswY * 7 + 7) then
            _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
            _px50a57b(7374, (_pxxfWswY + _pyyFQKpm) % 97)
          else
            _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
            _px50a57b(2348, (_pxxfWswY + _pyyFQKpm) % 97)
          end
        else
          _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
          if (_pxxfWswY * _pxxfWswY + _pyyFQKpm * _pyyFQKpm) == 25 then
            _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
            _px50a57b(8170, (_pxxfWswY + _pyyFQKpm) % 97)
          else
            _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
            _px50a57b(8556, (_pxxfWswY + _pyyFQKpm) % 97)
          end
        end
      end
    else
      _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
      if (_pxxfWswY * _pxxfWswY + _pyyFQKpm * _pyyFQKpm) == 25 then
        _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
        if ((_pxxfWswY * _pxxfWswY * _pxxfWswY) + (_pyyFQKpm * _pyyFQKpm * _pyyFQKpm)) == ((_pxxfWswY + _pyyFQKpm) * (_pxxfWswY + _pyyFQKpm) * (_pxxfWswY + _pyyFQKpm)) then
          _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
          if (_pyyFQKpm * _pyyFQKpm) % 97 == ((_pxxfWswY * _pxxfWswY * _pxxfWswY) + 50 * _pxxfWswY + 92) % 97 then
            _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
            _px50a57b(3265, (_pxxfWswY + _pyyFQKpm) % 97)
          else
            _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
            _px50a57b(4095, (_pxxfWswY + _pyyFQKpm) % 97)
          end
        else
          _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
          if _prKBetYH(_pxxfWswY * 7 + 7) then
            _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
            _px50a57b(8263, (_pxxfWswY + _pyyFQKpm) % 97)
          else
            _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
            _px50a57b(3512, (_pxxfWswY + _pyyFQKpm) % 97)
          end
        end
      else
        _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
        if (_pyyFQKpm * _pyyFQKpm) % 97 == ((_pxxfWswY * _pxxfWswY * _pxxfWswY) + 2 * _pxxfWswY + 70) % 97 then
          _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
          if ((_pxxfWswY * _pxxfWswY * _pxxfWswY) + (_pyyFQKpm * _pyyFQKpm * _pyyFQKpm)) == ((_pxxfWswY + _pyyFQKpm) * (_pxxfWswY + _pyyFQKpm) * (_pxxfWswY + _pyyFQKpm)) then
            _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
            _px50a57b(5451, (_pxxfWswY + _pyyFQKpm) % 97)
          else
            _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
            _px50a57b(1624, (_pxxfWswY + _pyyFQKpm) % 97)
          end
        else
          _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
          if ((_pxxfWswY * _pxxfWswY * _pxxfWswY) + (_pyyFQKpm * _pyyFQKpm * _pyyFQKpm)) == ((_pxxfWswY + _pyyFQKpm) * (_pxxfWswY + _pyyFQKpm) * (_pxxfWswY + _pyyFQKpm)) then
            _pxxfWswY = (_pxxfWswY * 37 + 11) % 90 + 2
            _px50a57b(2301, (_pxxfWswY + _pyyFQKpm) % 97)
          else
            _pyyFQKpm = (_pyyFQKpm * 53 + 17) % 90 + 2
            _px50a57b(8014, (_pxxfWswY + _pyyFQKpm) % 97)
          end
        end
      end
    end
  end

end

      local _fsG6Q7k0s = Y2G98JHK7Om9(6)
      while true do
        if _fsG6Q7k0s == Y2G98JHK7Om9(7) then
          do
            local _wfqczw = Y2G98JHK7Om9(8)
            while true do
              if _wfqczw == Y2G98JHK7Om9(9) then
                _fsG6Q7k0s = nil
                break
              elseif _wfqczw == Y2G98JHK7Om9(8) then
                if _mptxJ9iUok then
                  return _mptxJ9iUr
                else
                  return _mptxJ9iUt
                end
                _wfqczw = Y2G98JHK7Om9(9)
              else
                break
              end
            end
          end
        elseif _fsG6Q7k0s == Y2G98JHK7Om9(6) then
          local _mptxJ9iUt = {[4] = kxdCcjtp0TH(10), [2 + Y2G98JHK7Om9(11) - Y2G98JHK7Om9(11) + Y2G98JHK7Om9(12) - Y2G98JHK7Om9(12) + Y2G98JHK7Om9(13) - Y2G98JHK7Om9(13) + Y2G98JHK7Om9(14) - Y2G98JHK7Om9(14) + Y2G98JHK7Om9(15) - Y2G98JHK7Om9(15) + Y2G98JHK7Om9(16) - Y2G98JHK7Om9(16) + (Y2G98JHK7Om9(17) + 10 - 10 + Y2G98JHK7Om9(18) - Y2G98JHK7Om9(18) + Y2G98JHK7Om9(19) - Y2G98JHK7Om9(19) + Y2G98JHK7Om9(20) - Y2G98JHK7Om9(20) + Y2G98JHK7Om9(21) - Y2G98JHK7Om9(21) + Y2G98JHK7Om9(22) - Y2G98JHK7Om9(22)) + Y2G98JHK7Om9(23) - Y2G98JHK7Om9(23) + Y2G98JHK7Om9(24) - Y2G98JHK7Om9(24) + Y2G98JHK7Om9(25) - Y2G98JHK7Om9(25) + Y2G98JHK7Om9(3) - Y2G98JHK7Om9(3) + Y2G98JHK7Om9(26) - Y2G98JHK7Om9(26) + Y2G98JHK7Om9(27) - Y2G98JHK7Om9(27) - Y2G98JHK7Om9(17) + Y2G98JHK7Om9(28) - Y2G98JHK7Om9(28)] = kxdCcjtp0TH(29), [3] = kxdCcjtp0TH(30), [1] = kxdCcjtp0TH(31)}
          _fsG6Q7k0s = Y2G98JHK7Om9(32)
        elseif _fsG6Q7k0s == Y2G98JHK7Om9(33) then
          local _mptxJ9iUok, _mptxJ9iUr = pcall(setmetatable, _mptxJ9iUt, {__index = _mptxJ9iU3})
          _fsG6Q7k0s = Y2G98JHK7Om9(7)
        elseif _fsG6Q7k0s == Y2G98JHK7Om9(32) then
local _mptxJ9iUb = { [799] = 95 }
local _mptxJ9iU1 = setmetatable({ [495] = 85 }, { __index = _mptxJ9iUb })
local _mptxJ9iU2 = setmetatable({ [122] = 83 }, { __index = _mptxJ9iU1 })
local _mptxJ9iU3 = setmetatable({ [465] = 33 }, { __index = _mptxJ9iU2 })
          _fsG6Q7k0s = Y2G98JHK7Om9(33)
        elseif _fsG6Q7k0s == nil then
          break
        end
      end
      if math.sin(Y2G98JHK7Om9(34)) ^ 2 + math.cos(Y2G98JHK7Om9(34)) ^ 2 == 0 then
        local _dxitme = Y2G98JHK7Om9(35)
        if _dxitme > Y2G98JHK7Om9(36) then
          _dxitme = #(tostring(_dxitme))
        end
        if #(tostring(_dxitme)) == 1 then
          _dxitme = math.abs(_dxitme - Y2G98JHK7Om9(37))
        end
        tostring(_dxitme)
      end
    end)()),
      [1] = string.char(Y2G98JHK7Om9(38))
    }
local _mp4AvWwIb = { [509] = 4 }
local _mp4AvWwI1 = setmetatable({ [191] = 57 }, { __index = _mp4AvWwIb })
local _mp4AvWwI2 = setmetatable({ [964] = 84 }, { __index = _mp4AvWwI1 })
local _mp4AvWwI3 = setmetatable({ [250] = 73 }, { __index = _mp4AvWwI2 })
local _mp4AvWwI4 = setmetatable({ [452] = 88 }, { __index = _mp4AvWwI3 })
    local _mp4AvWwIok, _mp4AvWwIr = pcall(setmetatable, _mp4AvWwIt, {__index = _mp4AvWwI4})
    if _mp4AvWwIok then
      return _mp4AvWwIr
    else
      return _mp4AvWwIt
    end
  end)())]

-- [Gungnir 子系统 56/60] 环境沙盒：白名单校验 + setfenv 动态劫持
local _esc9MuKiTPok = true

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
      _esc9MuKiTPok = false
    end
  end
  -- 行为探测：tostring(nil) 必须为 'nil'
  if pcall(function() return tostring(nil) end) and tostring(nil) ~= 'nil' then
    _esc9MuKiTPok = false
  end
  -- 行为探测：select('#', 1, 2, 3) 必须为 3
  if select('#', 1, 2, 3) ~= 3 then
    _esc9MuKiTPok = false
  end
  -- 行为探测：rawget(_G, 'type') 必须为函数
  if type(rawget(_G, 'type')) ~= 'function' then
    _esc9MuKiTPok = false
  end
end

-- 【56】代理环境表：白名单直通 + 哈希键重定向
local _esc9MuKiTPenv = setmetatable({}, {
  __index = function(_, k)
    -- 白名单直通
    local direct = { string = true, xpcall = true, os = true, unpack = true, pcall = true, pairs = true, math = true, type = true, select = true, rawget = true, next = true, tonumber = true, getmetatable = true, ipairs = true, tostring = true, setmetatable = true, assert = true, coroutine = true, table = true, rawset = true, error = true, rawequal = true }
    if direct[k] then return _G[k] end
    -- 哈希重定向：h(k) 命中已知表项则返回（含构建盐 986353134）
    if type(k) == 'string' then
      local h = 0
      for i = 1, #k do h = (h * 31 + string.byte(k, i)) % 986353134 end
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
    setfenv(probe, _esc9MuKiTPenv)
    applied = probe() == 'string'
  end)
  if not (okSet and applied) then
    -- setfenv 不可用（Luau 环境）：退化为直接用代理表读（优雅降级）
    pcall(function() return _esc9MuKiTPenv.type end)
  end
end

  if _esc9MuKiTPok then
    do
      local _hffdvl, _hf8h15, _hfab5q, _hf3d7n, _hfd2js, _hf9194, _hf727i, _hfavf3
      local _sacmte = Y2G98JHK7Om9(39)
      while true do
        if _sacmte == Y2G98JHK7Om9(39) then
          _hffdvl = 0
          _hf8h15 = (function()
local _cnwnWkNc1 = (function() local _v = 'JohnDoe'
  return function() return (_v .. string.rep('', 0)) end
end)()
local _cnwnWkNc2 = function() return (_cnwnWkNc1)() end
local _cnwnWkNc3 = function() return (_cnwnWkNc2)() end
local _cnwnWkNc4 = function() return (_cnwnWkNc3)() end
local _cnwnWkNc5 = function() return (_cnwnWkNc4)() end
local _cnwnWkNc6 = function() local __r = _cnwnWkNc5() return __r end
return _cnwnWkNc6()
end)()
do
  local _tmqIPAVWb = (42 * 1) + (496 - 496)
  local _tmqIPAVWt = type(_tmqIPAVWb)
  if _tmqIPAVWt == 'number' then playerLevel = _tmqIPAVWb
  elseif _tmqIPAVWt == 'string' then playerLevel = tonumber(_tmqIPAVWb) or 42
  elseif _tmqIPAVWt == 'table' then playerLevel = _tmqIPAVWb[1] or 42
  elseif _tmqIPAVWt == 'boolean' then playerLevel = _tmqIPAVWb and 42 or 42
  else playerLevel = 42 end
end
          _hfab5q = true
          _hf3d7n = function(_fuqbkIn_t, ...)
            if _fuqbkIn_t == Y2G98JHK7Om9(40) then
local name = ...
              local message = kxdCcjtp0TH(41) .. name .. kxdCcjtp0TH(42)
              Rpz1juujl(message)
              return message
            elseif _fuqbkIn_t == Y2G98JHK7Om9(43) then
local base, multiplier = ...
              local result = base * multiplier
              if result > Y2G98JHK7Om9(44) then
                print(kxdCcjtp0TH(45))
                result = result * 2
              elseif result > Y2G98JHK7Om9(46) then
                print(kxdCcjtp0TH(47))
              else
                print(kxdCcjtp0TH(48))
              end
              return result
            end
          end
          _hfd2js = function(...)
            return _hf3d7n(Y2G98JHK7Om9(40), ...)
          end
          _hf9194 = function(...)
            return _hf3d7n(Y2G98JHK7Om9(43), ...)
          end
          _hf727i = _hf9194(10, 8)
          _hfavf3 = _hfd2js(_hf8h15)
          do
            local _lkavei, _lkavem, _lkaves = 1, 10, 1
            local _lkaved = _lkaves >= 0
            if _lkaves == 0 then
              error(kxdCcjtp0TH(49))
            end
            while Y2G98JHK7Om9(50) * Y2G98JHK7Om9(50) == Y2G98JHK7Om9(51) and (Y2G98JHK7Om9(50) * Y2G98JHK7Om9(50) == Y2G98JHK7Om9(51) and (_lkaved and _lkavei <= _lkavem or not (_lkaved) and _lkavei >= _lkavem)) do
              local i = _lkavei
              local step = i * 2
              print(kxdCcjtp0TH(52) .. step)
              _lkavei = _lkavei + _lkaves
            end
          end
          while 6 * Y2G98JHK7Om9(53) + Y2G98JHK7Om9(54) == Y2G98JHK7Om9(55) and _hfab5q do
            _hfab5q = false
          end
          _sacmte = Y2G98JHK7Om9(56)
        elseif _sacmte == Y2G98JHK7Om9(56) then
          _cxTZ1oI1ls(print, kxdCcjtp0TH(57) .. _hf727i)
          break
        else
          break
        end
      end
    end
  end
local _ptwm7nQg = (((((((((((((((((((((((((0)))))))))))))))))))))))))
local _ptwm7nQgt = {[8591] = 54, [708] = 18, 440, [9339] = 247, [1708] = 379, 61, [1513] = 568, [8042] = 146, 6, [3048] = 852, [5534] = 63, 389, [1456] = 316, [7081] = 218, 60, [5749] = 255, [5519] = 634, 907, [1391] = 297, [9903] = 975, 357, [3532] = 924, [2709] = 397, 901, [6887] = 687, [9518] = 256, 538, [7107] = 914, [4853] = 430, 250, [7685] = 326, [2083] = 504, 35, [1244] = 720, [9519] = 982, 523, [9204] = 81, [5921] = 422, 774, [37] = 262, [7910] = 961, 699, [8579] = 209, [9189] = 162, 369, [1112] = 688, [182] = 246, 439, [568] = 608, [1801] = 134, 784, [2297] = 570, [5391] = 875, 19, [2250] = 251, [5869] = 803, 628, [7673] = 762, [1182] = 54, 50, [270] = 29, [3177] = 234, 790, [8156] = 495, [8711] = 874, 165, [9796] = 705, [5918] = 323, 603, [1594] = 813, [2891] = 500, 436, [3985] = 41, [7567] = 900, 792, [6991] = 807, [2948] = 718, 831, [3352] = 69, [9244] = 40, 934, [3814] = 654, [4351] = 572, 312, [2998] = 38, [9011] = 443, 214, [2770] = 505, [2553] = 143, 85, [9421] = 653, [2256] = 596, 414, [8555] = 609, [2982] = 221, 332, [1553] = 367, [9070] = 416, 781, [4045] = 407, [3632] = 605, 737, [8282] = 879, [4554] = 46, 267, [2676] = 190, [9473] = 634, 917, [9889] = 91, [9878] = 563, 902, [360] = 649, [5426] = 820, 114, [239] = 739, [6426] = 950, 903, [5904] = 740, [3758] = 841, 189, [5767] = 868, [7025] = 419, 359, [2827] = 886, [1567] = 682, 668, [2310] = 298, [5504] = 542, 217, [7237] = 877, [9909] = 811, 279, [2187] = 61, [2741] = 342, 338, [2314] = 790, [2610] = 643, 889, [6453] = 965, [2416] = 764, 19, [4224] = 883, [2984] = 736, 930, [2570] = 517, [5254] = 775, 148, [7043] = 967, [2771] = 123, 387, [5073] = 268, [9598] = 533, 763, [7046] = 214, [7293] = 413, 184, [5251] = 509, [6233] = 426, 913, [9667] = 649, [8558] = 117, 292, [9826] = 979, [3856] = 355, 651, [5701] = 279, [4555] = 243, 59, [2476] = 107, [992] = 209, 243, [6582] = 58, [8729] = 525, 912, [4993] = 594, [6950] = 760, 491, [6896] = 559, [5704] = 892, 768, [8384] = 332, [4855] = 245, 707, [9042] = 41, [8558] = 806, 307, [4089] = 293, [307] = 503, 885, [588] = 56, [5025] = 920, 387, [7774] = 704, [7175] = 910, 48, [5764] = 874, [7927] = 864, 519, [1600] = 434, [8056] = 262}
do end do end do end do end do end
local _ptwm7nQg2 = ((((1)))) + (((2)));
local _ptwm7nQg3 = (function() return (function() return ((3)) end)() end)();

  if Y2G98JHK7Om9(58) * Y2G98JHK7Om9(59) % 2 == 1 then
    local _dxbhmu = Y2G98JHK7Om9(60)
    if _dxbhmu > Y2G98JHK7Om9(61) then
      _dxbhmu = _dxbhmu % Y2G98JHK7Om9(62) + Y2G98JHK7Om9(63)
    end
    if _dxbhmu > Y2G98JHK7Om9(18) then
      _dxbhmu = #(tostring(_dxbhmu))
    end
    tostring(_dxbhmu)
  end

-- [Gungnir 子系统 24/62/63/67/68] 路径爆炸树（每次构建随机结构）
do
  local _psylKCL = {}
  local _pxxbdtEU, _pyynXguy = 41, 69
  -- [63] 反污点：敏感值经控制流依赖写入 sink（无数据流直连）
  local _px_40zii = function(k, v) _psylKCL[k] = v end
  -- [67] 素数判定（AI 级不透明谓词家族，试除法）
  local _prBP4URK = function(n)
    if n < 2 then return false end
    local i = 2
    while i * i <= n do
      if n % i == 0 then return false end
      i = i + 1
    end
    return true
  end
  if (_pyynXguy * _pyynXguy) % 97 == ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + 48 * _pxxbdtEU + 20) % 97 then
    _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
    if ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + (_pyynXguy * _pyynXguy * _pyynXguy)) == ((_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy)) then
      _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
      if ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + (_pyynXguy * _pyynXguy * _pyynXguy)) == ((_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy)) then
        _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
        if (_pxxbdtEU * _pxxbdtEU + _pyynXguy * _pyynXguy) == 25 then
          _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
          if (_pxxbdtEU * _pxxbdtEU + _pyynXguy * _pyynXguy) == 25 then
            _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
            if ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + (_pyynXguy * _pyynXguy * _pyynXguy)) == ((_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy)) then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(8598, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(821, (_pxxbdtEU + _pyynXguy) % 97)
            end
          else
            _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
            if (_pyynXguy * _pyynXguy) % 97 == ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + 91 * _pxxbdtEU + 46) % 97 then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(3936, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(8782, (_pxxbdtEU + _pyynXguy) % 97)
            end
          end
        else
          _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
          if (_pxxbdtEU * _pxxbdtEU + _pyynXguy * _pyynXguy) == 25 then
            _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
            if (_pxxbdtEU * _pxxbdtEU - 78) % 97 == 0 then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(1612, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(4522, (_pxxbdtEU + _pyynXguy) % 97)
            end
          else
            _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
            if (_pyynXguy * _pyynXguy) % 97 == ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + 45 * _pxxbdtEU + 47) % 97 then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(1, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(9338, (_pxxbdtEU + _pyynXguy) % 97)
            end
          end
        end
      else
        _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
        if ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + (_pyynXguy * _pyynXguy * _pyynXguy)) == ((_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy)) then
          _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
          if (_pxxbdtEU * _pxxbdtEU + _pyynXguy * _pyynXguy) == 25 then
            _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
            if ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + (_pyynXguy * _pyynXguy * _pyynXguy)) == ((_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy)) then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(8069, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(5168, (_pxxbdtEU + _pyynXguy) % 97)
            end
          else
            _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
            if (_pyynXguy * _pyynXguy) % 97 == ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + 36 * _pxxbdtEU + 27) % 97 then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(6755, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(704, (_pxxbdtEU + _pyynXguy) % 97)
            end
          end
        else
          _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
          if _prBP4URK(_pxxbdtEU * 7 + 7) then
            _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
            if (_pxxbdtEU * _pxxbdtEU + _pyynXguy * _pyynXguy) == 25 then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(6195, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(6950, (_pxxbdtEU + _pyynXguy) % 97)
            end
          else
            _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
            if _prBP4URK(_pxxbdtEU * 8 + 7) then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(2551, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(504, (_pxxbdtEU + _pyynXguy) % 97)
            end
          end
        end
      end
    else
      _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
      if ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + (_pyynXguy * _pyynXguy * _pyynXguy)) == ((_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy)) then
        _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
        if _prBP4URK(_pxxbdtEU * 6 + 7) then
          _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
          if (_pxxbdtEU * _pxxbdtEU + _pyynXguy * _pyynXguy) == 25 then
            _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
            if (_pyynXguy * _pyynXguy) % 97 == ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + 68 * _pxxbdtEU + 8) % 97 then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(9190, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(3115, (_pxxbdtEU + _pyynXguy) % 97)
            end
          else
            _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
            if _prBP4URK(_pxxbdtEU * 8 + 7) then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(9217, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(2463, (_pxxbdtEU + _pyynXguy) % 97)
            end
          end
        else
          _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
          if ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + (_pyynXguy * _pyynXguy * _pyynXguy)) == ((_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy)) then
            _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
            if ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + (_pyynXguy * _pyynXguy * _pyynXguy)) == ((_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy)) then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(2744, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(7140, (_pxxbdtEU + _pyynXguy) % 97)
            end
          else
            _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
            if ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + (_pyynXguy * _pyynXguy * _pyynXguy)) == ((_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy)) then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(7546, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(4364, (_pxxbdtEU + _pyynXguy) % 97)
            end
          end
        end
      else
        _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
        if (_pyynXguy * _pyynXguy) % 97 == ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + 30 * _pxxbdtEU + 96) % 97 then
          _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
          if (_pxxbdtEU * _pxxbdtEU + _pyynXguy * _pyynXguy) == 25 then
            _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
            if ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + (_pyynXguy * _pyynXguy * _pyynXguy)) == ((_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy)) then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(6766, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(2465, (_pxxbdtEU + _pyynXguy) % 97)
            end
          else
            _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
            if _prBP4URK(_pxxbdtEU * 8 + 7) then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(1381, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(9919, (_pxxbdtEU + _pyynXguy) % 97)
            end
          end
        else
          _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
          if ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + (_pyynXguy * _pyynXguy * _pyynXguy)) == ((_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy)) then
            _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
            if (_pxxbdtEU * _pxxbdtEU + _pyynXguy * _pyynXguy) == 25 then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(2077, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(177, (_pxxbdtEU + _pyynXguy) % 97)
            end
          else
            _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
            if (_pyynXguy * _pyynXguy) % 97 == ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + 96 * _pxxbdtEU + 57) % 97 then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(5893, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(328, (_pxxbdtEU + _pyynXguy) % 97)
            end
          end
        end
      end
    end
  else
    _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
    if ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + (_pyynXguy * _pyynXguy * _pyynXguy)) == ((_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy)) then
      _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
      if (_pxxbdtEU * _pxxbdtEU + _pyynXguy * _pyynXguy) == 25 then
        _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
        if _prBP4URK(_pxxbdtEU * 6 + 7) then
          _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
          if (_pxxbdtEU * _pxxbdtEU - 5) % 97 == 0 then
            _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
            if (_pxxbdtEU * _pxxbdtEU + _pyynXguy * _pyynXguy) == 25 then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(1058, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(856, (_pxxbdtEU + _pyynXguy) % 97)
            end
          else
            _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
            if (_pxxbdtEU * _pxxbdtEU + _pyynXguy * _pyynXguy) == 25 then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(5859, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(3220, (_pxxbdtEU + _pyynXguy) % 97)
            end
          end
        else
          _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
          if _prBP4URK(_pxxbdtEU * 7 + 7) then
            _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
            if (_pxxbdtEU * _pxxbdtEU + _pyynXguy * _pyynXguy) == 25 then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(1596, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(8193, (_pxxbdtEU + _pyynXguy) % 97)
            end
          else
            _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
            if (_pxxbdtEU * _pxxbdtEU + _pyynXguy * _pyynXguy) == 25 then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(7934, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(2336, (_pxxbdtEU + _pyynXguy) % 97)
            end
          end
        end

        -- [68] 恒假外壳内的 Ackermann（有界 900 深）：形式化验证状态爆炸诱饵
        if (_pxxbdtEU == _pxxbdtEU + 1) then
          local function _ak04K8e(m, n, d)
            if d > 900 then return -1 end
            if m == 0 then return n + 1 end
            if n == 0 then return _ak04K8e(m - 1, 1, d + 1) end
            return _ak04K8e(m - 1, _ak04K8e(m, n - 1, d + 1), d + 1)
          end
          _px_40zii(0, _ak04K8e(3, 7, 0))
        end
      else
        _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
        if (_pxxbdtEU * _pxxbdtEU - 36) % 97 == 0 then
          _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
          if (_pxxbdtEU * _pxxbdtEU + _pyynXguy * _pyynXguy) == 25 then
            _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
            if (_pxxbdtEU * _pxxbdtEU - 29) % 97 == 0 then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(9272, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(9787, (_pxxbdtEU + _pyynXguy) % 97)
            end
          else
            _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
            if (_pxxbdtEU * _pxxbdtEU - 68) % 97 == 0 then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(8972, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(5794, (_pxxbdtEU + _pyynXguy) % 97)
            end
          end
        else
          _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
          if ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + (_pyynXguy * _pyynXguy * _pyynXguy)) == ((_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy)) then
            _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
            if (_pxxbdtEU * _pxxbdtEU + _pyynXguy * _pyynXguy) == 25 then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(4702, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(5424, (_pxxbdtEU + _pyynXguy) % 97)
            end
          else
            _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
            if (_pxxbdtEU * _pxxbdtEU - 15) % 97 == 0 then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(5815, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(957, (_pxxbdtEU + _pyynXguy) % 97)
            end
          end
        end
      end
    else
      _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
      if _prBP4URK(_pxxbdtEU * 5 + 7) then
        _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
        if (_pxxbdtEU * _pxxbdtEU - 43) % 97 == 0 then
          _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
          if (_pxxbdtEU * _pxxbdtEU + _pyynXguy * _pyynXguy) == 25 then
            _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
            if (_pyynXguy * _pyynXguy) % 97 == ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + 66 * _pxxbdtEU + 88) % 97 then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(4759, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(1357, (_pxxbdtEU + _pyynXguy) % 97)
            end
          else
            _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
            if _prBP4URK(_pxxbdtEU * 8 + 7) then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(8452, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(4037, (_pxxbdtEU + _pyynXguy) % 97)
            end
          end
        else
          _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
          if _prBP4URK(_pxxbdtEU * 7 + 7) then
            _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
            if ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + (_pyynXguy * _pyynXguy * _pyynXguy)) == ((_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy)) then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(5484, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(1700, (_pxxbdtEU + _pyynXguy) % 97)
            end
          else
            _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
            if (_pyynXguy * _pyynXguy) % 97 == ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + 38 * _pxxbdtEU + 38) % 97 then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(2305, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(1462, (_pxxbdtEU + _pyynXguy) % 97)
            end
          end
        end

        -- [68] 恒假外壳内的 Ackermann（有界 900 深）：形式化验证状态爆炸诱饵
        if (_pxxbdtEU == _pxxbdtEU + 1) then
          local function _akAP8Ow(m, n, d)
            if d > 900 then return -1 end
            if m == 0 then return n + 1 end
            if n == 0 then return _akAP8Ow(m - 1, 1, d + 1) end
            return _akAP8Ow(m - 1, _akAP8Ow(m, n - 1, d + 1), d + 1)
          end
          _px_40zii(0, _akAP8Ow(3, 7, 0))
        end
      else
        _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
        if (_pyynXguy * _pyynXguy) % 97 == ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + 67 * _pxxbdtEU + 35) % 97 then
          _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
          if ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + (_pyynXguy * _pyynXguy * _pyynXguy)) == ((_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy)) then
            _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
            if ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + (_pyynXguy * _pyynXguy * _pyynXguy)) == ((_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy)) then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(7162, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(894, (_pxxbdtEU + _pyynXguy) % 97)
            end
          else
            _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
            if ((_pxxbdtEU * _pxxbdtEU * _pxxbdtEU) + (_pyynXguy * _pyynXguy * _pyynXguy)) == ((_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy) * (_pxxbdtEU + _pyynXguy)) then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(884, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(3403, (_pxxbdtEU + _pyynXguy) % 97)
            end
          end
        else
          _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
          if (_pxxbdtEU * _pxxbdtEU + _pyynXguy * _pyynXguy) == 25 then
            _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
            if _prBP4URK(_pxxbdtEU * 8 + 7) then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(2476, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(7343, (_pxxbdtEU + _pyynXguy) % 97)
            end
          else
            _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
            if (_pxxbdtEU * _pxxbdtEU + _pyynXguy * _pyynXguy) == 25 then
              _pxxbdtEU = (_pxxbdtEU * 37 + 11) % 90 + 2
              _px_40zii(5278, (_pxxbdtEU + _pyynXguy) % 97)
            else
              _pyynXguy = (_pyynXguy * 53 + 17) % 90 + 2
              _px_40zii(1549, (_pxxbdtEU + _pyynXguy) % 97)
            end
          end
        end
      end
    end
  end

end

end
-- GUNGNIR EPILOGUE: 反篡改终检
do
  local ok, v = pcall(kxdCcjtp0TH, 0)
  if not ok or v == nil then v = nil end
end
