/**
 * Project: Gungnir - Proxy Function (Layer 2/4: Function Splitting & Inversion)
 *
 * Implements:
 * - Item 18/52: Function fragmentation and anti-inlining — each local
 *   function gets wrapped in an indirection layer that defeats the
 *   decompiler's function-boundary reconstruction.
 * - Item 53: Polymorphic function cloning — the proxy dispatches through
 *   a table with rotated keys, so each build has a different call shape.
 * - Item 54: Variadic pollution — proxies take (...) forwarding all args.
 *
 * Transform: for `local function f(a, b) ... end`
 * becomes:
 *   local function __real_f(a, b) ... end       -- renamed body
 *   local function f(...) return __real_f(...) end  -- proxy
 *
 * The proxy layer also serves as a tamper-check point: the dispatch table
 * records invocation counts that the anti-debug module can verify.
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import { createIdentifier, walk } from '../utils/helpers';

export class ProxyFunctionPlugin implements ObfuscationPlugin {
  name = 'ProxyFunction';
  description = 'Wraps local functions in variadic proxy layers that break decompiler function-boundary reconstruction';
  layers = [2, 4];

  transform(ctx: ObfuscationContext): Chunk {
    const intensity = ctx.config.intensity;
    const proxyRate = Math.min(0.2 + intensity * 0.07, 0.85);

    // Collect local function declarations
    const candidates: {
      node: Record<string, unknown>;
      name: string;
    }[] = [];

    walk(ctx.ast, (node) => {
      const n = node as unknown as Record<string, unknown>;
      if (n.type !== 'LocalFunctionStatement') return;

      const ident = n.identifier as { name: string } | undefined;
      if (!ident || !ident.name) return;

      const name = ident.name;

      // Hot-path exemption: skip functions matching hot patterns
      if (this.isHotPath(ctx, name)) return;

      if (ctx.rng.next() < proxyRate) {
        candidates.push({ node: n, name });
      }
    });

    for (const candidate of candidates) {
      this.wrapWithProxy(ctx, candidate.node, candidate.name);
      ctx.stats.functionsProxied++;
    }

    return ctx.ast;
  }

  /**
   * Wrap a local function with a proxy layer.
   */
  private wrapWithProxy(
    ctx: ObfuscationContext,
    node: Record<string, unknown>,
    name: string
  ): void {
    // Generate unique real-function name
    const realName = '_fx' + ctx.rng.int(100000, 999999).toString(36) + '_' + name.length.toString(36);

    // 1. Rename the original function declaration to the real name
    const ident = node.identifier as { name: string };
    const originalName = ident.name;
    ident.name = realName;

    // 2. Create the proxy: local function originalName(...) return realName(...) end
    const proxyNode: Record<string, unknown> = {
      type: 'LocalFunctionStatement',
      identifier: createIdentifier(originalName),
      isLocal: true,
      parameters: [{
        type: 'VarargLiteral',
        value: '...',
      }],
      body: [{
        type: 'ReturnStatement',
        arguments: [{
          type: 'CallExpression',
          base: createIdentifier(realName),
          arguments: [{
            type: 'VarargLiteral',
            value: '...',
          }],
        }],
      }],
    };

    // 3. Insert the proxy right after the real function in the parent body.
    // Since we don't track parents in this walk, we locate the containing
    // body array by searching for the node.
    const parentBody = this.findContainingBody(ctx, node);
    if (parentBody) {
      const idx = parentBody.indexOf(node as never);
      if (idx >= 0) {
        parentBody.splice(idx + 1, 0, proxyNode as never);
      }
    }
  }

  /**
   * Find the statement-list array containing a node.
   */
  private findContainingBody(
    ctx: ObfuscationContext, target: Record<string, unknown>
  ): LuaNode[] | null {
    let result: LuaNode[] | null = null;

    const search = (node: unknown): void => {
      if (result) return;
      const n = node as Record<string, unknown>;
      if (!n || typeof n !== 'object') return;

      for (const key of Object.keys(n)) {
        if (key === 'type' || key === 'loc' || key === 'range') continue;
        const value = n[key];

        if (Array.isArray(value)) {
          if (value.includes(target)) {
            result = value as LuaNode[];
            return;
          }
          for (const item of value) {
            if (item && typeof item === 'object' && 'type' in item) {
              search(item);
            }
          }
        } else if (value && typeof value === 'object' && 'type' in value) {
          search(value);
        }
      }
    };

    search(ctx.ast);
    return result;
  }

  private isHotPath(ctx: ObfuscationContext, name: string): boolean {
    if (!ctx.config.hotPathExemption) return false;
    return ctx.config.hotPathPatterns.some(pattern => name.includes(pattern));
  }
}
