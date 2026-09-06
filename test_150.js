const { Orchestrator } = require('./dist/core/Orchestrator');
const { LuaWriter } = require('./dist/utils/LuaWriter');
const { parseLua } = require('./dist/parser/LuaParser');
const { AutomatedVerifier } = require('./dist/verification/AutomatedVerifier');

const source = `local function add(a, b)
  return a + b
end
local function mul(a,b) return a*b end
local x = 10
local y = 20
local r1 = add(x,y)
local r2 = mul(x,y)
print(r1, r2)`;

const ast = parseLua(source);
console.log(`AST type: ${ast.type}, body length: ${ast.body?.length}`);

const orch = new Orchestrator({ seed: 12345, intensity: 10, verbose: false });
console.log(`Plugins: ${orch.getPluginList().length}`);
console.log(`Techniques: ${orch.getTechniqueCount()}`);

const result = orch.obfuscate(ast, 'test.lua', source.length);
const writer = new LuaWriter();
const output = writer.write(result.ast);

console.log(`Output: ${output.length} bytes, ${output.split('\n').length} lines`);
console.log(`Stats: ${JSON.stringify(result.context.stats).substring(0, 300)}`);

require('fs').writeFileSync('/tmp/gungnir_output.lua', output);
console.log('Output written to /tmp/gungnir_output.lua');

// Run automated verification
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  RUNNING AUTOMATED VERIFICATION...');
console.log('═══════════════════════════════════════════════════════════════\n');

const verifier = new AutomatedVerifier();
const verification = verifier.verify(output, result.context, source);
console.log(verification.reportText);

// Write verification report
require('fs').writeFileSync('/tmp/gungnir_verification_report.txt', verification.reportText);
console.log('Verification report written to /tmp/gungnir_verification_report.txt');

// Final syntax check
try {
  const luaparse = require('luaparse');
  luaparse.parse(output, { luaVersion: '5.1', comments: false });
  console.log('\n✅ FINAL: Lua 5.1 syntax validation PASSED');
} catch (e) {
  console.log('\n❌ FINAL: Lua 5.1 syntax validation FAILED:', e.message);
}
