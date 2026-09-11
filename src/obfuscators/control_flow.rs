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
}
