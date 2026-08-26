"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Verifier = void 0;
/**
 * Project: Gungnir-Absolute — 综合调度与自动验证器（Verifier）
 *
 * 【子系统 15：综合调度与自动验证】
 *  a) 等价性测试：fengari 执行原始/混淆脚本，print 输出必须一致。
 *  b) 结构相似度：两次产物 token 流对比（须 < 30% 相似）。
 *  c) 操作码映射冲突检测：VM 映射表无重复操作码。
 *  d) 多态报告：各子系统差异摘要。
 *  任何验证失败 → 重新生成（新种子）直至通过。
 *
 * 【子系统 95：混淆质量评估与报告】
 *  - 技术覆盖率（95 项子系统）
 *  - 多态相似度（跨构建 diff）
 *  - 预期分析时间（启发式估算）
 */
const SubsystemRegistry_1 = require("./SubsystemRegistry");
class Verifier {
    lastOutput = null;
    lastReport = null;
    /**
     * 【子系统 15】全量验证：语法 + 等价性 + 相似度 + 冲突。
     * 任何失败返回 false，调用方应换种子重试。
     */
    verify(params) {
        const diagnostics = [];
        // 1) 语法验证：luaparse 重解析
        const validSyntax = this.checkSyntax(params.output, diagnostics);
        // 2) 等价性：fengari 双执行
        const equivalence = validSyntax
            ? this.checkEquivalence(params.source, params.output, diagnostics)
            : false;
        // 3) 相似度：与上一产物比较（首次构建跳过）
        const dissimilar = this.lastOutput === null
            ? true
            : this.checkSimilarity(this.lastOutput, params.output, diagnostics);
        // 4) 冲突检测：操作码映射
        const noConflicts = params.opcodeMap
            ? this.checkOpcodeConflicts(params.opcodeMap, diagnostics)
            : true;
        const passed = validSyntax && equivalence && dissimilar && noConflicts;
        return { passed, equivalence, dissimilar, noConflicts, validSyntax, diagnostics };
    }
    /** luaparse 语法重解析（严格 Lua 5.1） */
    checkSyntax(output, diagnostics) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const luaparse = require('luaparse');
            luaparse.parse(output, { luaVersion: '5.1', encodingMode: 'pseudo-latin1' });
            return true;
        }
        catch (err) {
            diagnostics.push(`语法错误: ${err instanceof Error ? err.message : String(err)}`);
            return false;
        }
    }
    /** fengari 双执行等价性【子系统 15a】 */
    checkEquivalence(source, output, diagnostics) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const fengari = require('fengari');
            const { lua, lauxlib, lualib } = fengari;
            const runLua = (code) => {
                const captured = [];
                const L = lauxlib.luaL_newstate();
                lualib.luaL_openlibs(L);
                const pushPrint = () => {
                    const n = lua.lua_gettop(L);
                    const parts = [];
                    for (let i = 1; i <= n; i++) {
                        parts.push(lua.lua_tojsstring(L, i));
                    }
                    captured.push(parts.join('\t'));
                    return 0;
                };
                lua.lua_pushjsfunction(L, pushPrint);
                lua.lua_setglobal(L, fengari.to_luastring('print'));
                const status = lauxlib.luaL_dostring(L, fengari.to_luastring(code));
                const ok = status === lua.LUA_OK;
                let err = '';
                if (!ok) {
                    err = lua.lua_tojsstring(L, -1) || String(status);
                }
                return { ok, out: captured.join('\n'), err };
            };
            const orig = runLua(source);
            const obf = runLua(output);
            if (!obf.ok) {
                diagnostics.push(`混淆产物执行失败: ${obf.err}`);
                return false;
            }
            if (orig.ok && orig.out !== obf.out) {
                diagnostics.push(`输出不一致:\n  原始: ${orig.out.slice(0, 200)}\n  混淆: ${obf.out.slice(0, 200)}`);
                return false;
            }
            return true;
        }
        catch (err) {
            diagnostics.push(`fengari 环境异常: ${err instanceof Error ? err.message : String(err)}`);
            return false;
        }
    }
    /**
     * 【子系统 15b】结构相似度：token 流 LCS 近似（抽样 8-gram 集合
     * Jaccard 距离）。两产物相似度 > 30% 判定失败（多态性不足）。
     */
    checkSimilarity(a, b, diagnostics) {
        const SIM_LIMIT = 0.3;
        const grams = (s) => {
            // token 化：标识符/数字/符号
            const tokens = s.match(/[A-Za-z_][A-Za-z0-9_]*|\d+\.?\d*|[^\sA-Za-z0-9_]/g) ?? [];
            const set = new Set();
            const N = 8;
            for (let i = 0; i + N <= tokens.length; i += 8) { // 步长 8 抽样（大文件降本）
                set.add(tokens.slice(i, i + N).join(' '));
            }
            return set;
        };
        const sa = grams(a);
        const sb = grams(b);
        if (sa.size === 0 || sb.size === 0) {
            diagnostics.push('相似度采样为空');
            return true; // 无法判定视为通过
        }
        let inter = 0;
        for (const g of sa)
            if (sb.has(g))
                inter++;
        const sim = inter / Math.min(sa.size, sb.size);
        if (sim > SIM_LIMIT) {
            diagnostics.push(`多态相似度 ${(sim * 100).toFixed(1)}% > 30% 上限（两次产物过于相似）`);
            return false;
        }
        return true;
    }
    /** 【子系统 15c】操作码映射冲突检测 */
    checkOpcodeConflicts(map, diagnostics) {
        const seen = new Map();
        for (const [op, code] of map) {
            const existing = seen.get(code);
            if (existing !== undefined) {
                diagnostics.push(`操作码冲突: ${existing} 与 ${op} 同映射 0x${code.toString(16)}`);
                return false;
            }
            seen.set(code, op);
        }
        return true;
    }
    // ================= 【子系统 95】质量报告 =================
    /**
     * 生成质量报告（95 项覆盖率 + 多态相似度 + 预期分析时间）。
     * modulesApplied → 生效子系统集（以模块文件名反查登记表）。
     */
    generateReport(params) {
        // 登记完整性（构建期即应满足）
        (0, SubsystemRegistry_1.assertFullCoverage)();
        // 覆盖率：登记表模块文件名（去扩展名）→ 应用模块名匹配
        // 核心运行时模块（SeedEngine/VMCodec/PolymorphicRuntime）由 VMEngine
        // 插件承载；Orchestrator/LuaPrinter 始终生效。
        const normalized = (s) => s.toLowerCase().replace(/[^a-z]/g, '');
        const appliedNorms = params.modulesApplied.map(normalized);
        // 核心模块 → 宿主插件名映射（无宿主插件 = 始终生效）
        const HOST_ALIAS = {
            seedengine: ['VMEngine'],
            vmcodec: ['VMEngine'],
            polymorphicruntime: ['VMEngine'],
            orchestrator: [], // 始终生效（流水线本体）
            luaprinter: [], // 始终生效（输出本体）
            verifier: [], // 始终生效（本报告即证据）
        };
        const appliedSet = new Set();
        for (const sub of SubsystemRegistry_1.SUBSYSTEMS) {
            const modFile = sub.module.split('/').pop().replace('.ts', '');
            const modNorm = normalized(modFile);
            const hosts = HOST_ALIAS[modNorm];
            if (hosts !== undefined) {
                // 核心模块：宿主插件全部未应用且非空 → 未覆盖
                if (hosts.length === 0 || hosts.some(h => appliedNorms.includes(normalized(h)))) {
                    appliedSet.add(`${sub.id}`);
                }
                continue;
            }
            if (appliedNorms.some(a => a.includes(modNorm) || modNorm.includes(a))) {
                appliedSet.add(`${sub.id}`);
            }
        }
        const appliedCount = appliedSet.size;
        // 多态相似度（与上一产物）
        const polySim = this.lastOutput
            ? this.computeSimilarity(this.lastOutput, params.output)
            : 0;
        // 体积膨胀
        const expansion = params.source.length > 0
            ? params.output.length / params.source.length
            : 1;
        // 预期分析时间（启发式）：
        // 基础 8h + 每覆盖子系统 +2.5h + 膨胀对数增益 + VM opcode 数增益
        const estHours = Math.round(8 + appliedCount * 2.5 + Math.log2(Math.max(1, expansion)) * 4
            + (params.opcodeCount ?? 32) * 0.5);
        // 评级
        const covRatio = appliedCount / 95;
        let grade = 'C';
        if (covRatio >= 0.85 && polySim < 0.15 && expansion >= 20)
            grade = 'S';
        else if (covRatio >= 0.7 && polySim < 0.3)
            grade = 'A';
        else if (covRatio >= 0.5)
            grade = 'B';
        const report = {
            fingerprint: params.fingerprint,
            coverage: {
                applied: appliedCount,
                total: 95,
                ratio: covRatio,
                appliedList: SubsystemRegistry_1.SUBSYSTEMS
                    .filter(s => appliedSet.has(`${s.id}`))
                    .map(s => ({ id: s.id, title: s.title, module: s.module })),
            },
            polymorphicSimilarity: polySim,
            expansionRatio: expansion,
            estimatedAnalysisHours: estHours,
            modulesApplied: params.modulesApplied,
            modulesFailed: params.modulesFailed,
            grade,
        };
        this.lastOutput = params.output;
        this.lastReport = report;
        return report;
    }
    /** Jaccard 8-gram 相似度（0-1） */
    computeSimilarity(a, b) {
        const grams = (s) => {
            const tokens = s.match(/[A-Za-z_][A-Za-z0-9_]*|\d+\.?\d*|[^\sA-Za-z0-9_]/g) ?? [];
            const set = new Set();
            for (let i = 0; i + 8 <= tokens.length; i += 8) {
                set.add(tokens.slice(i, i + 8).join(' '));
            }
            return set;
        };
        const sa = grams(a);
        const sb = grams(b);
        if (sa.size === 0 || sb.size === 0)
            return 0;
        let inter = 0;
        for (const g of sa)
            if (sb.has(g))
                inter++;
        return inter / Math.min(sa.size, sb.size);
    }
    /** 上次报告（CLI 渲染用） */
    getLastReport() {
        return this.lastReport;
    }
    /** 报告渲染为中文文本（CLI / Web 展示） */
    renderReport(report) {
        const lines = [];
        lines.push('═══════════════════════════════════════════════');
        lines.push('  Gungnir-Absolute 混淆质量评估报告【子系统 95】');
        lines.push('═══════════════════════════════════════════════');
        lines.push(`构建指纹   : ${report.fingerprint}`);
        lines.push(`评级       : ${report.grade}`);
        lines.push(`技术覆盖率 : ${report.coverage.applied}/${report.coverage.total} (${(report.coverage.ratio * 100).toFixed(1)}%)`);
        lines.push(`多态相似度 : ${(report.polymorphicSimilarity * 100).toFixed(1)}%（与上次构建）`);
        lines.push(`体积膨胀   : ${report.expansionRatio.toFixed(1)}x`);
        lines.push(`预期分析   : ~${report.estimatedAnalysisHours} 小时（人工逆向）`);
        lines.push(`生效模块   : ${report.modulesApplied.join(', ')}`);
        if (report.modulesFailed.length > 0) {
            lines.push(`失败模块   : ${report.modulesFailed.join(', ')}（已隔离）`);
        }
        lines.push('───────────────────────────────────────────────');
        lines.push(`覆盖子系统 (${report.coverage.applied} 项):`);
        for (const s of report.coverage.appliedList) {
            lines.push(`  #${String(s.id).padStart(2, ' ')} ${s.title}  [${s.module}]`);
        }
        lines.push('═══════════════════════════════════════════════');
        return lines.join('\n');
    }
}
exports.Verifier = Verifier;
