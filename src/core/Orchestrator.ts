/**
 * Project: Gungnir - Core Orchestrator
 * Responsibility-chain pipeline that sequences obfuscation modules.
 */
import * as fs from 'fs';
import {
  GungnirConfig, ObfuscationContext, ObfuscationPlugin,
  Chunk, ObfuscationStats
} from './types';
import { createRng, Logger } from '../utils/helpers';

// Plugin imports
import { OpaquePredicatePlugin } from '../obfuscators/OpaquePredicate';
import { StringEncryptionPlugin } from '../obfuscators/StringEncryption';
import { ControlFlowFlatteningPlugin } from '../obfuscators/ControlFlowFlattening';
import { IdentifierRenamingPlugin } from '../obfuscators/IdentifierRenaming';
import { ConstantObfuscationPlugin } from '../obfuscators/ConstantObfuscation';
import { ExpressionDecompositionPlugin } from '../obfuscators/ExpressionDecomposition';
import { DeadCodeInjectionPlugin } from '../obfuscators/DeadCodeInjection';
import { GlobalHidingPlugin } from '../obfuscators/GlobalHiding';
import { ProxyFunctionPlugin } from '../obfuscators/ProxyFunction';
import { AntiDebugPlugin } from '../obfuscators/AntiDebug';
import { RobloxHardeningPlugin } from '../obfuscators/RobloxHardening';
import { WatermarkPlugin } from '../obfuscators/Watermark';

/** Layer execution order — layers run in this sequence, modules within a layer may be shuffled */
const LAYER_ORDER = [4, 3, 2, 5, 1, 6, 7, 8] as const;

export class Orchestrator {
  private plugins: ObfuscationPlugin[] = [];
  private logger: Logger;
  private config: GungnirConfig;
  private stats: ObfuscationStats | null = null;

  constructor(config: GungnirConfig) {
    this.config = config;
    this.logger = new Logger(config.verbose);
    this.registerDefaultPlugins();
  }

  /**
   * Register built-in plugins based on layer configuration.
   *
   * Commercial-grade pipeline design:
   * - Layers execute in a fixed dependency-safe order
   * - Modules within the same layer are shuffled when
   *   polymorphicPipeline is enabled (item 84/85: every build
   *   produces a structurally different obfuscation pipeline)
   * - Layer 4 (scope tearing) runs first to normalize symbols
   * - Layer 8 (delivery) runs last to embed the final watermark
   */
  private registerDefaultPlugins(): void {
    const L = this.config.layers;
    const byLayer = new Map<number, ObfuscationPlugin[]>();

    const addPlugin = (layer: number, plugin: ObfuscationPlugin): void => {
      if (!byLayer.has(layer)) byLayer.set(layer, []);
      byLayer.get(layer)!.push(plugin);
    };

    // Layer 4: Scope & Symbol Tearing (first — normalizes symbols)
    if (L.scopeTearing) {
      addPlugin(4, new IdentifierRenamingPlugin());
      addPlugin(4, new GlobalHidingPlugin());
      addPlugin(4, new ProxyFunctionPlugin());
    }

    // Layer 3: Data & Constant Blackhole
    if (L.dataFlow) {
      addPlugin(3, new StringEncryptionPlugin());
      addPlugin(3, new ConstantObfuscationPlugin());
      addPlugin(3, new ExpressionDecompositionPlugin());
    }

    // Layer 2: Control Flow Purgatory
    if (L.controlFlow) {
      addPlugin(2, new OpaquePredicatePlugin());
      addPlugin(2, new ControlFlowFlatteningPlugin());
    }

    // Layer 5: Anti-Automated-Analysis Shield
    if (L.antiAnalysis) {
      addPlugin(5, new DeadCodeInjectionPlugin());
    }

    // Layer 1: VM & Execution Layer
    if (L.vm) {
      // BytecodeGen is registered but not enabled by default in the
      // full pipeline — it replaces the entire program with VM bytecode
      // and is only safe for straight-line scripts. Enable via config.
      // addPlugin(1, new BytecodeGenPlugin());
    }

    // Layer 6: Hardcore Runtime Countermeasures
    if (L.runtime) {
      addPlugin(6, new AntiDebugPlugin());
    }

    // Layer 7: Roblox Ecosystem Arsenal
    if (L.roblox && this.config.target === 'roblox') {
      addPlugin(7, new RobloxHardeningPlugin());
    }

    // Layer 8: Engineering & Delivery (last — embeds final watermark)
    if (L.delivery) {
      addPlugin(8, new WatermarkPlugin());
    } else if (this.config.watermark) {
      // Watermark still runs as part of delivery even if the rest of layer 8 is off
      addPlugin(8, new WatermarkPlugin());
    }

    // Assemble the pipeline: layers in fixed order, modules shuffled within layers
    for (const layer of LAYER_ORDER) {
      const modules = byLayer.get(layer);
      if (!modules || modules.length === 0) continue;

      const ordered = this.config.polymorphicPipeline
        ? this.shuffleWithRng(modules)
        : modules;

      for (const plugin of ordered) {
        this.register(plugin);
      }
    }

    this.logger.info(`Registered ${this.plugins.length} plugins across ${byLayer.size} layers`);
  }

  /**
   * Shuffle plugin order within a layer (deterministic on config.seed).
   */
  private shuffleWithRng(plugins: ObfuscationPlugin[]): ObfuscationPlugin[] {
    const result = [...plugins];
    let state = this.config.seed >>> 0;
    if (state === 0) state = 0x9E3779B9;
    for (let i = result.length - 1; i > 0; i--) {
      state ^= state << 13; state >>>= 0;
      state ^= state >>> 17;
      state ^= state << 5; state >>>= 0;
      const j = Math.floor((state / 0xFFFFFFFF) * (i + 1)) % (i + 1);
      const tmp = result[i];
      result[i] = result[j];
      result[j] = tmp;
    }
    return result;
  }

  /** Register a new plugin into the chain */
  register(plugin: ObfuscationPlugin): void {
    this.plugins.push(plugin);
    this.logger.debug(`Plugin registered: ${plugin.name}`);
  }

  /** Remove a plugin by name */
  unregister(name: string): boolean {
    const idx = this.plugins.findIndex(p => p.name === name);
    if (idx >= 0) {
      this.plugins.splice(idx, 1);
      return true;
    }
    return false;
  }

  /** Get all registered plugins */
  getPlugins(): readonly ObfuscationPlugin[] {
    return this.plugins;
  }

  /**
   * Execute the full obfuscation pipeline.
   * Each plugin transforms the AST in sequence (responsibility chain).
   *
   * Commercial-grade error recovery: a failing module is quarantined
   * (recorded in stats.modulesFailed) with full AST-node context, and
   * the pipeline continues — a single module bug never destroys the build.
   */
  async obfuscate(source: string): Promise<string> {
    this.logger.info('Starting obfuscation pipeline');

    // Phase 1: Parse source to AST
    const ast = this.parseSource(source);
    if (!ast) {
      throw new Error('Failed to parse Lua source — check syntax near the reported location');
    }

    // Phase 2: Build context
    const ctx = this.buildContext(ast);
    this.stats = ctx.stats;

    // Phase 3: Run each plugin in the chain
    let currentAst = ast;
    ctx.stats.pipelineOrder = this.plugins.map(p => p.name);

    for (const plugin of this.plugins) {
      const startedAt = Date.now();
      try {
        this.logger.info(`Applying plugin: ${plugin.name}`);

        if (plugin.canHandle && !plugin.canHandle(ctx)) {
          this.logger.info(`Plugin ${plugin.name} skipped (cannot handle)`);
          continue;
        }

        if (plugin.preTransform) {
          plugin.preTransform(ctx);
        }

        currentAst = plugin.transform(ctx);

        if (plugin.postTransform) {
          plugin.postTransform(ctx);
        }

        ctx.stats.modulesApplied.push(plugin.name);
        this.logger.info(
          `Plugin ${plugin.name} completed in ${Date.now() - startedAt}ms`
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const nodeContext = this.extractErrorContext(currentAst, err);
        this.logger.error(
          `Plugin ${plugin.name} failed (quarantined): ${message}` +
          (nodeContext ? ` | node context: ${nodeContext}` : '')
        );
        ctx.stats.modulesFailed.push(plugin.name);
        // Error recovery: continue with next plugin, don't crash the pipeline
        if (this.config.verbose && err instanceof Error && err.stack) {
          console.error(err.stack);
        }
      }
    }

    // Phase 4: Generate output Lua source
    const output = this.generateCode(currentAst);

    this.logger.info(
      `Pipeline complete. ${ctx.stats.nodesProcessed} nodes, ` +
      `${ctx.stats.stringsEncrypted} strings encrypted, ` +
      `${ctx.stats.constantsObfuscated} constants obfuscated, ` +
      `${ctx.stats.expressionsDecomposed} expressions decomposed, ` +
      `${ctx.stats.predicatesInjected} predicates injected, ` +
      `${ctx.stats.deadBlocksInjected} dead blocks injected, ` +
      `${ctx.stats.identifiersRenamed} identifiers renamed, ` +
      `${ctx.stats.globalsHidden} globals hidden, ` +
      `${ctx.stats.functionsProxied} functions proxied, ` +
      `${ctx.stats.blocksFlattened} blocks flattened`
    );

    if (ctx.stats.modulesFailed.length > 0) {
      this.logger.warn(`Failed modules (excluded from output): ${ctx.stats.modulesFailed.join(', ')}`);
    }

    return output;
  }

  /**
   * Extract AST node context from an error for diagnostics.
   * Robustness requirement: parse failures must output clear AST node
   * logs without interrupting the process.
   */
  private extractErrorContext(ast: Chunk, err: unknown): string {
    try {
      const message = err instanceof Error ? err.message : String(err);
      // Look for node location info embedded in the error
      const locMatch = message.match(/\[(\d+):(\d+)\]/);
      if (locMatch) {
        const line = parseInt(locMatch[1], 10);
        const node = this.findNodeAtLine(ast, line);
        if (node) {
          const n = node as unknown as Record<string, unknown>;
          return `type=${n.type} line=${line}`;
        }
        return `line=${line}`;
      }
      return '';
    } catch {
      return '';
    }
  }

  private findNodeAtLine(ast: Chunk, line: number): unknown | null {
    let found: unknown | null = null;
    const search = (node: unknown): void => {
      if (found) return;
      const n = node as Record<string, unknown> | null;
      if (!n || typeof n !== 'object') return;

      const loc = n.loc as { start?: { line?: number } } | undefined;
      if (loc && loc.start && loc.start.line === line) {
        found = node;
        return;
      }

      for (const key of Object.keys(n)) {
        if (key === 'type' || key === 'loc' || key === 'range') continue;
        const value = n[key];
        if (Array.isArray(value)) {
          for (const item of value) {
            if (item && typeof item === 'object' && 'type' in item) search(item);
          }
        } else if (value && typeof value === 'object' && 'type' in value) {
          search(value);
        }
      }
    };
    search(ast);
    return found;
  }

  /** Parse Lua source using luaparse */
  private parseSource(source: string): Chunk | null {
    try {
      // Dynamic import to avoid issues if luaparse isn't installed
      const luaparse = require('luaparse');
      const ast = luaparse.parse(source, {
        luaVersion: '5.1',
        comments: false,
        scope: true,
        locations: true,
        ranges: true,
      });
      return ast as Chunk;
    } catch (err) {
      this.logger.error(
        `Parse error: ${err instanceof Error ? err.message : String(err)}`
      );
      return null;
    }
  }

  /** Build the shared obfuscation context */
  private buildContext(ast: Chunk): ObfuscationContext {
    const stats: ObfuscationStats = {
      nodesProcessed: 0,
      stringsEncrypted: 0,
      predicatesInjected: 0,
      identifiersRenamed: 0,
      blocksFlattened: 0,
      constantsObfuscated: 0,
      expressionsDecomposed: 0,
      deadBlocksInjected: 0,
      globalsHidden: 0,
      functionsProxied: 0,
      modulesApplied: [],
      modulesFailed: [],
      pipelineOrder: [],
    };

    return {
      ast,
      config: this.config,
      rng: createRng(this.config.seed),
      symbols: new Map(),
      stringPool: [],
      stats,
    };
  }

  /** Generate Lua source from AST */
  private generateCode(ast: Chunk): string {
    // Simple code generator — stringifies the AST back to Lua
    const writer = new LuaWriter();
    return writer.write(ast);
  }

  /** Process a file end-to-end */
  async processFile(inputPath: string, outputPath: string): Promise<void> {
    const source = fs.readFileSync(inputPath, 'utf-8');
    const result = await this.obfuscate(source);
    fs.writeFileSync(outputPath, result, 'utf-8');
    this.logger.info(`Written to ${outputPath}`);

    // Self-destruct: securely wipe the input after successful delivery (item 83)
    if (this.config.selfDestruct) {
      const { WatermarkPlugin } = require('../obfuscators/Watermark');
      const deleted = WatermarkPlugin.secureDelete(inputPath);
      if (deleted) {
        this.logger.info(`Source self-destruct complete: ${inputPath}`);
      } else {
        this.logger.warn(`Self-destruct failed for ${inputPath}`);
      }
    }
  }

  /** Get pipeline statistics (for CLI reporting) */
  getStats(): ObfuscationStats | null {
    return this.stats;
  }
}

// ============ Lua Code Writer ============

/**
 * Converts AST back to Lua source code.
 * This is a minimal implementation for demonstration;
 * production would use a proper code generator.
 */
export class LuaWriter {
  private indentLevel = 0;

  write(node: Chunk): string {
    let output = '';
    for (const stmt of node.body) {
      output += this.writeStatement(stmt as never) + '\n';
    }
    return output;
  }

  private indent(): string {
    return '  '.repeat(this.indentLevel);
  }

  private writeStatement(node: Record<string, unknown>): string {
    const type = node.type as string;
    const n = node as Record<string, never>;

    switch (type) {
      case 'LocalStatement': {
        const vars = (n.variables as unknown as { name: string }[])
          .map(v => v.name).join(', ');
        const inits = Array.isArray(n.init) && (n.init as unknown as unknown[]).length > 0
          ? ' = ' + (n.init as unknown as Record<string, unknown>[])
            .map(i => this.writeExpression(i)).join(', ')
          : '';
        return `${this.indent()}local ${vars}${inits}`;
      }

      case 'AssignmentStatement': {
        const vars = (n.variables as unknown as Record<string, unknown>[])
          .map(v => this.writeExpression(v)).join(', ');
        const inits = (n.init as unknown as Record<string, unknown>[])
          .map(i => this.writeExpression(i)).join(', ');
        return `${this.indent()}${vars} = ${inits}`;
      }

      case 'CallStatement': {
        const expr = this.writeExpression(
          (node as { expression: unknown }).expression as Record<string, unknown>
        );
        return `${this.indent()}${expr}`;
      }

      case 'IfStatement': {
        let result = '';
        const clauses = (n.clauses as unknown as {
          condition: Record<string, unknown> | null;
          body: Record<string, unknown>[];
        }[]);

        clauses.forEach((clause, i) => {
          // A clause without a condition is an `else` clause (luaparse convention)
          if (clause.condition === null || clause.condition === undefined) {
            result += `${this.indent()}else\n`;
          } else {
            const cond = this.writeExpression(clause.condition);
            if (i === 0) {
              result += `${this.indent()}if ${cond} then\n`;
            } else {
              result += `${this.indent()}elseif ${cond} then\n`;
            }
          }
          this.indentLevel++;
          for (const stmt of clause.body) {
            result += this.writeStatement(stmt) + '\n';
          }
          this.indentLevel--;
        });

        if (node.else_ && Array.isArray(node.else_) && node.else_.length > 0) {
          result += `${this.indent()}else\n`;
          this.indentLevel++;
          for (const stmt of node.else_ as unknown as Record<string, unknown>[]) {
            result += this.writeStatement(stmt) + '\n';
          }
          this.indentLevel--;
        }

        result += `${this.indent()}end`;
        return result;
      }

      case 'WhileStatement': {
        const cond = this.writeExpression(
          (node as { condition: unknown }).condition as Record<string, unknown>
        );
        let result = `${this.indent()}while ${cond} do\n`;
        this.indentLevel++;
        const body = (node as { body: unknown }).body as Record<string, unknown>[];
        for (const stmt of body) {
          result += this.writeStatement(stmt) + '\n';
        }
        this.indentLevel--;
        result += `${this.indent()}end`;
        return result;
      }

      case 'FunctionDeclaration': {
        const ident = (node as { identifier: { name: string } }).identifier;
        const params = (node as { parameters: { name?: string; type?: string }[] })
          .parameters
          .map(p => p.type === 'VarargLiteral' ? '...' : p.name)
          .join(', ');
        let result = `${this.indent()}function ${ident?.name ?? ''}(${params})\n`;
        this.indentLevel++;
        const body = (node as { body: unknown }).body as Record<string, unknown>[];
        for (const stmt of body) {
          result += this.writeStatement(stmt) + '\n';
        }
        this.indentLevel--;
        result += `${this.indent()}end`;
        return result;
      }

      case 'ReturnStatement': {
        const args = (node as { arguments: unknown }).arguments as Record<string, unknown>[];
        if (args && args.length > 0) {
          return `${this.indent()}return ${args.map(a => this.writeExpression(a)).join(', ')}`;
        }
        return `${this.indent()}return`;
      }

      case 'BreakStatement':
        return `${this.indent()}break`;

      case 'DoStatement': {
        let result = `${this.indent()}do\n`;
        this.indentLevel++;
        const body = (node as { body: unknown }).body as Record<string, unknown>[];
        for (const stmt of body) {
          result += this.writeStatement(stmt) + '\n';
        }
        this.indentLevel--;
        result += `${this.indent()}end`;
        return result;
      }

      case 'ForNumericStatement': {
        const variable = (node as { variable: { name: string } }).variable;
        const start = this.writeExpression((node as { start: unknown }).start as Record<string, unknown>);
        const end = this.writeExpression((node as { end: unknown }).end as Record<string, unknown>);
        const step = (node as { step: unknown }).step;
        const stepStr = step ? `, ${this.writeExpression(step as Record<string, unknown>)}` : '';
        let result = `${this.indent()}for ${variable.name} = ${start}, ${end}${stepStr} do\n`;
        this.indentLevel++;
        const body = (node as { body: unknown }).body as Record<string, unknown>[];
        for (const stmt of body) {
          result += this.writeStatement(stmt) + '\n';
        }
        this.indentLevel--;
        result += `${this.indent()}end`;
        return result;
      }

      case 'ForGenericStatement': {
        const variables = (node as { variables: { name: string }[] }).variables;
        const varNames = variables.map(v => v.name).join(', ');
        const iterators = ((node as { iterators: unknown[] }).iterators ?? [])
          .map(i => this.writeExpression(i as Record<string, unknown>)).join(', ');
        let result = `${this.indent()}for ${varNames} in ${iterators} do\n`;
        this.indentLevel++;
        const body = (node as { body: unknown }).body as Record<string, unknown>[];
        for (const stmt of body) {
          result += this.writeStatement(stmt) + '\n';
        }
        this.indentLevel--;
        result += `${this.indent()}end`;
        return result;
      }

      case 'RepeatStatement': {
        let result = `${this.indent()}repeat\n`;
        this.indentLevel++;
        const body = (node as { body: unknown }).body as Record<string, unknown>[];
        for (const stmt of body) {
          result += this.writeStatement(stmt) + '\n';
        }
        this.indentLevel--;
        const condition = this.writeExpression((node as { condition: unknown }).condition as Record<string, unknown>);
        result += `${this.indent()}until ${condition}`;
        return result;
      }

      case 'LabelStatement': {
        const label = (node as { label: { name: string } }).label;
        return `${this.indent()}::${label.name}::`;
      }

      case 'GotoStatement': {
        const label = (node as { label: { name: string } }).label;
        return `${this.indent()}goto ${label.name}`;
      }

      case 'LocalFunctionStatement': {
        const ident = (node as { identifier: { name: string } }).identifier;
        const params = (node as { parameters: { name?: string; type?: string }[] })
          .parameters
          .map(p => p.type === 'VarargLiteral' ? '...' : p.name)
          .join(', ');
        let result = `${this.indent()}local function ${ident.name}(${params})\n`;
        this.indentLevel++;
        const body = (node as { body: unknown }).body as Record<string, unknown>[];
        for (const stmt of body) {
          result += this.writeStatement(stmt) + '\n';
        }
        this.indentLevel--;
        result += `${this.indent()}end`;
        return result;
      }

      case 'GungnirRawStatement':
        return this.indent() + String(node.code);

      default:
        return `${this.indent()}--[[UNKNOWN: ${type}]]`;
    }
  }

  /**
   * Escape a string for safe emission inside double quotes.
   * Without this, strings containing quotes/backslashes/newlines
   * produce syntactically invalid output.
   */
  private escapeLuaString(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  private writeExpression(node: Record<string, unknown> | null | undefined): string {
    if (!node) return 'nil';
    const type = node.type as string;

    switch (type) {
      case 'Identifier':
        return String(node.name);

      case 'NumericLiteral':
        return String(node.value);

      case 'StringLiteral':
        return `"${this.escapeLuaString(String(node.value))}"`;

      case 'BooleanLiteral':
        return String(node.value);

      case 'NilLiteral':
        return 'nil';

      case 'VarargLiteral':
        return '...';

      case 'BinaryExpression': {
        const left = this.writeExpression(node.left as Record<string, unknown>);
        const right = this.writeExpression(node.right as Record<string, unknown>);
        const op = String(node.operator);
        return `(${left} ${op} ${right})`;
      }

      case 'LogicalExpression': {
        const left = this.writeExpression(node.left as Record<string, unknown>);
        const right = this.writeExpression(node.right as Record<string, unknown>);
        const op = String(node.operator);
        return `(${left} ${op} ${right})`;
      }

      case 'UnaryExpression': {
        const arg = this.writeExpression(node.argument as Record<string, unknown>);
        return `${String(node.operator)}${arg}`;
      }

      case 'CallExpression': {
        const base = this.writeExpression(node.base as Record<string, unknown>);
        const args = Array.isArray(node.arguments)
          ? (node.arguments as Record<string, unknown>[])
            .map(a => this.writeExpression(a)).join(', ')
          : '';
        return `${base}(${args})`;
      }

      case 'MemberExpression': {
        const base = this.writeExpression(node.base as Record<string, unknown>);
        const ident = (node as { identifier: { name: string } }).identifier;
        return `${base}${String(node.indexer)}${ident.name}`;
      }

      case 'IndexExpression': {
        const base = this.writeExpression(node.base as Record<string, unknown>);
        const idx = this.writeExpression(node.index as Record<string, unknown>);
        return `${base}[${idx}]`;
      }

      case 'FunctionExpression': {
        const params = Array.isArray(node.parameters)
          ? (node.parameters as { name?: string; type?: string }[])
            .map(p => p.type === 'VarargLiteral' ? '...' : (p.name ?? ''))
            .join(', ')
          : '';
        this.indentLevel++;
        let body = '';
        const bodyArr = Array.isArray(node.body) ? (node.body as Record<string, unknown>[]) : [];
        for (const stmt of bodyArr) {
          body += this.writeStatement(stmt) + '\n';
        }
        this.indentLevel--;
        return `function(${params})\n${body}${this.indent()}end`;
      }

      case 'TableConstructorExpression': {
        const fields = Array.isArray(node.fields)
          ? (node.fields as Record<string, unknown>[])
          : [];
        if (fields.length === 0) return '{}';
        const parts = fields.map(f => {
          if (f.type === 'TableKey') {
            const key = this.writeExpression(f.key as Record<string, unknown>);
            const val = this.writeExpression(f.value as Record<string, unknown>);
            return `[${key}] = ${val}`;
          } else if (f.type === 'TableKeyString') {
            const key = (f as { key: { name: string } }).key;
            const val = this.writeExpression(f.value as Record<string, unknown>);
            return `${key.name} = ${val}`;
          } else {
            return this.writeExpression(f.value as Record<string, unknown>);
          }
        });
        return `{${parts.join(', ')}}`;
      }

      case 'ParentheticExpression':
        return `(${this.writeExpression(node.expression as Record<string, unknown>)})`;

      default:
        return `--[[EXPR:${type}]]`;
    }
  }
}
