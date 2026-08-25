#!/usr/bin/env node
/**
 * Project: Gungnir - CLI Entry Point
 * Roblox Lua Obfuscator — Commercial-grade build toolchain
 *
 * Usage:
 *   gungnir --input <file.lua> --output <file.lua> [options]
 */
import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { Orchestrator } from './core/Orchestrator';
import { GungnirConfig, DEFAULT_CONFIG } from './core/types';

const program = new Command();

program
  .name('gungnir')
  .description('Project: Gungnir — Roblox Lua Obfuscation Framework (commercial grade)')
  .version('2.1.0')
  .requiredOption('-i, --input <file>', 'Input Lua source file')
  .requiredOption('-o, --output <file>', 'Output obfuscated Lua file')
  .option('-c, --config <file>', 'JSON configuration file')
  .option('--intensity <n>', 'Obfuscation intensity (1-10)', '5')
  .option('--seed <n>', 'Random seed for reproducible output', '0')
  // Layer toggles
  .option('--no-vm', 'Disable VM bytecode layer')
  .option('--no-cff', 'Disable control flow flattening')
  .option('--no-strings', 'Disable string encryption')
  .option('--no-rename', 'Disable identifier renaming')
  .option('--no-constants', 'Disable constant obfuscation')
  .option('--no-dead-code', 'Disable dead code injection')
  .option('--no-global-hiding', 'Disable global variable hiding')
  .option('--no-proxy', 'Disable function proxy wrapping')
  .option('--no-anti-debug', 'Disable anti-debug runtime')
  .option('--no-roblox', 'Disable Roblox-specific hardening')
  // Commercial features
  .option('--no-polymorphic', 'Disable polymorphic pipeline (fixed module order)')
  .option('--no-watermark', 'Disable build fingerprint watermark')
  .option('--self-destruct', 'Securely delete input file after obfuscation')
  .option('--target <env>', 'Target environment: roblox | generic', 'roblox')
  .option('--anti-debug-mode <mode>', 'Anti-debug response: corrupt | silent', 'silent')
  .option('--hot-path <patterns>', 'Comma-separated function-name patterns to exempt from heavy transforms')
  .option('--vm-opcode-remap', 'Enable per-build VM opcode remapping', true)
  .option('--no-vm-opcode-remap', 'Disable VM opcode remapping')
  .option('--hot-path-exempt', 'Enable hot path protection (deprecated, always on)', false)
  .option('-v, --verbose', 'Verbose logging')
  .action(async (options) => {
    try {
      await run(options as CliOptions);
    } catch (err) {
      console.error(`Fatal: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

interface CliOptions {
  input: string;
  output: string;
  config?: string;
  intensity: string;
  seed: string;
  // Layer toggles (commander's --no-X sets them to false)
  vm?: boolean;
  cff?: boolean;
  strings?: boolean;
  rename?: boolean;
  constants?: boolean;
  deadCode?: boolean;
  globalHiding?: boolean;
  proxy?: boolean;
  antiDebug?: boolean;
  roblox?: boolean;
  // Commercial features
  polymorphic?: boolean;
  watermark?: boolean;
  selfDestruct?: boolean;
  target?: string;
  antiDebugMode?: string;
  hotPath?: string;
  vmOpcodeRemap?: boolean;
  hotPathExempt?: boolean;
  verbose?: boolean;
}

async function run(options: CliOptions): Promise<void> {
  // Validate input file
  if (!fs.existsSync(options.input)) {
    throw new Error(`Input file not found: ${options.input}`);
  }

  // Load configuration: defaults → JSON config file → CLI overrides
  let config: GungnirConfig = { ...DEFAULT_CONFIG };

  if (options.config) {
    if (!fs.existsSync(options.config)) {
      throw new Error(`Config file not found: ${options.config}`);
    }
    const configData = JSON.parse(fs.readFileSync(options.config, 'utf-8'));
    config = { ...config, ...configData };
  }

  // Apply CLI overrides
  config.input = options.input;
  config.output = options.output;
  config.intensity = parseInt(options.intensity, 10) || 5;
  config.seed = parseInt(options.seed, 10) || Date.now();
  config.verbose = options.verbose === true;
  config.hotPathExemption = true; // always on in commercial mode

  // Layer toggles from CLI flags
  if (options.vm === false) config.layers.vm = false;
  if (options.cff === false) config.layers.controlFlow = false;
  if (options.strings === false) config.layers.dataFlow = false;
  if (options.rename === false) config.layers.scopeTearing = false;

  // Module-level disables map to layer disables when the layer
  // would otherwise be fully disabled
  if (options.deadCode === false) config.layers.antiAnalysis = false;
  if (options.antiDebug === false) config.layers.runtime = false;
  if (options.roblox === false) config.layers.roblox = false;

  // Commercial feature flags
  if (options.polymorphic === false) config.polymorphicPipeline = false;
  if (options.watermark === false) config.watermark = false;
  if (options.selfDestruct === true) config.selfDestruct = true;
  if (options.vmOpcodeRemap === false) config.vmOpcodeRemap = false;

  if (options.target === 'roblox' || options.target === 'generic') {
    config.target = options.target;
  }

  if (options.antiDebugMode === 'corrupt' || options.antiDebugMode === 'silent') {
    config.antiDebugMode = options.antiDebugMode;
  }

  if (options.hotPath) {
    config.hotPathPatterns = options.hotPath.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  // Validate intensity range
  config.intensity = Math.max(1, Math.min(10, config.intensity));

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  Project: Gungnir v2.0 — Lua Obfuscator          ║');
  console.log('║  Commercial-grade multi-layer obfuscation        ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`Input:       ${config.input}`);
  console.log(`Output:      ${config.output}`);
  console.log(`Intensity:   ${config.intensity}/10`);
  console.log(`Seed:        ${config.seed}`);
  console.log(`Target:      ${config.target}`);
  console.log(`Polymorphic: ${config.polymorphicPipeline ? 'enabled' : 'disabled'}`);
  console.log(`Watermark:   ${config.watermark ? 'enabled' : 'disabled'}`);
  console.log('');

  // Create output directory if needed
  const outputDir = path.dirname(config.output);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Run the obfuscator
  const orchestrator = new Orchestrator(config);
  await orchestrator.processFile(config.input, config.output);

  // Report statistics
  const stats = orchestrator.getStats();
  if (stats) {
    console.log('');
    console.log('── Obfuscation Report ──────────────────────────');
    console.log(`Modules applied: ${stats.modulesApplied.length}`);
    for (const mod of stats.modulesApplied) {
      console.log(`  ✓ ${mod}`);
    }
    if (stats.modulesFailed.length > 0) {
      console.log(`Modules failed: ${stats.modulesFailed.length}`);
      for (const mod of stats.modulesFailed) {
        console.log(`  ✗ ${mod} (quarantined)`);
      }
    }
    console.log('────────────────────────────────────────────────');
    console.log(`Nodes processed:       ${stats.nodesProcessed}`);
    console.log(`Strings encrypted:     ${stats.stringsEncrypted}`);
    console.log(`Constants obfuscated:  ${stats.constantsObfuscated}`);
    console.log(`Expressions decomposed:${stats.expressionsDecomposed}`);
    console.log(`Predicates injected:   ${stats.predicatesInjected}`);
    console.log(`Dead blocks injected:  ${stats.deadBlocksInjected}`);
    console.log(`Identifiers renamed:   ${stats.identifiersRenamed}`);
    console.log(`Globals hidden:        ${stats.globalsHidden}`);
    console.log(`Functions proxied:     ${stats.functionsProxied}`);
    console.log(`Blocks flattened:      ${stats.blocksFlattened}`);
    console.log('────────────────────────────────────────────────');
  }

  console.log('');
  console.log('Obfuscation complete.');
  console.log(`Output written to: ${config.output}`);
}

program.parse(process.argv);
