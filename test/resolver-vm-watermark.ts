/**
 * Test: pure-arithmetic bxor + VM opcode remap + watermark verification
 */

// ===== Test 1: pure-arithmetic bxor (Lua 5.1 stub helper) =====
// This mirrors the emitted Lua helper exactly — Lua 5.1 has no bitwise
// operators, so XOR is done via bit-slice arithmetic. Verify the full
// 256x256 byte space against JS XOR.
function luaBxor(a: number, b: number): number {
  let r = 0, p = 1;
  for (let i = 0; i < 8; i++) {
    const ab = a % 2;
    const bb = b % 2;
    if (ab !== bb) r += p;
    a = (a - ab) / 2;
    b = (b - bb) / 2;
    p *= 2;
  }
  return r;
}

let bxorPass = true;
let bxorCount = 0;
for (let a = 0; a < 256; a++) {
  for (let b = 0; b < 256; b++) {
    if (luaBxor(a, b) !== (a ^ b)) {
      bxorPass = false;
      console.error(`BXOR FAIL: ${a} ^ ${b} → ${luaBxor(a, b)}, expected ${a ^ b}`);
    }
    bxorCount++;
  }
}
console.log(`bxor arithmetic: ${bxorPass ? 'PASS' : 'FAIL'} (${bxorCount} combinations verified)`);

// ===== Test 2: VM opcode remap =====
const { BytecodeGenPlugin } = require('../dist/vm/BytecodeGen');
const plugin = new BytecodeGenPlugin() as unknown as {
  buildOpcodeRemap: (ctx: unknown) => void;
  opcodeMap: Map<number, number>;
  inverseOpcodeMap: Map<number, number>;
};

plugin.buildOpcodeRemap({
  rng: {
    next: () => Math.random(),
    int: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
    pick: <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)],
    shuffle: <T>(arr: T[]): T[] => {
      const r = [...arr];
      for (let i = r.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [r[i], r[j]] = [r[j], r[i]];
      }
      return r;
    },
    bool: () => Math.random() < 0.5,
  },
});

const canonical = Array.from(plugin.opcodeMap.keys());
const wires = Array.from(plugin.opcodeMap.values());
const isBijective = canonical.length === new Set(wires).size;
console.log(`Opcode remap: ${canonical.length} opcodes → ${new Set(wires).size} unique wire values (bijective: ${isBijective ? 'YES' : 'NO'})`);

let inverseOk = true;
for (const [canon, wire] of plugin.opcodeMap) {
  if (plugin.inverseOpcodeMap.get(wire) !== canon) inverseOk = false;
}
console.log(`Inverse map consistency: ${inverseOk ? 'PASS' : 'FAIL'}`);

// ===== Test 3: Watermark encoding roundtrip =====
const { WatermarkPlugin } = require('../dist/obfuscators/Watermark');
const wmInstance = new WatermarkPlugin() as unknown as {
  encodeZeroWidth: (s: string) => string;
};
const wmStatic = WatermarkPlugin as unknown as {
  decodeZeroWidth: (s: string) => string;
};

const fingerprints = ['ABCDEF0123456789', '0000000000000000', 'FFFFFFFFFFFFFFFF', '0123456789ABCDEF'];
let wmPassed = 0;
for (const fp of fingerprints) {
  const encoded = wmInstance.encodeZeroWidth(fp);
  const decoded = wmStatic.decodeZeroWidth(encoded);
  if (decoded === fp) {
    wmPassed++;
  } else {
    console.error(`Watermark FAIL: ${fp} → ${decoded}`);
  }
}
console.log(`Watermark: ${wmPassed}/${fingerprints.length} roundtrips passed`);

if (bxorPass && isBijective && inverseOk && wmPassed === fingerprints.length) {
  console.log('\nAll verification tests passed!');
} else {
  console.error('\nSome tests failed');
  process.exit(1);
}
