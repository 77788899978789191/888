"use strict";
/**
 * Project: Gungnir - Core Type Definitions
 * All AST nodes, plugin interfaces, and configuration types.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = void 0;
exports.DEFAULT_CONFIG = {
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
    verify: true,
    maxVerifyRetries: 3,
};
