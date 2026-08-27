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
/**
 * 诊断：hook 真实 Orchestrator 的每个插件，逐步打印产物，定位 string.char() 空参来源
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const Orchestrator_1 = require("../src/core/Orchestrator");
const types_1 = require("../src/core/types");
const LuaPrinter_1 = require("../src/core/LuaPrinter");
const SAMPLE = path.resolve(__dirname, '..', '..', 'test', 'sample.lua');
function countEmptyCharCalls(src) {
    const matches = src.match(/string\.char\(\s*\)/g);
    return matches ? matches.length : 0;
}
async function main() {
    const source = fs.readFileSync(SAMPLE, 'utf-8');
    for (let iter = 0; iter < 25; iter++) {
        const seed = Math.floor(Math.random() * 2 ** 31);
        const config = {
            ...types_1.DEFAULT_CONFIG,
            input: SAMPLE,
            output: '/tmp/out.lua',
            intensity: 6,
            seed,
            verify: false,
            verbose: false,
        };
        // 创建真实 Orchestrator，包装每个插件的 transform
        const orch = new Orchestrator_1.Orchestrator(config);
        const plugins = orch.plugins;
        const printer = new LuaPrinter_1.LuaPrinter();
        let firstEmpty = null;
        for (const p of plugins) {
            const orig = p.transform.bind(p);
            p.transform = (ctx) => {
                const result = orig(ctx);
                if (!firstEmpty) {
                    try {
                        const out = printer.print(ctx.ast);
                        const empty = countEmptyCharCalls(out);
                        if (empty > 0) {
                            const lines = out.split('\n');
                            for (const line of lines) {
                                if (/string\.char\(\s*\)/.test(line)) {
                                    firstEmpty = { plugin: p.name, line: line.trim().slice(0, 200) };
                                    break;
                                }
                            }
                        }
                    }
                    catch { /* 打印失败忽略 */ }
                }
                return result;
            };
        }
        let output;
        try {
            output = await orch.obfuscate(source);
        }
        catch (e) {
            console.log(`iter ${iter}: build error:`, e instanceof Error ? e.message : e);
            continue;
        }
        const empty = countEmptyCharCalls(output);
        const fe = firstEmpty;
        if ((fe !== null && fe !== undefined) || empty > 0) {
            console.log(`\n=== iter ${iter} seed=${seed}: ${empty} empty string.char ===`);
            if (fe) {
                console.log(`  first after: ${fe.plugin}`);
                console.log(`  line: ${fe.line}`);
            }
            fs.writeFileSync('/tmp/out-bad.lua', output);
            break;
        }
    }
    console.log('done');
}
main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
