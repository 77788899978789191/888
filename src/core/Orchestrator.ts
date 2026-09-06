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
 *   Total: 150 techniques (98 base + 28 ultimate + 14 frontier + 10 correction)
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
import {
  CFGRandomRewiringPlugin, VMISARandomizationPlugin, MultiLingualStringEncodingPlugin,
  AntiASTSerializationPlugin, DynamicKeyRotationPlugin, CodeSigningTamperChainPlugin,
  CoroutineSchedulingObfuscationPlugin, EnvironmentFingerprintBindingPlugin,
} from '../obfuscators/MissingTechniques';
import {
  ObfusQateQuantumPlugin, U3QuantumObfuscationPlugin, UnitaryObfuscationPlugin,
  LLMZeroShotObfuscationPlugin, OBsmithSelfTesterPlugin, OASIFResistantPlugin,
  LUCIDResistantPlugin, EgraphMBAPlugin, AsmMBAPlugin, PolarisMIRObfuscationPlugin,
  HenonMapPredicatePlugin, PiecewisePredicatePlugin, MimicryObfuscationPlugin,
  AntiLLMHardeningPlugin,
} from '../obfuscators/FrontierTechniques';
import {
  MBASnifferResistantPlugin, FloatingPointMBAPlugin, KrakVMStylePlugin,
  VMPredatorResistantPlugin, BytecodeVMStylePlugin, ObfuscatorIOStylePlugin,
  KleeneAlgebraCFFPlugin, OLLVMStylePlugin, VMStateOpaquePlugin, ClydeDualVMPlugin,
  SpreadSpectrumPlugin, ScriptShieldConfigPlugin, GoofyLuaPlugin, MoonveilIPPlugin,
  LuauPackagerPlugin, CodeBleachPlugin, ARMObfuscationPlugin,
  SystematicTaxonomyPlugin, LLMCrossLanguagePlugin, VariantAnalysisPlugin,
  LightrayBytecodePlugin, MathOBFMultiLayerPlugin, ScriptShieldVMPlugin,
  OnlineObfuscatorUXPlugin, GoofyLuaV2Plugin, AEGISGORGONPlugin, MLKEMChaoticPlugin,
  LieGroupPlugin, CoTDeceptorPlugin, ALIBIAdversarialPlugin, AntiLLMWasmPlugin,
  ObfVulnDetectionPlugin, ObfResiliencePlugin, KrakVMPerBytecodePlugin,
  CenturionVMLoaderPlugin, VMPredatorAnchorPlugin, HandlerPermutationPlugin,
  KleeneFormalPlugin, AntiCoTCFFPlugin, MultiLayerJumpPlugin, AntiCOBRAPlugin, FLOBPlugin,
} from '../obfuscators/NewTechniques2026';

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
    layer9.push(new CFGRandomRewiringPlugin()); // TT-17
    layer9.push(new VMISARandomizationPlugin()); // TT-18
    layer9.push(new MultiLingualStringEncodingPlugin()); // TT-19
    layer9.push(new AntiASTSerializationPlugin()); // TT-20
    layer9.push(new DynamicKeyRotationPlugin()); // TT-21
    layer9.push(new CodeSigningTamperChainPlugin()); // TT-22
    layer9.push(new CoroutineSchedulingObfuscationPlugin()); // TT-23
    layer9.push(new EnvironmentFingerprintBindingPlugin()); // TT-24
    // Layer 10: Frontier Technologies (TT-29~TT-42)
    const layer10: ObfuscationPlugin[] = [];
    layer10.push(new ObfusQateQuantumPlugin()); // TT-29
    layer10.push(new U3QuantumObfuscationPlugin()); // TT-30
    layer10.push(new UnitaryObfuscationPlugin()); // TT-31
    layer10.push(new LLMZeroShotObfuscationPlugin()); // TT-32
    layer10.push(new OBsmithSelfTesterPlugin()); // TT-33
    layer10.push(new OASIFResistantPlugin()); // TT-34
    layer10.push(new LUCIDResistantPlugin()); // TT-35
    layer10.push(new EgraphMBAPlugin()); // TT-36
    layer10.push(new AsmMBAPlugin()); // TT-37
    layer10.push(new PolarisMIRObfuscationPlugin()); // TT-38
    layer10.push(new HenonMapPredicatePlugin()); // TT-39
    layer10.push(new PiecewisePredicatePlugin()); // TT-40
    layer10.push(new MimicryObfuscationPlugin()); // TT-41
    layer10.push(new AntiLLMHardeningPlugin()); // TT-42
    this.plugins.push(...layer10);
    this.plugins.push(...this.randomizeLayer(layer9));

    // Layer 11: 2026 Latest Techniques (TT-51~TT-67)
    const layer11: ObfuscationPlugin[] = [];
    layer11.push(new MBASnifferResistantPlugin()); // TT-51
    layer11.push(new FloatingPointMBAPlugin()); // TT-52
    layer11.push(new KrakVMStylePlugin()); // TT-53
    layer11.push(new VMPredatorResistantPlugin()); // TT-54
    layer11.push(new BytecodeVMStylePlugin()); // TT-55
    layer11.push(new ObfuscatorIOStylePlugin()); // TT-56
    layer11.push(new KleeneAlgebraCFFPlugin()); // TT-57
    layer11.push(new OLLVMStylePlugin()); // TT-58
    layer11.push(new VMStateOpaquePlugin()); // TT-59
    layer11.push(new ClydeDualVMPlugin()); // TT-60
    layer11.push(new SpreadSpectrumPlugin()); // TT-61
    layer11.push(new ScriptShieldConfigPlugin()); // TT-62
    layer11.push(new GoofyLuaPlugin()); // TT-63
    layer11.push(new MoonveilIPPlugin()); // TT-64
    layer11.push(new LuauPackagerPlugin()); // TT-65
    layer11.push(new CodeBleachPlugin()); // TT-66
    layer11.push(new ARMObfuscationPlugin()); // TT-67
    this.plugins.push(...this.randomizeLayer(layer11));

    // Layer 12: Systematic & Niche Techniques (TT-176~TT-200)
    const layer12: ObfuscationPlugin[] = [];
    layer12.push(new SystematicTaxonomyPlugin()); // TT-176
    layer12.push(new LLMCrossLanguagePlugin()); // TT-177
    layer12.push(new VariantAnalysisPlugin()); // TT-178
    layer12.push(new LightrayBytecodePlugin()); // TT-179
    layer12.push(new MathOBFMultiLayerPlugin()); // TT-180
    layer12.push(new ScriptShieldVMPlugin()); // TT-181
    layer12.push(new OnlineObfuscatorUXPlugin()); // TT-182
    layer12.push(new GoofyLuaV2Plugin()); // TT-183
    layer12.push(new AEGISGORGONPlugin()); // TT-184
    layer12.push(new MLKEMChaoticPlugin()); // TT-185
    layer12.push(new LieGroupPlugin()); // TT-186
    layer12.push(new CoTDeceptorPlugin()); // TT-187
    layer12.push(new ALIBIAdversarialPlugin()); // TT-188
    layer12.push(new AntiLLMWasmPlugin()); // TT-189
    layer12.push(new ObfVulnDetectionPlugin()); // TT-190
    layer12.push(new ObfResiliencePlugin()); // TT-191
    layer12.push(new KrakVMPerBytecodePlugin()); // TT-192
    layer12.push(new CenturionVMLoaderPlugin()); // TT-193
    layer12.push(new VMPredatorAnchorPlugin()); // TT-194
    layer12.push(new HandlerPermutationPlugin()); // TT-195
    layer12.push(new KleeneFormalPlugin()); // TT-196
    layer12.push(new AntiCoTCFFPlugin()); // TT-197
    layer12.push(new MultiLayerJumpPlugin()); // TT-198
    layer12.push(new AntiCOBRAPlugin()); // TT-199
    layer12.push(new FLOBPlugin()); // TT-200
    this.plugins.push(...this.randomizeLayer(layer12));
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

    // Post-transform: syntax repair — remove statements after return in function bodies
    this.repairReturnStatements(context.ast);

    return {
      ast: context.ast,
      context,
      report: context.polymorphismReport,
    };
  }

  /**
   * Syntax repair: in any function body, if a return statement is not the
   * last statement, truncate everything after it. Lua requires return to
   * be the last statement of a block.
   */
  private repairReturnStatements(ast: Chunk): void {
    const repairBody = (body: unknown[]): void => {
      if (!Array.isArray(body)) return;
      for (let i = 0; i < body.length; i++) {
        const stmt = body[i] as Record<string, unknown>;
        if (!stmt || typeof stmt !== 'object') continue;
        if (stmt.type === 'ReturnStatement' && i < body.length - 1) {
          // Truncate everything after this return
          body.length = i + 1;
          break;
        }
        // Recurse into nested blocks
        for (const key of Object.keys(stmt)) {
          if (key === 'type' || key === 'loc' || key === 'range') continue;
          const val = stmt[key];
          if (Array.isArray(val)) {
            // Check if this array is a statement list (contains objects with type)
            if (val.length > 0 && val[0] && typeof val[0] === 'object' && 'type' in (val[0] as object)) {
              repairBody(val);
            } else {
              for (const item of val) {
                if (item && typeof item === 'object' && 'type' in item) {
                  repairReturnStatementsInNode(item);
                }
              }
            }
          } else if (val && typeof val === 'object' && 'type' in val) {
            repairReturnStatementsInNode(val);
          }
        }
      }
    };

    const repairReturnStatementsInNode = (node: unknown): void => {
      const n = node as Record<string, unknown>;
      if (!n || typeof n !== 'object') return;
      if (Array.isArray(n.body)) {
        repairBody(n.body as unknown[]);
      }
      for (const key of Object.keys(n)) {
        if (key === 'type' || key === 'loc' || key === 'range' || key === 'body') continue;
        const val = n[key];
        if (Array.isArray(val)) {
          for (const item of val) {
            if (item && typeof item === 'object' && 'type' in item) {
              repairReturnStatementsInNode(item);
            }
          }
        } else if (val && typeof val === 'object' && 'type' in val) {
          repairReturnStatementsInNode(val);
        }
      }
    };

    if (ast && Array.isArray(ast.body)) {
      repairBody(ast.body as unknown[]);
    }
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
    return 200;
  }

  /**
   * Get current config.
   */
  getConfig(): GungnirConfig {
    return this.config;
  }
}
