/**
 * Project: Gungnir - Core Type Definitions
 * All AST nodes, plugin interfaces, and configuration types.
 */

// ============ AST Node Types (Lua/Luau) ============

export type LuaNodeType =
  | 'Chunk' | 'Block' | 'Statement' | 'Expression'
  // Statements
  | 'LocalStatement' | 'AssignmentStatement' | 'CallStatement'
  | 'IfStatement' | 'WhileStatement' | 'DoStatement'
  | 'ForNumericStatement' | 'ForGenericStatement'
  | 'RepeatStatement' | 'FunctionDeclaration' | 'ReturnStatement'
  | 'BreakStatement' | 'GotoStatement' | 'LabelStatement'
  | 'LocalFunctionStatement'
  // Expressions
  | 'Identifier' | 'NumericLiteral' | 'StringLiteral' | 'BooleanLiteral'
  | 'NilLiteral' | 'VarargLiteral' | 'TableConstructorExpression'
  | 'BinaryExpression' | 'UnaryExpression' | 'LogicalExpression'
  | 'MemberExpression' | 'IndexExpression' | 'CallExpression'
  | 'TableCallExpression' | 'StringCallExpression' | 'FunctionExpression'
  | 'ParentheticExpression';

export interface LuaNodeBase {
  type: LuaNodeType;
  range?: [number, number];
  loc?: { start: { line: number; column: number }; end: { line: number; column: number } };
}

export interface Identifier extends LuaNodeBase {
  type: 'Identifier';
  name: string;
}

export interface NumericLiteral extends LuaNodeBase {
  type: 'NumericLiteral';
  value: number;
  raw: string;
}

export interface StringLiteral extends LuaNodeBase {
  type: 'StringLiteral';
  value: string;
  raw: string;
}

export interface BooleanLiteral extends LuaNodeBase {
  type: 'BooleanLiteral';
  value: boolean;
}

export interface NilLiteral extends LuaNodeBase {
  type: 'NilLiteral';
}

export interface VarargLiteral extends LuaNodeBase {
  type: 'VarargLiteral';
  value: '...';
}

export interface BinaryExpression extends LuaNodeBase {
  type: 'BinaryExpression';
  operator: string;
  left: LuaNode;
  right: LuaNode;
}

export interface UnaryExpression extends LuaNodeBase {
  type: 'UnaryExpression';
  operator: string;
  argument: LuaNode;
}

export interface LogicalExpression extends LuaNodeBase {
  type: 'LogicalExpression';
  operator: 'and' | 'or';
  left: LuaNode;
  right: LuaNode;
}

export interface CallExpression extends LuaNodeBase {
  type: 'CallExpression';
  base: LuaNode;
  arguments: LuaNode[];
}

export interface MemberExpression extends LuaNodeBase {
  type: 'MemberExpression';
  indexer: '.' | ':';
  identifier: Identifier;
  base: LuaNode;
}

export interface FunctionExpression extends LuaNodeBase {
  type: 'FunctionExpression';
  identifier: Identifier | null;
  isLocal: boolean;
  parameters: (Identifier | VarargLiteral)[];
  body: LuaNode[];
}

export interface LocalStatement extends LuaNodeBase {
  type: 'LocalStatement';
  variables: Identifier[];
  init: LuaNode[];
}

export interface AssignmentStatement extends LuaNodeBase {
  type: 'AssignmentStatement';
  variables: LuaNode[];
  init: LuaNode[];
}

export interface IfStatement extends LuaNodeBase {
  type: 'IfStatement';
  clauses: {
    condition: LuaNode;
    body: LuaNode[];
  }[];
  else_: LuaNode[] | null;
}

export interface WhileStatement extends LuaNodeBase {
  type: 'WhileStatement';
  condition: LuaNode;
  body: LuaNode[];
}

export interface ForNumericStatement extends LuaNodeBase {
  type: 'ForNumericStatement';
  variable: Identifier;
  start: LuaNode;
  end: LuaNode;
  step: LuaNode | null;
  body: LuaNode[];
}

export interface ReturnStatement extends LuaNodeBase {
  type: 'ReturnStatement';
  arguments: LuaNode[];
}

export interface TableConstructorExpression extends LuaNodeBase {
  type: 'TableConstructorExpression';
  fields: TableField[];
}

export interface TableField {
  type: 'TableKey' | 'TableKeyString' | 'TableValue';
  key: LuaNode | null;
  value: LuaNode;
}

export interface Chunk extends LuaNodeBase {
  type: 'Chunk';
  body: LuaNode[];
}

export type LuaNode =
  | Chunk | Identifier | NumericLiteral | StringLiteral | BooleanLiteral
  | NilLiteral | VarargLiteral | BinaryExpression | UnaryExpression
  | LogicalExpression | CallExpression | MemberExpression | FunctionExpression
  | LocalStatement | AssignmentStatement | IfStatement | WhileStatement
  | ForNumericStatement | ReturnStatement | TableConstructorExpression
  | LuaNodeBase;

// ============ Plugin System ============

export interface ObfuscationContext {
  /** The root AST chunk */
  ast: Chunk;
  /** Global configuration */
  config: GungnirConfig;
  /** Random number generator state */
  rng: RngState;
  /** Shared state between plugins */
  symbols: Map<string, LuaNode>;
  /** String pool for encrypted strings */
  stringPool: EncryptedStringEntry[];
  /** Statistics tracking */
  stats: ObfuscationStats;
}

export interface RngState {
  seed: number;
  next(): number;
  int(min: number, max: number): number;
  pick<T>(arr: T[]): T;
  shuffle<T>(arr: T[]): T[];
  bool(): boolean;
}

export interface EncryptedStringEntry {
  id: number;
  encrypted: number[];
  key: number[];
  original: string;
}

export interface ObfuscationStats {
  nodesProcessed: number;
  stringsEncrypted: number;
  predicatesInjected: number;
  identifiersRenamed: number;
  blocksFlattened: number;
  constantsObfuscated: number;
  expressionsDecomposed: number;
  deadBlocksInjected: number;
  globalsHidden: number;
  functionsProxied: number;
  modulesApplied: string[];
  modulesFailed: string[];
  pipelineOrder: string[];
}

export interface ObfuscationPlugin {
  /** Plugin name for logging and ordering */
  name: string;
  /** Plugin description */
  description: string;
  /** Which layers this plugin belongs to */
  layers: number[];
  /** Main transformation function */
  transform(ctx: ObfuscationContext): Chunk;
  /** Pre-processing hook (optional) */
  preTransform?(ctx: ObfuscationContext): void;
  /** Post-processing hook (optional) */
  postTransform?(ctx: ObfuscationContext): void;
  /** Whether this plugin can handle the given AST */
  canHandle?(ctx: ObfuscationContext): boolean;
}

// ============ Configuration ============

export interface GungnirConfig {
  /** Input file path */
  input: string;
  /** Output file path */
  output: string;
  /** Obfuscation intensity level (1-10) */
  intensity: number;
  /** Enable specific layers */
  layers: LayerConfig;
  /** Seed for reproducible output */
  seed: number;
  /** Performance mode - hot path protection */
  hotPathExemption: boolean;
  /** Verbose logging */
  verbose: boolean;
  /** Custom identifier prefix */
  identifierPrefix: string;
  /** Max expression nesting depth */
  maxExpressionDepth: number;
  // ===== Commercial-grade extensions =====
  /** Randomize pipeline order within layer constraints (polymorphic engine) */
  polymorphicPipeline: boolean;
  /** Embed build fingerprint watermark (invisible) */
  watermark: boolean;
  /** Delete input source file after successful obfuscation (self-destruct) */
  selfDestruct: boolean;
  /** Function name patterns to exempt from heavy transforms (hot path) */
  hotPathPatterns: string[];
  /** Target environment: 'roblox' enables executor fingerprinting */
  target: 'roblox' | 'generic';
  /** Anti-debug response: 'corrupt' halts, 'silent' continues silently */
  antiDebugMode: 'corrupt' | 'silent';
  /** Rotate VM opcodes per build (dynamic opcode remapping) */
  vmOpcodeRemap: boolean;
}

export interface LayerConfig {
  vm: boolean;
  controlFlow: boolean;
  dataFlow: boolean;
  scopeTearing: boolean;
  antiAnalysis: boolean;
  runtime: boolean;
  roblox: boolean;
  delivery: boolean;
}

export const DEFAULT_CONFIG: GungnirConfig = {
  input: '',
  output: '',
  intensity: 5,
  layers: {
    vm: true,
    controlFlow: true,
    dataFlow: true,
    scopeTearing: true,
    antiAnalysis: true,
    runtime: true,
    roblox: true,
    delivery: false,
  },
  seed: Date.now(),
  hotPathExemption: true,
  verbose: false,
  identifierPrefix: 'v',
  maxExpressionDepth: 3,
  // Commercial-grade defaults
  polymorphicPipeline: true,
  watermark: true,
  selfDestruct: false,
  hotPathPatterns: [],
  target: 'roblox',
  antiDebugMode: 'silent',
  vmOpcodeRemap: true,
};
