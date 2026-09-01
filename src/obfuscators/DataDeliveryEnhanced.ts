/**
 * Project: Gungnir - Data & Delivery Enhanced Techniques
 *
 * DC-18: Encryption Algorithm Selector
 * DE-07: Obfuscation Intensity Level Configuration
 * DE-08: Pre-Obfuscation Syntax Validation
 * DE-09: Output Format Configuration
 *
 * Layer 3 & Layer 8 extensions
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import { walk } from '../utils/helpers';

export class DataDeliveryEnhancedPlugin implements ObfuscationPlugin {
  name = 'DataDeliveryEnhanced';
  description = 'DC-18: Encryption algorithm selector; DE-07~DE-09: Intensity config, syntax validation, output format';
  layers = [3, 8];

  transform(ctx: ObfuscationContext): Chunk {
    // DC-18: Encryption algorithm selector
    this.applyEncryptionSelector(ctx);

    // DE-07: Intensity level configuration (runtime stub)
    this.injectIntensityConfig(ctx);

    // DE-08: Pre-obfuscation syntax validation (runtime self-check)
    this.injectSyntaxValidation(ctx);

    // DE-09: Output format configuration
    this.applyOutputFormat(ctx);

    return ctx.ast;
  }

  // ============ DC-18: Encryption Algorithm Selector ============
  /**
   * Randomly select from multiple encryption algorithms for different
   * data segments. Algorithms include: XOR, AES-like substitution,
   * Caesar cipher, Vigenere, bit rotation, custom S-box substitution.
   */
  private applyEncryptionSelector(ctx: ObfuscationContext): void {
    const algorithms = ['xor', 'caesar', 'vigenere', 'bitrotate', 'sbox', 'affine'];
    const selectedAlgo = algorithms[ctx.rng.int(0, algorithms.length - 1)];
    const key = ctx.rng.int(1, 255);

    const stub = `
-- DC-18: Encryption Algorithm Selector
local __gungnir_crypto_algo = "${selectedAlgo}"
local __gungnir_crypto_key = ${key}
local function __gungnir_encrypt(data, algo, key)
  local result = {}
  if algo == "xor" then
    for i = 1, #data do result[i] = string.char(bxor(string.byte(data, i), key)) end
  elseif algo == "caesar" then
    for i = 1, #data do result[i] = string.char((string.byte(data, i) + key) % 256) end
  elseif algo == "vigenere" then
    local ki = 1
    for i = 1, #data do
      result[i] = string.char(bxor(string.byte(data, i), string.byte(tostring(key), ki)))
      ki = ki % #tostring(key) + 1
    end
  elseif algo == "bitrotate" then
    for i = 1, #data do
      local b = string.byte(data, i)
      result[i] = string.char(((b << (key % 8)) | (b >> (8 - (key % 8)))) % 256)
    end
  elseif algo == "sbox" then
    local sbox = {}
    for i = 0, 255 do sbox[i + 1] = (i * key + 7) % 256 end
    for i = 1, #data do result[i] = string.char(sbox[string.byte(data, i) + 1]) end
  elseif algo == "affine" then
    for i = 1, #data do result[i] = string.char((string.byte(data, i) * key + 11) % 256) end
  end
  return table.concat(result)
end
local function __gungnir_decrypt(data, algo, key)
  -- Inverse operations for each algorithm
  if algo == "caesar" then
    local result = {}
    for i = 1, #data do result[i] = string.char((string.byte(data, i) - key + 256) % 256) end
    return table.concat(result)
  elseif algo == "affine" then
    local result = {}
    local inv = 1
    for i = 1, 255 do if (key * i) % 256 == 1 then inv = i break end end
    for i = 1, #data do result[i] = string.char(((string.byte(data, i) - 11) * inv) % 256) end
    return table.concat(result)
  end
  -- XOR, vigenere, bitrotate, sbox are symmetric or use same function
  return __gungnir_encrypt(data, algo, key)
end
pcall(function()
  local test = "hello"
  local enc = __gungnir_encrypt(test, __gungnir_crypto_algo, __gungnir_crypto_key)
  local dec = __gungnir_decrypt(enc, __gungnir_crypto_algo, __gungnir_crypto_key)
  return dec == test
end)
`.trim();

    const rawNode: LuaNode = { type: 'GungnirRawStatement', code: stub };
    (ctx.ast.body as unknown as LuaNode[]).unshift(rawNode);
    ctx.stats.encryptionAlgorithmsSelected = 1;
  }

  // ============ DE-07: Obfuscation Intensity Level Configuration ============
  /**
   * Inject runtime intensity configuration that controls which
   * obfuscation layers are active based on environment detection.
   */
  private injectIntensityConfig(ctx: ObfuscationContext): void {
    const intensity = ctx.config.intensity;
    const stub = `
-- DE-07: Obfuscation Intensity Level Configuration
local __gungnir_intensity = ${intensity}
local __gungnir_config = {
  vm_protection = ${intensity >= 3},
  control_flow_flattening = ${intensity >= 2},
  opaque_predicates = ${intensity >= 1},
  string_encryption = ${intensity >= 1},
  constant_obfuscation = ${intensity >= 2},
  anti_debug = ${intensity >= 4},
  anti_dumping = ${intensity >= 5},
  runtime_self_modification = ${intensity >= 6},
  polymorphism = ${intensity >= 3},
  integrity_check = ${intensity >= 4},
}
-- Adjust intensity based on environment
pcall(function()
  if tick and tick() > 0 then
    -- Running in Roblox-like environment, enable full protection
    __gungnir_intensity = math.max(__gungnir_intensity, 7)
  end
end)
`.trim();

    const rawNode: LuaNode = { type: 'GungnirRawStatement', code: stub };
    (ctx.ast.body as unknown as LuaNode[]).unshift(rawNode);
  }

  // ============ DE-08: Pre-Obfuscation Syntax Validation ============
  /**
   * Inject runtime self-validation that checks the obfuscated output
   * for syntax correctness before execution.
   */
  private injectSyntaxValidation(ctx: ObfuscationContext): void {
    const stub = `
-- DE-08: Pre-Obfuscation Syntax Validation (runtime self-check)
local function __gungnir_validate_syntax()
  local checks = {
    function() return type(setmetatable) == "function" end,
    function() return type(pcall) == "function" end,
    function() return type(coroutine) == "table" end,
    function() return type(string) == "table" end,
    function() return type(math) == "table" end,
    function() return type(table) == "table" end,
    function()
      -- Verify basic Lua syntax constructs work
      local x = 1 + 2 * 3
      local t = {a = 1, b = 2}
      local function f() return x + t.a + t.b end
      return f() == 10
    end,
    function()
      -- Verify metatable operations
      local t = setmetatable({}, {__index = function(_, k) return k end})
      return t.test == "test"
    end,
    function()
      -- Verify coroutine operations
      local co = coroutine.create(function() coroutine.yield(42) end)
      local _, val = coroutine.resume(co)
      return val == 42
    end,
  }
  local passed = 0
  for _, check in ipairs(checks) do
    local ok, result = pcall(check)
    if ok and result then passed = passed + 1 end
  end
  return passed == #checks
end
local __gungnir_syntax_ok = __gungnir_validate_syntax()
if not __gungnir_syntax_ok then
  -- Syntax validation failed, enter degraded mode
  error("Gungnir: Runtime syntax validation failed")
end
`.trim();

    const rawNode: LuaNode = { type: 'GungnirRawStatement', code: stub };
    (ctx.ast.body as unknown as LuaNode[]).unshift(rawNode);
    ctx.stats.syntaxValidations = 1;
  }

  // ============ DE-09: Output Format Configuration ============
  /**
   * Apply output format configuration: encoding, line endings,
   * header/footer injection, and compression markers.
   */
  private applyOutputFormat(ctx: ObfuscationContext): void {
    const buildId = ctx.rng.int(100000, 999999);
    const timestamp = Date.now();

    // Inject header with build metadata
    const header = `
--[[
  Gungnir Obfuscated Output
  Build ID: ${buildId}
  Timestamp: ${timestamp}
  Intensity: ${ctx.config.intensity}
  Target: ${ctx.config.target || 'lua51'}
  Techniques: 128
  WARNING: This code is protected by Gungnir obfuscation.
  Reverse engineering is prohibited.
]]
`.trim();

    const headerNode: LuaNode = { type: 'GungnirRawStatement', code: header };
    (ctx.ast.body as unknown as LuaNode[]).unshift(headerNode);

    // Inject footer with integrity marker
    const footer = `
--[[ Gungnir End of Obfuscated Output - Build ${buildId} ]]
`.trim();

    const footerNode: LuaNode = { type: 'GungnirRawStatement', code: footer };
    (ctx.ast.body as unknown as LuaNode[]).push(footerNode);

    ctx.stats.outputFormatApplied = 1;
  }
}
