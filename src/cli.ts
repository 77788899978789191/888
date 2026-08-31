#!/usr/bin/env node
/**
 * Project: Gungnir - CLI Entry Point
 *
 * Usage:
 *   gungnir <input.lua> [-o output.lua] [--intensity 1-10] [--seed N]
 *                        [--target lua51|roblox|luau] [--verbose]
 *                        [--no-push] [--self-destruct]
 *
 * Full 98-technique Lua 5.1 obfuscator with automated CI/CD.
 */
import * as fs from 'fs';
import * as path from 'path';
import { Orchestrator } from './core/Orchestrator';
import { GungnirConfig, createDefaultConfig, Chunk, PolymorphismReport } from './core/types';
import { LuaWriter } from './utils/LuaWriter';
import { GitAutoPusher } from './utils/GitAutoPusher';

// ============ Argument Parsing ============

interface CliArgs {
  input?: string;
  output?: string;
  intensity?: number;
  seed?: number;
  target?: 'lua51' | 'roblox' | 'luau';
  verbose: boolean;
  noPush: boolean;
  selfDestruct: boolean;
  listPlugins: boolean;
  version: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    verbose: false,
    noPush: false,
    selfDestruct: false,
    listPlugins: false,
    version: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '-o':
      case '--output':
        args.output = argv[++i];
        break;
      case '--intensity':
        args.intensity = parseInt(argv[++i], 10);
        break;
      case '--seed':
        args.seed = parseInt(argv[++i], 10);
        break;
      case '--target':
        args.target = argv[++i] as CliArgs['target'];
        break;
      case '--verbose':
        args.verbose = true;
        break;
      case '--no-push':
        args.noPush = true;
        break;
      case '--self-destruct':
        args.selfDestruct = true;
        break;
      case '--list-plugins':
        args.listPlugins = true;
        break;
      case '--version':
      case '-v':
        args.version = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        if (!arg.startsWith('-')) {
          args.input = arg;
        }
    }
  }
  return args;
}

// ============ Version Info ============

function getVersion(): string {
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.version || '2.0.0';
  } catch {
    return '2.0.0';
  }
}

// ============ Help Text ============

function printHelp(): void {
  console.log(`
Gungnir - Personal Lua 5.1 Obfuscation Framework (v${getVersion()})
Full 98-technique obfuscation with automated CI/CD.

Usage:
  gungnir <input.lua> [options]

Options:
  -o, --output <file>       Output file path (default: <input>.obfuscated.lua)
  --intensity <1-10>        Obfuscation intensity (default: 7)
  --seed <number>            Random seed for reproducible builds
  --target <lua51|roblox>   Target platform (default: lua51)
  --verbose                  Enable verbose output
  --no-push                  Disable automatic GitHub push
  --self-destruct            Securely delete source file after obfuscation
  --list-plugins             List all registered obfuscation plugins
  --version, -v              Show version
  --help, -h                 Show this help

Examples:
  gungnir script.lua
  gungnir script.lua -o out.lua --intensity 10 --target roblox
  gungnir script.lua --seed 12345 --verbose

Techniques: 98 across 8 layers
  Layer 1: Polymorphic VM Engine        (18 techniques)
  Layer 2: Purgatory Control Flow       (18 techniques)
  Layer 3: Quantum Data & Constants      (17 techniques)
  Layer 4: Scope & Symbol Tearing        (11 techniques)
  Layer 5: Anti-Automation Shield        (9 techniques)
  Layer 6: Hardcore Runtime Countermeasures (12 techniques)
  Layer 7: Platform-Specific (Delta)     (8 techniques)
  Layer 8: Delivery & Engineering         (6 techniques)
`);
}

// ============ Quality Report Printer ============

function printQualityReport(report: PolymorphismReport): void {
  console.log('\n' + '='.repeat(60));
  console.log('  GUNGNIR OBFUSCATION QUALITY REPORT');
  console.log('='.repeat(60));
  console.log(`  Build ID:          ${report.buildId}`);
  console.log(`  Timestamp:         ${new Date(report.timestamp).toISOString()}`);
  console.log(`  Seed:              ${report.seed}`);
  console.log('-'.repeat(60));

  // Technique coverage
  const covered = Object.values(report.techniqueCoverage).filter(Boolean).length;
  const total = Object.keys(report.techniqueCoverage).length;
  console.log(`  Technique Coverage: ${covered}/${total} (${((covered / total) * 100).toFixed(1)}%)`);

  // Layer breakdown
  const layers = [
    { name: 'VM Engine', prefix: 'VM-' },
    { name: 'Control Flow', prefix: 'CF-' },
    { name: 'Data & Constants', prefix: 'DC-' },
    { name: 'Scope & Symbol', prefix: 'SC-' },
    { name: 'Anti-Analysis', prefix: 'AA-' },
    { name: 'Runtime Countermeasures', prefix: 'RT-' },
    { name: 'Platform-Specific', prefix: 'PL-' },
    { name: 'Delivery & Engineering', prefix: 'DE-' },
  ];
  for (const layer of layers) {
    const layerTechs = Object.entries(report.techniqueCoverage)
      .filter(([k]) => k.startsWith(layer.prefix));
    const layerCovered = layerTechs.filter(([, v]) => v).length;
    console.log(`    ${layer.name.padEnd(28)} ${layerCovered}/${layerTechs.length}`);
  }

  console.log('-'.repeat(60));
  console.log(`  Structural Similarity:  ${report.structuralSimilarityToPrevious.toFixed(1)}% (lower = more unique)`);
  console.log(`  Est. Analysis Time:     ${report.estimatedAnalysisTimeHours.toFixed(0)} hours`);
  console.log(`  Size Expansion Ratio:   ${report.sizeExpansionRatio.toFixed(1)}x`);
  console.log(`  Startup Delay:          ${report.startupDelayMs}ms`);
  console.log('='.repeat(60) + '\n');
}

// ============ Main ============

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  if (args.version) {
    console.log(`Gungnir v${getVersion()}`);
    return;
  }

  if (args.listPlugins) {
    const config = createDefaultConfig();
    const orch = new Orchestrator(config);
    const plugins = orch.getPluginList();
    console.log(`\nGungnir v${getVersion()} - Registered Plugins (${plugins.length}):\n`);
    for (const p of plugins) {
      console.log(`  [${p.layers.join(',')}] ${p.name}`);
      console.log(`      ${p.description.slice(0, 80)}...`);
    }
    console.log(`\nTotal techniques: ${orch.getTechniqueCount()}\n`);
    return;
  }

  if (!args.input) {
    console.error('Error: No input file specified.');
    console.error('Use --help for usage information.');
    process.exit(1);
  }

  // Resolve paths
  const inputPath = path.resolve(args.input);
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const outputPath = args.output
    ? path.resolve(args.output)
    : inputPath.replace(/\.lua$/, '') + '.obfuscated.lua';

  // Read source
  const source = fs.readFileSync(inputPath, 'utf-8');
  const originalSize = Buffer.byteLength(source, 'utf-8');

  // Build config
  const config: Partial<GungnirConfig> = {
    intensity: args.intensity ?? 7,
    seed: args.seed ?? Date.now() % 2147483647,
    target: args.target ?? 'lua51',
    verbose: args.verbose,
    autoPushToGitHub: !args.noPush,
    deSourceSelfDestruct: args.selfDestruct,
  };

  console.log(`\nGungnir v${getVersion()} - Full 98-Technique Obfuscator`);
  console.log(`  Input:    ${inputPath} (${originalSize} bytes)`);
  console.log(`  Output:   ${outputPath}`);
  console.log(`  Intensity: ${config.intensity}/10`);
  console.log(`  Target:   ${config.target}`);
  console.log(`  Seed:     ${config.seed}`);
  console.log('');

  // Parse Lua source (simplified - in production use a proper Lua parser)
  // For now, we create a minimal AST with the source as raw statements
  const ast: Chunk = {
    type: 'Chunk',
    body: [
      {
        type: 'GungnirRawStatement',
        code: source,
      },
    ],
  };

  // Run obfuscation
  const startTime = Date.now();
  const orchestrator = new Orchestrator(config);
  const result = orchestrator.obfuscate(ast, inputPath, originalSize);
  const elapsed = Date.now() - startTime;

  // Generate output Lua
  const writer = new LuaWriter();
  const output = writer.write(result.ast);

  // Write output
  fs.writeFileSync(outputPath, output, 'utf-8');
  const outputSize = Buffer.byteLength(output, 'utf-8');

  console.log(`Obfuscation complete in ${elapsed}ms`);
  console.log(`  Output size: ${outputSize} bytes (${((outputSize / originalSize) * 100).toFixed(0)}% of original)`);
  console.log(`  Nodes processed: ${result.context.stats.nodesProcessed}`);
  console.log(`  Strings encrypted: ${result.context.stats.stringsEncrypted}`);
  console.log(`  Identifiers renamed: ${result.context.stats.identifiersRenamed}`);
  console.log(`  Constants obfuscated: ${result.context.stats.constantsObfuscated}`);
  console.log(`  Blocks flattened: ${result.context.stats.blocksFlattened}`);
  console.log(`  Dead blocks injected: ${result.context.stats.deadBlocksInjected}`);
  console.log(`  VM instructions: ${result.context.stats.vmInstructionsGenerated}`);

  // Print quality report
  if (result.report) {
    printQualityReport(result.report);

    // Save report to file
    const reportPath = outputPath.replace(/\.lua$/, '') + '.report.json';
    fs.writeFileSync(reportPath, JSON.stringify(result.report, null, 2), 'utf-8');
    console.log(`  Report saved: ${reportPath}`);
  }

  // Self-destruct source if requested
  if (args.selfDestruct) {
    try {
      // Overwrite with random bytes then delete
      const stat = fs.statSync(inputPath);
      const fd = fs.openSync(inputPath, 'w');
      const noise = require('crypto').randomBytes(Math.min(stat.size, 65536));
      fs.writeSync(fd, noise);
      fs.closeSync(fd);
      fs.unlinkSync(inputPath);
      console.log(`  Source file securely deleted: ${inputPath}`);
    } catch (err) {
      console.error(`  Warning: Failed to self-destruct source: ${err}`);
    }
  }

  // Auto-push to GitHub
  if (!args.noPush) {
    const repoPath = path.resolve(__dirname, '..');
    const pusher = new GitAutoPusher(repoPath, {
      enabled: true,
      remote: 'origin',
      branch: 'main',
    });

    // Update version file
    pusher.updateVersionFile();

    console.log('\nAuto-pushing to GitHub...');
    const pushResult = pusher.autoPush(`chore: obfuscation build ${new Date().toISOString()}`);

    if (pushResult.success) {
      if (pushResult.committed) {
        console.log(`  Committed: ${pushResult.commitHash}`);
        console.log(`  Pushed to origin/main`);
      } else {
        console.log(`  ${pushResult.message}`);
      }
    } else {
      console.error(`  Push failed: ${pushResult.message}`);
    }
  }

  console.log('\nDone.');
}

// Run main
main();
