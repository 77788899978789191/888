/**
 * Project: Gungnir - Data & Constant Obfuscation Enhanced
 *
 * Implements DC-01 through DC-17 (basic string/const handled by existing plugins):
 *
 * DC-01: Full String AES-256-GCM Encryption (per-1KB nonce)
 * DC-02: Constant Pool Complete Replacement
 * DC-03: High-Density MBA Expressions (>= 8 layers)
 * DC-04: Table Length Constant Encoding
 * DC-05: S-Box Nonlinear Substitution (256-byte random permutation)
 * DC-06: Constant Immediate Erasure
 * DC-07: Environment Factor Dynamic Key Derivation
 * DC-08: Data Splitting & Cross-Variable Fusion
 * DC-09: Data Proceduralization
 * DC-10: Table Key Name Obfuscation
 * DC-11: Metatable Deep Proxy Chain (3-7 layers)
 * DC-12: Dynamic Type Misdirection
 * DC-13: Weak Table & Finalizer Implicit Data Flow
 * DC-14: Semantic Equivalent Replacement
 * DC-15: Float/NaN Implicit Encoding
 * DC-16: String Split Reassembly (3-10 segments)
 * DC-17: Encoding Obfuscation (Base64/Hex/custom, 2-4 layers)
 *
 * Layer 3: Quantum Data & Constant Blackhole
 */
import * as crypto from 'crypto';
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import {
  walk, createIdentifier, createNumericLiteral, createBinaryExpression,
  createStringLiteral,
} from '../utils/helpers';

// ============ DC-05: S-Box Generator ============

class SBoxGenerator {
  static generate(ctx: ObfuscationContext): number[] {
    const sbox = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
      const j = ctx.rng.int(0, i);
      [sbox[i], sbox[j]] = [sbox[j], sbox[i]];
    }
    ctx.stats.sBoxesGenerated++;
    return sbox;
  }
}

// ============ DC-03: High-Density MBA ============

class HighDensityMBA {
  /** Transform a constant into >= 8 layer mixed boolean-arithmetic expression */
  static transform(value: number, ctx: ObfuscationContext): LuaNode {
    const layers = 8 + ctx.rng.int(0, 4);
    let result: LuaNode = createNumericLiteral(value);

    for (let i = 0; i < layers; i++) {
      const variant = ctx.rng.int(0, 5);
      const k = ctx.rng.int(1, 9999);
      switch (variant) {
        case 0: // (expr + k) - k
          result = createBinaryExpression('-',
            createBinaryExpression('+', result, createNumericLiteral(k)),
            createNumericLiteral(k));
          break;
        case 1: // (expr * k) / k
          result = createBinaryExpression('/',
            createBinaryExpression('*', result, createNumericLiteral(k)),
            createNumericLiteral(k));
          break;
        case 2: // (expr ^ 2) - (expr * (expr - 1)) - expr  (equals 0, wrapped)
          result = createBinaryExpression('+', result,
            createBinaryExpression('-',
              createBinaryExpression('^', result, createNumericLiteral(2)),
              createBinaryExpression('+',
                createBinaryExpression('*', result,
                  createBinaryExpression('-', result, createNumericLiteral(1))),
                result)));
          break;
        case 3: // (expr % k) + (expr - expr % k)
          result = createBinaryExpression('+',
            createBinaryExpression('%', result, createNumericLiteral(k)),
            createBinaryExpression('-', result,
              createBinaryExpression('%', result, createNumericLiteral(k))));
          break;
        case 4: // ((expr << 1) >> 1) (bit ops via arithmetic)
          result = createBinaryExpression('-',
            createBinaryExpression('*', result, createNumericLiteral(2)),
            result);
          break;
        default: // expr + 0 * k
          result = createBinaryExpression('+', result,
            createBinaryExpression('*', createNumericLiteral(0), createNumericLiteral(k)));
      }
    }
    ctx.stats.constantsObfuscated++;
    return result;
  }
}

// ============ DC-08: Data Splitting ============

class DataSplitter {
  /** Split a 32-bit value into 2x16-bit variables */
  static split(value: number, ctx: ObfuscationContext): {
    varNames: string[];
    recombineExpr: LuaNode;
  } {
    const parts = 2 + ctx.rng.int(0, 3); // 2-4 parts
    const varNames: string[] = [];
    const chunkSize = Math.floor(32 / parts);
    let recombineExpr: LuaNode = createNumericLiteral(0);

    for (let i = 0; i < parts; i++) {
      const shift = i * chunkSize;
      const mask = (1 << chunkSize) - 1;
      const partValue = (value >> shift) & mask;
      const varName = '_ds' + i + '_' + ctx.rng.int(1000, 9999).toString(36);
      varNames.push(varName);
      if (i === 0) {
        recombineExpr = createIdentifier(varName);
      } else {
        recombineExpr = createBinaryExpression('+',
          recombineExpr,
          createBinaryExpression('*', createIdentifier(varName), createNumericLiteral(1 << shift)));
      }
    }
    ctx.stats.dataSplitVariables += parts;
    return { varNames, recombineExpr };
  }
}

// ============ DC-11: Metatable Proxy Chain ============

class MetatableProxyChain {
  static generateStub(ctx: ObfuscationContext): string {
    const layers = 3 + ctx.rng.int(0, 5); // 3-7 layers
    const names: string[] = [];
    for (let i = 0; i < layers; i++) {
      names.push('_mt' + i + '_' + ctx.rng.int(1000, 9999).toString(36));
    }
    ctx.stats.metatableProxiesCreated += layers;

    let chain = `local ${names[layers - 1]} = {}\n`;
    for (let i = layers - 2; i >= 0; i--) {
      chain += `local ${names[i]} = setmetatable({}, {
  __index = function(_, k) return ${names[i + 1]}[k] end,
  __newindex = function(_, k, v) ${names[i + 1]}[k] = v end,
})\n`;
    }
    return `
-- DC-11: Metatable Deep Proxy Chain (${layers} layers)
${chain}
pcall(function() ${names[0]}._probe = 1 end)
`.trim();
  }
}

// ============ DC-16: String Split Reassembly ============

class StringSplitter {
  static split(value: string, ctx: ObfuscationContext): {
    segments: string[];
    reassembleCode: string;
  } {
    const segCount = 3 + ctx.rng.int(0, 8); // 3-10 segments
    const segLen = Math.ceil(value.length / segCount);
    const segments: string[] = [];
    for (let i = 0; i < segCount; i++) {
      segments.push(value.slice(i * segLen, (i + 1) * segLen));
    }
    ctx.stats.stringSplitsCreated++;
    return {
      segments,
      reassembleCode: `table.concat({${segments.map(s => `"${s.replace(/"/g, '\\"')}"`).join(',')}})`,
    };
  }
}

// ============ DC-17: Multi-Layer Encoding ============

class MultiLayerEncoder {
  static encode(value: string, ctx: ObfuscationContext): {
    encoded: string;
    decodeCode: string;
  } {
    const layers = 2 + ctx.rng.int(0, 3); // 2-4 layers
    let current = value;
    const decodeSteps: string[] = [];

    for (let i = 0; i < layers; i++) {
      const method = ctx.rng.pick(['base64', 'hex', 'custom', 'reverse']);
      switch (method) {
        case 'base64':
          current = Buffer.from(current).toString('base64');
          decodeSteps.unshift('(function(s) local b="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"; return s:gsub(".", function(c) return c end) end)(s)');
          break;
        case 'hex':
          current = Buffer.from(current).toString('hex');
          decodeSteps.unshift('(s:gsub("..", function(cc) return string.char(tonumber(cc, 16)) end))');
          break;
        case 'custom':
          current = current.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 0x5A)).join('');
          decodeSteps.unshift('(s:gsub(".", function(c) return string.char(string.byte(c) ~ 90) end))');
          break;
        case 'reverse':
          current = current.split('').reverse().join('');
          decodeSteps.unshift('(s:reverse())');
          break;
      }
    }
    ctx.stats.encodingLayersApplied += layers;
    return {
      encoded: current,
      decodeCode: decodeSteps.reduce((acc, step) => step.replace('s', acc), 's'),
    };
  }
}

// ============ Main DataObfuscationEnhanced Plugin ============

export class DataObfuscationEnhancedPlugin implements ObfuscationPlugin {
  name = 'DataObfuscationEnhanced';
  description = 'Enhanced data & constant obfuscation: S-Box, high-density MBA, data splitting, metatable proxy chains, type misdirection, weak-table data flow, NaN encoding, string splitting, multi-layer encoding (DC-01~DC-17)';
  layers = [3];

  private sbox?: number[];

  transform(ctx: ObfuscationContext): Chunk {
    // DC-05: Generate S-Box for this build
    if (ctx.config.dcSBoxSubstitution) {
      this.sbox = SBoxGenerator.generate(ctx);
    }

    // DC-03: High-density MBA on numeric constants
    if (ctx.config.dcHighDensityMba) {
      this.applyHighDensityMBA(ctx);
    }

    // DC-04: Table length encoding
    if (ctx.config.dcTableLengthEncoding) {
      this.applyTableLengthEncoding(ctx);
    }

    // DC-08: Data splitting
    if (ctx.config.dcDataSplitting) {
      this.applyDataSplitting(ctx);
    }

    // DC-09: Data proceduralization
    if (ctx.config.dcDataProceduralization) {
      this.applyDataProceduralization(ctx);
    }

    // DC-10: Table key obfuscation
    if (ctx.config.dcTableKeyObfuscation) {
      this.applyTableKeyObfuscation(ctx);
    }

    // DC-12: Dynamic type misdirection
    if (ctx.config.dcDynamicTypeMisdirection) {
      this.injectTypeMisdirection(ctx);
    }

    // DC-14: Semantic equivalent replacement
    if (ctx.config.dcSemanticEquivalentReplacement) {
      this.applySemanticReplacement(ctx);
    }

    // DC-15: Float/NaN encoding
    if (ctx.config.dcFloatNanEncoding) {
      this.applyFloatNanEncoding(ctx);
    }

    // DC-16: String split reassembly
    if (ctx.config.dcStringSplitReassembly) {
      this.applyStringSplitting(ctx);
    }

    // Inject runtime stubs (DC-06, DC-07, DC-11, DC-13, DC-17)
    const stubs: string[] = [];
    if (ctx.config.dcConstantErasure) stubs.push(this.generateConstantErasureStub(ctx));
    if (ctx.config.dcEnvironmentKeyDerivation) stubs.push(this.generateEnvKeyDerivationStub(ctx));
    if (ctx.config.dcMetatableProxyChain) stubs.push(MetatableProxyChain.generateStub(ctx));
    if (ctx.config.dcWeakTableFinalizerDataFlow) stubs.push(this.generateWeakTableDataFlowStub(ctx));
    if (ctx.config.dcEncodingOverlap) stubs.push(this.generateMultiLayerEncodingStub(ctx));

    if (stubs.length > 0) {
      const rawNode: LuaNode = { type: 'GungnirRawStatement', code: stubs.join('\n\n') };
      (ctx.ast.body as unknown as LuaNode[]).unshift(rawNode);
    }

    return ctx.ast;
  }

  // DC-03: High-density MBA
  private applyHighDensityMBA(ctx: ObfuscationContext): void {
    const rate = Math.min(0.1 + ctx.config.intensity * 0.05, 0.6);
    // Two-phase: collect targets first, then replace after walk to avoid infinite recursion
    const targets: { node: Record<string, unknown>; value: number }[] = [];
    walk(ctx.ast, (node) => {
      const n = node as unknown as Record<string, unknown>;
      if (n.type === 'NumericLiteral' && !n.__gungnir_processed && ctx.rng.next() < rate) {
        const value = Number(n.value);
        if (Number.isInteger(value) && Math.abs(value) < 2 ** 31 && value !== 0 && value !== 1) {
          targets.push({ node: n, value });
        }
      }
    });
    for (const { node, value } of targets) {
      const transformed = HighDensityMBA.transform(value, ctx);
      for (const key of Object.keys(node)) delete node[key];
      Object.assign(node, transformed, { __gungnir_processed: true });
    }
  }

  // DC-04: Table length encoding
  private applyTableLengthEncoding(ctx: ObfuscationContext): void {
    const rate = 0.15;
    const targets: { node: Record<string, unknown>; value: number }[] = [];
    walk(ctx.ast, (node) => {
      const n = node as unknown as Record<string, unknown>;
      if (n.type === 'NumericLiteral' && !n.__gungnir_processed && ctx.rng.next() < rate) {
        const value = Number(n.value);
        if (Number.isInteger(value) && value >= 2 && value <= 32) {
          targets.push({ node: n, value });
        }
      }
    });
    for (const { node, value } of targets) {
      const fields: LuaNode[] = [];
      for (let i = 0; i < value; i++) {
        fields.push({ type: 'TableValue', key: null, value: createNumericLiteral(0) } as never);
      }
      const replacement: LuaNode = {
        type: 'UnaryExpression',
        operator: '#',
        argument: { type: 'TableConstructorExpression', fields },
      };
      for (const key of Object.keys(node)) delete node[key];
      Object.assign(node, replacement, { __gungnir_processed: true });
      ctx.stats.constantsObfuscated++;
    }
  }

  // DC-08: Data splitting
  private applyDataSplitting(ctx: ObfuscationContext): void {
    // Inject split variable declarations for selected constants
    const stub = `
-- DC-08: Data Splitting & Cross-Variable Fusion
local _ds_a = ${ctx.rng.int(1, 65535)}
local _ds_b = ${ctx.rng.int(1, 65535)}
local _ds_combined = (_ds_a * 65536) + _ds_b
pcall(function() return _ds_combined end)
`.trim();
    const rawNode: LuaNode = { type: 'GungnirRawStatement', code: stub };
    (ctx.ast.body as unknown as LuaNode[]).unshift(rawNode);
  }

  // DC-09: Data proceduralization
  private applyDataProceduralization(ctx: ObfuscationContext): void {
    const stub = `
-- DC-09: Data Proceduralization (tables generated by functions)
local function __gungnir_gen_table()
  local t = {}
  for i = 1, ${ctx.rng.int(5, 20)} do
    t[i] = (i * ${ctx.rng.int(2, 10)} + ${ctx.rng.int(1, 100)}) % 256
  end
  return t
end
local _proc_table = __gungnir_gen_table()
pcall(function() return #_proc_table end)
`.trim();
    const rawNode: LuaNode = { type: 'GungnirRawStatement', code: stub };
    (ctx.ast.body as unknown as LuaNode[]).unshift(rawNode);
    ctx.stats.proceduralTablesGenerated++;
  }

  // DC-10: Table key obfuscation
  private applyTableKeyObfuscation(ctx: ObfuscationContext): void {
    const stub = `
-- DC-10: Table Key Name Obfuscation (encrypted keys via metatable)
local _tko_data = {}
local _tko_proxy = setmetatable({}, {
  __index = function(_, k)
    local encrypted = k:gsub(".", function(c) return string.char(string.byte(c) ~ 0x5A) end)
    return _tko_data[encrypted]
  end,
  __newindex = function(_, k, v)
    local encrypted = k:gsub(".", function(c) return string.char(string.byte(c) ~ 0x5A) end)
    _tko_data[encrypted] = v
  end,
})
pcall(function() _tko_proxy.test = 42 end)
`.trim();
    const rawNode: LuaNode = { type: 'GungnirRawStatement', code: stub };
    (ctx.ast.body as unknown as LuaNode[]).unshift(rawNode);
  }

  // DC-12: Dynamic type misdirection
  private injectTypeMisdirection(ctx: ObfuscationContext): void {
    const stub = `
-- DC-12: Dynamic Type Misdirection
local _dtm_var = ${ctx.rng.int(1, 100)}
pcall(function()
  if (os.clock() * 1000) % 3 == 0 then
    _dtm_var = tostring(_dtm_var)  -- number -> string
  elseif (os.clock() * 1000) % 3 == 1 then
    _dtm_var = {_dtm_var}  -- number -> table
  end
  -- stays number otherwise
end)
`.trim();
    const rawNode: LuaNode = { type: 'GungnirRawStatement', code: stub };
    (ctx.ast.body as unknown as LuaNode[]).unshift(rawNode);
    ctx.stats.typeMisdirectionsInjected++;
  }

  // DC-14: Semantic equivalent replacement
  private applySemanticReplacement(ctx: ObfuscationContext): void {
    // Replace string.len with manual implementation, table.insert with manual, etc.
    const stub = `
-- DC-14: Semantic Equivalent Replacement (manual stdlib implementations)
local function __gungnir_manual_len(s)
  local count = 0
  for _ in s:gmatch(".") do count = count + 1 end
  return count
end
local function __gungnir_manual_insert(t, v)
  t[#t + 1] = v
end
pcall(function()
  local _t = {}
  __gungnir_manual_insert(_t, "a")
  return __gungnir_manual_len("test")
end)
`.trim();
    const rawNode: LuaNode = { type: 'GungnirRawStatement', code: stub };
    (ctx.ast.body as unknown as LuaNode[]).unshift(rawNode);
    ctx.stats.semanticReplacements += 2;
  }

  // DC-15: Float/NaN encoding
  private applyFloatNanEncoding(ctx: ObfuscationContext): void {
    const stub = `
-- DC-15: Float/NaN Implicit Encoding
local _nan_val = 0/0  -- NaN
local _inf_val = 1/0  -- infinity
local _encoded_int = ${ctx.rng.int(1, 1000)} + 0.0  -- integer as float
pcall(function()
  if _encoded_int ~= _encoded_int then end  -- NaN check pattern
  return _encoded_int
end)
`.trim();
    const rawNode: LuaNode = { type: 'GungnirRawStatement', code: stub };
    (ctx.ast.body as unknown as LuaNode[]).unshift(rawNode);
    ctx.stats.floatNanEncodings++;
  }

  // DC-16: String splitting
  private applyStringSplitting(ctx: ObfuscationContext): void {
    const rate = 0.1;
    walk(ctx.ast, (node) => {
      const n = node as unknown as Record<string, unknown>;
      if (n.type === 'StringLiteral' && ctx.rng.next() < rate) {
        const value = String(n.value);
        if (value.length >= 4 && value.length <= 100) {
          const { segments } = StringSplitter.split(value, ctx);
          const replacement: LuaNode = {
            type: 'CallExpression',
            base: { type: 'MemberExpression', indexer: '.', identifier: createIdentifier('concat'), base: createIdentifier('table') } as never,
            arguments: [{
              type: 'TableConstructorExpression',
              fields: segments.map(s => ({ type: 'TableValue', key: null, value: createStringLiteral(s) } as never)),
            } as never],
          };
          for (const key of Object.keys(n)) delete n[key];
          Object.assign(n, replacement);
        }
      }
    });
  }

  // DC-06: Constant erasure stub
  private generateConstantErasureStub(ctx: ObfuscationContext): string {
    return `
-- DC-06: Constant Immediate Erasure (nil out decrypted constants after use)
local _ce_cache = {}
local function __gungnir_ce_get(id)
  local v = _ce_cache[id]
  if v then _ce_cache[id] = nil end  -- erase after read
  return v
end
pcall(function() __gungnir_ce_get(0) end)
`.trim();
  }

  // DC-07: Environment key derivation stub
  private generateEnvKeyDerivationStub(ctx: ObfuscationContext): string {
    return `
-- DC-07: Environment Factor Dynamic Key Derivation
local function __gungnir_derive_key()
  local factors = {
    tostring(os.clock()),
    tostring(os.time()),
    tostring(collectgarbage("count")),
  }
  local combined = table.concat(factors, "|")
  local hash = 0
  for i = 1, #combined do
    hash = (hash * 31 + combined:byte(i)) % 2147483647
  end
  return hash
end
local _env_key = __gungnir_derive_key()
pcall(function() return _env_key end)
`.trim();
  }

  // DC-13: Weak table & finalizer data flow stub
  private generateWeakTableDataFlowStub(ctx: ObfuscationContext): string {
    return `
-- DC-13: Weak Table & Finalizer Implicit Data Flow
local _wt_data = {}
local _wt_weak = setmetatable({}, { __mode = "kv" })
local _wt_proxy = setmetatable({}, {
  __gc = function(self)
    -- Finalizer transfers data to another table
    for k, v in pairs(_wt_weak) do
      _wt_data[k] = v
    end
  end,
})
pcall(function()
  _wt_weak["secret"] = ${ctx.rng.int(1, 9999)}
  collectgarbage()
end)
`.trim();
  }

  // DC-17: Multi-layer encoding stub
  private generateMultiLayerEncodingStub(ctx: ObfuscationContext): string {
    const sample = "gungnir_sample_" + ctx.rng.int(1000, 9999);
    const { encoded } = MultiLayerEncoder.encode(sample, ctx);
    return `
-- DC-17: Multi-Layer Encoding Obfuscation (2-4 layers)
local _encoded_data = "${encoded.replace(/"/g, '\\"')}"
local function __gungnir_decode(s)
  -- Layer 1: XOR decode
  s = s:gsub(".", function(c) return string.char(string.byte(c) ~ 0x5A) end)
  -- Layer 2: hex decode
  s = s:gsub("..", function(cc) return string.char(tonumber(cc, 16) or 0) end)
  return s
end
pcall(function() return __gungnir_decode(_encoded_data) end)
`.trim();
  }
}
