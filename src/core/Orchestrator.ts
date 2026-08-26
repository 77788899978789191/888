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
import { VMEnginePlugin } from '../obfuscators/VMEngine';
// —— 第二部分：炼狱级控制流 ——
import { IndirectJumpsPlugin } from '../obfuscators/IndirectJumps';
import { LoopObfuscationPlugin } from '../obfuscators/LoopObfuscation';
import { ControlFlowChaosPlugin } from '../obfuscators/ControlFlowChaos';
import { FunctionShreddingPlugin } from '../obfuscators/FunctionShredding';
// —— 第三部分：量子级数据与常量 ——
import { StringSplittingPlugin } from '../obfuscators/StringSplitting';
import { DataTormentPlugin } from '../obfuscators/DataTorment';
import { MetatableProxyPlugin } from '../obfuscators/MetatableProxy';
import { TypeMazePlugin } from '../obfuscators/TypeMaze';
// —— 第四部分：多维作用域与符号撕裂 ——
import { ClosureNestingPlugin } from '../obfuscators/ClosureNesting';
import { FunctionClonesPlugin } from '../obfuscators/FunctionClones';
import { EnvironmentSandboxPlugin } from '../obfuscators/EnvironmentSandbox';
// —— 第五部分：反自动化分析护盾 ——
import { PathExplosionPlugin } from '../obfuscators/PathExplosion';
// —— 第七部分：平台专属（Delta Executor） ——
import { PlatformDeltaPlugin } from '../obfuscators/PlatformDelta';
import { LuaPrinter } from './LuaPrinter';
import { Verifier } from './Verifier';
import { SeedEngine } from './SeedEngine';

/**
 * Layer execution order — layers run in this sequence, modules within a layer may be shuffled.
 * VM emission (layer 1) runs near-last: it wraps the final AST and encrypts
 * all constants into the GX-Cipher pool, so it must see the fully-transformed tree.
 * Delivery (layer 8) runs last to embed the final watermark.
 */
const LAYER_ORDER = [4, 3, 2, 5, 6, 7, 1, 8] as const;

export class Orchestrator {
  private plugins: ObfuscationPlugin[] = [];
  private logger: Logger;
  private config: GungnirConfig;
  private stats: ObfuscationStats | null = null;
  /** 【子系统 15/95】验证器 */
  private verifier = new Verifier();
  /** 【子系统 11/94】本构建种子引擎（指纹/水印） */
  private seedEngine: SeedEngine | null = null;

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
      addPlugin(4, new ClosureNestingPlugin());        // 子系统 54/55
      addPlugin(4, new FunctionClonesPlugin());        // 子系统 58/59
      addPlugin(4, new EnvironmentSandboxPlugin());    // 子系统 56/60
    }

    // Layer 3: Data & Constant Blackhole
    if (L.dataFlow) {
      addPlugin(3, new StringEncryptionPlugin());
      addPlugin(3, new ConstantObfuscationPlugin());
      addPlugin(3, new ExpressionDecompositionPlugin());
      addPlugin(3, new StringSplittingPlugin());       // 子系统 49/50
      addPlugin(3, new DataTormentPlugin());           // 子系统 39/42/43/46/47
      addPlugin(3, new MetatableProxyPlugin());        // 子系统 44/69
      addPlugin(3, new TypeMazePlugin());              // 子系统 45/64
    }

    // Layer 2: Control Flow Purgatory
    if (L.controlFlow) {
      addPlugin(2, new OpaquePredicatePlugin());
      addPlugin(2, new ControlFlowFlatteningPlugin());
      addPlugin(2, new IndirectJumpsPlugin());         // 子系统 18/19/32/33
      addPlugin(2, new LoopObfuscationPlugin());       // 子系统 22/31
      addPlugin(2, new ControlFlowChaosPlugin());      // 子系统 25/27/28/29/30
      addPlugin(2, new FunctionShreddingPlugin());     // 子系统 23/57
    }

    // Layer 5: Anti-Automated-Analysis Shield
    if (L.antiAnalysis) {
      addPlugin(5, new DeadCodeInjectionPlugin());
      addPlugin(5, new PathExplosionPlugin());         // 子系统 24/62/63/67/68
    }

    // Layer 1: VM & Execution Layer (runs near-last — wraps final AST)
    if (L.vm) {
      addPlugin(1, new VMEnginePlugin());
    }

    // Layer 6: Hardcore Runtime Countermeasures
    if (L.runtime) {
      addPlugin(6, new AntiDebugPlugin());
    }

    // Layer 7: Roblox Ecosystem Arsenal / Delta Executor
    if (L.roblox && this.config.target === 'roblox') {
      addPlugin(7, new RobloxHardeningPlugin());
      addPlugin(7, new PlatformDeltaPlugin());         // 子系统 84/85/89
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
   * 【子系统 93】解析源码级强度 pragma：
   *   -- @pragma: intensity=5 on= functionName
   *   -- @pragma: intensity=2
   * 返回函数名 → 强度映射（1-5）。
   */
  private parsePragmas(source: string): Map<string, number> {
    const pragmas = new Map<string, number>();
    const re = /--\s*@pragma:\s*intensity\s*=\s*([1-5])(?:\s+on\s*=\s*([\w.]+))?/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(source)) !== null) {
      const level = parseInt(m[1], 10);
      const target = m[2] ?? '*';
      pragmas.set(target, level);
    }
    if (pragmas.size > 0) {
      this.logger.info(`解析到 ${pragmas.size} 条强度 pragma（子系统 93）`);
    }
    return pragmas;
  }

  /**
   * Execute the full obfuscation pipeline.
   * Each plugin transforms the AST in sequence (responsibility chain).
   *
   * 【子系统 15】验证循环：产物经 fengari 等价性 + 相似度 + 冲突
   * 检测，失败自动换种子重试（≤ maxVerifyRetries 次）。
   *
   * Commercial-grade error recovery: a failing module is quarantined
   * (recorded in stats.modulesFailed) with full AST-node context, and
   * the pipeline continues — a single module bug never destroys the build.
   */
  async obfuscate(source: string): Promise<string> {
    this.logger.info('Starting obfuscation pipeline');

    // 【子系统 93】函数级强度 pragma
    const pragmas = this.parsePragmas(source);

    // 【子系统 15】验证重试循环
    const maxAttempts = this.config.verify
      ? Math.max(1, this.config.maxVerifyRetries + 1)
      : 1;

    let lastOutput = '';
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // 重试时换种子（保证多态性——新结构）
      const seed = attempt === 1
        ? this.config.seed
        : (Date.now() ^ (attempt * 0x9E3779B9)) >>> 0;
      const attemptConfig = { ...this.config, seed };

      this.logger.info(`构建尝试 ${attempt}/${maxAttempts}（种子 ${seed}）`);
      const output = await this.runPipeline(source, pragmas, attemptConfig);
      lastOutput = output;

      if (!this.config.verify) break;

      // 【子系统 15/95】自动验证
      this.seedEngine = this.seedEngine ?? new SeedEngine(String(seed));
      const verification = this.verifier.verify({
        source,
        output,
        modulesApplied: this.stats?.modulesApplied ?? [],
        modulesFailed: this.stats?.modulesFailed ?? [],
        fingerprint: this.seedEngine.buildId,
      });

      if (verification.passed) {
        this.logger.info('✓ 自动验证通过（等价性/相似度/冲突检测）【子系统 15】');
        break;
      }

      this.logger.warn(
        `验证失败（尝试 ${attempt}）: ${verification.diagnostics.join('; ').slice(0, 300)}`,
      );
      if (attempt === maxAttempts) {
        this.logger.warn('已达最大重试次数——返回最优产物（验证器诊断已记录）');
      }
    }

    return lastOutput;
  }

  /**
   * 单次流水线执行（解析 → 变换 → 生成）。
   * 验证重试由 obfuscate() 驱动。
   */
  private async runPipeline(
    source: string,
    pragmas: Map<string, number>,
    config: GungnirConfig,
  ): Promise<string> {
    // Phase 1: Parse source to AST
    const ast = this.parseSource(source);
    if (!ast) {
      throw new Error('Failed to parse Lua source — check syntax near the reported location');
    }

    // Phase 2: Build context（含 pragma 强度映射【子系统 93】）
    const ctx = this.buildContext(ast, config, pragmas);
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
   * 【子系统 95】生成质量评估报告（验证后调用）。
   */
  generateQualityReport(source: string, output: string): string {
    if (!this.seedEngine) {
      this.seedEngine = new SeedEngine(String(this.config.seed));
    }
    const report = this.verifier.generateReport({
      source,
      output,
      modulesApplied: this.stats?.modulesApplied ?? [],
      modulesFailed: this.stats?.modulesFailed ?? [],
      fingerprint: this.seedEngine.buildId,
    });
    return this.verifier.renderReport(report);
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
        // 关键：默认 encodingMode 'none' 会丢弃字符串字面量的 value（null），
        // 所有依赖 node.value 的插件（StringEncryption/VMEngine 等）都会读到 null。
        // 'pseudo-latin1' 逐字节忠实解码（每个 char = 一个 Lua 字节）。
        encodingMode: 'pseudo-latin1',
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
  private buildContext(
    ast: Chunk,
    config: GungnirConfig,
    pragmas: Map<string, number>,
  ): ObfuscationContext {
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
      config,
      rng: createRng(config.seed),
      symbols: new Map(),
      stringPool: [],
      stats,
      pragmaIntensities: pragmas,
    };
  }

  /** Generate Lua source from AST */
  private generateCode(ast: Chunk): string {
    const printer = new LuaPrinter();
    return printer.print(ast as unknown as Record<string, unknown>);
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
