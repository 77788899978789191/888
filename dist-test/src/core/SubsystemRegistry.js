"use strict";
/**
 * Project: Gungnir-Absolute — 95 子系统注册表（SubsystemRegistry）
 *
 * 【强制全量实现 §5】所有 95 项强制技术的唯一权威登记处。
 * 每一项登记：实现模块（文件）、运行层（Layer）、形态
 * （'transform' = AST 变换 / 'runtime' = 运行时 Lua 代码 / 'both'）。
 *
 * 用途：
 *  1. 【子系统 95】混淆质量评估与报告的技术覆盖率计算。
 *  2. 【子系统 15】综合调度与自动验证的冲突检测基础。
 *  3. Web UI / CLI 渲染 95 项技术清单。
 *  4. 强制保证「每项技术在代码中明确标注实现位置」。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUBSYSTEM_BY_ID = exports.SUBSYSTEMS = exports.LAYER_NAMES = void 0;
exports.assertFullCoverage = assertFullCoverage;
exports.LAYER_NAMES = {
    1: 'VM & Execution Layer',
    2: 'Control Flow Purgatory',
    3: 'Data & Constant Blackhole',
    4: 'Scope & Symbol Tearing',
    5: 'Anti-Automated-Analysis Shield',
    6: 'Hardcore Runtime Countermeasures',
    7: 'Platform (Delta Executor)',
    8: 'Delivery & Engineering',
};
/** 95 项强制技术登记表 —— 覆盖率报告的唯一数据源 */
exports.SUBSYSTEMS = [
    // ===== 第一部分：多态虚拟机引擎（1-15）=====
    { id: 1, title: '随机构建种子引擎（2048 位，SHA-256 派生）', module: 'core/SeedEngine.ts', layer: 1, form: 'both' },
    { id: 2, title: '全动态操作码映射表（32 操作，16 位，运行时轮换）', module: 'core/VMCodec.ts', layer: 1, form: 'both' },
    { id: 3, title: '指令参数顺序随机化（8 种排列方案）', module: 'core/VMCodec.ts', layer: 1, form: 'both' },
    { id: 4, title: '双重解释器架构（switch-case + 表驱动）', module: 'core/PolymorphicRuntime.ts', layer: 1, form: 'runtime' },
    { id: 5, title: '指令集布局随机化（4-32 字节，位置随机）', module: 'core/VMCodec.ts', layer: 1, form: 'both' },
    { id: 6, title: '虚拟机数据结构随机化（数组/链表/哈希，栈方向，寄存器编号）', module: 'core/PolymorphicRuntime.ts', layer: 1, form: 'runtime' },
    { id: 7, title: '解释器代码自变异（阈值 2000-5000）', module: 'core/PolymorphicRuntime.ts', layer: 1, form: 'runtime' },
    { id: 8, title: '运行时指令置换（1000-10000 条间隔）', module: 'core/PolymorphicRuntime.ts', layer: 1, form: 'runtime' },
    { id: 9, title: '常量池多态加密（独立密钥，缓存位置随机）', module: 'core/VMCodec.ts', layer: 1, form: 'both' },
    { id: 10, title: '反内存 Dump 混淆（闭包/upvalue 指针链）', module: 'core/PolymorphicRuntime.ts', layer: 1, form: 'runtime' },
    { id: 11, title: '构建指纹与防嫁接（256 位，8 处嵌入）', module: 'core/SeedEngine.ts', layer: 1, form: 'both' },
    { id: 12, title: '异常处理逻辑虚拟化（pcall 转 VM 字节码）', module: 'core/PolymorphicRuntime.ts', layer: 1, form: 'runtime' },
    { id: 13, title: '汇编级 MBA 表达式（VM Handler）', module: 'core/PolymorphicRuntime.ts', layer: 1, form: 'runtime' },
    { id: 14, title: 'LLM 增强的 VM 代码生成', module: 'core/PolymorphicRuntime.ts', layer: 1, form: 'runtime' },
    { id: 15, title: '综合调度与自动验证（等价性/相似度/冲突）', module: 'core/Verifier.ts', layer: 8, form: 'transform' },
    // ===== 第二部分：炼狱级控制流混淆（16-33）=====
    { id: 16, title: '控制流扁平化（while + switch，状态变量 ≥32）', module: 'obfuscators/ControlFlowFlattening.ts', layer: 2, form: 'transform' },
    { id: 17, title: '高维不透明谓词（≥6 种类型）', module: 'obfuscators/OpaquePredicate.ts', layer: 2, form: 'transform' },
    { id: 18, title: '间接跳转表（哈希加密，动态索引）', module: 'obfuscators/IndirectJumps.ts', layer: 2, form: 'transform' },
    { id: 19, title: '基本块指令乱序（≥50 块随机重排）', module: 'obfuscators/IndirectJumps.ts', layer: 2, form: 'transform' },
    { id: 20, title: '表达式树深度分解（深度 ≥10）', module: 'obfuscators/ExpressionDecomposition.ts', layer: 3, form: 'transform' },
    { id: 21, title: '具有副作用的垃圾代码注入（写入 _G）', module: 'obfuscators/DeadCodeInjection.ts', layer: 5, form: 'transform' },
    { id: 22, title: '循环混淆（for/while→状态机）', module: 'obfuscators/LoopObfuscation.ts', layer: 2, form: 'transform' },
    { id: 23, title: '函数片碎化与内联反转（≥20 片段）', module: 'obfuscators/FunctionShredding.ts', layer: 2, form: 'transform' },
    { id: 24, title: '路径爆炸分支（≥2000 条虚假分支）', module: 'obfuscators/PathExplosion.ts', layer: 5, form: 'transform' },
    { id: 25, title: '概率加权控制流（3-5 种等价实现）', module: 'obfuscators/ControlFlowChaos.ts', layer: 2, form: 'transform' },
    { id: 26, title: '协程风暴（200-300 协程）', module: 'core/PolymorphicRuntime.ts', layer: 1, form: 'runtime' },
    { id: 27, title: '尾调用消除栈污染（≥20 层）', module: 'obfuscators/ControlFlowChaos.ts', layer: 2, form: 'transform' },
    { id: 28, title: '多返回值堆栈状态机', module: 'obfuscators/ControlFlowChaos.ts', layer: 2, form: 'transform' },
    { id: 29, title: '异常驱动控制流（pcall 跳转）', module: 'obfuscators/ControlFlowChaos.ts', layer: 2, form: 'transform' },
    { id: 30, title: '控制流完整性破坏（非 CFI 间接调用）', module: 'obfuscators/ControlFlowChaos.ts', layer: 2, form: 'transform' },
    { id: 31, title: '去优化触发器（强制解释器模式）', module: 'obfuscators/LoopObfuscation.ts', layer: 2, form: 'transform' },
    { id: 32, title: '反编译器边界异常（Unluac 崩溃）', module: 'obfuscators/IndirectJumps.ts', layer: 5, form: 'transform' },
    { id: 33, title: '语法级反解析陷阱（5.1/Luau AST 歧义）', module: 'obfuscators/IndirectJumps.ts', layer: 5, form: 'transform' },
    // ===== 第三部分：量子级数据与常量混淆（34-50）=====
    { id: 34, title: '全量字符串 AES 加密（惰性解密缓存随机）', module: 'obfuscators/StringEncryption.ts', layer: 3, form: 'both' },
    { id: 35, title: '常量池完全替换（GX-Cipher 加密池）', module: 'obfuscators/VMEngine.ts', layer: 1, form: 'both' },
    { id: 36, title: '高密度 MBA 表达式（≥8 层）', module: 'obfuscators/ConstantObfuscation.ts', layer: 3, form: 'transform' },
    { id: 37, title: '表长度常量编码（#{...} 运行计算）', module: 'obfuscators/ConstantObfuscation.ts', layer: 3, form: 'transform' },
    { id: 38, title: 'S-Box 非线性替换（256 字节随机置换）', module: 'core/VMCodec.ts', layer: 1, form: 'both' },
    { id: 39, title: '常量即时擦除（置 nil 强制 GC）', module: 'obfuscators/DataTorment.ts', layer: 3, form: 'runtime' },
    { id: 40, title: '环境因子动态密钥派生（tick+PlaceId+JobId+盐）', module: 'core/PolymorphicRuntime.ts', layer: 1, form: 'runtime' },
    { id: 41, title: '数据拆分与跨变量融合（32 位拆 2×16 位）', module: 'obfuscators/ConstantObfuscation.ts', layer: 3, form: 'transform' },
    { id: 42, title: '数据过程化（函数生成静态表）', module: 'obfuscators/DataTorment.ts', layer: 3, form: 'transform' },
    { id: 43, title: '表键名混淆（元表 __index 解密）', module: 'obfuscators/DataTorment.ts', layer: 3, form: 'transform' },
    { id: 44, title: '元表深度代理链（≥3 层 __index 委托）', module: 'obfuscators/MetatableProxy.ts', layer: 3, form: 'both' },
    { id: 45, title: '动态类型迷踪（同变量不同类型）', module: 'obfuscators/TypeMaze.ts', layer: 3, form: 'transform' },
    { id: 46, title: '弱表与终结器隐式数据流（__gc + 弱表）', module: 'obfuscators/DataTorment.ts', layer: 3, form: 'runtime' },
    { id: 47, title: '语义等价替换（string.gsub→手动循环）', module: 'obfuscators/DataTorment.ts', layer: 3, form: 'transform' },
    { id: 48, title: '浮点数/NaN 隐式编码（位模式编码整数）', module: 'obfuscators/ConstantObfuscation.ts', layer: 3, form: 'transform' },
    { id: 49, title: '字符串拆分重组（table.concat）', module: 'obfuscators/StringSplitting.ts', layer: 3, form: 'transform' },
    { id: 50, title: '编码混淆（Base64/Hex/自定义多重叠加）', module: 'obfuscators/StringSplitting.ts', layer: 3, form: 'transform' },
    // ===== 第四部分：多维作用域与符号撕裂（51-61）=====
    { id: 51, title: '全标识符氪星重命名（长度 ≥10 混合字符）', module: 'obfuscators/IdentifierRenaming.ts', layer: 4, form: 'transform' },
    { id: 52, title: '全局变量暗物质隐藏（_G 代理表）', module: 'obfuscators/GlobalHiding.ts', layer: 4, form: 'both' },
    { id: 53, title: '局部变量代理表间接访问（元表劫持）', module: 'obfuscators/ProxyFunction.ts', layer: 4, form: 'both' },
    { id: 54, title: '多级闭包 Upvalue 嵌套（≥5 层捕获）', module: 'obfuscators/ClosureNesting.ts', layer: 4, form: 'transform' },
    { id: 55, title: '函数整体包装与作用域隔离（两层匿名）', module: 'obfuscators/ClosureNesting.ts', layer: 4, form: 'transform' },
    { id: 56, title: '动态环境劫持（setfenv/_ENV 切换）', module: 'obfuscators/EnvironmentSandbox.ts', layer: 4, form: 'both' },
    { id: 57, title: '函数融合与反内联分裂', module: 'obfuscators/FunctionShredding.ts', layer: 4, form: 'transform' },
    { id: 58, title: '多态函数克隆（3 版本随机调用）', module: 'obfuscators/FunctionClones.ts', layer: 4, form: 'transform' },
    { id: 59, title: '可变参数污染函数签名（+1-5 参数）', module: 'obfuscators/FunctionClones.ts', layer: 4, form: 'transform' },
    { id: 60, title: '环境表白名单沙盒隔离', module: 'core/PolymorphicRuntime.ts', layer: 1, form: 'runtime' },
    { id: 61, title: '全局访问路径动态计算（字符串拼接）', module: 'obfuscators/RobloxHardening.ts', layer: 7, form: 'transform' },
    // ===== 第五部分：反自动化分析护盾（62-69）=====
    { id: 62, title: '反符号执行盾（非线性约束）', module: 'obfuscators/PathExplosion.ts', layer: 5, form: 'transform' },
    { id: 63, title: '反污点追踪（控制流依赖传递）', module: 'obfuscators/PathExplosion.ts', layer: 5, form: 'transform' },
    { id: 64, title: '反 AST/GNN 模式匹配（对抗性节点）', module: 'obfuscators/TypeMaze.ts', layer: 5, form: 'transform' },
    { id: 65, title: '死代码消除反制（元表副作用）', module: 'obfuscators/DeadCodeInjection.ts', layer: 5, form: 'transform' },
    { id: 66, title: '反沙箱/反虚拟化（tick 跳变/内存/服务）', module: 'core/PolymorphicRuntime.ts', layer: 6, form: 'runtime' },
    { id: 67, title: 'AI 级不透明谓词（素数判定/离散对数）', module: 'obfuscators/PathExplosion.ts', layer: 5, form: 'transform' },
    { id: 68, title: '形式化验证陷阱（指数状态爆炸）', module: 'obfuscators/PathExplosion.ts', layer: 5, form: 'transform' },
    { id: 69, title: '内存布局随机化（表键顺序随机）', module: 'obfuscators/MetatableProxy.ts', layer: 3, form: 'transform' },
    // ===== 第六部分：硬核运行时反制（70-81）=====
    { id: 70, title: '分片代码完整性哈希校验（100 片 SHA-256）', module: 'core/PolymorphicRuntime.ts', layer: 6, form: 'runtime' },
    { id: 71, title: '静态+动态反调试合并框架', module: 'obfuscators/AntiDebug.ts', layer: 6, form: 'both' },
    { id: 72, title: '高精度时序侧信道检测（os.clock）', module: 'core/PolymorphicRuntime.ts', layer: 6, form: 'runtime' },
    { id: 73, title: '环境全局对象篡改检测（game/workspace）', module: 'core/PolymorphicRuntime.ts', layer: 6, form: 'runtime' },
    { id: 74, title: '时间炸弹（超时自动失效）', module: 'core/PolymorphicRuntime.ts', layer: 6, form: 'runtime' },
    { id: 75, title: '调用栈深度伪造（debug.getinfo 伪造）', module: 'core/PolymorphicRuntime.ts', layer: 6, form: 'runtime' },
    { id: 76, title: '运行时内存自校验（每 10 秒哈希对比）', module: 'core/PolymorphicRuntime.ts', layer: 6, form: 'runtime' },
    { id: 77, title: '内联反钩子检测（debug.sethook 假数据）', module: 'core/PolymorphicRuntime.ts', layer: 6, form: 'runtime' },
    { id: 78, title: '调试库污染（伪造源文件名/行号）', module: 'core/PolymorphicRuntime.ts', layer: 6, form: 'runtime' },
    { id: 79, title: '自变异代码块（运行时等价替换）', module: 'core/PolymorphicRuntime.ts', layer: 6, form: 'runtime' },
    { id: 80, title: '反内存 Dump（销毁闭包和 upvalue）', module: 'core/PolymorphicRuntime.ts', layer: 6, form: 'runtime' },
    { id: 81, title: '反篡改触发链（校验点数据流关联）', module: 'core/PolymorphicRuntime.ts', layer: 6, form: 'runtime' },
    // ===== 第七部分：平台专属（82-89）=====
    { id: 82, title: 'Gloop 引擎 100% 语法兼容（严格 Lua 5.1）', module: 'core/LuaPrinter.ts', layer: 7, form: 'transform' },
    { id: 83, title: 'Dark Dex 实例树混淆（元表伪造值）', module: 'core/PolymorphicRuntime.ts', layer: 7, form: 'runtime' },
    { id: 84, title: '触摸注入友好（task.defer 分散负载）', module: 'obfuscators/PlatformDelta.ts', layer: 7, form: 'runtime' },
    { id: 85, title: '跨平台差异化混淆（system 分支）', module: 'obfuscators/PlatformDelta.ts', layer: 7, form: 'runtime' },
    { id: 86, title: 'Script Hub 反收录特征（随机指纹）', module: 'core/PolymorphicRuntime.ts', layer: 7, form: 'runtime' },
    { id: 87, title: '巨型常量表分页加载（1KB 页按需解密）', module: 'core/PolymorphicRuntime.ts', layer: 1, form: 'runtime' },
    { id: 88, title: 'Remote 调用多层加密（≥3 层）', module: 'obfuscators/RobloxHardening.ts', layer: 7, form: 'both' },
    { id: 89, title: '任务调度器帧序扰乱（task 混用）', module: 'obfuscators/PlatformDelta.ts', layer: 7, form: 'runtime' },
    // ===== 第八部分：交付与工程（90-95）=====
    { id: 90, title: '源码终末自毁（覆盖删除原始文件）', module: 'obfuscators/Watermark.ts', layer: 8, form: 'transform' },
    { id: 91, title: '多策略编排流水线（顺序随机化）', module: 'core/Orchestrator.ts', layer: 8, form: 'transform' },
    { id: 92, title: '多态引擎内核（每次不同字节码）', module: 'core/PolymorphicRuntime.ts', layer: 8, form: 'both' },
    { id: 93, title: '宏粒度控制（函数级强度 1-5）', module: 'core/Orchestrator.ts', layer: 8, form: 'transform' },
    { id: 94, title: '唯一指纹水印（不可见唯一 ID）', module: 'obfuscators/Watermark.ts', layer: 8, form: 'transform' },
    { id: 95, title: '混淆质量评估与报告', module: 'core/Verifier.ts', layer: 8, form: 'transform' },
];
/** 按编号索引的快速查询表 */
exports.SUBSYSTEM_BY_ID = new Map(exports.SUBSYSTEMS.map(s => [s.id, s]));
/** 覆盖率检查：保证 1..95 全部登记（缺失即构建失败） */
function assertFullCoverage() {
    const missing = [];
    for (let i = 1; i <= 95; i++) {
        if (!exports.SUBSYSTEM_BY_ID.has(i))
            missing.push(i);
    }
    if (missing.length > 0) {
        throw new Error(`子系统登记缺失: ${missing.join(', ')}`);
    }
}
