/**
 * Project: Gungnir - Core Type Definitions
 *
 * Defines the plugin interface, obfuscation context, configuration,
 * and shared AST node types used across all 98 obfuscation techniques.
 *
 * Architecture: 8 layers × 98 techniques
 *   Layer 1: Polymorphic VM Engine        (VM-01 ~ VM-18, 18 items)
 *   Layer 2: Purgatory Control Flow       (CF-01 ~ CF-18, 18 items)
 *   Layer 3: Quantum Data & Constants      (DC-01 ~ DC-17, 17 items)
 *   Layer 4: Scope & Symbol Tearing        (SC-01 ~ SC-11, 11 items)
 *   Layer 5: Anti-Automation Shield        (AA-01 ~ AA-09,  9 items)
 *   Layer 6: Hardcore Runtime Countermeasures (RT-01 ~ RT-12, 12 items)
 *   Layer 7: Platform-Specific (Delta)     (PL-01 ~ PL-08,  8 items)
 *   Layer 8: Delivery & Engineering         (DE-01 ~ DE-06,  6 items)
 *   Total: 99 items (95 base + 3 bonus + 1 correction = 98 effective)
 */

// ============ AST Node Types (minimal Lua 5.1 subset) ============

// Using a loose type for AST nodes since they are dynamically structured
// and need to accommodate various node shapes from different parsers.
export type LuaNode = any;

// Specific AST node interfaces (for helper functions and type hints)
export interface Identifier {
  type: 'Identifier';
  name: string;
}

export interface NumericLiteral {
  type: 'NumericLiteral';
  value: number;
  raw?: string;
}

export interface StringLiteral {
  type: 'StringLiteral';
  value: string;
  raw?: string;
}

export interface BinaryExpression {
  type: 'BinaryExpression';
  operator: string;
  left: LuaNode;
  right: LuaNode;
}

export interface CallExpression {
  type: 'CallExpression';
  base: LuaNode;
  arguments: LuaNode[];
}

export interface MemberExpression {
  type: 'MemberExpression';
  indexer: string;
  identifier: LuaNode;
  base: LuaNode;
}

export interface TableConstructorExpression {
  type: 'TableConstructorExpression';
  fields: LuaNode[];
}

// RNG state type (returned by createRng)
export interface RngState {
  seed: number;
  next: () => number;
  int: (min: number, max: number) => number;
  bool: () => boolean;
  pick: <T>(arr: T[]) => T;
  shuffle: <T>(arr: T[]) => T[];
}

export interface Chunk {
  type: 'Chunk';
  body: LuaNode[];
}

export interface Identifier {
  type: 'Identifier';
  name: string;
}

export interface EncryptedStringEntry {
  id: number;
  encrypted: number[];
  key: number[];
  original: string;
}

// ============ Plugin Interface ============

export interface ObfuscationPlugin {
  /** Unique plugin name */
  name: string;
  /** Human-readable description */
  description: string;
  /** Which layers this plugin contributes to (1-8) */
  layers: number[];
  /**
   * Transform the AST in-place. Must return the (possibly modified) chunk.
   * Plugins may mutate ctx (stats, stringPool, etc.).
   */
  transform(ctx: ObfuscationContext): Chunk;
  /** Optional pre-transform hook (e.g. scope scanning) */
  preTransform?(ctx: ObfuscationContext): void;
}

// ============ Configuration ============

export interface GungnirConfig {
  // --- Core ---
  seed: number;
  intensity: number; // 1-10
  target: 'lua51' | 'roblox' | 'luau';
  verbose: boolean;
  outputPath?: string;

  // --- Layer 1: Polymorphic VM (VM-01 ~ VM-18) ---
  vmEnabled: boolean;
  vmSeedSystem: boolean;          // VM-01
  vmDynamicOpcodeMap: boolean;    // VM-02
  vmParamOrderRandomization: boolean; // VM-03
  vmDualInterpreter: boolean;     // VM-04
  vmLayoutRandomization: boolean; // VM-05
  vmDataStructureRandomization: boolean; // VM-06
  vmSelfMutation: boolean;        // VM-07
  vmRuntimeInstructionPermutation: boolean; // VM-08
  vmConstantPoolEncryption: boolean; // VM-09
  vmAntiMemoryDump: boolean;      // VM-10
  vmBuildFingerprint: boolean;    // VM-11
  vmExceptionVirtualization: boolean; // VM-12
  vmAsmMba: boolean;               // VM-13
  vmLlmEnhancedGeneration: boolean; // VM-14
  vmAutoVerification: boolean;     // VM-15
  vmPolymorphismReport: boolean;   // VM-16
  vmDualStack: boolean;            // VM-17
  vmDiversificationEnforcer: boolean; // VM-18

  // --- Layer 2: Control Flow (CF-01 ~ CF-18) ---
  cfFlattening: boolean;           // CF-01
  cfOpaquePredicates: boolean;     // CF-02
  cfIndirectJumpTable: boolean;    // CF-03
  cfBlockReordering: boolean;      // CF-04
  cfExpressionDecomposition: boolean; // CF-05
  cfDeadCodeInjection: boolean;    // CF-06
  cfLoopObfuscation: boolean;      // CF-07
  cfFunctionFragmentation: boolean; // CF-08
  cfPathExplosion: boolean;        // CF-09
  cfProbabilisticControlFlow: boolean; // CF-10
  cfCoroutineStorm: boolean;       // CF-11
  cfTailCallStackPollution: boolean; // CF-12
  cfMultiReturnStateMachine: boolean; // CF-13
  cfExceptionDrivenControlFlow: boolean; // CF-14
  cfControlFlowIntegrityBreak: boolean; // CF-15
  cfDeoptimizationTriggers: boolean; // CF-16
  cfDecompilerBoundaryAnomalies: boolean; // CF-17
  cfSyntaxAntiParseTraps: boolean; // CF-18

  // --- Layer 3: Data & Constants (DC-01 ~ DC-17) ---
  dcStringAesEncryption: boolean;  // DC-01
  dcConstantPoolReplacement: boolean; // DC-02
  dcHighDensityMba: boolean;        // DC-03
  dcTableLengthEncoding: boolean;   // DC-04
  dcSBoxSubstitution: boolean;      // DC-05
  dcConstantErasure: boolean;       // DC-06
  dcEnvironmentKeyDerivation: boolean; // DC-07
  dcDataSplitting: boolean;         // DC-08
  dcDataProceduralization: boolean; // DC-09
  dcTableKeyObfuscation: boolean;   // DC-10
  dcMetatableProxyChain: boolean;   // DC-11
  dcDynamicTypeMisdirection: boolean; // DC-12
  dcWeakTableFinalizerDataFlow: boolean; // DC-13
  dcSemanticEquivalentReplacement: boolean; // DC-14
  dcFloatNanEncoding: boolean;      // DC-15
  dcStringSplitReassembly: boolean; // DC-16
  dcEncodingOverlap: boolean;       // DC-17

  // --- Layer 4: Scope & Symbol (SC-01 ~ SC-11) ---
  scIdentifierRenaming: boolean;    // SC-01
  scGlobalHiding: boolean;          // SC-02
  scLocalProxyTable: boolean;       // SC-03
  scMultiLevelUpvalueNesting: boolean; // SC-04
  scFunctionWrapping: boolean;      // SC-05
  scDynamicEnvironmentHijack: boolean; // SC-06
  scFunctionFusionAntiInline: boolean; // SC-07
  scPolymorphicFunctionCloning: boolean; // SC-08
  scVariadicParameterPollution: boolean; // SC-09
  scEnvironmentWhitelistSandbox: boolean; // SC-10
  scGlobalAccessPathComputation: boolean; // SC-11

  // --- Layer 5: Anti-Analysis (AA-01 ~ AA-09) ---
  aaAntiSymbolicExecution: boolean; // AA-01
  aaAntiTaintTracking: boolean;     // AA-02
  aaAntiAstGnnMatching: boolean;    // AA-03
  aaDeadCodeEliminationCounter: boolean; // AA-04
  aaAntiSandboxVirtualization: boolean; // AA-05
  aaAiOpaquePredicates: boolean;    // AA-06
  aaFormalVerificationTraps: boolean; // AA-07
  aaMemoryLayoutRandomization: boolean; // AA-08
  aaAntiBeautifySemicolonTraps: boolean; // AA-09

  // --- Layer 6: Runtime Countermeasures (RT-01 ~ RT-12) ---
  rtIntegrityHashCheck: boolean;    // RT-01
  rtAntiDebugFramework: boolean;    // RT-02
  rtTimingSideChannelDetection: boolean; // RT-03
  rtEnvironmentTamperDetection: boolean; // RT-04
  rtTimeBomb: boolean;               // RT-05
  rtCallStackDepthForgery: boolean; // RT-06
  rtRuntimeMemorySelfCheck: boolean; // RT-07
  rtInlineAntiHookDetection: boolean; // RT-08
  rtDebugLibraryPollution: boolean;  // RT-09
  rtSelfMutatingCodeBlock: boolean;  // RT-10
  rtAntiMemoryDump: boolean;         // RT-11
  rtAntiTamperTriggerChain: boolean; // RT-12

  // --- Layer 7: Platform-Specific (PL-01 ~ PL-08) ---
  plGloopSyntaxCompatibility: boolean; // PL-01
  plDarkDexInstanceTreeObfuscation: boolean; // PL-02
  plTouchInjectionFriendly: boolean; // PL-03
  plCrossPlatformDifferential: boolean; // PL-04
  plScriptHubAntiFingerprint: boolean; // PL-05
  plGiantConstantTablePaging: boolean; // PL-06
  plRemoteCallEncryption: boolean;   // PL-07
  plTaskSchedulerFrameDisruption: boolean; // PL-08

  // --- Layer 8: Delivery & Engineering (DE-01 ~ DE-06) ---
  deSourceSelfDestruct: boolean;    // DE-01
  deMultiStrategyPipeline: boolean;  // DE-02
  dePolymorphicEngineCore: boolean;  // DE-03
  deMacroGranularityControl: boolean; // DE-04
  deUniqueFingerprintWatermark: boolean; // DE-05
  deQualityAssessmentReport: boolean; // DE-06

  // --- CI/CD ---
  autoPushToGitHub: boolean;
  autoDeployWeb: boolean;

  // --- Anti-debug behavior ---
  antiDebugMode: 'silent' | 'corrupt';
  hotPathExemption: boolean;
  hotPathPatterns: string[];
  watermark: boolean;
  vmOpcodeRemap: boolean;
  selfDestruct: boolean;
}

// ============ Default Configuration ============

export function createDefaultConfig(): GungnirConfig {
  return {
    seed: Date.now() % 2147483647,
    intensity: 7,
    target: 'lua51',
    verbose: false,
    vmEnabled: true,
    vmSeedSystem: true,
    vmDynamicOpcodeMap: true,
    vmParamOrderRandomization: true,
    vmDualInterpreter: true,
    vmLayoutRandomization: true,
    vmDataStructureRandomization: true,
    vmSelfMutation: true,
    vmRuntimeInstructionPermutation: true,
    vmConstantPoolEncryption: true,
    vmAntiMemoryDump: true,
    vmBuildFingerprint: true,
    vmExceptionVirtualization: true,
    vmAsmMba: true,
    vmLlmEnhancedGeneration: true,
    vmAutoVerification: true,
    vmPolymorphismReport: true,
    vmDualStack: true,
    vmDiversificationEnforcer: true,
    cfFlattening: true,
    cfOpaquePredicates: true,
    cfIndirectJumpTable: true,
    cfBlockReordering: true,
    cfExpressionDecomposition: true,
    cfDeadCodeInjection: true,
    cfLoopObfuscation: true,
    cfFunctionFragmentation: true,
    cfPathExplosion: true,
    cfProbabilisticControlFlow: true,
    cfCoroutineStorm: true,
    cfTailCallStackPollution: true,
    cfMultiReturnStateMachine: true,
    cfExceptionDrivenControlFlow: true,
    cfControlFlowIntegrityBreak: true,
    cfDeoptimizationTriggers: true,
    cfDecompilerBoundaryAnomalies: true,
    cfSyntaxAntiParseTraps: true,
    dcStringAesEncryption: true,
    dcConstantPoolReplacement: true,
    dcHighDensityMba: true,
    dcTableLengthEncoding: true,
    dcSBoxSubstitution: true,
    dcConstantErasure: true,
    dcEnvironmentKeyDerivation: true,
    dcDataSplitting: true,
    dcDataProceduralization: true,
    dcTableKeyObfuscation: true,
    dcMetatableProxyChain: true,
    dcDynamicTypeMisdirection: true,
    dcWeakTableFinalizerDataFlow: true,
    dcSemanticEquivalentReplacement: true,
    dcFloatNanEncoding: true,
    dcStringSplitReassembly: true,
    dcEncodingOverlap: true,
    scIdentifierRenaming: true,
    scGlobalHiding: true,
    scLocalProxyTable: true,
    scMultiLevelUpvalueNesting: true,
    scFunctionWrapping: true,
    scDynamicEnvironmentHijack: true,
    scFunctionFusionAntiInline: true,
    scPolymorphicFunctionCloning: true,
    scVariadicParameterPollution: true,
    scEnvironmentWhitelistSandbox: true,
    scGlobalAccessPathComputation: true,
    aaAntiSymbolicExecution: true,
    aaAntiTaintTracking: true,
    aaAntiAstGnnMatching: true,
    aaDeadCodeEliminationCounter: true,
    aaAntiSandboxVirtualization: true,
    aaAiOpaquePredicates: true,
    aaFormalVerificationTraps: true,
    aaMemoryLayoutRandomization: true,
    aaAntiBeautifySemicolonTraps: true,
    rtIntegrityHashCheck: true,
    rtAntiDebugFramework: true,
    rtTimingSideChannelDetection: true,
    rtEnvironmentTamperDetection: true,
    rtTimeBomb: true,
    rtCallStackDepthForgery: true,
    rtRuntimeMemorySelfCheck: true,
    rtInlineAntiHookDetection: true,
    rtDebugLibraryPollution: true,
    rtSelfMutatingCodeBlock: true,
    rtAntiMemoryDump: true,
    rtAntiTamperTriggerChain: true,
    plGloopSyntaxCompatibility: true,
    plDarkDexInstanceTreeObfuscation: true,
    plTouchInjectionFriendly: true,
    plCrossPlatformDifferential: true,
    plScriptHubAntiFingerprint: true,
    plGiantConstantTablePaging: true,
    plRemoteCallEncryption: true,
    plTaskSchedulerFrameDisruption: true,
    deSourceSelfDestruct: false,
    deMultiStrategyPipeline: true,
    dePolymorphicEngineCore: true,
    deMacroGranularityControl: true,
    deUniqueFingerprintWatermark: true,
    deQualityAssessmentReport: true,
    autoPushToGitHub: true,
    autoDeployWeb: true,
    antiDebugMode: 'silent',
    hotPathExemption: false,
    hotPathPatterns: [],
    watermark: true,
    vmOpcodeRemap: true,
    selfDestruct: false,
  };
}

// ============ Obfuscation Context ============

export interface ObfuscationStats {
  [key: string]: number;
  nodesProcessed: number;
  stringsEncrypted: number;
  identifiersRenamed: number;
  constantsObfuscated: number;
  expressionsDecomposed: number;
  predicatesInjected: number;
  blocksFlattened: number;
  deadBlocksInjected: number;
  globalsHidden: number;
  functionsProxied: number;
  // VM stats
  vmInstructionsGenerated: number;
  vmOpcodesRemapped: number;
  vmSeedsGenerated: number;
  vmHandlersDiversified: number;
  // Control flow stats
  indirectJumpsCreated: number;
  loopsObfuscated: number;
  functionsFragmented: number;
  pathExplosionBranches: number;
  coroutinesCreated: number;
  tailCallChains: number;
  exceptionDrivenJumps: number;
  // Data stats
  sBoxesGenerated: number;
  constantsErased: number;
  dataSplitVariables: number;
  proceduralTablesGenerated: number;
  metatableProxiesCreated: number;
  typeMisdirectionsInjected: number;
  weakTableDataFlows: number;
  semanticReplacements: number;
  floatNanEncodings: number;
  stringSplitsCreated: number;
  encodingLayersApplied: number;
  // Scope stats
  localProxiesCreated: number;
  upvalueNestingLevels: number;
  functionWrappersCreated: number;
  environmentHijacks: number;
  functionFusions: number;
  functionClonesCreated: number;
  variadicParametersAdded: number;
  sandboxChecksInjected: number;
  accessPathsComputed: number;
  // Anti-analysis stats
  symbolicConstraintsInjected: number;
  taintCutoffPoints: number;
  adversarialAstNodes: number;
  dceCounterMeasures: number;
  sandboxProbesInjected: number;
  aiPredicatesGenerated: number;
  formalVerificationTraps: number;
  memoryLayoutRandomizations: number;
  beautifyTrapsInjected: number;
  // Runtime stats
  integrityCheckpoints: number;
  antiDebugChecks: number;
  timingDetectors: number;
  tamperDetections: number;
  timeBombsArmed: number;
  stackForgeryLayers: number;
  memorySelfChecks: number;
  antiHookDetectors: number;
  debugPollutionPoints: number;
  selfMutatingBlocks: number;
  antiDumpDestructions: number;
  triggerChainLinks: number;
  // Platform stats
  syntaxCompatibilityChecks: number;
  dexObfuscationLayers: number;
  touchFriendlyOptimizations: number;
  platformBranchesInjected: number;
  antiFingerprintMeasures: number;
  constantTablePages: number;
  remoteEncryptions: number;
  schedulerDisruptions: number;
  // Delivery stats
  sourcesDestroyed: number;
  pipelineStrategiesUsed: number;
  polymorphicBuildsGenerated: number;
  macroGranularityAnnotations: number;
  watermarksEmbedded: number;
  qualityReportsGenerated: number;
}

export function createDefaultStats(): ObfuscationStats {
  const zeros: Record<string, number> = {};
  const keys = [
    'nodesProcessed','stringsEncrypted','identifiersRenamed','constantsObfuscated',
    'expressionsDecomposed','predicatesInjected','blocksFlattened','deadBlocksInjected',
    'globalsHidden','functionsProxied','vmInstructionsGenerated','vmOpcodesRemapped',
    'vmSeedsGenerated','vmHandlersDiversified','indirectJumpsCreated','loopsObfuscated',
    'functionsFragmented','pathExplosionBranches','coroutinesCreated','tailCallChains',
    'exceptionDrivenJumps','sBoxesGenerated','constantsErased','dataSplitVariables',
    'proceduralTablesGenerated','metatableProxiesCreated','typeMisdirectionsInjected',
    'weakTableDataFlows','semanticReplacements','floatNanEncodings','stringSplitsCreated',
    'encodingLayersApplied','localProxiesCreated','upvalueNestingLevels','functionWrappersCreated',
    'environmentHijacks','functionFusions','functionClonesCreated','variadicParametersAdded',
    'sandboxChecksInjected','accessPathsComputed','symbolicConstraintsInjected','taintCutoffPoints',
    'adversarialAstNodes','dceCounterMeasures','sandboxProbesInjected','aiPredicatesGenerated',
    'formalVerificationTraps','memoryLayoutRandomizations','beautifyTrapsInjected',
    'integrityCheckpoints','antiDebugChecks','timingDetectors','tamperDetections','timeBombsArmed',
    'stackForgeryLayers','memorySelfChecks','antiHookDetectors','debugPollutionPoints',
    'selfMutatingBlocks','antiDumpDestructions','triggerChainLinks','syntaxCompatibilityChecks',
    'dexObfuscationLayers','touchFriendlyOptimizations','platformBranchesInjected',
    'antiFingerprintMeasures','constantTablePages','remoteEncryptions','schedulerDisruptions',
    'sourcesDestroyed','pipelineStrategiesUsed','polymorphicBuildsGenerated',
    'macroGranularityAnnotations','watermarksEmbedded','qualityReportsGenerated',
  ];
  for (const k of keys) zeros[k] = 0;
  return zeros as unknown as ObfuscationStats;
}

// ============ Polymorphic VM Types ============

export interface VMBuildParameters {
  seed: string;
  seedFragments: string[];
  opcodeMap: Record<number, number>;
  inverseOpcodeMap: Record<number, number>;
  paramOrderSchemes: number[][];
  instructionLength: number;
  opcodePosition: 'start' | 'middle' | 'end';
  operandLayout: 'sequential' | 'scattered' | 'reversed';
  alignment: 1 | 2 | 4 | 8;
  stackImplementation: 'array' | 'linkedlist' | 'hashtable';
  stackDirection: 'up' | 'down';
  callStackImplementation: 'array' | 'linkedlist';
  registerMapping: Record<number, number>;
  constantIndexMode: 'direct' | 'hash' | 'tree';
  stringPoolMode: 'array' | 'hashtable';
  constantPoolKey: number[];
  buildFingerprint: string;
  fingerprintFragments: number[];
  sBox: number[];
  handlerOrder: number[];
  interpreterMode: 'switch' | 'table' | 'gotolabel';
  dualStackEnabled: boolean;
  deserializationVmArch: 'stack' | 'register';
  executionVmArch: 'stack' | 'register';
  selfMutationThreshold: number;
  instructionPermutationInterval: number;
  rotationEventInterval: number;
}

export interface PolymorphismReport {
  buildId: string;
  timestamp: number;
  seed: string;
  parameters: VMBuildParameters;
  stats: ObfuscationStats;
  techniqueCoverage: Record<string, boolean>;
  structuralSimilarityToPrevious: number;
  estimatedAnalysisTimeHours: number;
  sizeExpansionRatio: number;
  startupDelayMs: number;
}

// ============ Obfuscation Context ============

export interface ObfuscationContext {
  config: GungnirConfig;
  ast: Chunk;
  rng: RNG;
  stats: ObfuscationStats;
  stringPool: EncryptedStringEntry[];
  vmParams?: VMBuildParameters;
  polymorphismReport?: PolymorphismReport;
  /** Source file path (for self-destruct) */
  sourcePath?: string;
  /** Output file path */
  outputPath?: string;
  /** Original source size in bytes */
  originalSize: number;
  /** Build start time */
  buildStartTime: number;
}

// ============ RNG Interface (matches helpers.ts) ============

export interface RNG {
  next(): number;
  int(min: number, max: number): number;
  bool(): boolean;
  pick<T>(arr: T[]): T;
  shuffle<T>(arr: T[]): T[];
}
