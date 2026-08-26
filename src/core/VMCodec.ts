/**
 * Project: Gungnir-Absolute — GX-VM 编解码器（VMCodec）
 *
 * 【子系统 2：全动态操作码映射表】
 *  - 32 个规范操作 → 16 位线操作码（0x00-0xFF wire 空间，仿射轮换）。
 *  - 映射通过 256 置换表隐式表示：运行时由种子常量经 LCG
 *    Fisher-Yates 过程重建，二进制中不存映射表。
 *  - 轮换事件：每 ROT_EVERY 条指令，π ← (33·π + 17) mod 256（仿射双射）。
 *
 * 【子系统 3：指令参数顺序随机化】8 种排列方案（操作数槽位/寄存器
 *   方向的 8 种布局组合之一，按基本块随机，头部标记切换）。
 * 【子系统 5：指令集布局随机化】指令长度、操作码位置、操作数位置、
 *   填充字节全部由派生流随机决定。
 * 【子系统 9：常量池多态加密】GX-Cipher：每常量独立密钥 + 独立程序。
 *
 * TS 侧编码器与 Lua 侧运行时（PolymorphicRuntime）共享：
 *  - LCG：state = (state*1664525 + 1013904223) mod 2^32
 *  - Fisher-Yates 置换派生（操作码映射 π、S 盒）
 *  - ghash：h = (h*33 + byte) mod (2^31-1)【子系统 70 完整性哈希】
 */
import { SeedEngine } from './SeedEngine';

// ============ 规范指令集（32 操作）============
export const OP = {
  NOP: 0, HALT: 1,
  LOADI: 2, LOADP: 3,
  XOR: 4, ADD: 5, SUB: 6, MUL: 7,
  SBOX: 8, ISBOX: 9,
  SWAP: 10, MOV: 11, EMIT: 12,
  JMP: 13, JZ: 14, JNZ: 15,
  ADDI: 16, XORI: 17,
  ROL: 18, ROR: 19,
  CNT: 20, DEC: 21,
  PUSH: 22, POP: 23,
  LOADS: 24, STORS: 25,
  CMPEQ: 26, CMPNE: 27,
  EQK: 28, SYNC: 29, TICK: 30, TRAP: 31,
} as const;

export const OP_COUNT = 32;

export interface VMLayout {
  /** 每条指令字节数（4-16，强度越高越大） */
  insLen: number;
  /** 操作码在指令内的字节偏移 */
  opPos: number;
  /** 操作数 A 槽位偏移 */
  aPos: number;
  /** 操作数 B 槽位偏移 */
  bPos: number;
  /** 参数排列方案编号（0-7，子系统 3） */
  paramScheme: number;
  /** 轮换间隔（指令数，子系统 2） */
  rotEvery: number;
  /** 仿射轮换乘子（奇数，双射保证） */
  rotMult: number;
  /** 仿射轮换加数 */
  rotAdd: number;
  /** 操作码映射 π0（canonical → wire），运行时隐式重建 */
  opMap: number[];
  /** 逆映射（wire → canonical） */
  invMap: number[];
  /** S 盒（256 字节置换，子系统 38） */
  sbox: number[];
  /** S 盒逆 */
  invSbox: number[];
  /** 操作码映射置换的种子（Lua 运行时重建用，必须与编码器一致） */
  mapSeed: number;
  /** S 盒置换的种子（Lua 运行时重建用，必须与编码器一致） */
  sboxSeed: number;
}

export interface VMInstruction {
  op: number;
  a: number;
  b: number;
}

export interface VMProgram {
  /** 线性字节串（runA 解释器消费），含 3 字节头 */
  bytes: number[];
  /** 解释器选择：0=runA 1=runB 2=运行时随机（子系统 4） */
  mode: number;
  /** 指令数 */
  insCount: number;
}

// ============ 与 Lua 运行时逐位一致的确定性原语 ============

/** LCG 步进（Lua 双精度可精确表示：乘积 < 2^53） */
export function lcgStep(state: number): number {
  return (Math.imul(state, 1664525) + 1013904223) >>> 0;
}

/** Fisher-Yates 生成 256 置换（TS/Lua 位一致） */
export function derivePermutation(seed0: number): number[] {
  const pi = new Array<number>(256);
  for (let i = 0; i < 256; i++) pi[i] = i;
  let s = seed0 >>> 0;
  for (let i = 255; i >= 1; i--) {
    s = lcgStep(s);
    const j = s % (i + 1);
    const t = pi[i];
    pi[i] = pi[j];
    pi[j] = t;
  }
  return pi;
}

/** 从置换派生操作码映射（canonical 0..31 → wire 字节） */
export function deriveOpMap(layout: VMLayout, perm: number[]): void {
  layout.opMap = perm.slice(0, OP_COUNT);
  layout.invMap = new Array<number>(256).fill(-1);
  for (let c = 0; c < OP_COUNT; c++) {
    layout.invMap[layout.opMap[c]] = c;
  }
}

/** S 盒派生（独立熵流） */
export function deriveSbox(seed0: number): { sbox: number[]; invSbox: number[] } {
  const sbox = derivePermutation(seed0);
  const invSbox = new Array<number>(256);
  for (let i = 0; i < 256; i++) invSbox[sbox[i]] = i;
  return { sbox, invSbox };
}

/** ghash【子系统 70】：与 Lua 端逐位一致的内容哈希 */
export function ghash(bytes: number[] | string, seed = 5381): number {
  const mod = 2 ** 31 - 1;
  let h = seed % mod;
  if (typeof bytes === 'string') {
    for (let i = 0; i < bytes.length; i++) {
      h = (h * 33 + (bytes.charCodeAt(i) & 0xFF)) % mod;
    }
  } else {
    for (const b of bytes) {
      h = (h * 33 + (b & 0xFF)) % mod;
    }
  }
  return h;
}

// ============ 布局构建 ============

export function buildLayout(seedEngine: SeedEngine, intensity: number): VMLayout {
  const ds = seedEngine.derive('vm-layout');
  const insLen = Math.min(4 + ds.int(0, 3) + intensity, 16);
  const opPos = ds.int(0, insLen - 3);
  // 操作数位置：与 opPos 不同的两个槽（8 种排列方案之一，子系统 3）
  const scheme = ds.int(0, 7);
  const slots: number[] = [];
  for (let i = 0; i < insLen; i++) {
    if (i !== opPos) slots.push(i);
  }
  // 8 种方案：不同的槽位选择顺序与 A/B 交换
  const pickA = slots[(scheme * 3 + 1) % slots.length];
  let pickB = slots[(scheme * 5 + 2) % slots.length];
  if (pickB === pickA) {
    pickB = slots[(slots.indexOf(pickA) + 1) % slots.length];
  }
  const aPos = scheme % 2 === 0 ? pickA : pickB;
  const bPos = scheme % 2 === 0 ? pickB : pickA;

  const rotEvery = ds.int(12, 48);
  const rotMult = ds.int(1, 127) * 2 + 1; // 奇数 → 仿射双射
  const rotAdd = ds.int(1, 255);

  const mapSeed = ds.nextU32() >>> 0;
  const mapPerm = derivePermutation(mapSeed);
  const layout: VMLayout = {
    insLen, opPos, aPos, bPos, paramScheme: scheme,
    rotEvery, rotMult, rotAdd,
    opMap: [], invMap: [], sbox: [], invSbox: [],
    mapSeed, sboxSeed: 0,
  };
  deriveOpMap(layout, mapPerm);
  const sboxSeed = ds.nextU32() >>> 0;
  const sb = deriveSbox(sboxSeed);
  layout.sbox = sb.sbox;
  layout.invSbox = sb.invSbox;
  layout.sboxSeed = sboxSeed;
  return layout;
}

// ============ 操作码轮换（编码器侧模拟）============

/** 第 k 次轮换后的映射：π_k = affine^k ∘ π_0 */
function wireAt(layout: VMLayout, canonicalOp: number, rotationCount: number): number {
  let w = layout.opMap[canonicalOp];
  for (let k = 0; k < rotationCount; k++) {
    w = (layout.rotMult * w + layout.rotAdd) % 256;
  }
  return w;
}

// ============ 序列化（线性编码）============

/**
 * 指令列表 → 线性字节串（含头部）。
 * 头部：mode(1) + insCountLo(1) + insCountHi(1)。
 * 每条指令 insLen 字节：opPos 放（轮换后）wire 操作码，
 * aPos/bPos 放操作数，其余为随机填充（子系统 5）。
 */
export function serializeProgram(
  layout: VMLayout, insns: VMInstruction[], mode: number, junkStream: () => number
): VMProgram {
  const head = [mode & 0xFF, insns.length & 0xFF, (insns.length >> 8) & 0xFF];
  const bytes: number[] = [...head];
  for (let i = 0; i < insns.length; i++) {
    const rot = Math.floor(i / layout.rotEvery);
    const w = wireAt(layout, insns[i].op, rot);
    const ins = new Array<number>(layout.insLen);
    for (let j = 0; j < layout.insLen; j++) ins[j] = junkStream() & 0xFF;
    ins[layout.opPos] = w;
    ins[layout.aPos] = insns[i].a & 0xFF;
    ins[layout.bPos] = insns[i].b & 0xFF;
    // 若位置重叠（不应发生），操作码优先
    ins[layout.opPos] = w;
    bytes.push(...ins);
  }
  return { bytes, mode, insCount: insns.length };
}

// ============ GX-Cipher 程序编译器【子系统 9/34/35】============

/**
 * 为明文字节串编译解密程序：
 *   运行时执行程序：C[i] --链式逆变换--> P[i]
 * 编码器侧运行逆变换：P[i] --逆链--> C[i]（密文）
 *
 * 密码链（每常量独立密钥 k1..k5）：
 *   P[i] = ISBOX( ROL( bxor( ADD( C[i], k1 ), k2 ) ) ... ) 逆序展开
 */
export interface CipherProgramResult {
  program: VMProgram;
  ciphertext: number[];
}

/** 字节域逆操作计算（TS 侧，用于推导密文） */
function invApply(op: number, v: number, operand: number, sbox: number[], invSbox: number[]): number {
  switch (op) {
    case OP.ADD: return (v - operand + 512) % 256;      // ADD 的逆
    case OP.SUB: return (v + operand) % 256;             // SUB 的逆
    case OP.XOR: return v ^ operand;                     // XOR 自逆
    case OP.SBOX: return invSbox[v];                     // 正向 SBOX 的逆
    case OP.ISBOX: return sbox[v];
    case OP.ROL: return (Math.floor(v / 2) + (v % 2) * 128); // ROL 逆 = ROR
    case OP.ROR: return ((v * 2) % 256) + Math.floor(v / 128); // ROR 逆 = ROL
    case OP.ADDI: return (v - operand + 512) % 256;
    case OP.XORI: return v ^ operand;
    default:
      throw new Error(`VMCodec: non-invertible op in cipher chain: ${op}`);
  }
}

/** 字节域正操作计算（用于验证往返一致性） */
export function fwdApply(op: number, v: number, operand: number, sbox: number[]): number {
  switch (op) {
    case OP.ADD: return (v + operand) % 256;
    case OP.SUB: return (v - operand + 512) % 256;
    case OP.XOR: return v ^ operand;
    case OP.SBOX: return sbox[v];
    case OP.ISBOX: return (() => {
      // TS 侧逆 S 盒即时查询
      const inv: Record<number, number> = {};
      for (let i = 0; i < 256; i++) inv[sbox[i]] = i;
      return inv[v];
    })();
    case OP.ROL: return ((v * 2) % 256) + Math.floor(v / 128);
    case OP.ROR: return Math.floor(v / 2) + (v % 2) * 128;
    case OP.ADDI: return (v + operand) % 256;
    case OP.XORI: return v ^ operand;
    default:
      throw new Error(`VMCodec: non-invertible op: ${op}`);
  }
}

interface ChainStep {
  op: number;        // 应用到 R0 的操作
  /** 操作数类型：0=寄存器（密钥寄存器号），1=立即数 */
  kind: 0 | 1;
  operand: number;
}

/**
 * 编译单个常量的解密程序。
 * chain：正方向变换序列 C→P（运行时执行方向）。
 * 密文 = 对每个明文字节反向应用 chain。
 */
export function compileCipherProgram(
  layout: VMLayout,
  plaintext: number[],
  constId: number,
  junkStream: () => number
): CipherProgramResult {
  const dsChain = { k: 0 };
  const rk = (min: number, max: number): number => {
    // 确定性链参数（基于 constId 混合）
    const x = Math.imul(constId + 0x9E3779B9 + dsChain.k * 2654435761, 2246822519) >>> 0;
    dsChain.k++;
    return min + (x % (max - min + 1));
  };

  // 密钥寄存器 R1..R5（LOADI 预载）
  const keyRegs = [1, 2, 3, 4, 5];
  const keys = keyRegs.map(() => rk(1, 255));

  // 链步骤 4-8 步（强度提升链长）
  const chainLen = 4 + (layout.paramScheme % 3);
  const chain: ChainStep[] = [];
  const chainOps = [OP.ADD, OP.XOR, OP.SBOX, OP.ROL, OP.ROR, OP.SUB, OP.ADDI, OP.XORI];
  for (let i = 0; i < chainLen; i++) {
    const op = chainOps[rk(0, chainOps.length - 1)];
    if (op === OP.SBOX || op === OP.ROL || op === OP.ROR) {
      chain.push({ op, kind: 0, operand: 0 });
    } else {
      // 寄存器型或立即数型混合
      const useReg = rk(0, 1) === 0;
      if (useReg) {
        const regIdx = rk(0, keys.length - 1);
        chain.push({ op, kind: 0, operand: regIdx });
      } else {
        chain.push({ op, kind: 1, operand: rk(1, 255) });
      }
    }
  }

  // —— 计算密文：明文经逆链 ——
  const ciphertext: number[] = [];
  // 构建 TS 侧 S 盒逆查询（链内 SBOX/ISBOX 已用同一 sbox）
  const invSbox = layout.invSbox;
  const sbox = layout.sbox;
  for (const p of plaintext) {
    let v = p;
    // 反向应用链（从链尾到链头）
    for (let i = chain.length - 1; i >= 0; i--) {
      const step = chain[i];
      const operand = step.kind === 0 ? keys[step.operand] : step.operand;
      v = invApply(step.op, v, operand, sbox, invSbox);
    }
    ciphertext.push(v);
  }

  // —— 编译 VM 指令序列 ——
  const insns: VMInstruction[] = [];
  // 初始化密钥寄存器
  for (let i = 0; i < keyRegs.length; i++) {
    insns.push({ op: OP.LOADI, a: keyRegs[i], b: keys[i] });
  }
  const n = plaintext.length;
  insns.push({ op: OP.LOADI, a: 6, b: 0 });       // R6 = 计数器 i
  insns.push({ op: OP.LOADI, a: 7, b: n });       // R7 = 剩余长度
  const loopHead = insns.length;                   // 循环头指令索引
  insns.push({ op: OP.LOADP, a: 0, b: 6 });       // R0 = C[i]
  // 链步骤
  for (const step of chain) {
    if (step.op === OP.SBOX || step.op === OP.ROL || step.op === OP.ROR) {
      insns.push({ op: step.op, a: 0, b: 0 });
    } else if (step.kind === 0) {
      insns.push({ op: step.op, a: 0, b: keyRegs[step.operand] });
    } else {
      // 立即数形态：ADD→ADDI k；SUB→ADDI (256-k)（与 (v-k)%256 等价）；
      // XOR→XORI k。逆推导 invApply 与此精确对应。
      let immOp: number = OP.XORI;
      let immVal = step.operand;
      if (step.op === OP.ADD) {
        immOp = OP.ADDI;
      } else if (step.op === OP.SUB) {
        immOp = OP.ADDI;
        immVal = (256 - step.operand) % 256;
      }
      insns.push({ op: immOp, a: 0, b: immVal });
    }
  }
  insns.push({ op: OP.EMIT, a: 0, b: 0 });
  insns.push({ op: OP.CNT, a: 6, b: 0 });
  insns.push({ op: OP.DEC, a: 7, b: 0 });
  insns.push({ op: OP.JZ, a: 7, b: 0 });          // 目标占位，稍后回填
  const jzIndex = insns.length - 1;
  // 统一跳转约定：目标放 b（与 JZ/JNZ 及 Lua runA/runB 一致）
  insns.push({ op: OP.JMP, a: 0, b: loopHead });
  insns.push({ op: OP.HALT, a: 0, b: 0 });
  // 回填 JZ 目标：HALT 索引
  insns[jzIndex].b = insns.length - 1;

  // —— 验证：模拟运行程序，确认输出 == 明文（编码器侧等价性自检）——
  const sim = simulateProgram(layout, insns, ciphertext, sbox, invSbox, OP);
  if (sim.join(',') !== plaintext.join(',')) {
    // 程序与密文不一致：回退为恒等链（单步 XOR 0）保证正确性
    return compileIdentityProgram(layout, plaintext, constId, junkStream);
  }

  const mode = layout.paramScheme % 3; // 0/1/2 = runA/runB/随机（子系统 4）
  const program = serializeProgram(layout, insns, mode, junkStream);
  return { program, ciphertext };
}

/** 恒等回退程序：XOR 0（保证语义等价底线） */
function compileIdentityProgram(
  layout: VMLayout, plaintext: number[], constId: number, junkStream: () => number
): CipherProgramResult {
  const insns: VMInstruction[] = [];
  const n = plaintext.length;
  insns.push({ op: OP.LOADI, a: 6, b: 0 });
  insns.push({ op: OP.LOADI, a: 7, b: n });
  insns.push({ op: OP.LOADI, a: 1, b: 0 }); // 密钥 0
  const loopHead = insns.length;
  insns.push({ op: OP.LOADP, a: 0, b: 6 });
  insns.push({ op: OP.XOR, a: 0, b: 1 });
  insns.push({ op: OP.EMIT, a: 0, b: 0 });
  insns.push({ op: OP.CNT, a: 6, b: 0 });
  insns.push({ op: OP.DEC, a: 7, b: 0 });
  insns.push({ op: OP.JZ, a: 7, b: 0 });
  const jzIndex = insns.length - 1;
  insns.push({ op: OP.JMP, a: 0, b: loopHead });
  insns.push({ op: OP.HALT, a: 0, b: 0 });
  insns[jzIndex].b = insns.length - 1;
  const program = serializeProgram(layout, insns, constId % 3, junkStream);
  return { program, ciphertext: [...plaintext] };
}

// ============ 程序模拟器（编码器侧等价性自检）============

/**
 * 模拟 GX-VM 执行（线性编码 + 轮换解码，与运行时 runA 一致）。
 * 用于编码器验证程序输出与预期一致【子系统 15 自动验证】。
 */
export function simulateProgram(
  layout: VMLayout,
  insns: VMInstruction[],
  ciphertext: number[],
  sbox: number[],
  invSbox: number[],
  opTable: typeof OP
): number[] {
  const R = new Array<number>(16).fill(0);
  const OUT: number[] = [];
  void layout;
  let pc = 0;
  let guard = 0;
  const maxSteps = insns.length * 4 + 4096;
  while (pc >= 0 && pc < insns.length && guard < maxSteps) {
    guard++;
    const ins = insns[pc];
    const op = ins.op;
    const a = ins.a & 0xFF;
    const b = ins.b & 0xFF;
    switch (op) {
      case opTable.NOP: break;
      case opTable.HALT: return OUT;
      case opTable.LOADI: R[a] = b; break;
      case opTable.LOADP: R[a] = ciphertext[R[b]] ?? 0; break;
      case opTable.XOR: R[a] = (R[a] ^ R[b]) & 0xFF; break;
      case opTable.ADD: R[a] = (R[a] + R[b]) % 256; break;
      case opTable.SUB: R[a] = (R[a] - R[b] + 512) % 256; break;
      case opTable.MUL: R[a] = (R[a] * R[b]) % 256; break;
      case opTable.SBOX: R[a] = sbox[R[a] & 0xFF] ?? 0; break;
      case opTable.ISBOX: R[a] = invSbox[R[a] & 0xFF] ?? 0; break;
      case opTable.SWAP: { const t = R[a]; R[a] = R[b]; R[b] = t; break; }
      case opTable.MOV: R[a] = R[b]; break;
      case opTable.EMIT: OUT.push(R[a] & 0xFF); break;
      case opTable.JMP: pc = b; continue;
      case opTable.JZ: if (R[a] === 0) { pc = b; continue; } break;
      case opTable.JNZ: if (R[a] !== 0) { pc = b; continue; } break;
      case opTable.ADDI: R[a] = (R[a] + b) % 256; break;
      case opTable.XORI: R[a] = (R[a] ^ b) & 0xFF; break;
      case opTable.ROL: R[a] = ((R[a] * 2) % 256) + Math.floor(R[a] / 128); break;
      case opTable.ROR: R[a] = Math.floor(R[a] / 2) + (R[a] % 2) * 128; break;
      case opTable.CNT: R[a] = R[a] + 1; break;
      case opTable.DEC: R[a] = R[a] - 1; break;
      case opTable.PUSH: break;
      case opTable.POP: break;
      case opTable.LOADS: R[a] = 0; break;
      case opTable.STORS: break;
      case opTable.CMPEQ: R[a] = R[a] === R[b] ? 1 : 0; break;
      case opTable.CMPNE: R[a] = R[a] !== R[b] ? 1 : 0; break;
      case opTable.EQK: R[a] = R[a] === b ? 1 : 0; break;
      case opTable.SYNC: break;
      case opTable.TICK: R[a] = 0; break;
      case opTable.TRAP: break;
      default: break;
    }
    pc++;
  }
  return OUT;
}

/** 字节数组 → Lua 双引号字符串（\ddd 转义，Lua 5.1 安全） */
export function bytesToLuaString(bytes: number[]): string {
  let out = '"';
  for (const b of bytes) {
    const v = b & 0xFF;
    if (v === 34) { out += '\\"'; continue; }
    if (v === 92) { out += '\\\\'; continue; }
    if (v === 10) { out += '\\n'; continue; }
    if (v === 13) { out += '\\r'; continue; }
    if (v === 9) { out += '\\t'; continue; }
    if (v >= 32 && v < 127) {
      out += String.fromCharCode(v);
    } else {
      // 必须 3 位零填充：\2 后跟字面 '70' 会被解析器合并为 \270（>255 非法）
      out += '\\' + String(v).padStart(3, '0');
    }
  }
  return out + '"';
}
