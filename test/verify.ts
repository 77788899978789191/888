/**
 * Test: Verify obfuscated output is valid Lua syntax
 * and modules work correctly.
 */
import * as fs from 'fs';
import * as luaparse from 'luaparse';

// Test 1: Output is parseable Lua 5.1 (the strict gate — rejects 5.3-only
// bitwise operators, // floor division, goto, etc.)
const obfuscated = fs.readFileSync('test/sample_obf.lua', 'utf-8');
try {
  luaparse.parse(obfuscated, { luaVersion: '5.1' });
  console.log('PASS: Obfuscated output is valid Lua 5.1 syntax');
} catch (err) {
  console.error('FAIL: Obfuscated output is not valid Lua 5.1:', err instanceof Error ? err.message : err);
  process.exit(1);
}

// Test 2: Verify modules load
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { OpaquePredicatePlugin } = require('../dist/obfuscators/OpaquePredicate');
const plugin = new OpaquePredicatePlugin();
const strategies = (plugin as unknown as { strategies: { name: string; difficulty: number }[] }).strategies;
console.log(`PASS: OpaquePredicate plugin loads (${strategies.length} strategies)`);
for (const s of strategies) {
  console.log(`  - ${s.name} (difficulty: ${s.difficulty})`);
}

console.log('\nAll tests passed!');
