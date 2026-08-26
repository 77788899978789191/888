"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitRuntime = emitRuntime;
const VMCodec_1 = require("./VMCodec");
function mka(digitStream, used) {
    // 氪星命名：长度 10-13，大小写+数字混合，首字符字母/下划线
    const first = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
    const rest = first + '0123456789';
    for (let guard = 0; guard < 100; guard++) {
        const len = 10 + (Math.floor(digitStream() * 1000) % 4);
        let name = '';
        name += first[Math.floor(digitStream() * 1e6) % first.length];
        for (let i = 1; i < len; i++) {
            name += rest[Math.floor(digitStream() * 1e7) % rest.length];
        }
        if (!used.has(name)) {
            used.add(name);
            return name;
        }
    }
    const fallback = '_g' + Math.floor(digitStream() * 1e9).toString(36) + Date.now().toString(36);
    used.add(fallback);
    return fallback;
}
/**
 * 算术 MBA 恒等式包装（子系统 13）。
 * 安全约束：所有中间值必须落在 int32 范围内（±2^31），否则
 * fengari/Gloop 的 32 位整数路径会产生回绕，破坏恒等式。
 *  - 方案 A（乘除）：仅当 v*k < 2^31 时使用 ((v*k)/k)
 *  - 方案 B（加减）：v+k < 2^31 时使用 ((v+k)-k)
 *  - 大值（≥2^31）：直接字面量（仍受解密链保护）
 */
function mbaConst(v, ds) {
    const INT_MAX = 2 ** 31 - 1;
    const INT_MIN = -(2 ** 31);
    const pick = Math.floor(ds() * 1000) % 3;
    if (pick === 0 && Number.isInteger(v) && v > INT_MIN && v < INT_MAX) {
        const k = 2 + (Math.floor(ds() * 10000) % 97);
        if (Math.abs(v * k) < INT_MAX) {
            // (v*k)/k = v，中间值 v*k 保持 int32 安全
            return `(((${v}*${k}))/${k})`;
        }
        return `(${v})`;
    }
    if (pick === 1 && Number.isInteger(v) && v > INT_MIN && v < INT_MAX) {
        const k = 3 + (Math.floor(ds() * 10000) % 89);
        if (v + k < INT_MAX) {
            // (v+k)-k = v，中间值 v+k 保持 int32 安全
            return `((${v}+${k})-${k})`;
        }
        return `(${v})`;
    }
    return `(${v})`;
}
function emitRuntime(seedEngine, layout, pool, opts) {
    const ds = seedEngine.derive('runtime-names');
    const digitStream = () => ds.nextU32() / 4294967296;
    const used = new Set();
    const N = {};
    const nameKeys = [
        'K', 'KN', 'ENC3', 'DEC3',
        'CACHE', 'PROGS', 'PAGES', 'PAGEMAP', 'TREES', 'IDX',
        'TAINT', 'DEAD', 'TLIM', 'DECOY',
        'FR', 'ACC', 'MULT', 'MOD', 'EXPSEED',
        'FP', 'FPC', 'EXPFP', 'FPM',
        'INV0', 'INV', 'SB', 'ISB', 'XOR',
        'ROTN', 'RM', 'RA', 'RLEV',
        'RUNA', 'RUNB', 'BUILD', 'DT', 'DTBASE',
        'FADD', 'FSUB', 'FADD2', 'FSUB2',
        'EXEC', 'MUT1', 'MSTEP', 'MUTATE',
        'STRIDE', 'OFF', 'CSZ', 'CSZM',
        'GHSH', 'GCHK', 'PAYL', 'IH0', 'IH',
        'RSEL', 'RNGS',
        'GCHECK', 'LOOPG', 'RESUMEALL', 'COROS', 'CORON',
        'GUARD', 'TRAPF', 'SYNCF', 'TICKF',
        'FAKESRC', 'FAKELINE', 'FAKELINE2',
        'TTL', 'BUILT', 'CALN', 'CALMAX', 'DNR', 'DNG', 'DN',
        'ISRBX', 'RNDG', 'DG',
        'STK', 'SCAT', 'RDROP',
        'CHK', 'CHKI', 'LASTT', 'PCOUNT',
        'RK1', 'RK2', 'i', 'v',
    ];
    for (const k of nameKeys)
        N[k] = mka(digitStream, used);
    // ============ 编译常量池程序【子系统 9/34】 ============
    const junkDs = seedEngine.derive('junk-bytes');
    const junkStream = () => junkDs.nextU32() & 0xFF;
    const compiled = [];
    for (const entry of pool) {
        const r = (0, VMCodec_1.compileCipherProgram)(layout, entry.plaintext, entry.id, junkStream);
        compiled.push({ entry, progString: r.program.bytes, ciphertext: r.ciphertext });
    }
    // ============ 分页（1KB 页，惰性解密【子系统 87】）============
    // 约束：单个常量密文不跨页（跨页会破坏 pageMap 的单段映射），
    // 放不下就开新页；VMEngine 侧已保证单条目 ≤ PAGE_SIZE。
    const PAGE_SIZE = 1024;
    const pages = [];
    const pageMap = [];
    let curPage = [];
    let curPageIdx = 1;
    for (const c of compiled) {
        const data = [...c.ciphertext];
        if (curPage.length > 0 && curPage.length + data.length > PAGE_SIZE) {
            pages.push(curPage);
            curPage = [];
            curPageIdx++;
        }
        curPage.push(...data);
        pageMap[c.entry.id] = { p: curPageIdx, s: curPage.length - data.length + 1, e: curPage.length };
        if (curPage.length >= PAGE_SIZE) {
            pages.push(curPage);
            curPage = [];
            curPageIdx++;
        }
    }
    if (curPage.length > 0)
        pages.push(curPage);
    // ============ 守卫程序（guard logic 字节码化【子系统 12】）============
    // TICK R0; JZ R0 HALT; SYNC 1; TRAP; HALT
    const guardInsns = [
        { op: VMCodec_1.OP.TICK, a: 0, b: 0 },
        { op: VMCodec_1.OP.JZ, a: 0, b: 3 },
        { op: VMCodec_1.OP.SYNC, a: 1, b: 0 },
        { op: VMCodec_1.OP.TRAP, a: 0, b: 0 },
        { op: VMCodec_1.OP.HALT, a: 0, b: 0 },
    ];
    const guardProg = (0, VMCodec_1.serializeProgram)(layout, guardInsns, 0, junkStream);
    // ============ 完整性哈希（100 分片链【子系统 70】）============
    // PAYLOAD = 全部程序字节 + 守卫程序 + 全部分页密文
    const payloadBytes = [];
    for (const c of compiled)
        payloadBytes.push(...c.progString);
    payloadBytes.push(...guardProg.bytes);
    for (const p of pages)
        payloadBytes.push(...p);
    const IH0 = 5381 + (seedEngine.derive('ih0').nextU32() % 100000);
    const sliceLen = Math.max(1, Math.ceil(payloadBytes.length / 100));
    let ih = IH0;
    for (let st = 0; st < payloadBytes.length; st += sliceLen) {
        const end = Math.min(st + sliceLen, payloadBytes.length);
        ih = (0, VMCodec_1.ghash)(payloadBytes.slice(st, end), ih);
    }
    // ============ 种子片段重组参数 ============
    const frag = seedEngine.fragmentParams();
    const fp = seedEngine.fingerprintParams();
    // 关键：操作码映射/S 盒种子必须与 buildLayout（VMCodec）一致，
    // 否则 TS 编码器与 Lua 运行时重建出不同的置换，解密全部失败。
    const lcgSeedOpMap = layout.mapSeed;
    const lcgSeedSbox = layout.sboxSeed;
    const mut1 = 2000 + (seedEngine.derive('mut1').nextU32() % 3000);
    const mstep = 2000 + (seedEngine.derive('mstep').nextU32() % 3000);
    const stride = 1 + (seedEngine.derive('stride').nextU32() % 65521);
    const off = seedEngine.derive('off').nextU32() % 65521;
    const csz = Math.max(64, pool.length * 2 + 17);
    const rotEvery = layout.rotEvery;
    const il = layout.insLen;
    const opPos = layout.opPos;
    const aPos = layout.aPos;
    const bPos = layout.bPos;
    const mds = seedEngine.derive('mba-consts');
    const mdsF = () => mds.nextU32() / 4294967296;
    // ============ 程序与分页的 Lua 数据字面量 ============
    const progDefs = compiled.map(c => `${N.PROGS}[${c.entry.id + 1}] = ${(0, VMCodec_1.bytesToLuaString)(c.progString)}`).join('\n');
    const pageDefs = pages.map((p, idx) => `${N.PAGES}[${idx + 1}] = ${(0, VMCodec_1.bytesToLuaString)(p)}`).join('\n');
    const pageMapDefs = compiled.map(c => {
        const m = pageMap[c.entry.id];
        return `${N.PAGEMAP}[${c.entry.id + 1}] = {${m.p}, ${m.s}, ${m.e}}`;
    }).join('\n');
    const fpWords = seedEngine.fingerprint;
    // 指纹 8 处嵌入值（MBA 包装，嵌入运行时 8 个不同位置）
    const fpEmbeds = fpWords.map(w => mbaConst(w % (2 ** 31 - 1), mdsF));
    // 期望指纹折叠值（与 Lua 端 fold 一致）
    let fpFold = 0;
    for (const w of fpWords)
        fpFold = (fpFold * 31 + (w % (2 ** 31 - 1))) % (2 ** 31 - 1);
    const fpExpected = (fpFold * fp.mask) % (2 ** 31 - 1);
    // ============ 诱饵全局名（随机指纹【子系统 83/86】）============
    const decoyNames = [];
    const dnDs = seedEngine.derive('decoy-names');
    for (let i = 0; i < 12; i++) {
        decoyNames.push('_' + dnDs.nextU32().toString(36).toUpperCase() + '_' + dnDs.int(1000, 9999));
    }
    const DNR = opts.intensity >= 4 ? 24 + opts.intensity * 4 : 8; // Roblox 重型
    const DNG = opts.intensity >= 4 ? 6 + opts.intensity : 4; // 通用轻型
    const CORON = Math.min(opts.coroutineCount, 300); // 硬上限 300
    const fakeSrc = '"@' + seedEngine.derive('fakesrc').tag() + '"';
    const fakeLine = 100 + (seedEngine.derive('fakeline').nextU32() % 80000);
    // RK1/RK2：三层加密密钥流【子系统 88】
    const rkDs = seedEngine.derive('remote-keys');
    const rk1 = Array.from({ length: 16 }, () => rkDs.int(1, 255));
    const rk2 = Array.from({ length: 16 }, () => rkDs.int(1, 255));
    const ttl = opts.timeBombTtl;
    const built = Math.floor(opts.builtAt / 1000);
    const taintLimit = 3;
    // ============ Lua 运行时模板 ============
    const lua = `-- GUNGNIR-ABSOLUTE GX-VM RUNTIME (polymorphic build)
-- [2/4/5/6/7/8/9/10/11/12/13/26/60/66/70/71/72/73/74/75/76/77/78/79/81/83/85/86/87/88/89]
local ${N.K}, ${N.KN}, ${N.ENC3}, ${N.DEC3}
do
local ${N.CACHE} = {}
local ${N.PROGS} = {}
local ${N.PAGES} = {}
local ${N.PAGEMAP} = {}
local ${N.TREES} = {}
local ${N.TAINT} = 0
local ${N.DEAD} = false
local ${N.EXEC} = 0
local ${N.MUT1} = ${mbaConst(mut1, mdsF)}
local ${N.MSTEP} = ${mbaConst(mstep, mdsF)}
local ${N.STRIDE} = ${mbaConst(stride, mdsF)}
local ${N.OFF} = ${mbaConst(off, mdsF)}
local ${N.CSZ} = ${mbaConst(csz, mdsF)}
local ${N.LASTT} = 0
local ${N.PCOUNT} = 0

-- [子系统 1] 种子 16 片段闭包重组（散布存储，运行时校验）
local ${N.FR} = {}
${seedEngine.fragments.map((v, i) => `${N.FR}[${i + 1}] = function(...) return ${mbaConst(v % (2 ** 31 - 1), mdsF)} end`).join('\n')}
local ${N.MULT} = ${mbaConst(frag.mult, mdsF)}
local ${N.MOD} = ${mbaConst(frag.mod, mdsF)}
local ${N.ACC} = 0
for ${N.i} = 1, 16 do
  ${N.ACC} = (${N.ACC} * ${N.MULT} + ${N.FR}[${N.i}]()) % ${N.MOD}
end
local ${N.EXPSEED} = ${mbaConst(frag.expected, mdsF)}
if ${N.ACC} ~= ${N.EXPSEED} then ${N.TAINT} = ${N.TAINT} + 1 end

-- [子系统 11] 构建指纹 8 处嵌入（防嫁接）
local ${N.FP} = {}
${fpEmbeds.map((e, i) => `${N.FP}[${i + 1}] = (function() return ${e} end)()`).join('\n')}
local ${N.FPM} = ${mbaConst(31, mdsF)}
local ${N.FPC} = 0
for ${N.i} = 1, 8 do ${N.FPC} = (${N.FPC} * ${N.FPM} + ${N.FP}[${N.i}]) % ${N.MOD} end
local ${N.EXPFP} = ${mbaConst(fpExpected, mdsF)}
if (${N.FPC} * ${mbaConst(fp.mask, mdsF)}) % ${N.MOD} ~= ${N.EXPFP} then ${N.TAINT} = ${N.TAINT} + 1 end

-- [子系统 2/38] 操作码映射与 S 盒：种子派生，二进制中不存表
local ${N.INV0} = {}
do
  local pi = {}
  for x = 0, 255 do pi[x] = x end
  local s = ${mbaConst(lcgSeedOpMap, mdsF)}
  for x = 255, 1, -1 do
    s = (s * 1664525 + 1013904223) % 4294967296
    local j = s % (x + 1)
    pi[x], pi[j] = pi[j], pi[x]
  end
  for c = 0, 31 do ${N.INV0}[pi[c]] = c end
end
local ${N.SB}, ${N.ISB} = {}, {}
do
  for x = 0, 255 do ${N.SB}[x] = x end
  local s = ${mbaConst(lcgSeedSbox, mdsF)}
  for x = 255, 1, -1 do
    s = (s * 1664525 + 1013904223) % 4294967296
    local j = s % (x + 1)
    ${N.SB}[x], ${N.SB}[j] = ${N.SB}[j], ${N.SB}[x]
  end
  for x = 0, 255 do ${N.ISB}[${N.SB}[x]] = x end
end
local ${N.XOR} = {}
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
  ${N.XOR}[a] = row
end

-- [子系统 2] 操作码轮换参数（仿射双射：奇乘子 mod 256）
local ${N.ROTN} = ${rotEvery}
local ${N.RM} = ${layout.rotMult}
local ${N.RA} = ${layout.rotAdd}
local ${N.RLEV} = 0
local ${N.INV} = ${N.INV0}
local function ${N.RSEL}()
  local ok, c = pcall(os.clock)
  if ok and c then return (math.floor(c * 1000) % 2) end
  return 0
end

-- [子系统 7/13] 算术形态（MBA 等价实现，自变异切换）
local ${N.FADD} = function(x, y) return (x + y) % 256 end
local ${N.FSUB} = function(x, y) return (x - y + 512) % 256 end
local ${N.FADD2} = function(x, y) return (x * 3 + y * 3 - (x + y + y)) % 256 end
local ${N.FSUB2} = function(x, y) return (x + 255 - y + 1) % 256 end

-- [子系统 70] 完整性哈希（100 分片链）
local function ${N.GHSH}(s, h)
  for j = 1, #s do h = (h * 33 + string.byte(s, j)) % 2147483647 end
  return h
end
local ${N.IH0} = ${mbaConst(IH0, mdsF)}
local ${N.IH} = ${mbaConst(ih, mdsF)}
local function ${N.GCHK}()
  local pl = ${N.PAYL}
  if not pl or #pl == 0 then return true end
  local h = ${N.IH0}
  local n = #pl
  local sl = math.ceil(n / 100)
  local st = 1
  while st <= n do
    h = ${N.GHSH}(string.sub(pl, st, math.min(st + sl - 1, n)), h)
    st = st + sl
  end
  return h == ${N.IH}
end

-- [子系统 12] 守卫程序（guard logic 字节码化）：TICK/JZ/SYNC/TRAP
local ${N.GUARD} = ${(0, VMCodec_1.bytesToLuaString)(guardProg.bytes)}

-- [子系统 74] 时间炸弹
do
  local ttl = ${mbaConst(ttl, mdsF)}
  if ttl > 0 then
    local now = nil
    local ok1, t1 = pcall(function() return tick() end)
    if ok1 and type(t1) == 'number' then now = t1 end
    if not now then
      local ok2, t2 = pcall(os.time)
      if ok2 and type(t2) == 'number' then now = t2 end
    end
    if now and now > ${mbaConst(built + ttl, mdsF)} then ${N.DEAD} = true end
  end
end

-- [子系统 60] 环境表白名单沙盒
do
  local okge, env = pcall(function() return getfenv and getfenv(1) or _G end)
  if okge and type(env) == 'table' then
    local must = { {'pcall','function'}, {'string','table'}, {'math','table'}, {'type','function'}, {'select','function'} }
    for _, m in ipairs(must) do
      local okv, v = pcall(function() return env[m[1]] end)
      if not okv or type(v) ~= m[2] then ${N.TAINT} = ${N.TAINT} + 1 end
    end
  end
end

-- [子系统 77] 反钩子：debug.gethook 预置检测
do
  local ok, h = pcall(function() return debug and debug.gethook and debug.gethook() end)
  if ok and h ~= nil then ${N.TAINT} = ${N.TAINT} + 1 end
end

-- [子系统 72] 时序侧信道：校准环执行时间检测
do
  local ok0, c0 = pcall(os.clock)
  if ok0 and type(c0) == 'number' then
    local x = 0
    for j = 1, ${mbaConst(20000 + layout.paramScheme * 1000, mdsF)} do x = (x * 33 + j) % 2147483647 end
    local ok1, c1 = pcall(os.clock)
    if ok1 and type(c1) == 'number' then
      if (c1 - c0) > ${mbaConst(1.0 + layout.paramScheme * 0.1, mdsF)} then ${N.TAINT} = ${N.TAINT} + 1 end
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
      if t1 < t0 or (t1 - t0) > 60 then ${N.TAINT} = ${N.TAINT} + 1 end
    end
  end
end

-- [子系统 73] 环境全局对象篡改检测（仅 Roblox 环境生效）
local ${N.ISRBX} = (function()
  local ok, g = pcall(function() return game end)
  return ok and g ~= nil
end)()
if ${N.ISRBX} then
  local ok2, t = pcall(function() return type(game) end)
  if ok2 and t ~= 'userdata' and t ~= 'table' then ${N.TAINT} = ${N.TAINT} + 1 end
  local ok3, ws = pcall(function() return game.GetService and game:GetService('Workspace') end)
  if not ok3 or ws == nil then ${N.TAINT} = ${N.TAINT} + 1 end
end

-- [子系统 78] 调试库污染：debug.getinfo 返回伪造源/行号
do
  local ok, gi = pcall(function() return debug and debug.getinfo end)
  if ok and type(gi) == 'function' then
    pcall(function()
      debug.getinfo = function(f, w)
        local info = gi(f, w)
        if type(info) == 'table' then
          info.source = ${fakeSrc}
          if info.short_src ~= nil then info.short_src = ${fakeSrc} end
          info.currentline = ${fakeLine}
          if info.linedefined ~= nil then info.linedefined = ${fakeLine + 7} end
        end
        return info
      end
    end)
  end
end

-- [子系统 83/86] Dark Dex 诱饵实例树 + 反收录随机指纹
local ${N.DG} = {}
do
  local dnames = {${decoyNames.map(d => `'${d}'`).join(', ')}}
  ${N.DN} = ${N.ISRBX} and ${DNR} or ${DNG}
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
          __tostring = function() return ${fakeSrc} end,
          __metatable = 'The metatable is locked',
        })
        rawset(_G, nm, proxy)
        ${N.DG}[#${N.DG} + 1] = nm
      end
    end)
  end
end

-- [子系统 6] 双解释器：runA（if 链，线性字节串）/ runB（链表树 + 分发表）
local ${N.DT} = {}
local ${N.DTBASE} = ${N.DT}
local ${N.STK} = {}
local ${N.SCAT} = {}

local function ${N.BUILD}(progStr)
  local n = string.byte(progStr, 2) + string.byte(progStr, 3) * 256
  local idx = {}
  local head, prev
  local inv = ${N.INV0}
  local level = 0
  local cnt = 0
  for i = 0, n - 1 do
    local lv = math.floor(i / ${N.ROTN})
    while level < lv do
      local ni = {}
      for w = 0, 255 do ni[(${N.RM} * w + ${N.RA}) % 256] = inv[w] end
      inv = ni
      level = level + 1
    end
    local base = 4 + i * ${il}
    local w = string.byte(progStr, base + ${opPos})
    local node = { op = inv[w], a = string.byte(progStr, base + ${aPos}), b = string.byte(progStr, base + ${bPos}), nx = nil }
    if head == nil then head = node else prev.nx = node end
    prev = node
    idx[i] = node
    cnt = cnt + 1
  end
  return { head = head, idx = idx, dt = ${N.DTBASE}, n = cnt }
end

-- [子系统 8] 运行时指令置换：树节点段等价重写
local function ${N.RDROP}(tr)
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
local ${N.MUTATE}
${N.MUTATE} = function()
  ${N.MUT1} = ${N.MUT1} + ${N.MSTEP}
  -- (a) 算法形态切换（FADD/FSUB 等价实现互换）
  if (${N.EXEC} % 2) == 0 then
    ${N.FADD}, ${N.FADD2} = ${N.FADD2}, ${N.FADD}
  else
    ${N.FSUB}, ${N.FSUB2} = ${N.FSUB2}, ${N.FSUB}
  end
  -- (b) 树程序操作码对换 + 独立分发表重排（语义保持）
  local seen = 0
  for id, tr in pairs(${N.TREES}) do
    if seen >= 4 then break end
    if tr.dt == ${N.DTBASE} then
      local cp = {}
      for k, v in pairs(${N.DTBASE}) do cp[k] = v end
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
    ${N.RDROP}(tr)
    seen = seen + 1
  end
  -- (d) 缓存洗牌【子系统 10】
  local old = ${N.CACHE}
  local fresh = {}
  local shift = 1 + math.floor(${N.EXEC} % (${N.CSZ} - 1))
  for kk, vv in pairs(old) do
    fresh[((kk + shift - 1) % ${N.CSZ}) + 1] = vv
  end
  ${N.CACHE} = fresh
  -- (e) 程序重编码（新字符串对象，改变内存指纹）
  local ids = {}
  for idd in pairs(${N.PROGS}) do ids[#ids + 1] = idd end
  if #ids > 0 then
    local pick = ids[1 + math.floor(${N.EXEC} % #ids)]
    local ps = ${N.PROGS}[pick]
    if ps ~= nil then
      local rebuilt = {}
      local w = #ps
      for j = 1, w do rebuilt[j] = string.char(string.byte(ps, j)) end
      ${N.PROGS}[pick] = table.concat(rebuilt)
    end
  end
end

-- runA：if 链分发（线性字节串 + 指令索引轮换）
local function ${N.RUNA}(prog, src, want)
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
    local lv = math.floor(pc / ${N.ROTN})
    if lv ~= level then
      inv = ${N.INV0}
      local st2 = 0
      while st2 < lv do
        local ni = {}
        for w = 0, 255 do ni[(${N.RM} * w + ${N.RA}) % 256] = inv[w] end
        inv = ni
        st2 = st2 + 1
      end
      level = lv
      ${N.INV} = inv
    end
    local base = 4 + pc * ${il}
    local w = string.byte(prog, base + ${opPos})
    local op = inv[w]
    local a = string.byte(prog, base + ${aPos})
    local b = string.byte(prog, base + ${bPos})
    ${N.EXEC} = ${N.EXEC} + 1
    ${N.PCOUNT} = ${N.PCOUNT} + 1
    if ${N.EXEC} > ${N.MUT1} then ${N.MUTATE}() end
    local jumped = false
    if op == 13 then pc = b; jumped = true
    elseif op == 14 then if R[a + 1] == 0 then pc = b; jumped = true end
    elseif op == 15 then if R[a + 1] ~= 0 then pc = b; jumped = true end
    elseif op == 1 then break
    elseif op == 2 then R[a + 1] = b
    elseif op == 3 then local ix = R[b + 1] + 1; R[a + 1] = string.byte(src, ix) or 0
    elseif op == 4 then R[a + 1] = ${N.XOR}[R[a + 1]][R[b + 1]]
    elseif op == 5 then R[a + 1] = ${N.FADD}(R[a + 1], R[b + 1])
    elseif op == 6 then R[a + 1] = ${N.FSUB}(R[a + 1], R[b + 1])
    elseif op == 7 then R[a + 1] = (R[a + 1] * R[b + 1]) % 256
    elseif op == 8 then R[a + 1] = ${N.SB}[R[a + 1]]
    elseif op == 9 then R[a + 1] = ${N.ISB}[R[a + 1]]
    elseif op == 10 then local t = R[a + 1]; R[a + 1] = R[b + 1]; R[b + 1] = t
    elseif op == 11 then R[a + 1] = R[b + 1]
    elseif op == 12 then OUT[#OUT + 1] = string.char(R[a + 1])
    elseif op == 16 then R[a + 1] = ${N.FADD}(R[a + 1], b)
    elseif op == 17 then R[a + 1] = ${N.XOR}[R[a + 1]][b]
    elseif op == 18 then local v = R[a + 1]; R[a + 1] = ((v * 2) % 256) + math.floor(v / 128)
    elseif op == 19 then local v = R[a + 1]; R[a + 1] = math.floor(v / 2) + (v % 2) * 128
    elseif op == 20 then R[a + 1] = R[a + 1] + 1
    elseif op == 21 then R[a + 1] = R[a + 1] - 1
    elseif op == 22 then ${N.STK}[#${N.STK} + 1] = R[a + 1]
    elseif op == 23 then R[a + 1] = ${N.STK}[#${N.STK}] or 0; ${N.STK}[#${N.STK}] = nil
    elseif op == 24 then R[a + 1] = ${N.SCAT}[a] or 0
    elseif op == 25 then ${N.SCAT}[a] = R[b + 1]
    elseif op == 26 then R[a + 1] = (R[a + 1] == R[b + 1]) and 1 or 0
    elseif op == 27 then R[a + 1] = (R[a + 1] ~= R[b + 1]) and 1 or 0
    elseif op == 28 then R[a + 1] = (R[a + 1] == b) and 1 or 0
    elseif op == 29 then ${N.EXEC} = ${N.EXEC} + a
    elseif op == 30 then R[a + 1] = (${N.DEAD} or ${N.TAINT} > ${taintLimit}) and 1 or 0
    elseif op == 31 then ${N.TAINT} = ${N.TAINT} + 1; ${N.CACHE}[1] = nil
    end
    if not jumped then pc = pc + 1 end
    if want and #OUT >= want then break end
  end
  return table.concat(OUT)
end

-- runB：表驱动 + 链表树
${N.DT}[1] = function(nd, R, OUT) return true end
${N.DT}[2] = function(nd, R) R[nd.a + 1] = nd.b end
${N.DT}[3] = function(nd, R, OUT, src) R[nd.a + 1] = string.byte(src, R[nd.b + 1] + 1) or 0 end
${N.DT}[4] = function(nd, R) R[nd.a + 1] = ${N.XOR}[R[nd.a + 1]][R[nd.b + 1]] end
${N.DT}[5] = function(nd, R) R[nd.a + 1] = ${N.FADD}(R[nd.a + 1], R[nd.b + 1]) end
${N.DT}[6] = function(nd, R) R[nd.a + 1] = ${N.FSUB}(R[nd.a + 1], R[nd.b + 1]) end
${N.DT}[7] = function(nd, R) R[nd.a + 1] = (R[nd.a + 1] * R[nd.b + 1]) % 256 end
${N.DT}[8] = function(nd, R) R[nd.a + 1] = ${N.SB}[R[nd.a + 1]] end
${N.DT}[9] = function(nd, R) R[nd.a + 1] = ${N.ISB}[R[nd.a + 1]] end
${N.DT}[10] = function(nd, R) local t = R[nd.a + 1]; R[nd.a + 1] = R[nd.b + 1]; R[nd.b + 1] = t end
${N.DT}[11] = function(nd, R) R[nd.a + 1] = R[nd.b + 1] end
${N.DT}[12] = function(nd, R, OUT) OUT[#OUT + 1] = string.char(R[nd.a + 1]) end
${N.DT}[16] = function(nd, R) R[nd.a + 1] = ${N.FADD}(R[nd.a + 1], nd.b) end
${N.DT}[17] = function(nd, R) R[nd.a + 1] = ${N.XOR}[R[nd.a + 1]][nd.b] end
${N.DT}[18] = function(nd, R) local v = R[nd.a + 1]; R[nd.a + 1] = ((v * 2) % 256) + math.floor(v / 128) end
${N.DT}[19] = function(nd, R) local v = R[nd.a + 1]; R[nd.a + 1] = math.floor(v / 2) + (v % 2) * 128 end
${N.DT}[20] = function(nd, R) R[nd.a + 1] = R[nd.a + 1] + 1 end
${N.DT}[21] = function(nd, R) R[nd.a + 1] = R[nd.a + 1] - 1 end
${N.DT}[22] = function(nd, R) ${N.STK}[#${N.STK} + 1] = R[nd.a + 1] end
${N.DT}[23] = function(nd, R) R[nd.a + 1] = ${N.STK}[#${N.STK}] or 0; ${N.STK}[#${N.STK}] = nil end
${N.DT}[24] = function(nd, R) R[nd.a + 1] = ${N.SCAT}[nd.a] or 0 end
${N.DT}[25] = function(nd, R) ${N.SCAT}[nd.a] = R[nd.b + 1] end
${N.DT}[26] = function(nd, R) R[nd.a + 1] = (R[nd.a + 1] == R[nd.b + 1]) and 1 or 0 end
${N.DT}[27] = function(nd, R) R[nd.a + 1] = (R[nd.a + 1] ~= R[nd.b + 1]) and 1 or 0 end
${N.DT}[28] = function(nd, R) R[nd.a + 1] = (R[nd.a + 1] == nd.b) and 1 or 0 end
${N.DT}[29] = function(nd) ${N.EXEC} = ${N.EXEC} + nd.a end
${N.DT}[30] = function(nd, R) R[nd.a + 1] = (${N.DEAD} or ${N.TAINT} > ${taintLimit}) and 1 or 0 end
${N.DT}[31] = function(nd) ${N.TAINT} = ${N.TAINT} + 1; ${N.CACHE}[1] = nil end

local function ${N.RUNB}(id, src, want)
  local tr = ${N.TREES}[id]
  if tr == nil then
    local ok, t = pcall(${N.BUILD}, ${N.PROGS}[id + 1])
    if ok and t ~= nil then
      tr = t
      ${N.TREES}[id] = tr
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
    ${N.EXEC} = ${N.EXEC} + 1
    ${N.PCOUNT} = ${N.PCOUNT} + 1
    if ${N.EXEC} > ${N.MUT1} then ${N.MUTATE}() end
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
${pageDefs}
${progDefs}
${N.PROGS}[0] = ${(0, VMCodec_1.bytesToLuaString)(guardProg.bytes)}
${pageMapDefs}
${N.PAYL} = nil
do
  local parts = {}
  for j = 1, #${N.PROGS} do
    if ${N.PROGS}[j] ~= nil then parts[#parts + 1] = ${N.PROGS}[j] end
  end
  parts[#parts + 1] = ${N.GUARD}
  for j = 1, #${N.PAGES} do parts[#parts + 1] = ${N.PAGES}[j] end
  ${N.PAYL} = table.concat(parts)
end

-- [子系统 81] 反篡改触发链：完整性 → 缓存布局数据流耦合
if not ${N.GCHK}() then
  ${N.TAINT} = ${N.TAINT} + 2
  ${N.STRIDE} = (${N.STRIDE} * 33 + ${N.IH}) % 65521
  ${N.OFF} = (${N.OFF} + ${N.IH}) % 65521
end

-- [子系统 12] 守卫程序执行（时间炸弹状态 → VM 字节码路径）
do
  local ok = pcall(${N.RUNA}, ${N.GUARD}, '', 0)
  if not ok then ${N.TAINT} = ${N.TAINT} + 1 end
end

-- [子系统 9/34] 常量取值：VM 解密 + 随机缓存槽 + 惰性分页
-- 注意：此处必须赋值给块级 local（第 3 行声明的 K/KN），不能 local function
-- 否则载荷（do 块外的代码）看不到 K，调用得到 nil
${N.K} = function(id)
  local slot = ((id * ${N.STRIDE} + ${N.OFF}) % ${N.CSZ}) + 1
  local v = ${N.CACHE}[slot]
  if v ~= nil then return v end
  if ${N.DEAD} then return '\\1DEAD\\2' end
  if ${N.TAINT} > ${taintLimit} then return '\\1TNT\\2' end
  -- 注意：PROGS/PAGEMAP 以 Lua 1-based 键存储（id+1），PROGS[0] 为守卫程序
  local prog = ${N.PROGS}[id + 1]
  if prog == nil then return nil end
  local pm = ${N.PAGEMAP}[id + 1]
  if pm == nil then return nil end
  local src = string.sub(${N.PAGES}[pm[1]], pm[2], pm[3])
  local mode = string.byte(prog, 1)
  if mode == 2 then mode = ${N.RSEL}() + 1 end
  local ok, out
  if mode == 1 then
    ok, out = pcall(${N.RUNB}, id, src, #src)
  else
    ok, out = pcall(${N.RUNA}, prog, src, #src)
  end
  if not ok or out == nil then
    ${N.TAINT} = ${N.TAINT} + 1
    return nil
  end
  ${N.CACHE}[slot] = out
  -- [子系统 76] 周期性内存自校验（每 10 秒）
  local okc, now = pcall(os.clock)
  if okc and type(now) == 'number' and (now - ${N.LASTT}) > 10 then
    ${N.LASTT} = now
    if not ${N.GCHK}() then ${N.TAINT} = ${N.TAINT} + 2 end
  end
  return out
end
${N.KN} = function(id) return tonumber(${N.K}(id)) end

-- [子系统 88] Remote 调用三层加密助手（XOR 流 + ADD 流 + S 盒）
local ${N.RK1} = {${rk1.join(', ')}}
local ${N.RK2} = {${rk2.join(', ')}}
${N.ENC3} = function(s)
  local out = {}
  for j = 1, #s do
    local b = string.byte(s, j)
    b = ${N.XOR}[b][${N.RK1}[((j - 1) % #${N.RK1}) + 1]]
    b = (b + ${N.RK2}[((j - 1) % #${N.RK2}) + 1]) % 256
    b = ${N.SB}[b]
    out[j] = string.char(b)
  end
  return table.concat(out)
end
${N.DEC3} = function(s)
  local out = {}
  for j = 1, #s do
    local b = ${N.ISB}[string.byte(s, j)]
    b = (b - ${N.RK2}[((j - 1) % #${N.RK2}) + 1] + 256) % 256
    b = ${N.XOR}[b][${N.RK1}[((j - 1) % #${N.RK1}) + 1]]
    out[j] = string.char(b)
  end
  return table.concat(out)
end

-- [子系统 26/76/89] 协程风暴 + 守卫 + 帧序扰乱
local ${N.COROS} = {}
local ${N.CORON} = ${mbaConst(CORON, mdsF)}
local function ${N.RESUMEALL}(list)
  for rounds = 1, 3 do
    for j = 1, #list do
      pcall(coroutine.resume, list[j])
    end
  end
end
do
  local n = ${N.CORON}
  if n > 300 then n = 300 end
  for j = 1, n do
    local ok, co = pcall(coroutine.create, function()
      local x = j
      for k2 = 1, 4 do
        x = (x * 33 + k2) % 2147483647
        coroutine.yield(x)
      end
    end)
    if ok then ${N.COROS}[#${N.COROS} + 1] = co end
  end
end
local ${N.GCHECK}
${N.GCHECK} = function()
  if not ${N.GCHK}() then
    ${N.TAINT} = ${N.TAINT} + 2
    ${N.STRIDE} = (${N.STRIDE} * 33 + ${N.IH}) % 65521
  end
  pcall(${N.RUNA}, ${N.GUARD}, '', 0)
end
local ${N.LOOPG}
${N.LOOPG} = function()
  while true do
    ${N.GCHECK}()
    pcall(function() task.wait(10) end)
    coroutine.yield()
  end
end
do
  local okTask, task = pcall(function() return task end)
  if okTask and task and type(task) == 'table' then
    pcall(function() task.defer(function() ${N.RESUMEALL}(${N.COROS}) end) end)
    pcall(function() task.delay(${1 + (layout.paramScheme % 5)}, ${N.GCHECK}) end)
    pcall(function() task.spawn(function() ${N.LOOPG}() end) end)
  else
    local okCo, co = pcall(coroutine.create, ${N.LOOPG})
    if okCo then pcall(coroutine.resume, co) end
    pcall(${N.RESUMEALL}, ${N.COROS})
  end
end

end
`;
    // 声明 PAYL 变量（模板中在使用前需要 local 声明）
    const fixed = lua.replace(`local ${N.CACHE} = {}`, `local ${N.CACHE} = {}\nlocal ${N.PAYL} = nil`).replace(`-- 常量池数据（分页密文【子系统 87】+ 程序 + 页映射）`, `-- 常量池数据（分页密文【子系统 87】+ 程序 + 页映射）\n-- PAYL 完整性载体【子系统 70】`);
    // 移除模板内 PAYL 的重复声明（do 块中的赋值前不能再次 local）
    const cleaned = fixed.replace(`${N.PAYL} = nil\ndo\n  local parts`, `do\n  local parts`);
    const prologue = cleaned;
    const epilogue = `-- GUNGNIR EPILOGUE: 反篡改终检
do
  local ok, v = pcall(${N.K}, 0)
  if not ok or v == nil then v = nil end
end`;
    return {
        prologue,
        epilogue,
        fetchString: N.K,
        fetchNumber: N.KN,
        encRemote: N.ENC3,
        decRemote: N.DEC3,
        layout,
        poolSize: pool.length,
        programBytes: payloadBytes.length,
        pageBytes: pages.reduce((a, p) => a + p.length, 0),
        integrityHash: ih,
    };
}
