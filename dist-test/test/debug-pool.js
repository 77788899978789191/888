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
 * 池一致性调试：构建后直接对比 VMEngine 池条目与 AST 中 K() 调用 id。
 * 若 K(208) 在池中对应 "314" 而 AST 用 208 替换字符串 → 收集/替换错位。
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const Orchestrator_1 = require("../src/core/Orchestrator");
const types_1 = require("../src/core/types");
const DIR = path.resolve(__dirname, '..', '..', 'test');
const FILE = process.env.REPRO_FILE ?? 'complex.lua';
const SEED = parseInt(process.env.REPRO_SEED ?? '1016313696', 10);
async function main() {
    const source = fs.readFileSync(path.join(DIR, FILE), 'utf-8');
    const config = {
        ...types_1.DEFAULT_CONFIG,
        input: FILE,
        output: '/tmp/repro.lua',
        intensity: 6,
        seed: SEED,
        verify: false,
        verbose: false,
    };
    const orch = new Orchestrator_1.Orchestrator(config);
    // 拦截 VMEngine 的池
    const output = await orch.obfuscate(source);
    const vm = orch.getPlugins().find(p => p.name === 'VMEngine');
    console.log('VM emission poolSize:', vm?.emission?.poolSize);
    fs.writeFileSync('/tmp/repro.lua', output);
    // 从产物反查：K 调用的 id 集合
    const callRe = /\b([A-Za-z_]\w*)\((\d+)\)/g;
    const counts = new Map();
    let m;
    while ((m = callRe.exec(output)) !== null) {
        if (!counts.has(m[1]))
            counts.set(m[1], new Set());
        counts.get(m[1]).add(parseInt(m[2], 10));
    }
    for (const [fn, ids] of counts) {
        if (ids.size > 5) {
            const sorted = [...ids].sort((a, b) => a - b);
            console.log(`fn=${fn} ids(${sorted.length}): min=${sorted[0]} max=${sorted[sorted.length - 1]}`);
        }
    }
}
main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
