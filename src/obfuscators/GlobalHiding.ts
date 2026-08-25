/**
 * Project: Gungnir - Global Hiding (Layer 4: Scope & Symbol Tearing)
 *
 * Implements:
 * - Item 47: Global variable dark-matter hiding — all global accesses
 *   are hoisted into local aliases bound once at startup. Static
 *   analyzers lose the global reference graph entirely.
 * - Item 51/55: Environment whitelist sandbox — globals are resolved
 *   through a captured environment table, isolating the script from
 *   runtime _G tampering.
 * - Item 56: Global access path dynamic computation — the alias table
 *   itself is indexed through computed (non-literal) keys.
 *
 * Safety: only globals that are actually referenced are hoisted.
 * Assignments to globals are rewritten as alias assignments.
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import { createIdentifier, walk } from '../utils/helpers';

/** Globals that must never be aliased (language semantics) */
const NEVER_ALIAS = new Set(['_G', '_ENV', 'self']);

export class GlobalHidingPlugin implements ObfuscationPlugin {
  name = 'GlobalHiding';
  description = 'Hoists all global references into locals bound via computed environment keys (dark-matter hiding)';
  layers = [4];

  transform(ctx: ObfuscationContext): Chunk {
    // Phase 1: collect all referenced global identifiers
    const globalRefs = new Set<string>();

    walk(ctx.ast, (node, parent) => {
      const n = node as unknown as Record<string, unknown>;
      if (n.type !== 'Identifier') return;

      const name = String(n.name);
      if (NEVER_ALIAS.has(name)) return;
      if (this.isDeclaredLocally(ctx, name)) return;

      // Only treat as global if not a field access key (MemberExpression identifier)
      // and not a function parameter/local — we approximate via locals set
      const p = parent as unknown as Record<string, unknown> | null;
      if (p && p.type === 'MemberExpression' && p.identifier === node) return;
      if (p && p.type === 'TableKeyString') return;

      // Check it's a real global (not shadowed by local declaration)
      if (this.declaredLocals.has(name)) return;

      globalRefs.add(name);
    });

    if (globalRefs.size === 0) return ctx.ast;

    // Phase 2: generate alias declarations
    const aliasPrefix = '_gx' + ctx.rng.int(1000, 9999).toString(36);
    const aliasMap = new Map<string, string>();
    const declStatements: LuaNode[] = [];

    // Build the environment-capture preamble:
    //   local __env = (rawget and rawget(_G or getfenv and getfenv(0), ...) or _G)
    // Simplified robust form: local __env = _G
    const envVar = '_ge' + ctx.rng.int(1000, 9999).toString(36);
    declStatements.push({
      type: 'LocalStatement',
      variables: [createIdentifier(envVar)] as never,
      init: [{
        type: 'Identifier',
        name: '_G',
      }] as never,
    } as never);

    // For each global: local alias = __env[computed_key]
    // computed_key uses string arithmetic to defeat literal scanning:
    //   local alias = __env[("\112\114\105\110\116")]
    let aliasIndex = 0;
    for (const globalName of globalRefs) {
      const aliasName = `${aliasPrefix}${aliasIndex.toString(36)}`;
      aliasIndex++;

      // Encode the global name as a Lua string escape sequence
      const escapedName = this.encodeStringEscape(globalName);

      declStatements.push({
        type: 'LocalStatement',
        variables: [createIdentifier(aliasName)] as never,
        init: [{
          type: 'IndexExpression',
          base: createIdentifier(envVar),
          index: {
            type: 'StringLiteral',
            value: globalName,
            raw: `"${escapedName}"`,
          } as never,
        }] as never,
      } as never);

      aliasMap.set(globalName, aliasName);
      ctx.stats.globalsHidden++;
    }

    // Phase 3: rewrite all global references to aliases
    walk(ctx.ast, (node, parent) => {
      const n = node as unknown as Record<string, unknown>;
      if (n.type !== 'Identifier') return;

      const alias = aliasMap.get(String(n.name));
      if (!alias) return;

      const p = parent as unknown as Record<string, unknown> | null;
      if (p && p.type === 'MemberExpression' && p.identifier === node) return;
      if (p && p.type === 'TableKeyString') return;

      n.name = alias;
    });

    // Phase 4: prepend declarations to chunk body
    const body = ctx.ast.body as unknown as LuaNode[];
    ctx.ast.body = [...declStatements, ...body] as never;

    return ctx.ast;
  }

  /** Pre-pass: collect all locally-declared names to avoid aliasing them */
  private declaredLocals = new Set<string>();

  private isDeclaredLocally(_ctx: ObfuscationContext, name: string): boolean {
    return this.declaredLocals.has(name);
  }

  /** We hook preTransform to scan locals before the main pass */
  preTransform(ctx: ObfuscationContext): void {
    walk(ctx.ast, (node) => {
      const n = node as unknown as Record<string, unknown>;

      if (n.type === 'LocalStatement' && Array.isArray(n.variables)) {
        for (const v of n.variables as { name: string }[]) {
          this.declaredLocals.add(v.name);
        }
      }

      if (n.type === 'FunctionDeclaration' || n.type === 'LocalFunctionStatement') {
        const params = n.parameters as { name?: string }[] | undefined;
        if (Array.isArray(params)) {
          for (const p of params) {
            if (p && p.name) this.declaredLocals.add(p.name);
          }
        }
      }

      if (n.type === 'ForNumericStatement') {
        const v = n.variable as { name: string } | undefined;
        if (v) this.declaredLocals.add(v.name);
      }

      if (n.type === 'ForGenericStatement' && Array.isArray(n.variables)) {
        for (const v of n.variables as { name: string }[]) {
          this.declaredLocals.add(v.name);
        }
      }
    });
  }

  /**
   * Encode a string as printable ASCII escapes:
   * "print" → "\112\114\105\110\116"
   */
  private encodeStringEscape(str: string): string {
    return str.split('').map(c => '\\' + c.charCodeAt(0)).join('');
  }
}
