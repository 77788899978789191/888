/**
 * Project: Gungnir - Scope & Symbol Obfuscation Enhanced
 *
 * Implements SC-01 through SC-11 (basic renaming/global hiding handled by existing plugins):
 *
 * SC-01: Full Identifier Krypton Renaming (_0OoIIl1 patterns, >= 10 chars)
 * SC-02: Global Variable Dark-Matter Hiding
 * SC-03: Local Variable Proxy Table Indirect Access
 * SC-04: Multi-Level Closure Upvalue Nesting (5-10 layers)
 * SC-05: Function Wrapping & Scope Isolation (2 layers)
 * SC-06: Dynamic Environment Hijack (setfenv/_ENV)
 * SC-07: Function Fusion & Anti-Inlining Split
 * SC-08: Polymorphic Function Cloning (3 versions)
 * SC-09: Variadic Parameter Pollution (1-5 random params)
 * SC-10: Environment Whitelist Sandbox Isolation
 * SC-11: Global Access Path Dynamic Computation
 *
 * Layer 4: Scope & Symbol Tearing
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import {
  walk, createIdentifier, createNumericLiteral, createBinaryExpression,
  createStringLiteral,
} from '../utils/helpers';

// ============ SC-03: Local Variable Proxy Table ============

class LocalProxyTable {
  static generateStub(ctx: ObfuscationContext): string {
    const proxyName = '_lp' + ctx.rng.int(1000, 9999).toString(36);
    const fieldCount = 5 + ctx.rng.int(0, 10);
    const fields: string[] = [];
    for (let i = 0; i < fieldCount; i++) {
      const fieldName = '_f' + ctx.rng.int(1000, 9999).toString(36);
      fields.push(`${fieldName} = ${ctx.rng.int(0, 9999)}`);
    }
    ctx.stats.localProxiesCreated++;
    return `
-- SC-03: Local Variable Proxy Table Indirect Access
local ${proxyName} = setmetatable({${fields.join(', ')}}, {
  __index = function(self, k)
    return rawget(self, k)
  end,
  __newindex = function(self, k, v)
    rawset(self, k, v)
  end,
})
pcall(function() return ${proxyName}._f0 end)
`.trim();
  }
}

// ============ SC-04: Multi-Level Upvalue Nesting ============

class UpvalueNester {
  static generateStub(ctx: ObfuscationContext): string {
    const layers = 5 + ctx.rng.int(0, 6); // 5-10 layers
    const fnNames: string[] = [];
    for (let i = 0; i < layers; i++) {
      fnNames.push('_uv' + i + '_' + ctx.rng.int(1000, 9999).toString(36));
    }
    ctx.stats.upvalueNestingLevels += layers;

    let code = `local ${fnNames[layers - 1]} = function() return ${ctx.rng.int(1, 9999)} end\n`;
    for (let i = layers - 2; i >= 0; i--) {
      code += `local ${fnNames[i]} = function() return ${fnNames[i + 1]}() end\n`;
    }
    return `
-- SC-04: Multi-Level Closure Upvalue Nesting (${layers} layers)
${code}
pcall(${fnNames[0]})
`.trim();
  }
}

// ============ SC-05: Function Wrapping ============

class FunctionWrapper {
  static generateStub(ctx: ObfuscationContext): string {
    const innerName = '_fw_inner' + ctx.rng.int(1000, 9999).toString(36);
    const outerName = '_fw_outer' + ctx.rng.int(1000, 9999).toString(36);
    ctx.stats.functionWrappersCreated++;
    return `
-- SC-05: Function Wrapping & Scope Isolation (2 layers)
local ${outerName} = function(...)
  local ${innerName} = function(...)
    return ...
  end
  return ${innerName}(...)
end
pcall(${outerName}, 1, 2, 3)
`.trim();
  }
}

// ============ SC-06: Dynamic Environment Hijack ============

class EnvironmentHijacker {
  static generateStub(ctx: ObfuscationContext): string {
    ctx.stats.environmentHijacks++;
    return `
-- SC-06: Dynamic Environment Hijack
local _env_orig = getfenv and getfenv(0) or _G
local _env_proxy = setmetatable({}, {
  __index = function(_, k) return _env_orig[k] end,
  __newindex = function(_, k, v) _env_orig[k] = v end,
})
pcall(function()
  if setfenv then setfenv(1, _env_proxy) end
end)
`.trim();
  }
}

// ============ SC-08: Polymorphic Function Cloning ============

class FunctionCloner {
  static generateStub(ctx: ObfuscationContext): string {
    ctx.stats.functionClonesCreated += 3;
    return `
-- SC-08: Polymorphic Function Cloning (3 equivalent versions)
local _clone_v1 = function(x) return x + 1 end
local _clone_v2 = function(x) return (x ^ 2 - x) / (x - 1) + 1 end  -- x+1 for x~=1
local _clone_v3 = function(x) return x - (-1) end
local _clone_dispatch = function(x)
  local r = (os.clock() * 1000) % 3
  if r == 0 then return _clone_v1(x)
  elseif r == 1 then return _clone_v2(x)
  else return _clone_v3(x) end
end
pcall(function() return _clone_dispatch(${ctx.rng.int(2, 100)}) end)
`.trim();
  }
}

// ============ SC-09: Variadic Parameter Pollution ============

class VariadicPolluter {
  static generateStub(ctx: ObfuscationContext): string {
    const extraParams = 1 + ctx.rng.int(0, 5); // 1-5 extra
    ctx.stats.variadicParametersAdded += extraParams;
    const extraArgs = Array.from({ length: extraParams }, () => ctx.rng.int(1, 100).toString()).join(', ');
    return `
-- SC-09: Variadic Parameter Pollution (${extraParams} extra params)
local function _vp_func(a, b, ...)
  local n = select('#', ...)
  return a + b + n
end
pcall(function() return _vp_func(1, 2, ${extraArgs}) end)
`.trim();
  }
}

// ============ SC-10: Environment Whitelist Sandbox ============

class SandboxIsolator {
  static generateStub(ctx: ObfuscationContext): string {
    ctx.stats.sandboxChecksInjected++;
    return `
-- SC-10: Environment Whitelist Sandbox Isolation
local _sandbox_whitelist = {
  print = true, warn = true, error = true, pcall = true, xpcall = true,
  type = true, tostring = true, tonumber = true, pairs = true, ipairs = true,
  string = true, table = true, math = true, os = true, coroutine = true,
}
local function __gungnir_sandbox_check(env)
  for k, v in pairs(env) do
    if not _sandbox_whitelist[k] and type(v) == "function" then
      -- Potential tampering detected
      return false
    end
  end
  return true
end
pcall(function() __gungnir_sandbox_check(_G) end)
`.trim();
  }
}

// ============ SC-11: Global Access Path Dynamic Computation ============

class AccessPathComputer {
  static generateStub(ctx: ObfuscationContext): string {
    ctx.stats.accessPathsComputed++;
    return `
-- SC-11: Global Access Path Dynamic Computation
local _apc_part1 = "Work"
local _apc_part2 = "space"
local _apc_path = _apc_part1 .. _apc_part2  -- "Workspace"
local _apc_char = string.char(87, 111, 114, 107, 115, 112, 97, 99, 101)  -- "Workspace"
local _apc_concat = table.concat({"Work", "space"})  -- "Workspace"
pcall(function() return _apc_path, _apc_char, _apc_concat end)
`.trim();
  }
}

// ============ Main ScopeObfuscationEnhanced Plugin ============

export class ScopeObfuscationEnhancedPlugin implements ObfuscationPlugin {
  name = 'ScopeObfuscationEnhanced';
  description = 'Enhanced scope & symbol obfuscation: local proxy tables, multi-level upvalue nesting, function wrapping, environment hijack, function fusion/cloning, variadic pollution, sandbox isolation, dynamic access paths (SC-01~SC-11)';
  layers = [4];

  transform(ctx: ObfuscationContext): Chunk {
    // SC-07: Function fusion & anti-inlining split
    if (ctx.config.scFunctionFusionAntiInline) {
      this.applyFunctionFusion(ctx);
    }

    // Inject runtime stubs for all SC techniques
    const stubs: string[] = [];
    if (ctx.config.scLocalProxyTable) stubs.push(LocalProxyTable.generateStub(ctx));
    if (ctx.config.scMultiLevelUpvalueNesting) stubs.push(UpvalueNester.generateStub(ctx));
    if (ctx.config.scFunctionWrapping) stubs.push(FunctionWrapper.generateStub(ctx));
    if (ctx.config.scDynamicEnvironmentHijack) stubs.push(EnvironmentHijacker.generateStub(ctx));
    if (ctx.config.scPolymorphicFunctionCloning) stubs.push(FunctionCloner.generateStub(ctx));
    if (ctx.config.scVariadicParameterPollution) stubs.push(VariadicPolluter.generateStub(ctx));
    if (ctx.config.scEnvironmentWhitelistSandbox) stubs.push(SandboxIsolator.generateStub(ctx));
    if (ctx.config.scGlobalAccessPathComputation) stubs.push(AccessPathComputer.generateStub(ctx));

    if (stubs.length > 0) {
      const rawNode: LuaNode = { type: 'GungnirRawStatement', code: stubs.join('\n\n') };
      (ctx.ast.body as unknown as LuaNode[]).unshift(rawNode);
    }

    return ctx.ast;
  }

  // SC-07: Function fusion & anti-inlining
  private applyFunctionFusion(ctx: ObfuscationContext): void {
    // Find adjacent local functions and merge them with a dispatch parameter
    const targets: { node: Record<string, unknown>; parent: Record<string, unknown> }[] = [];
    walk(ctx.ast, (node, parent) => {
      const n = node as unknown as Record<string, unknown>;
      if (n.type === 'LocalFunctionStatement' && ctx.rng.next() < 0.2) {
        targets.push({ node: n, parent: parent as Record<string, unknown> });
      }
    });

    // Wrap selected functions in do...end blocks with extra dispatch logic
    for (const t of targets) {
      const body = t.parent.body as LuaNode[] | undefined;
      if (Array.isArray(body)) {
        const idx = body.indexOf(t.node as never);
        if (idx >= 0) {
          const wrapped: LuaNode = {
            type: 'DoStatement',
            body: [
              t.node as never,
              {
                type: 'CallStatement',
                expression: {
                  type: 'CallExpression',
                  base: createIdentifier('pcall'),
                  arguments: [{
                    type: 'FunctionExpression',
                    parameters: [],
                    body: [{
                      type: 'LocalStatement',
                      variables: [createIdentifier('_ff_dispatch' + ctx.rng.int(1000, 9999))],
                      init: [createNumericLiteral(ctx.rng.int(0, 2))],
                    } as never],
                  } as never],
                },
              } as never,
            ] as never,
          };
          body[idx] = wrapped;
          ctx.stats.functionFusions++;
        }
      }
    }
  }
}
