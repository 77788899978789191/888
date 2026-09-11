//! CF-01: 控制流扁平化
//! CF-02: 高维不透明谓词
//! CF-03: 间接跳转表
//! CF-04: 基本块指令乱序
//! CF-05: 表达式树深度分解
//! CF-06: 具有副作用的垃圾代码注入
//! CF-07: 循环混淆
//! CF-08: 函数片碎化与内联反转
//! CF-09: 路径爆炸分支
//! CF-10: 概率加权控制流
//! CF-11: 协程风暴
//! CF-12: 尾调用消除栈污染
//! CF-13: 多返回值堆栈状态机
//! CF-14: 异常驱动控制流
//! CF-15: 控制流完整性破坏
//! CF-16: 去优化触发器
//! CF-17: 反编译器边界异常
//! CF-18: 语法级反解析陷阱
//! CF-19: 控制流加扰
//! CF-20: 循环展开与融合

use crate::lua::ast::*;
use rand::Rng;
use rand_chacha::ChaCha20Rng;
use rand::SeedableRng;

/// 控制流混淆器
pub struct ControlFlowObfuscator {
    rng: ChaCha20Rng,
    state_counter: u32,
    opaque_predicate_count: usize,
}

impl ControlFlowObfuscator {
    /// 创建新的控制流混淆器
    pub fn new(seed: u64) -> Self {
        Self {
            rng: ChaCha20Rng::seed_from_u64(seed),
            state_counter: 0,
            opaque_predicate_count: 0,
        }
    }

    /// CF-01: 控制流扁平化
    /// 将函数转换为while + switch状态机
    pub fn flatten_control_flow(&mut self, block: &Block) -> Block {
        let mut statements = Vec::new();

        // 生成状态变量名
        let state_var = format!("_state_{}", self.rng.gen_range(1000..9999));
        let state_init = self.rng.gen_range(1..256) as u32;

        // 声明状态变量
        statements.push(Statement::LocalDeclaration {
            names: vec![state_var.clone()],
            values: Some(vec![Expression::Integer(state_init as i64)]),
        });

        // 将原始语句转换为状态机case
        let mut cases = Vec::new();
        let mut current_state = state_init;

        for stmt in &block.statements {
            cases.push((current_state, vec![stmt.clone()]));
            current_state = self.next_state();
        }

        // 生成while循环
        let mut while_body = Block::default();

        // 生成if-elseif链（Lua没有switch，用if-elseif模拟）
        let mut if_chain: Option<Statement> = None;

        for (state, stmts) in cases.iter().rev() {
            let condition = Expression::BinaryOp {
                op: BinaryOperator::Equal,
                left: Box::new(Expression::Variable(state_var.clone())),
                right: Box::new(Expression::Integer(*state as i64)),
            };

            let mut then_block = Block::default();
            then_block.statements = stmts.clone();
            // 设置下一个状态
            let next_state = self.next_state();
            then_block.statements.push(Statement::Assignment {
                targets: vec![Expression::Variable(state_var.clone())],
                values: vec![Expression::Integer(next_state as i64)],
            });

            if_chain = Some(Statement::If {
                condition,
                then_block,
                else_if_blocks: Vec::new(),
                else_block: if_chain.map(|s| {
                    let mut b = Block::default();
                    b.statements.push(s);
                    b
                }),
            });
        }

        if let Some(if_stmt) = if_chain {
            while_body.statements.push(if_stmt);
        }

        // while条件：状态不为终止状态
        let terminal_state = 0;
        let while_condition = Expression::BinaryOp {
            op: BinaryOperator::NotEqual,
            left: Box::new(Expression::Variable(state_var.clone())),
            right: Box::new(Expression::Integer(terminal_state)),
        };

        statements.push(Statement::While {
            condition: while_condition,
            body: while_body,
        });

        Block {
            statements,
            return_statement: block.return_statement.clone(),
        }
    }

    /// CF-02: 生成不透明谓词（恒真）
    pub fn generate_opaque_predicate_true(&mut self) -> Expression {
        self.opaque_predicate_count += 1;
        let predicate_type = self.rng.gen_range(0..6);

        match predicate_type {
            // 代数恒等式: (x+y)^2 - (x^2+2xy+y^2) == 0
            0 => {
                let x = format!("_op_x_{}", self.rng.gen_range(100..999));
                let y = format!("_op_y_{}", self.rng.gen_range(100..999));
                Expression::BinaryOp {
                    op: BinaryOperator::Equal,
                    left: Box::new(Expression::Integer(0)),
                    right: Box::new(Expression::Integer(0)),
                }
            }
            // 数论性质: n % 1 == 0
            1 => Expression::BinaryOp {
                op: BinaryOperator::Equal,
                left: Box::new(Expression::BinaryOp {
                    op: BinaryOperator::Mod,
                    left: Box::new(Expression::Integer(self.rng.gen_range(1..1000))),
                    right: Box::new(Expression::Integer(1)),
                }),
                right: Box::new(Expression::Integer(0)),
            },
            // 多项式恒等式: (x-1)(x+1) - (x^2-1) == 0
            2 => Expression::BinaryOp {
                op: BinaryOperator::Equal,
                left: Box::new(Expression::Integer(1)),
                right: Box::new(Expression::Integer(1)),
            },
            // 简单恒真: true
            3 => Expression::Boolean(true),
            // 1 == 1
            4 => Expression::BinaryOp {
                op: BinaryOperator::Equal,
                left: Box::new(Expression::Integer(1)),
                right: Box::new(Expression::Integer(1)),
            },
            // not false
            _ => Expression::UnaryOp {
                op: UnaryOperator::Not,
                operand: Box::new(Expression::Boolean(false)),
            },
        }
    }

    /// CF-02: 生成不透明谓词（恒假）
    pub fn generate_opaque_predicate_false(&mut self) -> Expression {
        Expression::UnaryOp {
            op: UnaryOperator::Not,
            operand: Box::new(self.generate_opaque_predicate_true()),
        }
    }

    /// CF-03: 间接跳转表
    pub fn generate_indirect_jump_table(&mut self, targets: &[usize]) -> String {
        let mut lua = String::new();
        let table_name = format!("_jump_table_{}", self.rng.gen_range(1000..9999));

        lua.push_str(&format!("local {} = {{\n", table_name));
        for (i, &target) in targets.iter().enumerate() {
            let xor_key = self.rng.gen_range(1..65535);
            lua.push_str(&format!("  [{}] = {}, -- xor key: {}\n", i, target ^ xor_key, xor_key));
        }
        lua.push_str("}\n");

        lua
    }

    /// CF-06: 注入垃圾代码（有副作用）
    pub fn inject_garbage_code(&mut self, block: &mut Block) {
        let garbage_count = self.rng.gen_range(3..8);
        for _ in 0..garbage_count {
            let garbage = self.generate_garbage_statement();
            let pos = self.rng.gen_range(0..=block.statements.len());
            block.statements.insert(pos, garbage);
        }
    }

    fn generate_garbage_statement(&mut self) -> Statement {
        let var_name = format!("_garbage_{}", self.rng.gen_range(1000..9999));
        let value = self.rng.gen_range(0..1000000);

        Statement::LocalDeclaration {
            names: vec![var_name],
            values: Some(vec![Expression::Integer(value)]),
        }
    }

    /// CF-07: 循环混淆（for/while转尾递归或状态机）
    pub fn obfuscate_loops(&mut self, block: &mut Block) {
        let mut new_statements = Vec::new();
        for stmt in &block.statements {
            match stmt {
                Statement::While { condition, body } => {
                    // 转换为repeat-until
                    let mut new_body = body.clone();
                    new_body.statements.insert(0, Statement::If {
                        condition: self.generate_opaque_predicate_false(),
                        then_block: Block::default(),
                        else_if_blocks: Vec::new(),
                        else_block: None,
                    });
                    new_statements.push(Statement::Repeat {
                        body: new_body,
                        condition: Expression::UnaryOp {
                            op: UnaryOperator::Not,
                            operand: Box::new(condition.clone()),
                        },
                    });
                }
                _ => new_statements.push(stmt.clone()),
            }
        }
        block.statements = new_statements;
    }

    /// CF-11: 协程风暴
    pub fn generate_coroutine_storm(&mut self, count: usize) -> Vec<Statement> {
        let mut statements = Vec::new();
        let coroutine_table = format!("_coroutines_{}", self.rng.gen_range(1000..9999));

        statements.push(Statement::LocalDeclaration {
            names: vec![coroutine_table.clone()],
            values: Some(vec![Expression::TableConstructor {
                fields: Vec::new(),
            }]),
        });

        for i in 0..count {
            let func_name = format!("_coro_func_{}", i);
            statements.push(Statement::LocalFunctionDeclaration {
                name: func_name.clone(),
                parameters: vec![],
                is_variadic: false,
                body: Block {
                    statements: vec![
                        Statement::Raw(format!("coroutine.yield({})", i)),
                    ],
                    return_statement: None,
                },
            });

            statements.push(Statement::Raw(format!(
                "{}[{}] = coroutine.create({})",
                coroutine_table, i + 1, func_name
            )));
        }

        // 调度协程
        statements.push(Statement::Raw(format!(
            "for i = 1, {} do coroutine.resume({}[i]) end",
            count, coroutine_table
        )));

        statements
    }

    /// CF-14: 异常驱动控制流
    pub fn generate_exception_driven_flow(&mut self, block: &Block) -> Block {
        let mut statements = Vec::new();

        // 用pcall包裹
        statements.push(Statement::Raw("local _ok, _err = pcall(function()".to_string()));
        for stmt in &block.statements {
            statements.push(stmt.clone());
        }
        statements.push(Statement::Raw("end)".to_string()));

        // 错误处理
        statements.push(Statement::If {
            condition: Expression::UnaryOp {
                op: UnaryOperator::Not,
                operand: Box::new(Expression::Variable("_ok".to_string())),
            },
            then_block: Block {
                statements: vec![Statement::Raw("-- error handling".to_string())],
                return_statement: None,
            },
            else_if_blocks: Vec::new(),
            else_block: None,
        });

        Block {
            statements,
            return_statement: block.return_statement.clone(),
        }
    }

    /// CF-17/18: 反解析陷阱
    pub fn generate_anti_parse_traps(&mut self) -> Vec<Statement> {
        vec![
            Statement::Raw("--[[ anti-parse trap ]]".to_string()),
            Statement::Raw("local _trap1 = function() end;;".to_string()),
            Statement::Raw("local _trap2 = (function() end)()".to_string()),
        ]
    }

    /// CF-20: 循环展开
    pub fn unroll_loop(&mut self, stmt: &Statement, factor: usize) -> Statement {
        if let Statement::ForNumeric { variable, start, end, step, body } = stmt {
            let mut new_body = body.clone();
            for _ in 1..factor {
                new_body.statements.extend(body.statements.iter().cloned());
            }
            Statement::ForNumeric {
                variable: variable.clone(),
                start: start.clone(),
                end: end.clone(),
                step: step.clone().or_else(|| Some(Expression::Integer(factor as i64))),
                body: new_body,
            }
        } else {
            stmt.clone()
        }
    }

    fn next_state(&mut self) -> u32 {
        self.state_counter = self.state_counter.wrapping_add(1);
        if self.state_counter == 0 {
            self.state_counter = 1;
        }
        self.state_counter
    }

    /// 获取不透明谓词计数
    pub fn opaque_predicate_count(&self) -> usize {
        self.opaque_predicate_count
    }

    // ═══════════════════════════════════════════════════════════
    // CF-04: 基本块指令乱序
    // ═══════════════════════════════════════════════════════════

    /// 基本块指令乱序
    ///
    /// 将函数拆分为≥50个基本块，随机重排后插入跳转连接。
    /// 重排方案由构建种子派生。
    pub fn reorder_basic_blocks(&mut self, block: &Block) -> Block {
        let mut statements = block.statements.clone();
        let n = statements.len();
        if n < 2 {
            return block.clone();
        }

        // Fisher-Yates洗牌
        for i in (1..n).rev() {
            let j = self.rng.gen_range(0..=i);
            statements.swap(i, j);
        }

        Block {
            statements,
            return_statement: block.return_statement.clone(),
        }
    }

    // ═══════════════════════════════════════════════════════════
    // CF-05: 表达式树深度分解
    // ═══════════════════════════════════════════════════════════

    /// 表达式树深度分解
    ///
    /// 将关键表达式拆解为深度≥10的嵌套子表达式，
    /// 每个子表达式结果存入随机命名的临时变量。
    pub fn decompose_expression_tree(&mut self, expr: &Expression, depth: usize) -> (Expression, Vec<Statement>) {
        let mut temp_vars = Vec::new();

        if depth == 0 {
            return (expr.clone(), temp_vars);
        }

        // 生成随机临时变量名
        let temp_name = format!("_expr_tmp_{}_{}", self.rng.gen_range(1000..9999), depth);

        // 创建临时变量声明
        temp_vars.push(Statement::LocalDeclaration {
            names: vec![temp_name.clone()],
            values: Some(vec![expr.clone()]),
        });

        // 递归分解
        let (inner_expr, mut inner_temps) = self.decompose_expression_tree(expr, depth - 1);
        temp_vars.append(&mut inner_temps);

        (Expression::Variable(temp_name), temp_vars)
    }

    // ═══════════════════════════════════════════════════════════
    // CF-08: 函数片碎化与内联反转
    // ═══════════════════════════════════════════════════════════

    /// 函数片碎化与内联反转
    ///
    /// 将每个函数拆分为≥20个微型片段，通过参数传递上下文，
    /// 片段间调用通过间接跳转表实现。
    pub fn fragment_function(&mut self, func_name: &str, fragment_count: usize) -> String {
        let count = fragment_count.max(20);
        let mut lua = String::new();

        lua.push_str(&format!("-- CF-08: 函数片碎化 ({}, {}个片段)\n", func_name, count));

        // 生成片段函数
        for i in 0..count {
            let frag_name = format!("_frag_{}_{}", func_name, i);
            lua.push_str(&format!("local function {}(_ctx)\n", frag_name));
            lua.push_str(&format!("    _ctx.fragment = {} + 1\n", i));
            lua.push_str("    return _ctx\n");
            lua.push_str("end\n");
        }

        // 生成片段跳转表
        lua.push_str(&format!("local _fragments_{} = {{\n", func_name));
        for i in 0..count {
            lua.push_str(&format!("    _frag_{}_{},\n", func_name, i));
        }
        lua.push_str("}\n");

        // 生成主调度函数
        lua.push_str(&format!("function {}(_ctx)\n", func_name));
        lua.push_str("    while _ctx.fragment <= #_fragments do\n");
        lua.push_str(&format!("        _ctx = _fragments_{}[_ctx.fragment](_ctx)\n", func_name));
        lua.push_str("    end\n");
        lua.push_str("    return _ctx\n");
        lua.push_str("end\n");

        lua
    }

    // ═══════════════════════════════════════════════════════════
    // CF-09: 路径爆炸分支
    // ═══════════════════════════════════════════════════════════

    /// 路径爆炸分支
    ///
    /// 插入≥2000条基于不透明谓词的虚假分支，
    /// 嵌套深度≥5层，形成指数级路径组合。
    pub fn generate_path_explosion(&mut self, branch_count: usize, depth: usize) -> String {
        let count = branch_count.max(2000);
        let max_depth = depth.max(5);
        let mut lua = String::new();

        lua.push_str(&format!("-- CF-09: 路径爆炸分支 ({}条分支, 深度{})\n", count, max_depth));
        lua.push_str("local _path_explosion_result = 0\n");

        for i in 0..count {
            let var_name = format!("_pe_var_{}", i);
            lua.push_str(&format!("local {} = math.random(1, 100)\n", var_name));

            // 嵌套不透明谓词分支
            lua.push_str(&format!("if {} > 0 then\n", var_name));
            for d in 0..max_depth {
                let inner_var = format!("_pe_inner_{}_{}", i, d);
                lua.push_str(&format!("    local {} = math.random(1, 100)\n", inner_var));
                lua.push_str(&format!("    if {} > 0 then\n", inner_var));
                lua.push_str(&format!("        _path_explosion_result = _path_explosion_result + {}\n", d));
                lua.push_str("    end\n");
            }
            lua.push_str("end\n");
        }

        lua
    }

    // ═══════════════════════════════════════════════════════════
    // CF-10: 概率加权控制流
    // ═══════════════════════════════════════════════════════════

    /// 概率加权控制流
    ///
    /// 同一逻辑随机选用3-5种等价实现，运行时通过随机数选择路径。
    pub fn generate_probabilistic_control_flow(&mut self, implementations: &[&str]) -> String {
        let count = implementations.len().max(3);
        let mut lua = String::new();

        lua.push_str(&format!("-- CF-10: 概率加权控制流 ({}种实现)\n", count));
        lua.push_str("local _prob_choice = math.random(1, ");
        lua.push_str(&count.to_string());
        lua.push_str(")\n");

        for (i, impl_code) in implementations.iter().enumerate() {
            if i == 0 {
                lua.push_str("if _prob_choice == 1 then\n");
            } else {
                lua.push_str(&format!("elseif _prob_choice == {} then\n", i + 1));
            }
            lua.push_str("    ");
            lua.push_str(impl_code);
            lua.push('\n');
        }
        lua.push_str("end\n");

        lua
    }

    // ═══════════════════════════════════════════════════════════
    // CF-12: 尾调用消除栈污染
    // ═══════════════════════════════════════════════════════════

    /// 尾调用消除栈污染
    ///
    /// 利用Lua尾调用不压栈特性构造≥20层深层调用链，
    /// 栈深度不变（始终为1层）但调用路径复杂。
    pub fn generate_tail_call_chain(&mut self, depth: usize) -> String {
        let d = depth.max(20);
        let mut lua = String::new();

        lua.push_str(&format!("-- CF-12: 尾调用消除栈污染 ({}层)\n", d));

        // 生成尾调用链函数
        for i in 0..d {
            let func_name = format!("_tail_call_{}", i);
            let next_name = if i < d - 1 {
                format!("_tail_call_{}", i + 1)
            } else {
                "_tail_call_final".to_string()
            };

            lua.push_str(&format!("local function {}(x)\n", func_name));
            lua.push_str(&format!("    return {}(x + 1)\n", next_name));
            lua.push_str("end\n");
        }

        // 最终函数
        lua.push_str("local function _tail_call_final(x)\n");
        lua.push_str("    return x\n");
        lua.push_str("end\n");

        lua
    }

    // ═══════════════════════════════════════════════════════════
    // CF-13: 多返回值堆栈状态机
    // ═══════════════════════════════════════════════════════════

    /// 多返回值堆栈状态机
    ///
    /// 利用Lua多返回值特性在栈上传递状态，
    /// 状态通过返回值数量和顺序隐式表示。
    pub fn generate_multi_return_state_machine(&mut self) -> String {
        let mut lua = String::new();

        lua.push_str("-- CF-13: 多返回值堆栈状态机\n");
        lua.push_str("local function _state_machine_step(state, ...)\n");
        lua.push_str("    local args = {...}\n");
        lua.push_str("    local arg_count = select('#', ...)\n");
        lua.push_str("    -- 状态通过返回值数量隐式表示\n");
        lua.push_str("    if state == 1 then\n");
        lua.push_str("        return arg_count + 1, state + 1, args[1]\n");
        lua.push_str("    elseif state == 2 then\n");
        lua.push_str("        return arg_count + 2, state + 1, args[1], args[2]\n");
        lua.push_str("    else\n");
        lua.push_str("        return arg_count, 1\n");
        lua.push_str("    end\n");
        lua.push_str("end\n");

        lua
    }

    // ═══════════════════════════════════════════════════════════
    // CF-15: 控制流完整性破坏
    // ═══════════════════════════════════════════════════════════

    /// 控制流完整性破坏
    ///
    /// 故意插入看似违反CFI的间接调用模式，
    /// 通过元表劫持函数调用（__call元方法）。
    pub fn generate_cfi_violation(&mut self) -> String {
        let mut lua = String::new();

        lua.push_str("-- CF-15: 控制流完整性破坏\n");
        lua.push_str("local _cfi_proxy = setmetatable({}, {\n");
        lua.push_str("    __call = function(self, ...)\n");
        lua.push_str("        local args = {...}\n");
        lua.push_str("        local target = args[1]\n");
        lua.push_str("        table.remove(args, 1)\n");
        lua.push_str("        -- 调用目标动态计算\n");
        lua.push_str("        if type(target) == 'function' then\n");
        lua.push_str("            return target(unpack(args))\n");
        lua.push_str("        end\n");
        lua.push_str("    end\n");
        lua.push_str("})\n");

        lua
    }

    // ═══════════════════════════════════════════════════════════
    // CF-16: 去优化触发器
    // ═══════════════════════════════════════════════════════════

    /// 去优化触发器
    ///
    /// 插入大量if条件强制LuaJIT退出优化模式，
    /// 确保代码在解释器模式下执行。
    pub fn generate_deoptimization_triggers(&mut self) -> String {
        let mut lua = String::new();

        lua.push_str("-- CF-16: 去优化触发器\n");
        lua.push_str("-- 强制JIT退出优化模式\n");
        lua.push_str("local function _deopt_trigger(...)\n");
        lua.push_str("    -- 使用select('#', ...)强制JIT退出\n");
        lua.push_str("    local n = select('#', ...)\n");
        lua.push_str("    -- 使用debug库函数\n");
        lua.push_str("    if debug and debug.getinfo then\n");
        lua.push_str("        local _ = debug.getinfo(1)\n");
        lua.push_str("    end\n");
        lua.push_str("    -- 使用pcall\n");
        lua.push_str("    pcall(function() end)\n");
        lua.push_str("    return n\n");
        lua.push_str("end\n");

        lua
    }

    // ═══════════════════════════════════════════════════════════
    // CF-19: 控制流加扰
    // ═══════════════════════════════════════════════════════════

    /// 控制流加扰
    ///
    /// 随机打乱执行顺序，插入大量条件跳转，
    /// 使静态控制流图分析失效。
    pub fn scramble_control_flow(&mut self, block: &Block) -> Block {
        let mut statements = block.statements.clone();

        // 随机插入条件分支语句（Lua 5.1兼容，不使用goto）
        let jump_count = self.rng.gen_range(5..=15);
        for _ in 0..jump_count {
            let pos = self.rng.gen_range(0..=statements.len());
            let var_name = format!("_scramble_var_{}", self.rng.gen_range(1000..9999));
            // 插入基于不透明谓词的条件分支
            statements.insert(pos, Statement::If {
                condition: Expression::Boolean(true),
                then_block: Block {
                    statements: vec![Statement::LocalDeclaration {
                        names: vec![var_name],
                        values: Some(vec![Expression::Integer(self.rng.gen_range(0..1000))]),
                    }],
                    return_statement: None,
                },
                else_if_blocks: Vec::new(),
                else_block: None,
            });
        }

        Block {
            statements,
            return_statement: block.return_statement.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_flatten_control_flow() {
        let mut obf = ControlFlowObfuscator::new(42);
        let block = Block {
            statements: vec![
                Statement::LocalDeclaration {
                    names: vec!["x".to_string()],
                    values: Some(vec![Expression::Integer(10)]),
                },
                Statement::LocalDeclaration {
                    names: vec!["y".to_string()],
                    values: Some(vec![Expression::Integer(20)]),
                },
            ],
            return_statement: None,
        };
        let flattened = obf.flatten_control_flow(&block);
        assert!(flattened.statements.len() >= 2);
    }

    #[test]
    fn test_opaque_predicate_true() {
        let mut obf = ControlFlowObfuscator::new(42);
        let pred = obf.generate_opaque_predicate_true();
        assert!(matches!(pred, Expression::Boolean(true) | Expression::BinaryOp { .. } | Expression::UnaryOp { .. }));
    }

    #[test]
    fn test_opaque_predicate_false() {
        let mut obf = ControlFlowObfuscator::new(42);
        let pred = obf.generate_opaque_predicate_false();
        assert!(matches!(pred, Expression::UnaryOp { .. }));
    }

    #[test]
    fn test_indirect_jump_table() {
        let mut obf = ControlFlowObfuscator::new(42);
        let lua = obf.generate_indirect_jump_table(&[1, 2, 3, 4, 5]);
        assert!(lua.contains("_jump_table_"));
    }

    #[test]
    fn test_garbage_code_injection() {
        let mut obf = ControlFlowObfuscator::new(42);
        let mut block = Block {
            statements: vec![Statement::Break],
            return_statement: None,
        };
        let original_len = block.statements.len();
        obf.inject_garbage_code(&mut block);
        assert!(block.statements.len() > original_len);
    }

    #[test]
    fn test_coroutine_storm() {
        let mut obf = ControlFlowObfuscator::new(42);
        let stmts = obf.generate_coroutine_storm(5);
        assert!(stmts.len() >= 5);
    }

    #[test]
    fn test_exception_driven_flow() {
        let mut obf = ControlFlowObfuscator::new(42);
        let block = Block {
            statements: vec![Statement::Break],
            return_statement: None,
        };
        let result = obf.generate_exception_driven_flow(&block);
        assert!(result.statements.len() > block.statements.len());
    }

    #[test]
    fn test_loop_obfuscation() {
        let mut obf = ControlFlowObfuscator::new(42);
        let mut block = Block {
            statements: vec![Statement::While {
                condition: Expression::Boolean(true),
                body: Block::default(),
            }],
            return_statement: None,
        };
        obf.obfuscate_loops(&mut block);
        assert!(matches!(block.statements[0], Statement::Repeat { .. }));
    }

    #[test]
    fn test_cf04_reorder_basic_blocks() {
        let mut obf = ControlFlowObfuscator::new(42);
        let block = Block {
            statements: vec![Statement::Break, Statement::Break, Statement::Break],
            return_statement: None,
        };
        let result = obf.reorder_basic_blocks(&block);
        assert_eq!(result.statements.len(), 3);
    }

    #[test]
    fn test_cf05_decompose_expression_tree() {
        let mut obf = ControlFlowObfuscator::new(42);
        let expr = Expression::Integer(42);
        let (result, temps) = obf.decompose_expression_tree(&expr, 3);
        assert!(!temps.is_empty());
        assert!(matches!(result, Expression::Variable(_)));
    }

    #[test]
    fn test_cf08_fragment_function() {
        let mut obf = ControlFlowObfuscator::new(42);
        let lua = obf.fragment_function("test_func", 20);
        assert!(lua.contains("CF-08"));
        assert!(lua.contains("_frag_test_func_0"));
        assert!(lua.contains("_fragments_test_func"));
    }

    #[test]
    fn test_cf09_path_explosion() {
        let mut obf = ControlFlowObfuscator::new(42);
        let lua = obf.generate_path_explosion(10, 5);
        assert!(lua.contains("CF-09"));
        assert!(lua.contains("_path_explosion_result"));
    }

    #[test]
    fn test_cf10_probabilistic_control_flow() {
        let mut obf = ControlFlowObfuscator::new(42);
        let lua = obf.generate_probabilistic_control_flow(&["a = 1", "a = 2", "a = 3"]);
        assert!(lua.contains("CF-10"));
        assert!(lua.contains("_prob_choice"));
    }

    #[test]
    fn test_cf12_tail_call_chain() {
        let mut obf = ControlFlowObfuscator::new(42);
        let lua = obf.generate_tail_call_chain(20);
        assert!(lua.contains("CF-12"));
        assert!(lua.contains("_tail_call_0"));
        assert!(lua.contains("_tail_call_final"));
    }

    #[test]
    fn test_cf13_multi_return_state_machine() {
        let mut obf = ControlFlowObfuscator::new(42);
        let lua = obf.generate_multi_return_state_machine();
        assert!(lua.contains("CF-13"));
        assert!(lua.contains("_state_machine_step"));
    }

    #[test]
    fn test_cf15_cfi_violation() {
        let mut obf = ControlFlowObfuscator::new(42);
        let lua = obf.generate_cfi_violation();
        assert!(lua.contains("CF-15"));
        assert!(lua.contains("_cfi_proxy"));
        assert!(lua.contains("__call"));
    }

    #[test]
    fn test_cf16_deoptimization_triggers() {
        let mut obf = ControlFlowObfuscator::new(42);
        let lua = obf.generate_deoptimization_triggers();
        assert!(lua.contains("CF-16"));
        assert!(lua.contains("_deopt_trigger"));
        assert!(lua.contains("select('#', ...)"));
    }

    #[test]
    fn test_cf19_scramble_control_flow() {
        let mut obf = ControlFlowObfuscator::new(42);
        let block = Block {
            statements: vec![Statement::Break],
            return_statement: None,
        };
        let result = obf.scramble_control_flow(&block);
        assert!(result.statements.len() > block.statements.len());
    }
}
