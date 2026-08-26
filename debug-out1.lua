--[[​﻿​​﻿‍‍‌‍‍‍​‍﻿‍﻿‌‌​‌​‌‌​‍​​​‍‍‌﻿]]
-- GUNGNIR-ABSOLUTE GX-VM RUNTIME (polymorphic build)
-- [2/4/5/6/7/8/9/10/11/12/13/26/60/66/70/71/72/73/74/75/76/77/78/79/81/83/85/86/87/88/89]
local F6ld8Buf6o, oyj9GKTxOr, lx7cqBJDK0Ff, PB4xW496uH0
do
local xJsRki2ip6Sk = {}
local GmAetGi1zd1eK = nil
local hRPsY01bE_5e = {}
local QLodK67QdUqyC = {}
local IQW4ke239BS = {}
local aEn2GFZWkIZ = {}
local SHBeZp6GI1 = 0
local Mbgwk2EV8KYs = false
local uxnx9cj9TMy = 0
local PRcqCAdqsh = (3983)
local GqqGIAllCf = (4063)
local ih5XbDlCHR4G = (62431)
local lq53QrmSIrG_ = ((46539+21)-21)
local j2b4QsP5jFomx = (64)
local lbjB26fVelKJd = 0
local mo9iEKMjMAnq0 = 0

-- [子系统 1] 种子 16 片段闭包重组（散布存储，运行时校验）
local dlSND6sYZpD = {}
dlSND6sYZpD[1] = function(...) return ((2049552241+60)-60) end
dlSND6sYZpD[2] = function(...) return (1941629126) end
dlSND6sYZpD[3] = function(...) return (1212700079) end
dlSND6sYZpD[4] = function(...) return (2014965872) end
dlSND6sYZpD[5] = function(...) return (931397548) end
dlSND6sYZpD[6] = function(...) return (1851119725) end
dlSND6sYZpD[7] = function(...) return (1156887150) end
dlSND6sYZpD[8] = function(...) return (2108587358) end
dlSND6sYZpD[9] = function(...) return (1182677027) end
dlSND6sYZpD[10] = function(...) return (440943387) end
dlSND6sYZpD[11] = function(...) return ((1399772047+66)-66) end
dlSND6sYZpD[12] = function(...) return (((42550700*19))/19) end
dlSND6sYZpD[13] = function(...) return (471232119) end
dlSND6sYZpD[14] = function(...) return (480965452) end
dlSND6sYZpD[15] = function(...) return (308705810) end
dlSND6sYZpD[16] = function(...) return (1655166873) end
local fEV5Aut76TB9 = (492528930)
local vuD2eH5yKkw = (2147483647)
local KQ50ygzZukt3X = 0
for bYsf8eqP8Jddt = 1, 16 do
  KQ50ygzZukt3X = (KQ50ygzZukt3X * fEV5Aut76TB9 + dlSND6sYZpD[bYsf8eqP8Jddt]()) % vuD2eH5yKkw
end
local RMJYIvfwASO = (1159214447)
if KQ50ygzZukt3X ~= RMJYIvfwASO then SHBeZp6GI1 = SHBeZp6GI1 + 1 end

-- [子系统 11] 构建指纹 8 处嵌入（防嫁接）
local MuPvb9oQrrwKs = {}
MuPvb9oQrrwKs[1] = (function() return (1982511596) end)()
MuPvb9oQrrwKs[2] = (function() return (879585499) end)()
MuPvb9oQrrwKs[3] = (function() return (462577733) end)()
MuPvb9oQrrwKs[4] = (function() return (1819641288) end)()
MuPvb9oQrrwKs[5] = (function() return (784694588) end)()
MuPvb9oQrrwKs[6] = (function() return ((1759814709+78)-78) end)()
MuPvb9oQrrwKs[7] = (function() return ((500532808+38)-38) end)()
MuPvb9oQrrwKs[8] = (function() return ((1403135832+5)-5) end)()
local zX8wTkbTIX = (((31*17))/17)
local yfLJvr9vSWpe = 0
for bYsf8eqP8Jddt = 1, 8 do yfLJvr9vSWpe = (yfLJvr9vSWpe * zX8wTkbTIX + MuPvb9oQrrwKs[bYsf8eqP8Jddt]) % vuD2eH5yKkw end
local cP256T0DNWJr4 = (955036336)
if (yfLJvr9vSWpe * (3403367257)) % vuD2eH5yKkw ~= cP256T0DNWJr4 then SHBeZp6GI1 = SHBeZp6GI1 + 1 end

-- [子系统 2/38] 操作码映射与 S 盒：种子派生，二进制中不存表
local rvZGtdhe1pwZ = {}
do
  local pi = {}
  for x = 0, 255 do pi[x] = x end
  local s = (3006087273)
  for x = 255, 1, -1 do
    s = (s * 1664525 + 1013904223) % 4294967296
    local j = s % (x + 1)
    pi[x], pi[j] = pi[j], pi[x]
  end
  for c = 0, 31 do rvZGtdhe1pwZ[pi[c]] = c end
end
local ZF5ve9uNS2zk1, BH4gC1qzEZUd = {}, {}
do
  for x = 0, 255 do ZF5ve9uNS2zk1[x] = x end
  local s = (3640121446)
  for x = 255, 1, -1 do
    s = (s * 1664525 + 1013904223) % 4294967296
    local j = s % (x + 1)
    ZF5ve9uNS2zk1[x], ZF5ve9uNS2zk1[j] = ZF5ve9uNS2zk1[j], ZF5ve9uNS2zk1[x]
  end
  for x = 0, 255 do BH4gC1qzEZUd[ZF5ve9uNS2zk1[x]] = x end
end
local UlNNoKBUpA = {}
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
  UlNNoKBUpA[a] = row
end

-- [子系统 2] 操作码轮换参数（仿射双射：奇乘子 mod 256）
local bYoeDUF_ZBKf = 41
local i7bBI0d7YbnN = 9
local edYq07rigUMN = 61
local gZoUe8vJ0Uzla = 0
local p9pPQ67wdjM = rvZGtdhe1pwZ
local function Gkus4nO51l8ij()
  local ok, c = pcall(os.clock)
  if ok and c then return (math.floor(c * 1000) % 2) end
  return 0
end

-- [子系统 7/13] 算术形态（MBA 等价实现，自变异切换）
local J3YGw1jYEHfy = function(x, y) return (x + y) % 256 end
local OZJmxryAOh = function(x, y) return (x - y + 512) % 256 end
local gDxozz5mgY = function(x, y) return (x * 3 + y * 3 - (x + y + y)) % 256 end
local hCa_mh81ULFsD = function(x, y) return (x + 255 - y + 1) % 256 end

-- [子系统 70] 完整性哈希（100 分片链）
local function My14odFmpdA(s, h)
  for j = 1, #s do h = (h * 33 + string.byte(s, j)) % 2147483647 end
  return h
end
local _4UBUqYhBYYZp = ((96328+73)-73)
local xCAycAEAH_ENK = (978818922)
local function p1FYxnET0_NRo()
  local pl = GmAetGi1zd1eK
  if not pl or #pl == 0 then return true end
  local h = _4UBUqYhBYYZp
  local n = #pl
  local sl = math.ceil(n / 100)
  local st = 1
  while st <= n do
    h = My14odFmpdA(string.sub(pl, st, math.min(st + sl - 1, n)), h)
    st = st + sl
  end
  return h == xCAycAEAH_ENK
end

-- [子系统 12] 守卫程序（guard logic 字节码化）：TICK/JZ/SYNC/TRAP
local LA7uwV15jTAbX = "\000\005\000\187f\020\172\165x\000\000]\217\155\008\207x!\000\003\012\192_\246\154\019\024\001\000\234\195h\n+%\195\000\000mP\248\031\176\137\243\000\000Q"

-- [子系统 74] 时间炸弹
do
  local ttl = ((0+46)-46)
  if ttl > 0 then
    local now = nil
    local ok1, t1 = pcall(function() return tick() end)
    if ok1 and type(t1) == 'number' then now = t1 end
    if not now then
      local ok2, t2 = pcall(os.time)
      if ok2 and type(t2) == 'number' then now = t2 end
    end
    if now and now > (1787761657) then Mbgwk2EV8KYs = true end
  end
end

-- [子系统 60] 环境表白名单沙盒
do
  local okge, env = pcall(function() return getfenv and getfenv(1) or _G end)
  if okge and type(env) == 'table' then
    local must = { {'pcall','function'}, {'string','table'}, {'math','table'}, {'type','function'}, {'select','function'} }
    for _, m in ipairs(must) do
      local okv, v = pcall(function() return env[m[1]] end)
      if not okv or type(v) ~= m[2] then SHBeZp6GI1 = SHBeZp6GI1 + 1 end
    end
  end
end

-- [子系统 77] 反钩子：debug.gethook 预置检测
do
  local ok, h = pcall(function() return debug and debug.gethook and debug.gethook() end)
  if ok and h ~= nil then SHBeZp6GI1 = SHBeZp6GI1 + 1 end
end

-- [子系统 72] 时序侧信道：校准环执行时间检测
do
  local ok0, c0 = pcall(os.clock)
  if ok0 and type(c0) == 'number' then
    local x = 0
    for j = 1, (27000) do x = (x * 33 + j) % 2147483647 end
    local ok1, c1 = pcall(os.clock)
    if ok1 and type(c1) == 'number' then
      if (c1 - c0) > (1.7000000000000002) then SHBeZp6GI1 = SHBeZp6GI1 + 1 end
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
      if t1 < t0 or (t1 - t0) > 60 then SHBeZp6GI1 = SHBeZp6GI1 + 1 end
    end
  end
end

-- [子系统 73] 环境全局对象篡改检测（仅 Roblox 环境生效）
local tr2guF33aEcXl = (function()
  local ok, g = pcall(function() return game end)
  return ok and g ~= nil
end)()
if tr2guF33aEcXl then
  local ok2, t = pcall(function() return type(game) end)
  if ok2 and t ~= 'userdata' and t ~= 'table' then SHBeZp6GI1 = SHBeZp6GI1 + 1 end
  local ok3, ws = pcall(function() return game.GetService and game:GetService('Workspace') end)
  if not ok3 or ws == nil then SHBeZp6GI1 = SHBeZp6GI1 + 1 end
end

-- [子系统 78] 调试库污染：debug.getinfo 返回伪造源/行号
do
  local ok, gi = pcall(function() return debug and debug.getinfo end)
  if ok and type(gi) == 'function' then
    pcall(function()
      debug.getinfo = function(f, w)
        local info = gi(f, w)
        if type(info) == 'table' then
          info.source = "@saed5q"
          if info.short_src ~= nil then info.short_src = "@saed5q" end
          info.currentline = 16170
          if info.linedefined ~= nil then info.linedefined = 16177 end
        end
        return info
      end
    end)
  end
end

-- [子系统 83/86] Dark Dex 诱饵实例树 + 反收录随机指纹
local uqFADHFfMo = {}
do
  local dnames = {'_6CDIYL_6902', '_1IXMFNY_5594', '_171X8E5_9846', '_UK3ZD2_3112', '_1PYUYIY_5275', '_1M6FCER_8579', '_S175OF_9080', '_1QANF6O_2941', '_W7G5Y9_1653', '_6S9I0U_2603', '_15D96CP_9176', '_SGXNYN_2854'}
  SQzS0UubKL = tr2guF33aEcXl and 8 or 4
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
          __tostring = function() return "@saed5q" end,
          __metatable = 'The metatable is locked',
        })
        rawset(_G, nm, proxy)
        uqFADHFfMo[#uqFADHFfMo + 1] = nm
      end
    end)
  end
end

-- [子系统 6] 双解释器：runA（if 链，线性字节串）/ runB（链表树 + 分发表）
local XfaqP0ElCr = {}
local SOCHFq4z0aral = XfaqP0ElCr
local cNa4fr45ko = {}
local HaCm9OxNorw = {}

local function ZX4acomYOH9aw(progStr)
  local n = string.byte(progStr, 2) + string.byte(progStr, 3) * 256
  local idx = {}
  local head, prev
  local inv = rvZGtdhe1pwZ
  local level = 0
  local cnt = 0
  for i = 0, n - 1 do
    local lv = math.floor(i / bYoeDUF_ZBKf)
    while level < lv do
      local ni = {}
      for w = 0, 255 do ni[(i7bBI0d7YbnN * w + edYq07rigUMN) % 256] = inv[w] end
      inv = ni
      level = level + 1
    end
    local base = 4 + i * 9
    local w = string.byte(progStr, base + 5)
    local node = { op = inv[w], a = string.byte(progStr, base + 6), b = string.byte(progStr, base + 7), nx = nil }
    if head == nil then head = node else prev.nx = node end
    prev = node
    idx[i] = node
    cnt = cnt + 1
  end
  return { head = head, idx = idx, dt = SOCHFq4z0aral, n = cnt }
end

-- [子系统 8] 运行时指令置换：树节点段等价重写
local function UzuZ3gFM321(tr)
  if tr == nil or tr.head == nil then return end
  local seg = tr.head
  local k = 0
  while seg and k < 3 do
    if seg.op == 11 then
      -- MOV a b → XOR a a; XORI a b（等价）
      seg.op = 4
      local b = seg.b
      seg.b = seg.a
      local nn = { op = 17, a = seg.a, b = b, nx = seg.nx }
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
local bGROxwrYq8
bGROxwrYq8 = function()
  PRcqCAdqsh = PRcqCAdqsh + GqqGIAllCf
  -- (a) 算法形态切换（FADD/FSUB 等价实现互换）
  if (uxnx9cj9TMy % 2) == 0 then
    J3YGw1jYEHfy, gDxozz5mgY = gDxozz5mgY, J3YGw1jYEHfy
  else
    OZJmxryAOh, hCa_mh81ULFsD = hCa_mh81ULFsD, OZJmxryAOh
  end
  -- (b) 树程序操作码对换 + 独立分发表重排（语义保持）
  local seen = 0
  for id, tr in pairs(aEn2GFZWkIZ) do
    if seen >= 4 then break end
    if tr.dt == SOCHFq4z0aral then
      local cp = {}
      for k, v in pairs(SOCHFq4z0aral) do cp[k] = v end
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
    UzuZ3gFM321(tr)
    seen = seen + 1
  end
  -- (d) 缓存洗牌【子系统 10】
  local old = xJsRki2ip6Sk
  local fresh = {}
  local shift = 1 + math.floor(uxnx9cj9TMy % (j2b4QsP5jFomx - 1))
  for kk, vv in pairs(old) do
    fresh[((kk + shift - 1) % j2b4QsP5jFomx) + 1] = vv
  end
  xJsRki2ip6Sk = fresh
  -- (e) 程序重编码（新字符串对象，改变内存指纹）
  local ids = {}
  for idd in pairs(hRPsY01bE_5e) do ids[#ids + 1] = idd end
  if #ids > 0 then
    local pick = ids[1 + math.floor(uxnx9cj9TMy % #ids)]
    local ps = hRPsY01bE_5e[pick]
    if ps ~= nil then
      local rebuilt = {}
      local w = #ps
      for j = 1, w do rebuilt[j] = string.char(string.byte(ps, j)) end
      hRPsY01bE_5e[pick] = table.concat(rebuilt)
    end
  end
end

-- runA：if 链分发（线性字节串 + 指令索引轮换）
local function y7iz6J5bmUB(prog, src, want)
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
    local lv = math.floor(pc / bYoeDUF_ZBKf)
    if lv ~= level then
      inv = rvZGtdhe1pwZ
      local st2 = 0
      while st2 < lv do
        local ni = {}
        for w = 0, 255 do ni[(i7bBI0d7YbnN * w + edYq07rigUMN) % 256] = inv[w] end
        inv = ni
        st2 = st2 + 1
      end
      level = lv
      p9pPQ67wdjM = inv
    end
    local base = 4 + pc * 9
    local w = string.byte(prog, base + 5)
    local op = inv[w]
    local a = string.byte(prog, base + 6)
    local b = string.byte(prog, base + 7)
    uxnx9cj9TMy = uxnx9cj9TMy + 1
    mo9iEKMjMAnq0 = mo9iEKMjMAnq0 + 1
    if uxnx9cj9TMy > PRcqCAdqsh then bGROxwrYq8() end
    local jumped = false
    if op == 13 then pc = b; jumped = true
    elseif op == 14 then if R[a + 1] == 0 then pc = b; jumped = true end
    elseif op == 15 then if R[a + 1] ~= 0 then pc = b; jumped = true end
    elseif op == 1 then break
    elseif op == 2 then R[a + 1] = b
    elseif op == 3 then local ix = R[b + 1] + 1; R[a + 1] = string.byte(src, ix) or 0
    elseif op == 4 then R[a + 1] = UlNNoKBUpA[R[a + 1]][R[b + 1]]
    elseif op == 5 then R[a + 1] = J3YGw1jYEHfy(R[a + 1], R[b + 1])
    elseif op == 6 then R[a + 1] = OZJmxryAOh(R[a + 1], R[b + 1])
    elseif op == 7 then R[a + 1] = (R[a + 1] * R[b + 1]) % 256
    elseif op == 8 then R[a + 1] = ZF5ve9uNS2zk1[R[a + 1]]
    elseif op == 9 then R[a + 1] = BH4gC1qzEZUd[R[a + 1]]
    elseif op == 10 then local t = R[a + 1]; R[a + 1] = R[b + 1]; R[b + 1] = t
    elseif op == 11 then R[a + 1] = R[b + 1]
    elseif op == 12 then OUT[#OUT + 1] = string.char(R[a + 1])
    elseif op == 16 then R[a + 1] = J3YGw1jYEHfy(R[a + 1], b)
    elseif op == 17 then R[a + 1] = UlNNoKBUpA[R[a + 1]][b]
    elseif op == 18 then local v = R[a + 1]; R[a + 1] = ((v * 2) % 256) + math.floor(v / 128)
    elseif op == 19 then local v = R[a + 1]; R[a + 1] = math.floor(v / 2) + (v % 2) * 128
    elseif op == 20 then R[a + 1] = R[a + 1] + 1
    elseif op == 21 then R[a + 1] = R[a + 1] - 1
    elseif op == 22 then cNa4fr45ko[#cNa4fr45ko + 1] = R[a + 1]
    elseif op == 23 then R[a + 1] = cNa4fr45ko[#cNa4fr45ko] or 0; cNa4fr45ko[#cNa4fr45ko] = nil
    elseif op == 24 then R[a + 1] = HaCm9OxNorw[a] or 0
    elseif op == 25 then HaCm9OxNorw[a] = R[b + 1]
    elseif op == 26 then R[a + 1] = (R[a + 1] == R[b + 1]) and 1 or 0
    elseif op == 27 then R[a + 1] = (R[a + 1] ~= R[b + 1]) and 1 or 0
    elseif op == 28 then R[a + 1] = (R[a + 1] == b) and 1 or 0
    elseif op == 29 then uxnx9cj9TMy = uxnx9cj9TMy + a
    elseif op == 30 then R[a + 1] = (Mbgwk2EV8KYs or SHBeZp6GI1 > 3) and 1 or 0
    elseif op == 31 then SHBeZp6GI1 = SHBeZp6GI1 + 1; xJsRki2ip6Sk[1] = nil
    end
    if not jumped then pc = pc + 1 end
    if want and #OUT >= want then break end
  end
  return table.concat(OUT)
end

-- runB：表驱动 + 链表树
XfaqP0ElCr[1] = function(nd, R, OUT) return true end
XfaqP0ElCr[2] = function(nd, R) R[nd.a + 1] = nd.b end
XfaqP0ElCr[3] = function(nd, R, OUT, src) R[nd.a + 1] = string.byte(src, R[nd.b + 1] + 1) or 0 end
XfaqP0ElCr[4] = function(nd, R) R[nd.a + 1] = UlNNoKBUpA[R[nd.a + 1]][R[nd.b + 1]] end
XfaqP0ElCr[5] = function(nd, R) R[nd.a + 1] = J3YGw1jYEHfy(R[nd.a + 1], R[nd.b + 1]) end
XfaqP0ElCr[6] = function(nd, R) R[nd.a + 1] = OZJmxryAOh(R[nd.a + 1], R[nd.b + 1]) end
XfaqP0ElCr[7] = function(nd, R) R[nd.a + 1] = (R[nd.a + 1] * R[nd.b + 1]) % 256 end
XfaqP0ElCr[8] = function(nd, R) R[nd.a + 1] = ZF5ve9uNS2zk1[R[nd.a + 1]] end
XfaqP0ElCr[9] = function(nd, R) R[nd.a + 1] = BH4gC1qzEZUd[R[nd.a + 1]] end
XfaqP0ElCr[10] = function(nd, R) local t = R[nd.a + 1]; R[nd.a + 1] = R[nd.b + 1]; R[nd.b + 1] = t end
XfaqP0ElCr[11] = function(nd, R) R[nd.a + 1] = R[nd.b + 1] end
XfaqP0ElCr[12] = function(nd, R, OUT) OUT[#OUT + 1] = string.char(R[nd.a + 1]) end
XfaqP0ElCr[16] = function(nd, R) R[nd.a + 1] = J3YGw1jYEHfy(R[nd.a + 1], nd.b) end
XfaqP0ElCr[17] = function(nd, R) R[nd.a + 1] = UlNNoKBUpA[R[nd.a + 1]][nd.b] end
XfaqP0ElCr[18] = function(nd, R) local v = R[nd.a + 1]; R[nd.a + 1] = ((v * 2) % 256) + math.floor(v / 128) end
XfaqP0ElCr[19] = function(nd, R) local v = R[nd.a + 1]; R[nd.a + 1] = math.floor(v / 2) + (v % 2) * 128 end
XfaqP0ElCr[20] = function(nd, R) R[nd.a + 1] = R[nd.a + 1] + 1 end
XfaqP0ElCr[21] = function(nd, R) R[nd.a + 1] = R[nd.a + 1] - 1 end
XfaqP0ElCr[22] = function(nd, R) cNa4fr45ko[#cNa4fr45ko + 1] = R[nd.a + 1] end
XfaqP0ElCr[23] = function(nd, R) R[nd.a + 1] = cNa4fr45ko[#cNa4fr45ko] or 0; cNa4fr45ko[#cNa4fr45ko] = nil end
XfaqP0ElCr[24] = function(nd, R) R[nd.a + 1] = HaCm9OxNorw[nd.a] or 0 end
XfaqP0ElCr[25] = function(nd, R) HaCm9OxNorw[nd.a] = R[nd.b + 1] end
XfaqP0ElCr[26] = function(nd, R) R[nd.a + 1] = (R[nd.a + 1] == R[nd.b + 1]) and 1 or 0 end
XfaqP0ElCr[27] = function(nd, R) R[nd.a + 1] = (R[nd.a + 1] ~= R[nd.b + 1]) and 1 or 0 end
XfaqP0ElCr[28] = function(nd, R) R[nd.a + 1] = (R[nd.a + 1] == nd.b) and 1 or 0 end
XfaqP0ElCr[29] = function(nd) uxnx9cj9TMy = uxnx9cj9TMy + nd.a end
XfaqP0ElCr[30] = function(nd, R) R[nd.a + 1] = (Mbgwk2EV8KYs or SHBeZp6GI1 > 3) and 1 or 0 end
XfaqP0ElCr[31] = function(nd) SHBeZp6GI1 = SHBeZp6GI1 + 1; xJsRki2ip6Sk[1] = nil end

local function BhRW34Ofh181y(id, src, want)
  local tr = aEn2GFZWkIZ[id]
  if tr == nil then
    local ok, t = pcall(ZX4acomYOH9aw, hRPsY01bE_5e[id + 1])
    if ok and t ~= nil then
      tr = t
      aEn2GFZWkIZ[id] = tr
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
    uxnx9cj9TMy = uxnx9cj9TMy + 1
    mo9iEKMjMAnq0 = mo9iEKMjMAnq0 + 1
    if uxnx9cj9TMy > PRcqCAdqsh then bGROxwrYq8() end
    local op = nd.op
    if op == 13 then nd = tr.idx[nd.a]
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
QLodK67QdUqyC[1] = "greetprintcalculateDamageJohnDoe42571079Hello, !377918100Critical hit!50Normal hitWeak hitStep: Done: "
hRPsY01bE_5e[1] = "\000\011\000\208\195\176\139\162\228\006\000\156\183kE\2146\228\007\005\012n\172\224\184\252\228\001\000|RX6\238\158=\000\006\230a\166\209l`\136\000\001\201\135\166\200YX\001\000\000\230\183\220%\167\158'\006\000\133,\149`8V\139\007\000'\203\006\217\142\242!\007\n\205W\216\168\191|\160\003\000\231\252\191u\205\146\243\000\000\223"
hRPsY01bE_5e[2] = "\001\011\000\203\001\237{$\228\006\000B%\1850\184\017\228\007\005\200/\160\006\127\144\228\001\000\135v\205 \002b=\000\006-@\014[\226n\136\000\001\234\184\168e\201;\001\000\000\231\137h\157\t['\006\000\255\164\1886\241\245\139\007\000\141tZ\179_h!\007\n\159X=f\237%\160\003\000n\166Y\160\157\219\243\000\000\130"
hRPsY01bE_5e[3] = "\002\011\000\0066\157\rx\228\006\000(\173\017\1560\207\228\007\015\137H\172\223\1796\228\001\000.\014Qv=\191=\000\006a\225\209\237G\006\136\000\001\194\221,\174\204\231\001\000\000P\136\245\174Eb'\006\000BfH\208\2413\139\007\000\175\228\153TP\224!\007\n\173R\027\245\025h\160\003\000z\012\138\143\229&\243\000\000?"
hRPsY01bE_5e[4] = "\000\011\000\016+\248\150\234\228\006\000\213\235{\154 \217\228\007\007\235\207\204\182\224\237\228\001\000\001\193x\244oI=\000\006\136\t\203gI\204\136\000\001#\180e\139\172\184\001\000\000\133\169p&\235S'\006\000\148\245\144\173\175\223\139\007\000\208\228\tP\135\228!\007\n\166\2406Q\174\133\160\003\000\142\136\163\163\217\174\243\000\000\153"
hRPsY01bE_5e[5] = "\001\011\000\181\151\012{\217\228\006\000\160\178\238\137\129N\228\007\002\170kxf\1970\228\001\000\157}\224:d\198=\000\006l\210\154\180\213\141\136\000\001g\206\238m%I\001\000\000A\"\192\170\177\249'\006\000\209\183\162%\144\255\139\007\000\207\148\027\168*\n!\007\nF\161\187aq\n\160\003\000>\226\167F\190\246\243\000\000\134"
hRPsY01bE_5e[6] = "\002\011\000N\1615\242\149\228\006\000qY@\023\171\011\228\007\006\170\246\166C\007,\228\001\000\140\243X\209\128\163=\000\006\207\131\1417\131o\136\000\001\018\"/ut \001\000\000*dJK\213\153'\006\000>F\139\142\169\134\139\007\000\014\140\146\176\016}!\007\n\008GBL+\176\160\003\000\139[f\199Hy\243\000\000C"
hRPsY01bE_5e[7] = "\000\011\000\146\201\137\011\235\228\006\000!\017\214Q\198\157\228\007\007/U.ZM\235\228\001\000\213_\223}\219a=\000\006Bm>\152\2209\136\000\001\151|\134\240q'\001\000\000\187\1708o\2008'\006\000U\221ZYx/\139\007\000!\004n\217)\186!\007\n\164]\029\012\020\011\160\003\000\252\255q\153\200\208\243\000\000\198"
hRPsY01bE_5e[8] = "\001\011\000\252\176\139O\200\228\006\000ZJ\248\211\170\147\228\007\001b3\021<\001\156\228\001\000zkSg\241L=\000\006*\152[I\200?\136\000\001\143$j\226\251Z\001\000\000\187\014\227\nS\232'\006\000H\138\174\183z\221\139\007\000\222j\225j\011\166!\007\n\175\135(\133\022a\160\003\000\167[\234\240\240i\243\000\000\226"
hRPsY01bE_5e[9] = "\002\011\000*<:\143\235\228\006\000.\019\152H>\005\228\007\006JQ\171:\139G\228\001\000\023\016\171X\003\024=\000\006\191H>\002l\220\136\000\001\205\239\131\182e\198\001\000\000\154\161k:\005T'\006\000\241\025\218k\141\136\139\007\000\152\143F\202\159&!\007\n\242\236\025\224\217\029\160\003\000\022\197\155\220?\173\243\000\000n"
hRPsY01bE_5e[10] = "\000\011\000\219-t\164\031\228\006\000GQ}\208/\026\228\007\003K\135\134|\186\180\228\001\000\175l\195\011\244-=\000\006\184K\135\030\139^\136\000\001'\222\128\178\130\178\001\000\000\006\029\211=Q='\006\000B\170k^\233?\139\007\000B\184\011\219?\138!\007\n.A_>\148}\160\003\000L\008\016`\006\\\243\000\000\214"
hRPsY01bE_5e[11] = "\001\011\000\255\229\223\145\141\228\006\000!\176$\218\209\204\228\007\r\201\201\217bs\127\228\001\0008B\030\199\248w=\000\006\253\166\130\137\232\180\136\000\001\129\001\019Z)T\001\000\000n%\168\234\133\018'\006\000\221\194\229Dp\158\139\007\000_\159\144;\003\193!\007\n_a\231_\008\183\160\003\000\019<\149\238\165\022\243\000\000\169"
hRPsY01bE_5e[12] = "\002\011\000\134\1465m-\228\006\000;&\196_d6\228\007\002\209\237R\144\239\140\228\001\000\138\239\148'\199\019=\000\006ck4\131J\151\136\000\001\003\004\167)\130c\001\000\000=\232\127\143We'\006\000\207\167\150\249\170\015\139\007\000\191\157T\199a\195!\007\n\008\234\129,q\243\160\003\000\198\249\189\127\002C\243\000\000\025"
hRPsY01bE_5e[13] = "\000\011\000Sms\185\204\228\006\000\172\127Y\143\217\008\228\007\n\139\231,P\173\229\228\001\000\158\254\016\243& =\000\006\154\128A\188w{\136\000\001\186\030h%\179(\001\000\000\005V>\2180\031'\006\000\202\172\152\002\134\192\139\007\000\138\145\157\031\146;!\007\n\206\164\211\254\144#\160\003\000\190Aozs\029\243\000\000\252"
hRPsY01bE_5e[14] = "\001\011\000+\158\194H\200\228\006\000@\209.t\180\200\228\007\008A\255\019\164`\189\228\001\000\179-\199\152=\197=\000\006\131f\180tQ\196\136\000\001\245\016\247\136]Q\001\000\000P\216\192\255\174\240'\006\000\253\138v>\0241\139\007\000\206\011\132\165\184M!\007\n&.bxg\217\160\003\000\190Z\144\143\253\"\243\000\000\249"
hRPsY01bE_5e[15] = "\002\011\000\169\158\149\2147\228\006\000\175Y\224\237\160\191\228\007\006\245\204\213\017<\175\228\001\000\223\143\130\240\241;=\000\006\248nX\0123q\136\000\001\193\182q\024\161\142\001\000\000W\027\155aP\233'\006\000\030q\201\176\011\209\139\007\000\210\227\149\134\172\008!\007\n\193\152[\198t0\160\003\000\140\186\177\254\143\209\243\000\000!"
hRPsY01bE_5e[16] = "\000\011\000V-\021k\189\228\006\000Q\208\150\227\176\004\228\007\006~r\230D\195%\228\001\0002\130\177kC\184=\000\006\142\255\208H\n\181\136\000\001\189<e\208\181\016\001\000\000\157/\233<\148\193'\006\0004$<t\189\021\139\007\000\161R\168\004\251D!\007\nP\154s\007r\201\160\003\000\189\n\241W\154\235\243\000\000\182"
hRPsY01bE_5e[0] = "\000\005\000\187f\020\172\165x\000\000]\217\155\008\207x!\000\003\012\192_\246\154\019\024\001\000\234\195h\n+%\195\000\000mP\248\031\176\137\243\000\000Q"
IQW4ke239BS[1] = {1, 1, 5}
IQW4ke239BS[2] = {1, 6, 10}
IQW4ke239BS[3] = {1, 11, 25}
IQW4ke239BS[4] = {1, 26, 32}
IQW4ke239BS[5] = {1, 33, 34}
IQW4ke239BS[6] = {1, 35, 40}
IQW4ke239BS[7] = {1, 41, 47}
IQW4ke239BS[8] = {1, 48, 48}
IQW4ke239BS[9] = {1, 49, 54}
IQW4ke239BS[10] = {1, 55, 57}
IQW4ke239BS[11] = {1, 58, 70}
IQW4ke239BS[12] = {1, 71, 72}
IQW4ke239BS[13] = {1, 73, 82}
IQW4ke239BS[14] = {1, 83, 90}
IQW4ke239BS[15] = {1, 91, 96}
IQW4ke239BS[16] = {1, 97, 102}
do
  local parts = {}
  for j = 1, #hRPsY01bE_5e do
    if hRPsY01bE_5e[j] ~= nil then parts[#parts + 1] = hRPsY01bE_5e[j] end
  end
  parts[#parts + 1] = LA7uwV15jTAbX
  for j = 1, #QLodK67QdUqyC do parts[#parts + 1] = QLodK67QdUqyC[j] end
  GmAetGi1zd1eK = table.concat(parts)
end

-- [子系统 81] 反篡改触发链：完整性 → 缓存布局数据流耦合
if not p1FYxnET0_NRo() then
  SHBeZp6GI1 = SHBeZp6GI1 + 2
  ih5XbDlCHR4G = (ih5XbDlCHR4G * 33 + xCAycAEAH_ENK) % 65521
  lq53QrmSIrG_ = (lq53QrmSIrG_ + xCAycAEAH_ENK) % 65521
end

-- [子系统 12] 守卫程序执行（时间炸弹状态 → VM 字节码路径）
do
  local ok = pcall(y7iz6J5bmUB, LA7uwV15jTAbX, '', 0)
  if not ok then SHBeZp6GI1 = SHBeZp6GI1 + 1 end
end

-- [子系统 9/34] 常量取值：VM 解密 + 随机缓存槽 + 惰性分页
-- 注意：此处必须赋值给块级 local（第 3 行声明的 K/KN），不能 local function
-- 否则载荷（do 块外的代码）看不到 K，调用得到 nil
F6ld8Buf6o = function(id)
  local slot = ((id * ih5XbDlCHR4G + lq53QrmSIrG_) % j2b4QsP5jFomx) + 1
  local v = xJsRki2ip6Sk[slot]
  if v ~= nil then return v end
  if Mbgwk2EV8KYs then return '\1DEAD\2' end
  if SHBeZp6GI1 > 3 then return '\1TNT\2' end
  -- 注意：PROGS/PAGEMAP 以 Lua 1-based 键存储（id+1），PROGS[0] 为守卫程序
  local prog = hRPsY01bE_5e[id + 1]
  if prog == nil then return nil end
  local pm = IQW4ke239BS[id + 1]
  if pm == nil then return nil end
  local src = string.sub(QLodK67QdUqyC[pm[1]], pm[2], pm[3])
  local mode = string.byte(prog, 1)
  if mode == 2 then mode = Gkus4nO51l8ij() + 1 end
  local ok, out
  if mode == 1 then
    ok, out = pcall(BhRW34Ofh181y, id, src, #src)
  else
    ok, out = pcall(y7iz6J5bmUB, prog, src, #src)
  end
  if not ok or out == nil then
    SHBeZp6GI1 = SHBeZp6GI1 + 1
    return nil
  end
  xJsRki2ip6Sk[slot] = out
  -- [子系统 76] 周期性内存自校验（每 10 秒）
  local okc, now = pcall(os.clock)
  if okc and type(now) == 'number' and (now - lbjB26fVelKJd) > 10 then
    lbjB26fVelKJd = now
    if not p1FYxnET0_NRo() then SHBeZp6GI1 = SHBeZp6GI1 + 2 end
  end
  return out
end
oyj9GKTxOr = function(id) return tonumber(F6ld8Buf6o(id)) end

-- [子系统 88] Remote 调用三层加密助手（XOR 流 + ADD 流 + S 盒）
local q8GHH06kbJ6 = {71, 167, 29, 27, 166, 241, 80, 149, 233, 68, 84, 11, 127, 103, 199, 81}
local Q7FXZ5EyztG8R = {165, 144, 219, 51, 52, 178, 43, 207, 49, 137, 60, 123, 90, 57, 168, 27}
lx7cqBJDK0Ff = function(s)
  local out = {}
  for j = 1, #s do
    local b = string.byte(s, j)
    b = UlNNoKBUpA[b][q8GHH06kbJ6[((j - 1) % #q8GHH06kbJ6) + 1]]
    b = (b + Q7FXZ5EyztG8R[((j - 1) % #Q7FXZ5EyztG8R) + 1]) % 256
    b = ZF5ve9uNS2zk1[b]
    out[j] = string.char(b)
  end
  return table.concat(out)
end
PB4xW496uH0 = function(s)
  local out = {}
  for j = 1, #s do
    local b = BH4gC1qzEZUd[string.byte(s, j)]
    b = (b - Q7FXZ5EyztG8R[((j - 1) % #Q7FXZ5EyztG8R) + 1] + 256) % 256
    b = UlNNoKBUpA[b][q8GHH06kbJ6[((j - 1) % #q8GHH06kbJ6) + 1]]
    out[j] = string.char(b)
  end
  return table.concat(out)
end

-- [子系统 26/76/89] 协程风暴 + 守卫 + 帧序扰乱
local HUps5C6K5dqb = {}
local ukzD_adjkSkcZ = (((260*16))/16)
local function bIZsHoxS8h(list)
  for rounds = 1, 3 do
    for j = 1, #list do
      pcall(coroutine.resume, list[j])
    end
  end
end
do
  local n = ukzD_adjkSkcZ
  if n > 300 then n = 300 end
  for j = 1, n do
    local ok, co = pcall(coroutine.create, function()
      local x = j
      for k2 = 1, 4 do
        x = (x * 33 + k2) % 2147483647
        coroutine.yield(x)
      end
    end)
    if ok then HUps5C6K5dqb[#HUps5C6K5dqb + 1] = co end
  end
end
local rmqONpikOle9u
rmqONpikOle9u = function()
  if not p1FYxnET0_NRo() then
    SHBeZp6GI1 = SHBeZp6GI1 + 2
    ih5XbDlCHR4G = (ih5XbDlCHR4G * 33 + xCAycAEAH_ENK) % 65521
  end
  pcall(y7iz6J5bmUB, LA7uwV15jTAbX, '', 0)
end
local sm3BrkWC6C
sm3BrkWC6C = function()
  while true do
    rmqONpikOle9u()
    pcall(function() task.wait(10) end)
    coroutine.yield()
  end
end
do
  local okTask, task = pcall(function() return task end)
  if okTask and task and type(task) == 'table' then
    pcall(function() task.defer(function() bIZsHoxS8h(HUps5C6K5dqb) end) end)
    pcall(function() task.delay(3, rmqONpikOle9u) end)
    pcall(function() task.spawn(function() sm3BrkWC6C() end) end)
  else
    local okCo, co = pcall(coroutine.create, sm3BrkWC6C)
    if okCo then pcall(coroutine.resume, co) end
    pcall(bIZsHoxS8h, HUps5C6K5dqb)
  end
end

end


do
-- Gungnir Environment Fingerprint (auto-generated, Lua 5.1)
local _exl1ix = false
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
      _exl1ix = true
      break
    end
  end

  if not _exl1ix then
    local okName, name = pcall(function()
      return identifyexecutor and identifyexecutor()
    end)
    if okName and type(name) == "string" and #name > 0 then
      _exl1ix = true
    end
  end

  -- Silent mode: record detection without visible side effects
  if _exl1ix then
    pcall(function()
      _G["__gng_ex"] = true
    end)
  end
end)

-- [Gungnir 子系统 84/85/89] 平台护盾：触摸友好 / 跨平台差异 / 帧序扰乱
local _pdZjZr5S7zq = {}

-- 【85】平台与执行器探测（pcall 保险，非 Roblox 环境优雅降级）
local _pdZjZr5S7zp, _pdZjZr5S7ze = 'unknown', 'unknown'
do
  local ok, result = pcall(function()
    if identifyexecutor then return identifyexecutor() end
    return 'unknown'
  end)
  if ok and type(result) == 'string' then _pdZjZr5S7ze = result end

  ok, result = pcall(function()
    -- Luau 提供 os.platform / UserInputService 触摸能力探测
    if os and os.platform then return tostring(os.platform()) end
    return 'unknown'
  end)
  if ok and type(result) == 'string' then _pdZjZr5S7zp = result end

  -- 服务探测（Delta 必有 UserInputService；缺则标记非 Roblox）
  local hasUIS = false
  pcall(function()
    if game and game:GetService('UserInputService') then hasUIS = true end
  end)
  if not hasUIS then _pdZjZr5S7zp = _pdZjZr5S7zp .. '+noUIS' end
end

-- 【89】帧序扰乱调度器：步骤以随机权重交错执行
_pdZjZr5S7zq.push = function(fn)
  _pdZjZr5S7zq[#_pdZjZr5S7zq + 1] = fn
end

_pdZjZr5S7zq.drain = function()
  -- 构建派生的伪随机交错顺序（同一构建确定性、跨构建不同）
  local s = 11423
  local n = #_pdZjZr5S7zq
  if n == 0 then return end
  -- 交错执行（defer → spawn → delay 混合路径）
  for i = 1, n do
    local fn = _pdZjZr5S7zq[i]
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
          if task and task.delay then task.delay(5 / 1000, fn) return true end
          return false
        end)
        if not ok then pcall(fn) end
      end
    end
  end
  for i = 1, n do _pdZjZr5S7zq[i] = nil end
end

-- 【85】跨平台差异化分支：Android 轻量防御 / iOS 重型防御
_pdZjZr5S7zq.push(function()
  if _pdZjZr5S7zp:find('Android', 1, true) or _pdZjZr5S7zp:find('android', 1, true) then
    -- Android：轻量防御（省电优先）
    pcall(function()
      if game and game:GetService('UserInputService') then
        game:GetService('UserInputService').TouchEnabled = game:GetService('UserInputService').TouchEnabled
      end
    end)
  elseif _pdZjZr5S7zp:find('iOS', 1, true) or _pdZjZr5S7zp:find('IOS', 1, true) or _pdZjZr5S7zp:find('Darwin', 1, true) then
    -- iOS：重型防御（额外校验层）
    pcall(function()
      local clock = os and os.clock and os.clock() or 0
      if clock < 0 then error('t') end
    end)
  else
    -- 桌面/未知：中性分支
    pcall(function() return type(_pdZjZr5S7ze) end)
  end
end)

-- 【84】触摸注入友好：非阻塞启动（task.defer 一帧延迟，无 while 等待）
do
  local ok = pcall(function()
    if task and task.defer then
      task.defer(function()
        pcall(function() _pdZjZr5S7zq.drain() end)
      end)
      return true
    end
    return false
  end)
  if not ok then
    -- task 不可用（纯 Lua 5.1 环境）：同步排空（仍然 pcall 保险）
    pcall(function() _pdZjZr5S7zq.drain() end)
  end
end

-- Gungnir Anti-Debug Framework (auto-generated, do not modify)
local _adip87 = { tripped = false, count = 0 }
local _adiyid = function() return _adip87 end

-- Debug library poisoning: fabricate getinfo metadata (item 73)
local _ad4umy = false
local function _ad58jw()
  if _ad4umy then return end
  _ad4umy = true
  local ok, dbg = pcall(function() return debug end)
  if ok and dbg and dbg.getinfo then
    local realGetinfo = dbg.getinfo
    local fakeData = {
      currentline = 174,
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
local _adl2j6
do
  local ok1, t1 = pcall(function() return tostring(42) end)
  local ok2, t2 = pcall(function() return math.floor(1.5) end)
  _adl2j6 = (ok1 and t1 == "42" and ok2 and t2 == 1)
end

-- Main check battery (items 66, 67, 72)
local function _ad68z9()
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
    _adip87.tripped = true
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
    _adip87.tripped = true
  end

  -- Check 3: environment tamper (item 68)
  local ok3, tampered = pcall(function()
    return tostring(42) ~= "42" or math.floor(1.5) ~= 1
  end)
  if ok3 and tampered then
    _adip87.tripped = true
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
    _adip87.tripped = true
  end

  _adip87.count = _adip87.count + 1
  return _adip87.tripped
end

-- Anti-dump: the check function self-destructs after N invocations (item 75)
local _adcdt8 = 0
local function runChecks(...)
  _adcdt8 = _adcdt8 + 1
  local result = _ad68z9(...)
  if _adcdt8 >= 123 then
    -- Self-destruct: dereference the check battery (anti-dump)
    _ad68z9 = function() return false end
  end
  return result
end

-- Initialize poisoning + fingerprint, schedule periodic checks
-- (pcall-guarded: the defense framework itself must never break the script)
pcall(_ad58jw)
if not _adl2j6 then
  -- Library already tampered at load time
  _adip87.tripped = true
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
  _G["__gungnir_guard_8862"] = _adiyid
end)

-- [Gungnir 子系统 25/27/28/29/30] 混沌分发运行时（每次构建随机生成）
-- 【子系统 28】多返回值堆栈状态机：状态编码在返回值数量中
local _cxHkGwobw2ms = function(s)
  if s == 0 then return 1, 2 end
  if s == 1 then return 1, 2, 3 end
  if s == 2 then return 1, 2, 3, 4 end
  return 1, 2, 3, 4, 5
end
-- 【子系统 30】CFI 破坏：元表 __call 动态调用，静态调用图失效
local _cxHkGwobw2cf = setmetatable({}, { __call = function(_, f, ...) return f(...) end })
-- 【子系统 27】20 层尾调用链（每层 return 尾调用，栈深度不变）
local _cxHkGwobw2t20 = function(f, ...) return _cxHkGwobw2t19(f, ...) end
local _cxHkGwobw2t19 = function(f, ...) return _cxHkGwobw2t18(f, ...) end
local _cxHkGwobw2t18 = function(f, ...) return _cxHkGwobw2t17(f, ...) end
local _cxHkGwobw2t17 = function(f, ...) return _cxHkGwobw2t16(f, ...) end
local _cxHkGwobw2t16 = function(f, ...) return _cxHkGwobw2t15(f, ...) end
local _cxHkGwobw2t15 = function(f, ...) return _cxHkGwobw2t14(f, ...) end
local _cxHkGwobw2t14 = function(f, ...) return _cxHkGwobw2t13(f, ...) end
local _cxHkGwobw2t13 = function(f, ...) return _cxHkGwobw2t12(f, ...) end
local _cxHkGwobw2t12 = function(f, ...) return _cxHkGwobw2t11(f, ...) end
local _cxHkGwobw2t11 = function(f, ...) return _cxHkGwobw2t10(f, ...) end
local _cxHkGwobw2t10 = function(f, ...) return _cxHkGwobw2t9(f, ...) end
local _cxHkGwobw2t9 = function(f, ...) return _cxHkGwobw2t8(f, ...) end
local _cxHkGwobw2t8 = function(f, ...) return _cxHkGwobw2t7(f, ...) end
local _cxHkGwobw2t7 = function(f, ...) return _cxHkGwobw2t6(f, ...) end
local _cxHkGwobw2t6 = function(f, ...) return _cxHkGwobw2t5(f, ...) end
local _cxHkGwobw2t5 = function(f, ...) return _cxHkGwobw2t4(f, ...) end
local _cxHkGwobw2t4 = function(f, ...) return _cxHkGwobw2t3(f, ...) end
local _cxHkGwobw2t3 = function(f, ...) return _cxHkGwobw2t2(f, ...) end
local _cxHkGwobw2t2 = function(f, ...) return _cxHkGwobw2t1(f, ...) end
local _cxHkGwobw2t1 = function(f, ...) return f(f, ...) end
-- 概率权重种子（构建期随机派生，每次构建不同）
local _cxHkGwobw2ws = 534706320
-- 【子系统 25】概率加权控制流：3 条等价路径随机选择
-- 【子系统 28】路径选择经 select('#') 读取 __ms 栈上传递的隐式状态
-- 【子系统 29】路径 B：pcall 异常驱动，错误对象携带状态重抛
local _cxHkGwobw2 = function(f, ...)
  _cxHkGwobw2ws = (_cxHkGwobw2ws * 1103515245 + 12345) % 2147483648
  local __mstate = select('#', _cxHkGwobw2ms(_cxHkGwobw2ws % 4)) % 3
  local __r = (_cxHkGwobw2ws + __mstate) % 3
  if __r == 0 then
    return _cxHkGwobw2t20(f, ...)
  elseif __r == 1 then
    -- Lua 5.1：嵌套闭包不能引用外层 ...，改为 pcall 直传参数
    local __ok, __e = pcall(_cxHkGwobw2t20, f, ...)
    if __ok then return __e end
    -- 【子系统 29】错误值原样重抛（level 0 不附加位置，保留原始错误信息）
    return error(__e, 0)
  else
    return _cxHkGwobw2cf(f, ...)
  end
end


-- [Gungnir 子系统 39/43/46] 数据折磨运行时（键名解密代理 / 弱表终结器 / 常量擦除）
local _dtGzVzOX2ppool = {}
local _dtGzVzOX2pweak = setmetatable({}, { __mode = 'kv' })
local _dtGzVzOX2pfinalized = false

-- 【43】键名混淆代理：t.真实键 → 哈希键存取，__index 动态解密
local _dtGzVzOX2pproxy = setmetatable({}, {
  __index = function(_, k)
    local _dtGzVzOX2pk = 0
    if type(k) == 'string' then
      for i = 1, #k do _dtGzVzOX2pk = (_dtGzVzOX2pk * 31 + string.byte(k, i)) % 399760347 end
    end
    return _dtGzVzOX2ppool[_dtGzVzOX2pk]
  end,
  __newindex = function(_, k, v)
    local _dtGzVzOX2pk = 0
    if type(k) == 'string' then
      for i = 1, #k do _dtGzVzOX2pk = (_dtGzVzOX2pk * 31 + string.byte(k, i)) % 399760347 end
    end
    _dtGzVzOX2ppool[_dtGzVzOX2pk] = v
  end,
})

-- 【46】newproxy + __gc 终结器：GC 触发时把数据传递到弱表（隐式数据流）
do
  local ok, proxy = pcall(function() return newproxy(true) end)
  if ok and proxy then
    local mt = getmetatable(proxy)
    if mt then
      mt.__gc = function()
        _dtGzVzOX2pweak[#_dtGzVzOX2pweak + 1] = _dtGzVzOX2ppool
        _dtGzVzOX2pfinalized = true
      end
    end
  end
end

-- 【39】常量即时擦除：使用后置 nil + 强制 GC（时机由调用方随机决定）
local _dtGzVzOX2perase = function(...)
  local keys = {...}
  for i = 1, #keys do
    if type(keys[i]) == 'table' then
      for k in pairs(keys[i]) do keys[i][k] = nil end
    else
      _dtGzVzOX2ppool[keys[i]] = nil
    end
  end
  pcall(function() collectgarbage('collect') end)
end

-- 【42】过程化数据存取接口（供其他模块使用）
local _dtGzVzOX2pwrap = function(v) _dtGzVzOX2ppool[#_dtGzVzOX2ppool + 1] = v return #_dtGzVzOX2ppool end


-- [Gungnir 子系统 69] 内存布局随机化：重建表以扰动键序（破坏内存快照对比）
local _mllcg4sushuffle
_mllcg4sushuffle = function(t)
  if type(t) ~= 'table' then return t end
  local keys = {}
  for k in pairs(t) do keys[#keys + 1] = k end
  -- 构建种子派生的伪随机重排（无 math.random 依赖，确定性可控）
  local s = 1264807015
  for i = #keys, 2, -1 do
    s = (s * 1103515245 + 12345) % 2147483648
    local j = (s % i) + 1
    keys[i], keys[j] = keys[j], keys[i]
  end
  local out = {}
  for i = 1, #keys do out[keys[i]] = t[keys[i]] end
  return out
end


-- [Gungnir 子系统 56/60] 环境沙盒：白名单校验 + setfenv 动态劫持
local _esTe3yn_gKok = true

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
      _esTe3yn_gKok = false
    end
  end
  -- 行为探测：tostring(nil) 必须为 'nil'
  if pcall(function() return tostring(nil) end) and tostring(nil) ~= 'nil' then
    _esTe3yn_gKok = false
  end
  -- 行为探测：select('#', 1, 2, 3) 必须为 3
  if select('#', 1, 2, 3) ~= 3 then
    _esTe3yn_gKok = false
  end
  -- 行为探测：rawget(_G, 'type') 必须为函数
  if type(rawget(_G, 'type')) ~= 'function' then
    _esTe3yn_gKok = false
  end
end

-- 【56】代理环境表：白名单直通 + 哈希键重定向
local _esTe3yn_gKenv = setmetatable({}, {
  __index = function(_, k)
    -- 白名单直通
    local direct = { rawequal = true, os = true, error = true, math = true, rawget = true, setmetatable = true, type = true, ipairs = true, rawset = true, pcall = true, pairs = true, next = true, string = true, table = true, select = true, tonumber = true, assert = true, coroutine = true, xpcall = true, unpack = true, getmetatable = true, tostring = true }
    if direct[k] then return _G[k] end
    -- 哈希重定向：h(k) 命中已知表项则返回（含构建盐 299101054）
    if type(k) == 'string' then
      local h = 0
      for i = 1, #k do h = (h * 31 + string.byte(k, i)) % 299101054 end
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
    setfenv(probe, _esTe3yn_gKenv)
    applied = probe() == 'string'
  end)
  if not (okSet and applied) then
    -- setfenv 不可用（Luau 环境）：退化为直接用代理表读（优雅降级）
    pcall(function() return _esTe3yn_gKenv.type end)
  end
end

  if _esTe3yn_gKok then
    local _ge6at = _G
    local _gx58f0 = _ge6at[F6ld8Buf6o(0)]
    local _gx58f1 = _ge6at[F6ld8Buf6o(1)]
    local _gx58f2 = _ge6at[F6ld8Buf6o(2)]
    local playerName = F6ld8Buf6o(3)
    local playerLevel = oyj9GKTxOr(4)
    local isActive = true
    local function _fujoUSWk(_fujoUSWkt, ...)
      if _fujoUSWkt == oyj9GKTxOr(5) then
local name = ...
        local message = F6ld8Buf6o(6) .. name .. F6ld8Buf6o(7)
        _gx58f1(message)
        return message
      elseif _fujoUSWkt == oyj9GKTxOr(8) then
local base, multiplier = ...
        local result = base * multiplier
        if result > oyj9GKTxOr(9) then
          _gx58f1(F6ld8Buf6o(10))
          result = result * 2
        elseif result > oyj9GKTxOr(11) then
          _gx58f1(F6ld8Buf6o(12))
        else
          _gx58f1(F6ld8Buf6o(13))
        end
        return result
      end
    end
    local _gx58f0 = function(...)
      return _fujoUSWk(oyj9GKTxOr(5), ...)
    end
    local _gx58f2 = function(...)
      return _fujoUSWk(oyj9GKTxOr(8), ...)
    end
    local damage = _gx58f2(10, 8)
    local greeting = _gx58f0(playerName)
    do
local _mtPduosM = setmetatable({}, { __index = function(_, k) return k end })
local _ccUlENdv, _skq63SRU = 0, nil
      for i = 1, 10 do
_ccUlENdv = _ccUlENdv + 1
_skq63SRU = _mtPduosM[(_ccUlENdv % 13) + 1]
        local step = i * 2
        _gx58f1(F6ld8Buf6o(14) .. step)
      end
    end
    do
local _mtwb6igp = setmetatable({}, { __index = function(_, k) return k end })
local _ccQwchfh, _skFaKeXq = 0, nil
      while isActive do
_ccQwchfh = _ccQwchfh + 1
_skFaKeXq = _mtwb6igp[(_ccQwchfh % 13) + 1]
        isActive = false
      end
    end
    _cxHkGwobw2(_gx58f1, F6ld8Buf6o(15) .. damage)
  end
local _ptBPFBnq = ((((((((((((((((((((((((((((((((0))))))))))))))))))))))))))))))))
local _ptBPFBnqt = {[6953] = 197, [432] = 217, 571, [6499] = 676, [5002] = 586, 544, [9373] = 29, [2435] = 727, 874, [3662] = 187, [4874] = 703, 55, [344] = 116, [9302] = 350, 867, [9676] = 276, [4681] = 715, 250, [1301] = 412, [8804] = 788, 637, [3534] = 441, [539] = 1, 43, [152] = 982, [2637] = 967, 267, [6833] = 693, [9403] = 176, 69, [1574] = 10, [4495] = 418, 289, [6197] = 665, [3925] = 787, 595, [1602] = 348, [5999] = 374, 754, [4123] = 583, [7446] = 509, 783, [6496] = 783, [323] = 346, 256, [8180] = 231, [2196] = 156, 295, [3172] = 429, [4932] = 893, 853, [5195] = 146, [3909] = 995, 863, [8788] = 294, [6728] = 586, 862, [3596] = 503, [5986] = 581, 481, [7387] = 938, [4474] = 69, 966, [9004] = 559, [7564] = 307, 527, [9077] = 873, [7046] = 994, 404, [1290] = 968, [9643] = 710, 483, [1784] = 258, [2470] = 155, 585, [7840] = 86, [926] = 800, 629, [7490] = 265, [6146] = 389, 74, [6437] = 21, [824] = 587, 78, [1105] = 488, [7649] = 655, 23, [2858] = 357, [6941] = 340, 225, [1099] = 556, [5463] = 753, 522, [2688] = 722, [5067] = 70, 708, [6326] = 5, [2094] = 370, 54, [9232] = 845, [880] = 993, 101, [2329] = 267, [4426] = 110, 741, [9702] = 374, [3828] = 906, 765, [482] = 686, [2461] = 537, 354, [3492] = 977, [7553] = 780, 392, [3813] = 100, [8542] = 285, 448, [380] = 581, [9198] = 213, 910, [1484] = 437, [7485] = 245, 764, [6606] = 552, [668] = 826, 460, [2803] = 682, [6644] = 58, 517, [7994] = 698, [1114] = 983, 410, [9668] = 997, [8744] = 300, 758, [4653] = 897, [8820] = 73, 32, [3187] = 803, [1104] = 426, 979, [2568] = 952, [3475] = 179, 371, [2589] = 645, [8123] = 903, 337, [8053] = 967, [1047] = 428, 570, [5498] = 725, [4935] = 211, 715, [3681] = 426, [5450] = 871, 727, [4878] = 516, [53] = 16, 614, [151] = 450, [3960] = 46, 116, [4826] = 92, [7471] = 52, 748, [7036] = 594, [9708] = 655, 952, [6604] = 147, [1745] = 714, 373, [9048] = 526, [2095] = 89, 631, [4871] = 530, [4269] = 62, 952, [1454] = 189, [9386] = 596, 577, [5465] = 576, [2793] = 111, 957, [2927] = 213, [8814] = 69, 884, [9745] = 506, [3695] = 585, 929, [9694] = 593, [9567] = 663, 449, [3117] = 513, [3108] = 118, 434, [3517] = 687, [8685] = 556, 656, [9121] = 745, [8478] = 497}
do end do end do end do end do end
local _ptBPFBnq2 = ((((1)))) + (((2)));
local _ptBPFBnq3 = (function() return (function() return ((3)) end)() end)();


-- [Gungnir 子系统 24/62/63/67/68] 路径爆炸树（每次构建随机结构）
do
  local _psX8qqy = {}
  local _pxx3XwQw, _pyyvbY1a = 44, 34
  -- [63] 反污点：敏感值经控制流依赖写入 sink（无数据流直连）
  local _pxfkwZI4 = function(k, v) _psX8qqy[k] = v end
  -- [67] 素数判定（AI 级不透明谓词家族，试除法）
  local _prnLy3po = function(n)
    if n < 2 then return false end
    local i = 2
    while i * i <= n do
      if n % i == 0 then return false end
      i = i + 1
    end
    return true
  end
  if _prnLy3po(_pxx3XwQw * 3 + 7) then
    _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
    if _prnLy3po(_pxx3XwQw * 4 + 7) then
      _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
      if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 48 * _pxx3XwQw + 64) % 97 then
        _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
        if _prnLy3po(_pxx3XwQw * 6 + 7) then
          _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
          if (_pxx3XwQw * _pxx3XwQw + _pyyvbY1a * _pyyvbY1a) == 25 then
            _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
            if (_pxx3XwQw * _pxx3XwQw + _pyyvbY1a * _pyyvbY1a) == 25 then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + (_pyyvbY1a * _pyyvbY1a * _pyyvbY1a)) == ((_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a)) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(3859, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(6129, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + (_pyyvbY1a * _pyyvbY1a * _pyyvbY1a)) == ((_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a)) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(1838, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(188, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          else
            _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
            if (_pxx3XwQw * _pxx3XwQw + _pyyvbY1a * _pyyvbY1a) == 25 then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 72 * _pxx3XwQw + 81) % 97 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(7449, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(5101, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if (_pxx3XwQw * _pxx3XwQw + _pyyvbY1a * _pyyvbY1a) == 25 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(3989, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(6116, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          end
        else
          _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
          if ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + (_pyyvbY1a * _pyyvbY1a * _pyyvbY1a)) == ((_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a)) then
            _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
            if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 53 * _pxx3XwQw + 95) % 97 then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if _prnLy3po(_pxx3XwQw * 9 + 7) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(3639, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(6214, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if (_pxx3XwQw * _pxx3XwQw + _pyyvbY1a * _pyyvbY1a) == 25 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(9643, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(8789, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          else
            _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
            if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 81 * _pxx3XwQw + 56) % 97 then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + (_pyyvbY1a * _pyyvbY1a * _pyyvbY1a)) == ((_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a)) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(98, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(1371, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if (_pxx3XwQw * _pxx3XwQw + _pyyvbY1a * _pyyvbY1a) == 25 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(3188, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(4069, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          end
        end
      else
        _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
        if (_pxx3XwQw * _pxx3XwQw + _pyyvbY1a * _pyyvbY1a) == 25 then
          _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
          if (_pxx3XwQw * _pxx3XwQw + _pyyvbY1a * _pyyvbY1a) == 25 then
            _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
            if (_pxx3XwQw * _pxx3XwQw - 26) % 97 == 0 then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if _prnLy3po(_pxx3XwQw * 9 + 7) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(7329, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(178, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if (_pxx3XwQw * _pxx3XwQw - 46) % 97 == 0 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(8792, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(554, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          else
            _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
            if ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + (_pyyvbY1a * _pyyvbY1a * _pyyvbY1a)) == ((_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a)) then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if _prnLy3po(_pxx3XwQw * 9 + 7) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(6303, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(20, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if _prnLy3po(_pxx3XwQw * 9 + 7) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(5293, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(6949, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          end
        else
          _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
          if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 52 * _pxx3XwQw + 32) % 97 then
            _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
            if ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + (_pyyvbY1a * _pyyvbY1a * _pyyvbY1a)) == ((_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a)) then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if (_pxx3XwQw * _pxx3XwQw + _pyyvbY1a * _pyyvbY1a) == 25 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(228, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(8282, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if _prnLy3po(_pxx3XwQw * 9 + 7) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(3584, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(4669, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          else
            _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
            if (_pxx3XwQw * _pxx3XwQw + _pyyvbY1a * _pyyvbY1a) == 25 then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 32 * _pxx3XwQw + 45) % 97 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(9620, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(8948, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + (_pyyvbY1a * _pyyvbY1a * _pyyvbY1a)) == ((_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a)) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(8454, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(5841, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          end
        end
      end
    else
      _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
      if (_pxx3XwQw * _pxx3XwQw - 20) % 97 == 0 then
        _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
        if _prnLy3po(_pxx3XwQw * 6 + 7) then
          _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
          if ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + (_pyyvbY1a * _pyyvbY1a * _pyyvbY1a)) == ((_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a)) then
            _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
            if (_pxx3XwQw * _pxx3XwQw - 33) % 97 == 0 then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + (_pyyvbY1a * _pyyvbY1a * _pyyvbY1a)) == ((_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a)) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(8291, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(9067, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if (_pxx3XwQw * _pxx3XwQw + _pyyvbY1a * _pyyvbY1a) == 25 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(7609, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(4874, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          else
            _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
            if _prnLy3po(_pxx3XwQw * 8 + 7) then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if (_pxx3XwQw * _pxx3XwQw - 18) % 97 == 0 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(4370, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(5699, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if _prnLy3po(_pxx3XwQw * 9 + 7) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(8686, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(3440, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          end
        else
          _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
          if (_pxx3XwQw * _pxx3XwQw + _pyyvbY1a * _pyyvbY1a) == 25 then
            _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
            if _prnLy3po(_pxx3XwQw * 8 + 7) then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 53 * _pxx3XwQw + 76) % 97 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(238, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(1528, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if _prnLy3po(_pxx3XwQw * 9 + 7) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(8286, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(6197, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          else
            _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
            if (_pxx3XwQw * _pxx3XwQw - 71) % 97 == 0 then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 43 * _pxx3XwQw + 91) % 97 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(7560, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(9139, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if _prnLy3po(_pxx3XwQw * 9 + 7) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(3673, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(9615, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          end
        end
      else
        _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
        if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 47 * _pxx3XwQw + 3) % 97 then
          _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
          if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 84 * _pxx3XwQw + 27) % 97 then
            _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
            if (_pxx3XwQw * _pxx3XwQw + _pyyvbY1a * _pyyvbY1a) == 25 then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 5 * _pxx3XwQw + 54) % 97 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(6927, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(8120, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if (_pxx3XwQw * _pxx3XwQw - 19) % 97 == 0 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(747, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(3830, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          else
            _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
            if ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + (_pyyvbY1a * _pyyvbY1a * _pyyvbY1a)) == ((_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a)) then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if _prnLy3po(_pxx3XwQw * 9 + 7) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(6978, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(4686, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if (_pxx3XwQw * _pxx3XwQw + _pyyvbY1a * _pyyvbY1a) == 25 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(6408, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(5322, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          end
        else
          _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
          if _prnLy3po(_pxx3XwQw * 7 + 7) then
            _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
            if ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + (_pyyvbY1a * _pyyvbY1a * _pyyvbY1a)) == ((_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a)) then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if (_pxx3XwQw * _pxx3XwQw - 43) % 97 == 0 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(5435, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(4536, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if (_pxx3XwQw * _pxx3XwQw - 2) % 97 == 0 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(1013, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(1074, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          else
            _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
            if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 96 * _pxx3XwQw + 26) % 97 then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 45 * _pxx3XwQw + 60) % 97 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(750, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(2977, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 41 * _pxx3XwQw + 12) % 97 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(3181, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(2996, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          end
        end
      end
    end
  else
    _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
    if _prnLy3po(_pxx3XwQw * 4 + 7) then
      _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
      if (_pxx3XwQw * _pxx3XwQw - 35) % 97 == 0 then
        _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
        if (_pxx3XwQw * _pxx3XwQw + _pyyvbY1a * _pyyvbY1a) == 25 then
          _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
          if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 91 * _pxx3XwQw + 75) % 97 then
            _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
            if (_pxx3XwQw * _pxx3XwQw + _pyyvbY1a * _pyyvbY1a) == 25 then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 78 * _pxx3XwQw + 42) % 97 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(5073, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(5568, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if (_pxx3XwQw * _pxx3XwQw - 85) % 97 == 0 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(3565, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(1567, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          else
            _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
            if _prnLy3po(_pxx3XwQw * 8 + 7) then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if (_pxx3XwQw * _pxx3XwQw - 20) % 97 == 0 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(3994, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(1789, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 79 * _pxx3XwQw + 72) % 97 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(3724, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(3829, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          end
        else
          _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
          if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 65 * _pxx3XwQw + 50) % 97 then
            _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
            if ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + (_pyyvbY1a * _pyyvbY1a * _pyyvbY1a)) == ((_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a)) then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if _prnLy3po(_pxx3XwQw * 9 + 7) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(8900, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(1037, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if (_pxx3XwQw * _pxx3XwQw - 41) % 97 == 0 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(2131, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(570, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          else
            _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
            if (_pxx3XwQw * _pxx3XwQw - 22) % 97 == 0 then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if (_pxx3XwQw * _pxx3XwQw - 20) % 97 == 0 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(999, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(8575, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if _prnLy3po(_pxx3XwQw * 9 + 7) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(4010, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(5413, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          end
        end

        -- [68] 恒假外壳内的 Ackermann（有界 900 深）：形式化验证状态爆炸诱饵
        if (_pxx3XwQw == _pxx3XwQw + 1) then
          local function _akfsXQQ(m, n, d)
            if d > 900 then return -1 end
            if m == 0 then return n + 1 end
            if n == 0 then return _akfsXQQ(m - 1, 1, d + 1) end
            return _akfsXQQ(m - 1, _akfsXQQ(m, n - 1, d + 1), d + 1)
          end
          _pxfkwZI4(0, _akfsXQQ(3, 7, 0))
        end
      else
        _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
        if (_pxx3XwQw * _pxx3XwQw - 11) % 97 == 0 then
          _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
          if _prnLy3po(_pxx3XwQw * 7 + 7) then
            _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
            if _prnLy3po(_pxx3XwQw * 8 + 7) then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if (_pxx3XwQw * _pxx3XwQw + _pyyvbY1a * _pyyvbY1a) == 25 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(7156, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(9284, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if (_pxx3XwQw * _pxx3XwQw + _pyyvbY1a * _pyyvbY1a) == 25 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(2628, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(6047, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          else
            _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
            if (_pxx3XwQw * _pxx3XwQw - 76) % 97 == 0 then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + (_pyyvbY1a * _pyyvbY1a * _pyyvbY1a)) == ((_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a)) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(6992, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(7242, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if (_pxx3XwQw * _pxx3XwQw - 48) % 97 == 0 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(6977, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(2363, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          end
        else
          _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
          if ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + (_pyyvbY1a * _pyyvbY1a * _pyyvbY1a)) == ((_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a)) then
            _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
            if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 15 * _pxx3XwQw + 68) % 97 then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + (_pyyvbY1a * _pyyvbY1a * _pyyvbY1a)) == ((_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a)) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(3922, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(4284, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + (_pyyvbY1a * _pyyvbY1a * _pyyvbY1a)) == ((_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a)) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(4553, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(5394, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          else
            _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
            if _prnLy3po(_pxx3XwQw * 8 + 7) then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 94 * _pxx3XwQw + 94) % 97 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(1836, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(2660, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if (_pxx3XwQw * _pxx3XwQw + _pyyvbY1a * _pyyvbY1a) == 25 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(8170, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(7682, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          end
        end
      end
    else
      _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
      if ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + (_pyyvbY1a * _pyyvbY1a * _pyyvbY1a)) == ((_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a)) then
        _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
        if ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + (_pyyvbY1a * _pyyvbY1a * _pyyvbY1a)) == ((_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a)) then
          _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
          if (_pxx3XwQw * _pxx3XwQw - 27) % 97 == 0 then
            _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
            if (_pxx3XwQw * _pxx3XwQw + _pyyvbY1a * _pyyvbY1a) == 25 then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if _prnLy3po(_pxx3XwQw * 9 + 7) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(1619, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(4975, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 88 * _pxx3XwQw + 28) % 97 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(9221, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(3594, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          else
            _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
            if (_pxx3XwQw * _pxx3XwQw + _pyyvbY1a * _pyyvbY1a) == 25 then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 19 * _pxx3XwQw + 23) % 97 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(3875, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(5568, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if (_pxx3XwQw * _pxx3XwQw - 68) % 97 == 0 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(5522, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(1344, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          end
        else
          _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
          if ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + (_pyyvbY1a * _pyyvbY1a * _pyyvbY1a)) == ((_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a)) then
            _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
            if _prnLy3po(_pxx3XwQw * 8 + 7) then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 65 * _pxx3XwQw + 52) % 97 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(6153, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(4546, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if (_pxx3XwQw * _pxx3XwQw - 78) % 97 == 0 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(4638, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(3768, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          else
            _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
            if (_pxx3XwQw * _pxx3XwQw - 83) % 97 == 0 then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if _prnLy3po(_pxx3XwQw * 9 + 7) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(806, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(2391, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if _prnLy3po(_pxx3XwQw * 9 + 7) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(789, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(1334, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          end
        end
      else
        _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
        if (_pxx3XwQw * _pxx3XwQw - 5) % 97 == 0 then
          _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
          if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 5 * _pxx3XwQw + 32) % 97 then
            _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
            if _prnLy3po(_pxx3XwQw * 8 + 7) then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + (_pyyvbY1a * _pyyvbY1a * _pyyvbY1a)) == ((_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a)) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(2452, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(9844, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if _prnLy3po(_pxx3XwQw * 9 + 7) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(7806, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(6323, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          else
            _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
            if (_pxx3XwQw * _pxx3XwQw - 34) % 97 == 0 then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 89 * _pxx3XwQw + 74) % 97 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(9565, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(3760, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if (_pxx3XwQw * _pxx3XwQw - 78) % 97 == 0 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(4480, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(6163, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          end
        else
          _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
          if (_pyyvbY1a * _pyyvbY1a) % 97 == ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + 85 * _pxx3XwQw + 47) % 97 then
            _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
            if _prnLy3po(_pxx3XwQw * 8 + 7) then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if _prnLy3po(_pxx3XwQw * 9 + 7) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(7920, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(1261, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if (_pxx3XwQw * _pxx3XwQw + _pyyvbY1a * _pyyvbY1a) == 25 then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(8349, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(8660, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            end
          else
            _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
            if (_pxx3XwQw * _pxx3XwQw + _pyyvbY1a * _pyyvbY1a) == 25 then
              _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
              if ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + (_pyyvbY1a * _pyyvbY1a * _pyyvbY1a)) == ((_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a)) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(4020, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(9252, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
            else
              _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
              if ((_pxx3XwQw * _pxx3XwQw * _pxx3XwQw) + (_pyyvbY1a * _pyyvbY1a * _pyyvbY1a)) == ((_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a) * (_pxx3XwQw + _pyyvbY1a)) then
                _pxx3XwQw = (_pxx3XwQw * 37 + 11) % 90 + 2
                _pxfkwZI4(404, (_pxx3XwQw + _pyyvbY1a) % 97)
              else
                _pyyvbY1a = (_pyyvbY1a * 53 + 17) % 90 + 2
                _pxfkwZI4(756, (_pxx3XwQw + _pyyvbY1a) % 97)
              end
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
  local ok, v = pcall(F6ld8Buf6o, 0)
  if not ok or v == nil then v = nil end
end
