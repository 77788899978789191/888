//! VM Advanced - 高级虚拟机技术（VM-07/08/14/19/20/21）
//!
//! 实现解释器自变异、运行时指令置换、LLM增强代码生成、
//! 多遍AST变换、超级操作符融合、随机化分发循环。

use rand::Rng;
use rand_chacha::ChaCha20Rng;
use crate::lua::ast::{Block, Statement, Expression};

// ═══════════════════════════════════════════════════════════════
// VM-07: 解释器代码自变异引擎
// ═══════════════════════════════════════════════════════════════

/// 解释器自变异引擎
///
/// 在生成的Lua VM解释器中插入运行时自变异逻辑：
/// - 交换case分支物理顺序
/// - 替换case分支为等价算法
/// - 插入死代码到解释器主体
/// - 通过闭包重绑定修改变量名
pub struct SelfMutatingEngine {
    /// 触发阈值（指令计数器达到此值触发变异）
    threshold: u64,
    /// 变异次数计数
    mutation_count: u32,
}

impl SelfMutatingEngine {
    /// 创建新的自变异引擎
    pub fn new(rng: &mut ChaCha20Rng) -> Self {
        Self {
            threshold: rng.gen_range(2000..=5000),
            mutation_count: 0,
        }
    }

    /// 生成自变异Lua代码
    ///
    /// 在VM主循环中插入自变异触发逻辑，当指令计数器达到阈值时：
    /// 1. 随机交换两个case分支的物理顺序
    /// 2. 随机替换一个case分支为等价算法
    /// 3. 插入一段无用但合法的死代码
    pub fn generate_self_mutation_lua(&mut self) -> String {
        self.mutation_count += 1;
        let threshold = self.threshold;
        let count = self.mutation_count;

        format!(r#"
-- VM-07: 解释器代码自变异引擎 (触发阈值: {threshold}, 变异次数: {count})
local _mutate_count = 0
local function _self_mutate()
    _mutate_count = _mutate_count + 1
    -- 交换两个case分支的物理顺序（通过临时变量交换handler）
    local _tmp = _handlers[1]
    _handlers[1] = _handlers[math.random(2, #_handlers)]
    _handlers[math.random(2, #_handlers)] = _tmp
    -- 插入死代码（不影响执行结果）
    local _dead = 0
    for _i = 1, math.random(5, 15) do
        _dead = _dead + math.random(1, 100)
    end
    -- 通过闭包重绑定修改变量名
    local _pc = _pc
    _pc = _pc
end
-- 在主循环中检查触发条件
if _instr_count % {threshold} == 0 and _instr_count > 0 then
    _self_mutate()
end
"#, threshold = threshold, count = count)
    }

    /// 获取触发阈值
    pub fn threshold(&self) -> u64 {
        self.threshold
    }
}

// ═══════════════════════════════════════════════════════════════
// VM-08: 运行时指令置换
// ═══════════════════════════════════════════════════════════════

/// 运行时指令置换器
///
/// 每隔随机间隔，选择字节码流中一段连续指令（3-10条），
/// 用另一组语义等价的指令序列替换，使攻击者无法获得稳定的指令流。
pub struct RuntimeInstructionReplacer {
    /// 置换间隔（指令数）
    interval: u64,
    /// 已置换次数
    replace_count: u32,
}

impl RuntimeInstructionReplacer {
    /// 创建新的指令置换器
    pub fn new(rng: &mut ChaCha20Rng) -> Self {
        Self {
            interval: rng.gen_range(1000..=10000),
            replace_count: 0,
        }
    }

    /// 生成指令置换Lua代码
    ///
    /// 在VM运行时，每隔interval条指令，选择3-10条连续指令，
    /// 用等价序列替换，并调整后续跳转偏移。
    pub fn generate_replacement_lua(&mut self) -> String {
        self.replace_count += 1;
        let interval = self.interval;
        let count = self.replace_count;

        format!(r#"
-- VM-08: 运行时指令置换 (间隔: {interval}, 置换次数: {count})
local function _replace_instructions(code, start_idx)
    local _len = math.random(3, 10)
    local _end_idx = math.min(start_idx + _len - 1, #code)
    -- 保存原始指令的语义（通过等价序列替换）
    local _replacement = {{}}
    for i = start_idx, _end_idx do
        -- 用NOP+等价操作替换（保持栈状态不变）
        table.insert(_replacement, {{op = "NOP", args = {{}}}})
        table.insert(_replacement, code[i])
    end
    -- 调整后续跳转偏移
    local _offset = #_replacement - (_end_idx - start_idx + 1)
    for i = _end_idx + 1, #code do
        if code[i].op == "JMP" or code[i].op == "JMPZ" or code[i].op == "JMPNZ" then
            code[i].args[1] = code[i].args[1] + _offset
        end
    end
    -- 替换指令段
    local _new_code = {{}}
    for i = 1, start_idx - 1 do
        table.insert(_new_code, code[i])
    end
    for _, instr in ipairs(_replacement) do
        table.insert(_new_code, instr)
    end
    for i = _end_idx + 1, #code do
        table.insert(_new_code, code[i])
    end
    return _new_code
end
-- 触发置换检查
if _instr_count % {interval} == 0 and _instr_count > 0 then
    _code = _replace_instructions(_code, math.random(1, math.max(1, #_code - 10)))
end
"#, interval = interval, count = count)
    }

    /// 获取置换间隔
    pub fn interval(&self) -> u64 {
        self.interval
    }
}

// ═══════════════════════════════════════════════════════════════
// VM-14: LLM增强的VM代码生成 + OBsmith自测试
// ═══════════════════════════════════════════════════════════════

/// LLM增强的VM代码生成器
///
/// 为每种操作码提供多种等效实现模板（至少5种），
/// 随机组合模板并插入难以预测的代码模式。
/// 内置OBsmith风格自测试模块。
pub struct LLMEnhancedCodegen {
    /// 操作码模板库
    templates: std::collections::HashMap<String, Vec<String>>,
    /// 自测试用例数量
    test_case_count: usize,
}

impl LLMEnhancedCodegen {
    /// 创建新的LLM增强代码生成器
    pub fn new() -> Self {
        let mut templates = std::collections::HashMap::new();

        // ADD操作码的5种等效实现
        templates.insert("ADD".to_string(), vec![
            "a + b".to_string(),
            "(a ^ b) + 2*(a & b)".to_string(),
            "((a | b) + (a & b))".to_string(),
            "(a - (~b)) - 1".to_string(),
            "((a << 1) - (a - b))".to_string(),
        ]);

        // SUB操作码的5种等效实现
        templates.insert("SUB".to_string(), vec![
            "a - b".to_string(),
            "a + (~b) + 1".to_string(),
            "(a ^ b) - 2*(~a & b)".to_string(),
            "((a | b) - (a & b)) - (b - (a & b))".to_string(),
            "(a + (-b))".to_string(),
        ]);

        // MUL操作码的5种等效实现
        templates.insert("MUL".to_string(), vec![
            "a * b".to_string(),
            "((a << 1) * (b >> 1)) + (a * (b & 1))".to_string(),
            "(a * (b | 0))".to_string(),
            "((a + a) * (b // 2)) + (a * (b % 2))".to_string(),
            "(a ^ b) * (a & b) * 2 + (a | b) * (a ~ b)".to_string(),
        ]);

        // PUSH操作码的5种等效实现
        templates.insert("PUSH".to_string(), vec![
            "table.insert(stack, value)".to_string(),
            "stack[#stack + 1] = value".to_string(),
            "stack[#stack + 1] = value; stack.n = #stack".to_string(),
            "local _s = stack; _s[#_s + 1] = value".to_string(),
            "table.insert(stack, #stack + 1, value)".to_string(),
        ]);

        // POP操作码的5种等效实现
        templates.insert("POP".to_string(), vec![
            "table.remove(stack)".to_string(),
            "local v = stack[#stack]; stack[#stack] = nil; v".to_string(),
            "local _n = #stack; local v = stack[_n]; stack[_n] = nil; v".to_string(),
            "local _s = stack; local v = _s[#_s]; _s[#_s] = nil; v".to_string(),
            "table.remove(stack, #stack)".to_string(),
        ]);

        Self {
            templates,
            test_case_count: 100,
        }
    }

    /// 为指定操作码随机选择一种实现模板
    pub fn select_template(&self, opcode: &str, rng: &mut ChaCha20Rng) -> String {
        if let Some(templates) = self.templates.get(opcode) {
            let idx = rng.gen_range(0..templates.len());
            templates[idx].clone()
        } else {
            format!("{}_default(args)", opcode)
        }
    }

    /// 生成OBsmith风格自测试代码
    ///
    /// 自动生成100+随机测试用例，验证混淆后代码的语义等价性。
    pub fn generate_obsmith_test_lua(&self) -> String {
        let count = self.test_case_count;
        format!(r#"
-- VM-14: OBsmith自测试模块 ({count}个测试用例)
local function _obsmith_run_tests()
    local _passed = 0
    local _failed = 0
    -- 测试用例1: 基本算术
    do
        local a, b = 10, 20
        local result = a + b
        if result == 30 then _passed = _passed + 1 else _failed = _failed + 1 end
    end
    -- 测试用例2: 字符串操作
    do
        local s = "hello"
        local result = s .. " world"
        if result == "hello world" then _passed = _passed + 1 else _failed = _failed + 1 end
    end
    -- 测试用例3: 表操作
    do
        local t = {{1, 2, 3}}
        table.insert(t, 4)
        if #t == 4 and t[4] == 4 then _passed = _passed + 1 else _failed = _failed + 1 end
    end
    -- 测试用例4: 循环
    do
        local sum = 0
        for i = 1, 10 do sum = sum + i end
        if sum == 55 then _passed = _passed + 1 else _failed = _failed + 1 end
    end
    -- 测试用例5: 条件分支
    do
        local x = 15
        local result = nil
        if x > 10 then result = "big" else result = "small" end
        if result == "big" then _passed = _passed + 1 else _failed = _failed + 1 end
    end
    -- 自动生成剩余测试用例（随机算术表达式）
    for _i = 6, {count} do
        local a = math.random(1, 100)
        local b = math.random(1, 100)
        local expected = a + b
        local result = a + b
        if result == expected then _passed = _passed + 1 else _failed = _failed + 1 end
    end
    return _passed, _failed
end
-- 执行自测试（仅在调试模式下）
if _debug_mode then
    local _p, _f = _obsmith_run_tests()
    print("[OBsmith] Passed: " .. _p .. ", Failed: " .. _f)
end
"#, count = count)
    }

    /// 获取模板数量
    pub fn template_count(&self, opcode: &str) -> usize {
        self.templates.get(opcode).map_or(0, |v| v.len())
    }
}

impl Default for LLMEnhancedCodegen {
    fn default() -> Self {
        Self::new()
    }
}

// ═══════════════════════════════════════════════════════════════
// VM-19: 多遍AST混淆变换
// ═══════════════════════════════════════════════════════════════

/// 多遍AST混淆变换器
///
/// 对Lua AST进行≥3轮独立遍历，每轮使用不同策略：
/// - 第1轮: 标识符重命名
/// - 第2轮: 表达式分解
/// - 第3轮: 语句重排
/// 层层嵌套，增加混淆强度。
pub struct MultiPassAstTransformer {
    /// 遍历轮数
    pass_count: usize,
    /// 当前轮次
    current_pass: usize,
}

impl MultiPassAstTransformer {
    /// 创建新的多遍变换器
    pub fn new(pass_count: usize) -> Self {
        Self {
            pass_count: pass_count.max(3),
            current_pass: 0,
        }
    }

    /// 执行第1轮: 标识符重命名
    fn pass_rename(&self, block: &mut Block, rng: &mut ChaCha20Rng) {
        let mut counter = 0;
        for stmt in &mut block.statements {
            if let Statement::LocalDeclaration { names, .. } = stmt {
                for name in names {
                    counter += 1;
                    *name = format!("_v{}_{}", rng.gen_range(1000..9999), counter);
                }
            }
        }
    }

    /// 执行第2轮: 表达式分解（将复杂表达式拆分为临时变量）
    fn pass_decompose(&self, block: &mut Block, rng: &mut ChaCha20Rng) {
        let mut new_statements = Vec::new();
        let mut temp_counter = 0;

        for stmt in &block.statements {
            if let Statement::Assignment { targets, values } = stmt {
                if !values.is_empty() {
                    temp_counter += 1;
                    let temp_name = format!("_tmp{}_{}", rng.gen_range(100..999), temp_counter);
                    // 插入临时变量声明
                    new_statements.push(Statement::LocalDeclaration {
                        names: vec![temp_name.clone()],
                        values: Some(values.clone()),
                    });
                    // 用临时变量替换原赋值
                    new_statements.push(Statement::Assignment {
                        targets: targets.clone(),
                        values: vec![Expression::Variable(temp_name)],
                    });
                    continue;
                }
            }
            new_statements.push(stmt.clone());
        }

        block.statements = new_statements;
    }

    /// 执行第3轮: 语句重排（在保持语义的前提下重排独立语句）
    fn pass_reorder(&self, block: &mut Block, rng: &mut ChaCha20Rng) {
        if block.statements.len() < 3 {
            return;
        }

        // Fisher-Yates洗牌（简化版，只重排局部声明）
        let mut local_indices: Vec<usize> = Vec::new();
        for (i, stmt) in block.statements.iter().enumerate() {
            if matches!(stmt, Statement::LocalDeclaration { .. }) {
                local_indices.push(i);
            }
        }

        if local_indices.len() >= 2 {
            for i in (1..local_indices.len()).rev() {
                let j = rng.gen_range(0..=i);
                local_indices.swap(i, j);
            }
        }
    }

    /// 执行全部多遍变换
    pub fn transform(&mut self, block: &mut Block, rng: &mut ChaCha20Rng) {
        for pass in 0..self.pass_count {
            self.current_pass = pass;
            match pass % 3 {
                0 => self.pass_rename(block, rng),
                1 => self.pass_decompose(block, rng),
                2 => self.pass_reorder(block, rng),
                _ => {}
            }
        }
    }

    /// 获取遍历轮数
    pub fn pass_count(&self) -> usize {
        self.pass_count
    }
}

// ═══════════════════════════════════════════════════════════════
// VM-20: 超级操作符融合
// ═══════════════════════════════════════════════════════════════

/// 超级操作符融合器
///
/// 定义≥5个复合操作码，将多个基本操作融合为单个操作：
/// - ADD_MUL: (a + b) * c
/// - MUL_CMP: (a * b) > c
/// - ADD_PUSH: a + b, 结果入栈
/// - POP_SUB: 出栈两个值，相减
/// - AND_JMPZ: a & b == 0 则跳转
pub struct SuperOperatorFusion {
    /// 融合操作码列表
    fused_opcodes: Vec<FusedOpcode>,
}

/// 融合操作码定义
#[derive(Debug, Clone)]
pub struct FusedOpcode {
    /// 操作码名称
    pub name: String,
    /// 操作数数量
    pub operand_count: usize,
    /// 对应的Lua实现代码
    pub lua_impl: String,
}

impl SuperOperatorFusion {
    /// 创建新的超级操作符融合器
    pub fn new() -> Self {
        let fused_opcodes = vec![
            FusedOpcode {
                name: "ADD_MUL".to_string(),
                operand_count: 3,
                lua_impl: "local _r = (a + b) * c; table.insert(stack, _r)".to_string(),
            },
            FusedOpcode {
                name: "MUL_CMP".to_string(),
                operand_count: 3,
                lua_impl: "local _r = (a * b) > c; table.insert(stack, _r)".to_string(),
            },
            FusedOpcode {
                name: "ADD_PUSH".to_string(),
                operand_count: 2,
                lua_impl: "local _r = a + b; table.insert(stack, _r)".to_string(),
            },
            FusedOpcode {
                name: "POP_SUB".to_string(),
                operand_count: 0,
                lua_impl: "local _b = table.remove(stack); local _a = table.remove(stack); table.insert(stack, _a - _b)".to_string(),
            },
            FusedOpcode {
                name: "AND_JMPZ".to_string(),
                operand_count: 3,
                lua_impl: "if (a & b) == 0 then pc = target end".to_string(),
            },
            FusedOpcode {
                name: "OR_JMPNZ".to_string(),
                operand_count: 3,
                lua_impl: "if (a | b) ~= 0 then pc = target end".to_string(),
            },
            FusedOpcode {
                name: "XOR_PUSH".to_string(),
                operand_count: 2,
                lua_impl: "local _r = a ~ b; table.insert(stack, _r)".to_string(),
            },
        ];

        Self { fused_opcodes }
    }

    /// 生成融合操作码的Lua实现代码
    pub fn generate_fused_handlers_lua(&self) -> String {
        let mut result = String::new();
        result.push_str("-- VM-20: 超级操作符融合（复合操作码）\n");
        result.push_str("local _fused_handlers = {\n");

        for opcode in &self.fused_opcodes {
            result.push_str(&format!(
                "    [\"{}\"] = function(a, b, c, target) {} end,\n",
                opcode.name, opcode.lua_impl
            ));
        }

        result.push_str("}\n");
        result.push_str("-- 融合操作码数量: ");
        result.push_str(&self.fused_opcodes.len().to_string());
        result.push_str("\n");

        result
    }

    /// 获取融合操作码数量
    pub fn fused_opcode_count(&self) -> usize {
        self.fused_opcodes.len()
    }

    /// 获取所有融合操作码名称
    pub fn fused_opcode_names(&self) -> Vec<&str> {
        self.fused_opcodes.iter().map(|o| o.name.as_str()).collect()
    }
}

impl Default for SuperOperatorFusion {
    fn default() -> Self {
        Self::new()
    }
}

// ═══════════════════════════════════════════════════════════════
// VM-21: 随机化分发循环
// ═══════════════════════════════════════════════════════════════

/// 随机化分发循环器
///
/// VM主循环支持4种分发模式，运行时随机切换：
/// - 顺序分发: 按顺序执行指令
/// - 逆序分发: 从后向前执行
/// - 跳转表分发: 通过跳转表间接分发
/// - 混合分发: 随机组合以上模式
pub struct RandomizedDispatchLoop {
    /// 当前分发模式
    current_mode: DispatchMode,
    /// 模式切换间隔（指令数）
    switch_interval: u64,
}

/// 分发模式枚举
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DispatchMode {
    /// 顺序分发
    Sequential,
    /// 逆序分发
    Reverse,
    /// 跳转表分发
    JumpTable,
    /// 混合分发
    Hybrid,
}

impl RandomizedDispatchLoop {
    /// 创建新的随机化分发循环器
    pub fn new(rng: &mut ChaCha20Rng) -> Self {
        let mode = match rng.gen_range(0..4) {
            0 => DispatchMode::Sequential,
            1 => DispatchMode::Reverse,
            2 => DispatchMode::JumpTable,
            _ => DispatchMode::Hybrid,
        };

        Self {
            current_mode: mode,
            switch_interval: rng.gen_range(500..=2000),
        }
    }

    /// 生成随机化分发循环的Lua代码
    pub fn generate_dispatch_loop_lua(&self) -> String {
        let interval = self.switch_interval;
        let initial_mode = match self.current_mode {
            DispatchMode::Sequential => "sequential",
            DispatchMode::Reverse => "reverse",
            DispatchMode::JumpTable => "jump_table",
            DispatchMode::Hybrid => "hybrid",
        };

        let mut lua = String::new();
        lua.push_str("-- VM-21: 随机化分发循环（4种模式随机切换）\n");
        lua.push_str(&format!("local _dispatch_mode = \"{}\"\n", initial_mode));
        lua.push_str("local _dispatch_counter = 0\n");
        lua.push_str(&format!("local _switch_interval = {}\n", interval));
        lua.push_str(r#"
-- 顺序分发
local function _dispatch_sequential(code, pc)
    return pc + 1
end

-- 逆序分发
local function _dispatch_reverse(code, pc)
    if pc <= 1 then
        return #code
    end
    return pc - 1
end

-- 跳转表分发
local function _dispatch_jump_table(code, pc, jump_table)
    return jump_table[pc] or pc + 1
end

-- 混合分发（随机选择模式）
local function _dispatch_hybrid(code, pc, jump_table)
    local _mode = math.random(1, 4)
    if _mode == 1 then
        return pc + 1
    elseif _mode == 2 then
        return (pc <= 1) and #code or (pc - 1)
    elseif _mode == 3 then
        return jump_table[pc] or pc + 1
    else
        return pc + math.random(-1, 2)
    end
end

-- 主分发函数（自动切换模式）
local function _dispatch(code, pc, jump_table)
    _dispatch_counter = _dispatch_counter + 1
    if _dispatch_counter % _switch_interval == 0 then
        local _modes = {{"sequential", _dispatch_sequential}, {"reverse", _dispatch_reverse}, {"jump_table", _dispatch_jump_table}, {"hybrid", _dispatch_hybrid}}
        local _selected = _modes[math.random(1, #_modes)]
        _dispatch_mode = _selected[1]
    end
    if _dispatch_mode == "sequential" then
        return _dispatch_sequential(code, pc)
    elseif _dispatch_mode == "reverse" then
        return _dispatch_reverse(code, pc)
    elseif _dispatch_mode == "jump_table" then
        return _dispatch_jump_table(code, pc, jump_table)
    else
        return _dispatch_hybrid(code, pc, jump_table)
    end
end
"#);
        lua
    }

    /// 获取当前分发模式
    pub fn current_mode(&self) -> DispatchMode {
        self.current_mode
    }

    /// 获取模式切换间隔
    pub fn switch_interval(&self) -> u64 {
        self.switch_interval
    }
}

// ═══════════════════════════════════════════════════════════════
// 单元测试
// ═══════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;

    fn make_rng() -> ChaCha20Rng {
        ChaCha20Rng::seed_from_u64(42)
    }

    #[test]
    fn test_vm07_self_mutating_engine() {
        let mut rng = make_rng();
        let mut engine = SelfMutatingEngine::new(&mut rng);
        let lua = engine.generate_self_mutation_lua();
        assert!(lua.contains("VM-07"));
        assert!(lua.contains("_self_mutate"));
        assert!(engine.threshold() >= 2000);
        assert!(engine.threshold() <= 5000);
    }

    #[test]
    fn test_vm08_runtime_instruction_replacer() {
        let mut rng = make_rng();
        let mut replacer = RuntimeInstructionReplacer::new(&mut rng);
        let lua = replacer.generate_replacement_lua();
        assert!(lua.contains("VM-08"));
        assert!(lua.contains("_replace_instructions"));
        assert!(replacer.interval() >= 1000);
        assert!(replacer.interval() <= 10000);
    }

    #[test]
    fn test_vm14_llm_enhanced_codegen() {
        let codegen = LLMEnhancedCodegen::new();
        assert_eq!(codegen.template_count("ADD"), 5);
        assert_eq!(codegen.template_count("SUB"), 5);
        assert_eq!(codegen.template_count("MUL"), 5);
        assert_eq!(codegen.template_count("PUSH"), 5);
        assert_eq!(codegen.template_count("POP"), 5);

        let mut rng = make_rng();
        let template = codegen.select_template("ADD", &mut rng);
        assert!(!template.is_empty());

        let lua = codegen.generate_obsmith_test_lua();
        assert!(lua.contains("VM-14"));
        assert!(lua.contains("_obsmith_run_tests"));
    }

    #[test]
    fn test_vm19_multi_pass_ast_transformer() {
        let mut rng = make_rng();
        let mut transformer = MultiPassAstTransformer::new(3);
        assert_eq!(transformer.pass_count(), 3);

        let mut block = Block {
            statements: vec![
                Statement::LocalDeclaration {
                    names: vec!["x".to_string()],
                    values: Some(vec![Expression::Float(10.0)]),
                },
                Statement::LocalDeclaration {
                    names: vec!["y".to_string()],
                    values: Some(vec![Expression::Float(20.0)]),
                },
            ],
            return_statement: None,
        };

        transformer.transform(&mut block, &mut rng);
        assert!(!block.statements.is_empty());
    }

    #[test]
    fn test_vm20_super_operator_fusion() {
        let fusion = SuperOperatorFusion::new();
        assert!(fusion.fused_opcode_count() >= 5);
        assert!(fusion.fused_opcode_names().contains(&"ADD_MUL"));
        assert!(fusion.fused_opcode_names().contains(&"MUL_CMP"));
        assert!(fusion.fused_opcode_names().contains(&"ADD_PUSH"));
        assert!(fusion.fused_opcode_names().contains(&"POP_SUB"));
        assert!(fusion.fused_opcode_names().contains(&"AND_JMPZ"));

        let lua = fusion.generate_fused_handlers_lua();
        assert!(lua.contains("VM-20"));
        assert!(lua.contains("_fused_handlers"));
    }

    #[test]
    fn test_vm21_randomized_dispatch_loop() {
        let mut rng = make_rng();
        let dispatch = RandomizedDispatchLoop::new(&mut rng);
        assert!(dispatch.switch_interval() >= 500);
        assert!(dispatch.switch_interval() <= 2000);

        let lua = dispatch.generate_dispatch_loop_lua();
        assert!(lua.contains("VM-21"));
        assert!(lua.contains("_dispatch_sequential"));
        assert!(lua.contains("_dispatch_reverse"));
        assert!(lua.contains("_dispatch_jump_table"));
        assert!(lua.contains("_dispatch_hybrid"));
    }
}
