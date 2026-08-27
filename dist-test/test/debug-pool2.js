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
 * 诊断：池条目类型 vs AST 取值调用类型比对
 * 复现：REPRO_FILE=complex.lua REPRO_SEED=470281351 node dist-test/test/debug-pool2.js
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const Orchestrator_1 = require("../src/core/Orchestrator");
const types_1 = require("../src/core/types");
const DIR = path.resolve(__dirname, '..', '..', 'test');
const FILE = process.env.REPRO_FILE ?? 'complex.lua';
const SEED = parseInt(process.env.REPRO_SEED ?? '0', 10);
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
    const vm = orch.getPlugins().find(p => p.name === 'VMEngine');
    if (!vm)
        throw new Error('VMEngine not registered');
    const output = await orch.obfuscate(source);
    const emission = vm.emission;
    const pool = vm.pool;
    if (!emission || pool.length === 0)
        throw new Error('no emission/pool');
    const KN = emission.fetchNumber;
    const K = emission.fetchString;
    console.log(`pool size=${pool.length}（字符串 ${pool.filter(p => !p.isNumber).length} / 数字 ${pool.filter(p => p.isNumber).length}）`);
    // 扫描输出中全部 KN(id) 调用，比对池条目类型
    const mismatches = [];
    const re = new RegExp(`${KN}\\((\\d+)\\)`, 'g');
    let m;
    while ((m = re.exec(output)) !== null) {
        const id = parseInt(m[1], 10);
        const e = pool[id];
        if (e && !e.isNumber) {
            mismatches.push({ id, entry: JSON.stringify(e.original).slice(0, 40) });
        }
    }
    console.log(`KN 调用指向字符串条目的冲突: ${mismatches.length} 处`);
    for (const x of mismatches.slice(0, 15)) {
        console.log(`  id=${x.id} entry=${x.entry}`);
    }
    // 反向：K(id) 指向数字条目（string 语境中无碍——K 返回原字符串，
    // 数字条目解出 "105" 也是字符串，类型安全。仅统计）
    let kNum = 0;
    const reK = new RegExp(`${K}\\((\\d+)\\)`, 'g');
    while ((m = reK.exec(output)) !== null) {
        const e = pool[parseInt(m[1], 10)];
        if (e && e.isNumber)
            kNum++;
    }
    console.log(`K 调用指向数字条目: ${kNum} 处（类型安全，仅统计）`);
    // 打印 id 187 附近条目
    for (let id = 184; id <= 190; id++) {
        const e = pool[id];
        if (e) {
            console.log(`pool[${id}] isNumber=${e.isNumber} original=${JSON.stringify(e.original).slice(0, 30)} plaintextLen=${e.plaintext.length}`);
        }
    }
    fs.writeFileSync('/tmp/repro.lua', output);
}
main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
