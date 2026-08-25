/**
 * Project: Gungnir - Roblox Hardening (Layer 7)
 *
 * Environment fingerprint detection: probes for executor-injected
 * globals (syn, hookfunction, getgenv, identifyexecutor, ...) and
 * flags the finding. The response is configurable via antiDebugMode:
 * - 'silent': record the detection without visible side effects
 * - 'corrupt': poison the script's own math functions (self-sabotage
 *   as anti-tamper — no effect on the host environment)
 *
 * NOTE: This module performs *detection only*. It does not spoof game
 * instance trees and is not tailored to any specific executor.
 *
 * The entire stub runs inside pcall: detection machinery can never
 * break the obfuscated script itself.
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';

export class RobloxHardeningPlugin implements ObfuscationPlugin {
  name = 'RobloxHardening';
  description = 'Environment fingerprint detection (executor globals, tamper response)';
  layers = [7];

  transform(ctx: ObfuscationContext): Chunk {
    if (ctx.config.target !== 'roblox') return ctx.ast;

    const stub = this.generateExecutorStub(ctx);
    const rawNode: LuaNode = {
      type: 'GungnirRawStatement',
      code: stub,
    } as never;

    const body = ctx.ast.body as unknown as LuaNode[];
    body.unshift(rawNode);

    return ctx.ast;
  }

  /**
   * Generate the environment fingerprint stub (Lua 5.1 compatible).
   */
  private generateExecutorStub(ctx: ObfuscationContext): string {
    const flagName = '_ex' + ctx.rng.int(100000, 999999).toString(36);
    const corrupt = ctx.config.antiDebugMode === 'corrupt';

    return `
-- Gungnir Environment Fingerprint (auto-generated, Lua 5.1)
local ${flagName} = false
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
      ${flagName} = true
      break
    end
  end

  if not ${flagName} then
    local okName, name = pcall(function()
      return identifyexecutor and identifyexecutor()
    end)
    if okName and type(name) == "string" and #name > 0 then
      ${flagName} = true
    end
  end

  ${
    corrupt
      ? `-- Corrupt mode: sabotage own math functions on detection
  if ${flagName} then
    pcall(function()
      math.floor = function() return 0 / 0 end
      math.abs = function() return 0 / 0 end
    end)
  end`
      : `-- Silent mode: record detection without visible side effects
  if ${flagName} then
    pcall(function()
      _G["__gng_ex"] = true
    end)
  end`
  }
end)
`.trim();
  }
}
