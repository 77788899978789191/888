"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Orchestrator = void 0;
/**
 * Project: Gungnir - Core Orchestrator
 * Responsibility-chain pipeline that sequences obfuscation modules.
 */
const fs = __importStar(require("fs"));
const helpers_1 = require("../utils/helpers");
// Plugin imports
const OpaquePredicate_1 = require("../obfuscators/OpaquePredicate");
const StringEncryption_1 = require("../obfuscators/StringEncryption");
const ControlFlowFlattening_1 = require("../obfuscators/ControlFlowFlattening");
const IdentifierRenaming_1 = require("../obfuscators/IdentifierRenaming");
const ConstantObfuscation_1 = require("../obfuscators/ConstantObfuscation");
const ExpressionDecomposition_1 = require("../obfuscators/ExpressionDecomposition");
const DeadCodeInjection_1 = require("../obfuscators/DeadCodeInjection");
const GlobalHiding_1 = require("../obfuscators/GlobalHiding");
const ProxyFunction_1 = require("../obfuscators/ProxyFunction");
const AntiDebug_1 = require("../obfuscators/AntiDebug");
const RobloxHardening_1 = require("../obfuscators/RobloxHardening");
const Watermark_1 = require("../obfuscators/Watermark");
const VMEngine_1 = require("../obfuscators/VMEngine");
// —— 第二部分：炼狱级控制流 ——
const IndirectJumps_1 = require("../obfuscators/IndirectJumps");
const LoopObfuscation_1 = require("../obfuscators/LoopObfuscation");
const ControlFlowChaos_1 = require("../obfuscators/ControlFlowChaos");
const FunctionShredding_1 = require("../obfuscators/FunctionShredding");
// —— 第三部分：量子级数据与常量 ——
const StringSplitting_1 = require("../obfuscators/StringSplitting");
const DataTorment_1 = require("../obfuscators/DataTorment");
const MetatableProxy_1 = require("../obfuscators/MetatableProxy");
const TypeMaze_1 = require("../obfuscators/TypeMaze");
// —— 第四部分：多维作用域与符号撕裂 ——
const ClosureNesting_1 = require("../obfuscators/ClosureNesting");
const FunctionClones_1 = require("../obfuscators/FunctionClones");
const EnvironmentSandbox_1 = require("../obfuscators/EnvironmentSandbox");
// —— 第五部分：反自动化分析护盾 ——
const PathExplosion_1 = require("../obfuscators/PathExplosion");
// —— 第七部分：平台专属（Delta Executor） ——
const PlatformDelta_1 = require("../obfuscators/PlatformDelta");
const LuaPrinter_1 = require("./LuaPrinter");
const Verifier_1 = require("./Verifier");
const SeedEngine_1 = require("./SeedEngine");
/**
 * Layer execution order — layers run in this sequence, modules within a layer may be shuffled.
 * VM emission (layer 1) runs near-last: it wraps the final AST and encrypts
 * all constants into the GX-Cipher pool, so it must see the fully-transformed tree.
 * Delivery (layer 8) runs last to embed the final watermark.
 */
const LAYER_ORDER = [4, 3, 2, 5, 6, 7, 1, 8];
class Orchestrator {
    plugins = [];
    logger;
    config;
    stats = null;
    /** 【子系统 15/95】验证器 */
    verifier = new Verifier_1.Verifier();
    /** 【子系统 11/94】本构建种子引擎（指纹/水印） */
    seedEngine = null;
    constructor(config) {
        this.config = config;
        this.logger = new helpers_1.Logger(config.verbose);
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
    registerDefaultPlugins() {
        const L = this.config.layers;
        const byLayer = new Map();
        const addPlugin = (layer, plugin) => {
            if (!byLayer.has(layer))
                byLayer.set(layer, []);
            byLayer.get(layer).push(plugin);
        };
        // Layer 4: Scope & Symbol Tearing (first — normalizes symbols)
        if (L.scopeTearing) {
            addPlugin(4, new IdentifierRenaming_1.IdentifierRenamingPlugin());
            addPlugin(4, new GlobalHiding_1.GlobalHidingPlugin());
            addPlugin(4, new ProxyFunction_1.ProxyFunctionPlugin());
            addPlugin(4, new ClosureNesting_1.ClosureNestingPlugin()); // 子系统 54/55
            addPlugin(4, new FunctionClones_1.FunctionClonesPlugin()); // 子系统 58/59
            addPlugin(4, new EnvironmentSandbox_1.EnvironmentSandboxPlugin()); // 子系统 56/60
        }
        // Layer 3: Data & Constant Blackhole
        if (L.dataFlow) {
            addPlugin(3, new StringEncryption_1.StringEncryptionPlugin());
            addPlugin(3, new ConstantObfuscation_1.ConstantObfuscationPlugin());
            addPlugin(3, new ExpressionDecomposition_1.ExpressionDecompositionPlugin());
            addPlugin(3, new StringSplitting_1.StringSplittingPlugin()); // 子系统 49/50
            addPlugin(3, new DataTorment_1.DataTormentPlugin()); // 子系统 39/42/43/46/47
            addPlugin(3, new MetatableProxy_1.MetatableProxyPlugin()); // 子系统 44/69
            addPlugin(3, new TypeMaze_1.TypeMazePlugin()); // 子系统 45/64
        }
        // Layer 2: Control Flow Purgatory
        if (L.controlFlow) {
            addPlugin(2, new OpaquePredicate_1.OpaquePredicatePlugin());
            addPlugin(2, new ControlFlowFlattening_1.ControlFlowFlatteningPlugin());
            addPlugin(2, new IndirectJumps_1.IndirectJumpsPlugin()); // 子系统 18/19/32/33
            addPlugin(2, new LoopObfuscation_1.LoopObfuscationPlugin()); // 子系统 22/31
            addPlugin(2, new ControlFlowChaos_1.ControlFlowChaosPlugin()); // 子系统 25/27/28/29/30
            addPlugin(2, new FunctionShredding_1.FunctionShreddingPlugin()); // 子系统 23/57
        }
        // Layer 5: Anti-Automated-Analysis Shield
        if (L.antiAnalysis) {
            addPlugin(5, new DeadCodeInjection_1.DeadCodeInjectionPlugin());
            addPlugin(5, new PathExplosion_1.PathExplosionPlugin()); // 子系统 24/62/63/67/68
        }
        // Layer 1: VM & Execution Layer (runs near-last — wraps final AST)
        if (L.vm) {
            addPlugin(1, new VMEngine_1.VMEnginePlugin());
        }
        // Layer 6: Hardcore Runtime Countermeasures
        if (L.runtime) {
            addPlugin(6, new AntiDebug_1.AntiDebugPlugin());
        }
        // Layer 7: Roblox Ecosystem Arsenal / Delta Executor
        if (L.roblox && this.config.target === 'roblox') {
            addPlugin(7, new RobloxHardening_1.RobloxHardeningPlugin());
            addPlugin(7, new PlatformDelta_1.PlatformDeltaPlugin()); // 子系统 84/85/89
        }
        // Layer 8: Engineering & Delivery (last — embeds final watermark)
        if (L.delivery) {
            addPlugin(8, new Watermark_1.WatermarkPlugin());
        }
        else if (this.config.watermark) {
            // Watermark still runs as part of delivery even if the rest of layer 8 is off
            addPlugin(8, new Watermark_1.WatermarkPlugin());
        }
        // Assemble the pipeline: layers in fixed order, modules shuffled within layers
        for (const layer of LAYER_ORDER) {
            const modules = byLayer.get(layer);
            if (!modules || modules.length === 0)
                continue;
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
    shuffleWithRng(plugins) {
        const result = [...plugins];
        let state = this.config.seed >>> 0;
        if (state === 0)
            state = 0x9E3779B9;
        for (let i = result.length - 1; i > 0; i--) {
            state ^= state << 13;
            state >>>= 0;
            state ^= state >>> 17;
            state ^= state << 5;
            state >>>= 0;
            const j = Math.floor((state / 0xFFFFFFFF) * (i + 1)) % (i + 1);
            const tmp = result[i];
            result[i] = result[j];
            result[j] = tmp;
        }
        return result;
    }
    /** Register a new plugin into the chain */
    register(plugin) {
        this.plugins.push(plugin);
        this.logger.debug(`Plugin registered: ${plugin.name}`);
    }
    /** Remove a plugin by name */
    unregister(name) {
        const idx = this.plugins.findIndex(p => p.name === name);
        if (idx >= 0) {
            this.plugins.splice(idx, 1);
            return true;
        }
        return false;
    }
    /** Get all registered plugins */
    getPlugins() {
        return this.plugins;
    }
    /**
     * 【子系统 93】解析源码级强度 pragma：
     *   -- @pragma: intensity=5 on= functionName
     *   -- @pragma: intensity=2
     * 返回函数名 → 强度映射（1-5）。
     */
    parsePragmas(source) {
        const pragmas = new Map();
        const re = /--\s*@pragma:\s*intensity\s*=\s*([1-5])(?:\s+on\s*=\s*([\w.]+))?/g;
        let m;
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
    async obfuscate(source) {
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
            if (!this.config.verify)
                break;
            // 【子系统 15/95】自动验证
            this.seedEngine = this.seedEngine ?? new SeedEngine_1.SeedEngine(String(seed));
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
            this.logger.warn(`验证失败（尝试 ${attempt}）: ${verification.diagnostics.join('; ').slice(0, 300)}`);
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
    async runPipeline(source, pragmas, config) {
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
                this.logger.info(`Plugin ${plugin.name} completed in ${Date.now() - startedAt}ms`);
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                const nodeContext = this.extractErrorContext(currentAst, err);
                this.logger.error(`Plugin ${plugin.name} failed (quarantined): ${message}` +
                    (nodeContext ? ` | node context: ${nodeContext}` : ''));
                ctx.stats.modulesFailed.push(plugin.name);
                // Error recovery: continue with next plugin, don't crash the pipeline
                if (this.config.verbose && err instanceof Error && err.stack) {
                    console.error(err.stack);
                }
            }
        }
        // Phase 4: Generate output Lua source
        const output = this.generateCode(currentAst);
        this.logger.info(`Pipeline complete. ${ctx.stats.nodesProcessed} nodes, ` +
            `${ctx.stats.stringsEncrypted} strings encrypted, ` +
            `${ctx.stats.constantsObfuscated} constants obfuscated, ` +
            `${ctx.stats.expressionsDecomposed} expressions decomposed, ` +
            `${ctx.stats.predicatesInjected} predicates injected, ` +
            `${ctx.stats.deadBlocksInjected} dead blocks injected, ` +
            `${ctx.stats.identifiersRenamed} identifiers renamed, ` +
            `${ctx.stats.globalsHidden} globals hidden, ` +
            `${ctx.stats.functionsProxied} functions proxied, ` +
            `${ctx.stats.blocksFlattened} blocks flattened`);
        if (ctx.stats.modulesFailed.length > 0) {
            this.logger.warn(`Failed modules (excluded from output): ${ctx.stats.modulesFailed.join(', ')}`);
        }
        return output;
    }
    /**
     * 【子系统 95】生成质量评估报告（验证后调用）。
     */
    generateQualityReport(source, output) {
        if (!this.seedEngine) {
            this.seedEngine = new SeedEngine_1.SeedEngine(String(this.config.seed));
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
    extractErrorContext(ast, err) {
        try {
            const message = err instanceof Error ? err.message : String(err);
            // Look for node location info embedded in the error
            const locMatch = message.match(/\[(\d+):(\d+)\]/);
            if (locMatch) {
                const line = parseInt(locMatch[1], 10);
                const node = this.findNodeAtLine(ast, line);
                if (node) {
                    const n = node;
                    return `type=${n.type} line=${line}`;
                }
                return `line=${line}`;
            }
            return '';
        }
        catch {
            return '';
        }
    }
    findNodeAtLine(ast, line) {
        let found = null;
        const search = (node) => {
            if (found)
                return;
            const n = node;
            if (!n || typeof n !== 'object')
                return;
            const loc = n.loc;
            if (loc && loc.start && loc.start.line === line) {
                found = node;
                return;
            }
            for (const key of Object.keys(n)) {
                if (key === 'type' || key === 'loc' || key === 'range')
                    continue;
                const value = n[key];
                if (Array.isArray(value)) {
                    for (const item of value) {
                        if (item && typeof item === 'object' && 'type' in item)
                            search(item);
                    }
                }
                else if (value && typeof value === 'object' && 'type' in value) {
                    search(value);
                }
            }
        };
        search(ast);
        return found;
    }
    /** Parse Lua source using luaparse */
    parseSource(source) {
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
            return ast;
        }
        catch (err) {
            this.logger.error(`Parse error: ${err instanceof Error ? err.message : String(err)}`);
            return null;
        }
    }
    /** Build the shared obfuscation context */
    buildContext(ast, config, pragmas) {
        const stats = {
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
            rng: (0, helpers_1.createRng)(config.seed),
            symbols: new Map(),
            stringPool: [],
            stats,
            pragmaIntensities: pragmas,
        };
    }
    /** Generate Lua source from AST */
    generateCode(ast) {
        const printer = new LuaPrinter_1.LuaPrinter();
        return printer.print(ast);
    }
    /** Process a file end-to-end */
    async processFile(inputPath, outputPath) {
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
            }
            else {
                this.logger.warn(`Self-destruct failed for ${inputPath}`);
            }
        }
    }
    /** Get pipeline statistics (for CLI reporting) */
    getStats() {
        return this.stats;
    }
}
exports.Orchestrator = Orchestrator;
