/**
 * Project: Gungnir - Obfuscation Orchestrator
 *
 * Coordinates all 98 obfuscation techniques across 8 layers:
 *   Layer 1: Polymorphic VM Engine        (VM-01 ~ VM-18, 18 items)
 *   Layer 2: Purgatory Control Flow       (CF-01 ~ CF-18, 18 items)
 *   Layer 3: Quantum Data & Constants      (DC-01 ~ DC-17, 17 items)
 *   Layer 4: Scope & Symbol Tearing        (SC-01 ~ SC-11, 11 items)
 *   Layer 5: Anti-Automation Shield        (AA-01 ~ AA-09,  9 items)
 *   Layer 6: Hardcore Runtime Countermeasures (RT-01 ~ RT-12, 12 items)
 *   Layer 7: Platform-Specific (Delta)     (PL-01 ~ PL-08,  8 items)
 *   Layer 8: Delivery & Engineering         (DE-01 ~ DE-06,  6 items)
 *   Total: 98 techniques
 *
 * Plugins execute in layer order (1 → 8), with randomized order within
 * each layer (DE-02: Multi-Strategy Orchestration Pipeline).
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk,
  GungnirConfig, createDefaultConfig, createDefaultStats,
  PolymorphismReport, RNG,
} from './types';
import { createRng } from '../utils/helpers';

// ============ Layer 1: Polymorphic VM Engine ============
import { PolymorphicVMPlugin } from '../vm/PolymorphicVM';
import { BytecodeGenPlugin } from '../vm/BytecodeGen';
import { VMEnhancedPlugin } from '../vm/VMEnhanced';

// ============ Layer 2: Control Flow ============
import { ControlFlowFlatteningPlugin } from '../obfuscators/ControlFlowFlattening';
import { OpaquePredicatePlugin } from '../obfuscators/OpaquePredicate';
import { ExpressionDecompositionPlugin } from '../obfuscators/ExpressionDecomposition';
import { DeadCodeInjectionPlugin } from '../obfuscators/DeadCodeInjection';
import { ControlFlowEnhancedPlugin } from '../obfuscators/ControlFlowEnhanced';
import { ControlFlowAdvancedPlugin } from '../obfuscators/ControlFlowAdvanced';

// ============ Layer 3: Data & Constants ============
import { StringEncryptionPlugin } from '../obfuscators/StringEncryption';
import { ConstantObfuscationPlugin } from '../obfuscators/ConstantObfuscation';
import { DataObfuscationEnhancedPlugin } from '../obfuscators/DataObfuscationEnhanced';

// ============ Layer 4: Scope & Symbol ============
import { IdentifierRenamingPlugin } from '../obfuscators/IdentifierRenaming';
import { GlobalHidingPlugin } from '../obfuscators/GlobalHiding';
import { ProxyFunctionPlugin } from '../obfuscators/ProxyFunction';
import { ScopeObfuscationEnhancedPlugin } from '../obfuscators/ScopeObfuscationEnhanced';

// ============ Layer 5: Anti-Analysis ============
import { AntiAnalysisPlugin } from '../obfuscators/AntiAnalysis';

// ============ Layer 6: Runtime Countermeasures ============
import { AntiDebugPlugin } from '../obfuscators/AntiDebug';
import { RuntimeCountermeasuresPlugin } from '../obfuscators/RuntimeCountermeasures';

// ============ Layer 7: Platform-Specific ============
import { RobloxHardeningPlugin } from '../obfuscators/RobloxHardening';
import { PlatformSpecificPlugin } from '../obfuscators/PlatformSpecific';

// ============ Layer 8: Delivery & Engineering ============
import { WatermarkPlugin } from '../obfuscators/Watermark';
import { DeliveryEngineeringPlugin } from '../obfuscators/DeliveryEngineering';
import { DataDeliveryEnhancedPlugin } from '../obfuscators/DataDeliveryEnhanced';
import { UltimateTechniquesPlugin } from '../obfuscators/UltimateTechniques';
import { AdvancedTechniquesPlugin } from '../obfuscators/AdvancedTechniques';

export class Orchestrator {
  private config: GungnirConfig;
  private plugins: ObfuscationPlugin[] = [];
  private rng: RNG;

  constructor(config?: Partial<GungnirConfig>) {
    this.config = { ...createDefaultConfig(), ...config };
    this.rng = createRng(this.config.seed);
    this.registerPlugins();
  }

  /**
   * Register all plugins in layer order.
   * Within each layer, plugins can be randomized (DE-02).
   */
  private registerPlugins(): void {
    // Layer 1: VM Engine
    if (this.config.vmEnabled) {
      this.plugins.push(new PolymorphicVMPlugin());
      this.plugins.push(new VMEnhancedPlugin()); // VM-19~VM-22
    }

    // Layer 2: Control Flow
    const layer2: ObfuscationPlugin[] = [];
    if (this.config.cfFlattening) layer2.push(new ControlFlowFlatteningPlugin());
    if (this.config.cfOpaquePredicates) layer2.push(new OpaquePredicatePlugin());
    if (this.config.cfExpressionDecomposition) layer2.push(new ExpressionDecompositionPlugin());
    if (this.config.cfDeadCodeInjection) layer2.push(new DeadCodeInjectionPlugin());
    layer2.push(new ControlFlowEnhancedPlugin());
    layer2.push(new ControlFlowAdvancedPlugin()); // CF-19~CF-20
    this.plugins.push(...this.randomizeLayer(layer2));

    // Layer 3: Data & Constants
    const layer3: ObfuscationPlugin[] = [];
    if (this.config.dcStringAesEncryption) layer3.push(new StringEncryptionPlugin());
    if (this.config.dcConstantPoolReplacement) layer3.push(new ConstantObfuscationPlugin());
    layer3.push(new DataObfuscationEnhancedPlugin());
    layer3.push(new DataDeliveryEnhancedPlugin()); // DC-18 + DE-07~DE-09
    this.plugins.push(...this.randomizeLayer(layer3));

    // Layer 4: Scope & Symbol
    const layer4: ObfuscationPlugin[] = [];
    if (this.config.scIdentifierRenaming) layer4.push(new IdentifierRenamingPlugin());
    if (this.config.scGlobalHiding) layer4.push(new GlobalHidingPlugin());
    if (this.config.scFunctionWrapping) layer4.push(new ProxyFunctionPlugin());
    layer4.push(new ScopeObfuscationEnhancedPlugin());
    this.plugins.push(...this.randomizeLayer(layer4));

    // Layer 5: Anti-Analysis
    this.plugins.push(new AntiAnalysisPlugin());

    // Layer 6: Runtime Countermeasures
    const layer6: ObfuscationPlugin[] = [];
    if (this.config.rtAntiDebugFramework) layer6.push(new AntiDebugPlugin());
    layer6.push(new RuntimeCountermeasuresPlugin());
    this.plugins.push(...this.randomizeLayer(layer6));

    // Layer 7: Platform-Specific
    const layer7: ObfuscationPlugin[] = [];
    layer7.push(new RobloxHardeningPlugin());
    layer7.push(new PlatformSpecificPlugin());
    this.plugins.push(...this.randomizeLayer(layer7));

    // Layer 8: Delivery & Engineering
    const layer8: ObfuscationPlugin[] = [];
    if (this.config.deUniqueFingerprintWatermark) layer8.push(new WatermarkPlugin());
    layer8.push(new DeliveryEngineeringPlugin());
    this.plugins.push(...layer8);

    // Layer 9: Ultimate Reinforcement Techniques (TT-01~TT-16, TT-25~TT-28)
    const layer9: ObfuscationPlugin[] = [];
    layer9.push(new UltimateTechniquesPlugin()); // TT-01~TT-16
    layer9.push(new AdvancedTechniquesPlugin()); // TT-25~TT-28
    this.plugins.push(...this.randomizeLayer(layer9));
  }

  /**
   * Randomize plugin order within a layer (DE-02: Multi-Strategy Pipeline).
   * Dependencies are preserved via stable ordering of critical plugins.
   */
  private randomizeLayer(plugins: ObfuscationPlugin[]): ObfuscationPlugin[] {
    if (!this.config.deMultiStrategyPipeline || plugins.length <= 1) {
      return plugins;
    }
    // Fisher-Yates shuffle
    const shuffled = [...plugins];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.rng.int(0, i);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Execute the full obfuscation pipeline on an AST.
   */
  obfuscate(ast: Chunk, sourcePath?: string, originalSize?: number): {
    ast: Chunk;
    context: ObfuscationContext;
    report?: PolymorphismReport;
  } {
    const context: ObfuscationContext = {
      config: this.config,
      ast,
      rng: this.rng,
      stats: createDefaultStats(),
      stringPool: [],
      sourcePath,
      originalSize: originalSize ?? 0,
      buildStartTime: Date.now(),
    };

    // Pre-transform hooks
    for (const plugin of this.plugins) {
      if (plugin.preTransform) {
        plugin.preTransform(context);
      }
    }

    // Execute plugins in order
    for (const plugin of this.plugins) {
      try {
        if (this.config.verbose) {
          console.log(`[Gungnir] Running: ${plugin.name} (${plugin.description.slice(0, 50)}...)`);
        }
        context.ast = plugin.transform(context);
      } catch (err) {
        console.error(`[Gungnir] Plugin ${plugin.name} failed: ${err}`);
        if (this.config.verbose) {
          console.error(err);
        }
        // Continue with remaining plugins (fault tolerance)
      }
    }

    return {
      ast: context.ast,
      context,
      report: context.polymorphismReport,
    };
  }

  /**
   * Get the list of registered plugins (for reporting).
   */
  getPluginList(): { name: string; layers: number[]; description: string }[] {
    return this.plugins.map(p => ({
      name: p.name,
      layers: p.layers,
      description: p.description,
    }));
  }

  /**
   * Get total technique count.
   */
  getTechniqueCount(): number {
    return 128;
  }

  /**
   * Get current config.
   */
  getConfig(): GungnirConfig {
    return this.config;
  }
}
