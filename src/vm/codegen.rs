//! VM代码生成器
//!
//! 将Lua AST编译为VM字节码，并生成可执行的Lua VM解释器代码。

use super::core::*;
use super::polymorphism::*;
use crate::lua::ast::*;
use rand::Rng;
use rand_chacha::ChaCha20Rng;
use rand::SeedableRng;

/// VM代码生成器
pub struct VMCodeGenerator {
    rng: ChaCha20Rng,
    opcode_mapping: OpcodeMapping,
    layout: InstructionLayout,
    data_structure: VMDataStructure,
    diversification: VMDiversification,
}

impl VMCodeGenerator {
    /// 创建新的代码生成器
    pub fn new(seed: u64) -> Self {
        let mut rng = ChaCha20Rng::seed_from_u64(seed);
        let opcode_mapping = OpcodeMapping::new(&mut rng);
        let layout = InstructionLayout::random(&mut rng);
        let data_structure = VMDataStructure::random(&mut rng);
        let diversification = VMDiversification::random(&mut rng, 32);

        Self {
            rng,
            opcode_mapping,
            layout,
            data_structure,
            diversification,
        }
    }

    /// 将Lua表达式编译为VM指令
    pub fn compile_expression(&mut self, expr: &Expression) -> Vec<VMInstruction> {
        let mut instructions = Vec::new();
        self.compile_expression_inner(expr, &mut instructions);
        instructions
    }

    fn compile_expression_inner(&mut self, expr: &Expression, instructions: &mut Vec<VMInstruction>) {
        match expr {
            Expression::Integer(n) => {
                instructions.push(VMInstruction {
                    opcode: BaseOpcode::Push,
                    operands: vec![*n],
                    param_order: ParamOrder::random(&mut self.rng),
                });
            }
            Expression::Float(n) => {
                instructions.push(VMInstruction {
                    opcode: BaseOpcode::Push,
                    operands: vec![*n as i64],
                    param_order: ParamOrder::random(&mut self.rng),
                });
            }
            Expression::String(s) => {
                // 字符串常量先存入常量池，然后压栈
                let hash = s.as_bytes().iter().map(|b| *b as i64).sum::<i64>();
                instructions.push(VMInstruction {
                    opcode: BaseOpcode::Push,
                    operands: vec![hash],
                    param_order: ParamOrder::random(&mut self.rng),
                });
            }
            Expression::Boolean(b) => {
                instructions.push(VMInstruction {
                    opcode: BaseOpcode::Push,
                    operands: vec![if *b { 1 } else { 0 }],
                    param_order: ParamOrder::random(&mut self.rng),
                });
            }
            Expression::Nil => {
                instructions.push(VMInstruction {
                    opcode: BaseOpcode::Push,
                    operands: vec![0],
                    param_order: ParamOrder::random(&mut self.rng),
                });
            }
            Expression::Variable(name) => {
                let reg = self.rng.gen_range(0..16);
                instructions.push(VMInstruction {
                    opcode: BaseOpcode::Get,
                    operands: vec![reg, name.len() as i64],
                    param_order: ParamOrder::random(&mut self.rng),
                });
            }
            Expression::BinaryOp { op, left, right } => {
                self.compile_expression_inner(left, instructions);
                self.compile_expression_inner(right, instructions);
                let vm_op = match op {
                    BinaryOperator::Add => BaseOpcode::Add,
                    BinaryOperator::Sub => BaseOpcode::Sub,
                    BinaryOperator::Mul => BaseOpcode::Mul,
                    BinaryOperator::Div => BaseOpcode::Div,
                    BinaryOperator::Mod => BaseOpcode::Mod,
                    BinaryOperator::Pow => BaseOpcode::Pow,
                    BinaryOperator::Concat => BaseOpcode::Concat,
                    BinaryOperator::Equal => BaseOpcode::Eq,
                    BinaryOperator::Less => BaseOpcode::Lt,
                    BinaryOperator::LessEqual => BaseOpcode::Le,
                    BinaryOperator::Greater => BaseOpcode::Lt, // 简化处理
                    BinaryOperator::GreaterEqual => BaseOpcode::Le, // 简化处理
                    BinaryOperator::And => BaseOpcode::And,
                    BinaryOperator::Or => BaseOpcode::Or,
                    BinaryOperator::NotEqual => BaseOpcode::Eq, // 简化处理
                };
                instructions.push(VMInstruction {
                    opcode: vm_op,
                    operands: vec![],
                    param_order: ParamOrder::random(&mut self.rng),
                });
            }
            Expression::UnaryOp { op, operand } => {
                self.compile_expression_inner(operand, instructions);
                let vm_op = match op {
                    UnaryOperator::Neg => BaseOpcode::Neg,
                    UnaryOperator::Not => BaseOpcode::Not,
                    UnaryOperator::Len => BaseOpcode::Len,
                };
                instructions.push(VMInstruction {
                    opcode: vm_op,
                    operands: vec![],
                    param_order: ParamOrder::random(&mut self.rng),
                });
            }
            Expression::FunctionCall(call) => {
                // 编译参数
                for arg in &call.args {
                    self.compile_expression_inner(arg, instructions);
                }
                instructions.push(VMInstruction {
                    opcode: BaseOpcode::Call,
                    operands: vec![call.args.len() as i64],
                    param_order: ParamOrder::random(&mut self.rng),
                });
            }
            _ => {
                // 其他表达式类型简化处理
                instructions.push(VMInstruction {
                    opcode: BaseOpcode::Push,
                    operands: vec![0],
                    param_order: ParamOrder::random(&mut self.rng),
                });
            }
        }
    }

    /// 将Lua语句编译为VM指令
    pub fn compile_statement(&mut self, stmt: &Statement) -> Vec<VMInstruction> {
        let mut instructions = Vec::new();
        match stmt {
            Statement::LocalDeclaration { names, values } => {
                if let Some(vals) = values {
                    for val in vals {
                        self.compile_expression_inner(val, &mut instructions);
                    }
                }
                for (i, _name) in names.iter().enumerate() {
                    instructions.push(VMInstruction {
                        opcode: BaseOpcode::Pop,
                        operands: vec![i as i64],
                        param_order: ParamOrder::random(&mut self.rng),
                    });
                }
            }
            Statement::Assignment { targets, values } => {
                for val in values {
                    self.compile_expression_inner(val, &mut instructions);
                }
                for (i, _target) in targets.iter().enumerate() {
                    instructions.push(VMInstruction {
                        opcode: BaseOpcode::Set,
                        operands: vec![i as i64],
                        param_order: ParamOrder::random(&mut self.rng),
                    });
                }
            }
            Statement::If { condition, then_block, else_if_blocks, else_block } => {
                self.compile_expression_inner(condition, &mut instructions);
                let then_start = instructions.len();
                instructions.push(VMInstruction {
                    opcode: BaseOpcode::JmpZ,
                    operands: vec![0], // 占位符，后面回填
                    param_order: ParamOrder::random(&mut self.rng),
                });
                // 编译then块
                for stmt in &then_block.statements {
                    instructions.extend(self.compile_statement(stmt));
                }
                let jmp_pos = instructions.len();
                instructions.push(VMInstruction {
                    opcode: BaseOpcode::Jmp,
                    operands: vec![0], // 占位符
                    param_order: ParamOrder::random(&mut self.rng),
                });
                // 回填JmpZ目标
                let else_start = instructions.len();
                instructions[then_start].operands[0] = else_start as i64;

                // 编译elseif和else块
                for (cond, block) in else_if_blocks {
                    self.compile_expression_inner(cond, &mut instructions);
                    let jmpz_pos = instructions.len();
                    instructions.push(VMInstruction {
                        opcode: BaseOpcode::JmpZ,
                        operands: vec![0],
                        param_order: ParamOrder::random(&mut self.rng),
                    });
                    for stmt in &block.statements {
                        instructions.extend(self.compile_statement(stmt));
                    }
                    let next_jmp = instructions.len();
                    instructions.push(VMInstruction {
                        opcode: BaseOpcode::Jmp,
                        operands: vec![0],
                        param_order: ParamOrder::random(&mut self.rng),
                    });
                    let target = instructions.len();
                    instructions[jmpz_pos].operands[0] = target as i64;
                    instructions[jmp_pos].operands[0] = target as i64;
                }

                if let Some(block) = else_block {
                    for stmt in &block.statements {
                        instructions.extend(self.compile_statement(stmt));
                    }
                }
                let end_pos = instructions.len();
                instructions[jmp_pos].operands[0] = end_pos as i64;
            }
            Statement::While { condition, body } => {
                let loop_start = instructions.len();
                self.compile_expression_inner(condition, &mut instructions);
                let jmpz_pos = instructions.len();
                instructions.push(VMInstruction {
                    opcode: BaseOpcode::JmpZ,
                    operands: vec![0],
                    param_order: ParamOrder::random(&mut self.rng),
                });
                for stmt in &body.statements {
                    instructions.extend(self.compile_statement(stmt));
                }
                instructions.push(VMInstruction {
                    opcode: BaseOpcode::Jmp,
                    operands: vec![loop_start as i64],
                    param_order: ParamOrder::random(&mut self.rng),
                });
                let end_pos = instructions.len();
                instructions[jmpz_pos].operands[0] = end_pos as i64;
            }
            Statement::FunctionCall(call) => {
                for arg in &call.args {
                    self.compile_expression_inner(arg, &mut instructions);
                }
                instructions.push(VMInstruction {
                    opcode: BaseOpcode::Call,
                    operands: vec![call.args.len() as i64],
                    param_order: ParamOrder::random(&mut self.rng),
                });
            }
            Statement::Return(exprs) => {
                for expr in exprs {
                    self.compile_expression_inner(expr, &mut instructions);
                }
                instructions.push(VMInstruction {
                    opcode: BaseOpcode::Ret,
                    operands: vec![exprs.len() as i64],
                    param_order: ParamOrder::random(&mut self.rng),
                });
            }
            _ => {
                // 其他语句类型简化处理
            }
        }
        instructions
    }

    /// 将Lua块编译为VM程序
    pub fn compile_block(&mut self, block: &Block) -> VMProgram {
        let mut instructions = Vec::new();
        for stmt in &block.statements {
            instructions.extend(self.compile_statement(stmt));
        }
        if let Some(ret) = &block.return_statement {
            for expr in ret {
                self.compile_expression_inner(expr, &mut instructions);
            }
            instructions.push(VMInstruction {
                opcode: BaseOpcode::Ret,
                operands: vec![ret.len() as i64],
                param_order: ParamOrder::random(&mut self.rng),
            });
        }

        VMProgram {
            instructions,
            constants: Vec::new(),
            opcode_mapping: self.opcode_mapping.clone(),
            layout: self.layout.clone(),
        }
    }

    /// 生成Lua VM解释器代码
    pub fn generate_vm_interpreter_lua(&self) -> String {
        let mut lua = String::new();

        lua.push_str("-- Gungnir VM Interpreter (Dual architecture)\n");
        lua.push_str("-- VM-04: Dual interpreter architecture\n\n");

        // 操作码映射表
        lua.push_str(&self.opcode_mapping.generate_lua_mapping());
        lua.push('\n');

        // switch-case解释器
        lua.push_str("-- Switch-case interpreter\n");
        lua.push_str("local function _run_switch(bytecode)\n");
        lua.push_str("  local pc = 1\n");
        lua.push_str("  local stack = {}\n");
        lua.push_str("  local top = 0\n");
        lua.push_str("  local registers = {}\n");
        lua.push_str("  while pc <= #bytecode do\n");
        lua.push_str("    local instr = bytecode[pc]\n");
        lua.push_str("    local op = instr.opcode\n");
        lua.push_str("    if op == _opcode_map.ADD then\n");
        lua.push_str("      local b = stack[top]; top = top - 1\n");
        lua.push_str("      local a = stack[top]; top = top - 1\n");
        lua.push_str("      top = top + 1; stack[top] = a + b\n");
        lua.push_str("    elseif op == _opcode_map.SUB then\n");
        lua.push_str("      local b = stack[top]; top = top - 1\n");
        lua.push_str("      local a = stack[top]; top = top - 1\n");
        lua.push_str("      top = top + 1; stack[top] = a - b\n");
        lua.push_str("    elseif op == _opcode_map.MUL then\n");
        lua.push_str("      local b = stack[top]; top = top - 1\n");
        lua.push_str("      local a = stack[top]; top = top - 1\n");
        lua.push_str("      top = top + 1; stack[top] = a * b\n");
        lua.push_str("    elseif op == _opcode_map.PUSH then\n");
        lua.push_str("      top = top + 1; stack[top] = instr.operands[1]\n");
        lua.push_str("    elseif op == _opcode_map.POP then\n");
        lua.push_str("      registers[instr.operands[1]] = stack[top]; top = top - 1\n");
        lua.push_str("    elseif op == _opcode_map.JMP then\n");
        lua.push_str("      pc = instr.operands[1]\n");
        lua.push_str("    elseif op == _opcode_map.JMPZ then\n");
        lua.push_str("      if stack[top] == 0 or stack[top] == nil then\n");
        lua.push_str("        pc = instr.operands[1]\n");
        lua.push_str("      end\n");
        lua.push_str("      top = top - 1\n");
        lua.push_str("    elseif op == _opcode_map.CALL then\n");
        lua.push_str("      -- function call handling\n");
        lua.push_str("    elseif op == _opcode_map.RET then\n");
        lua.push_str("      return stack[top]\n");
        lua.push_str("    end\n");
        lua.push_str("    pc = pc + 1\n");
        lua.push_str("  end\n");
        lua.push_str("end\n\n");

        // 表驱动解释器
        lua.push_str("-- Table-driven interpreter\n");
        lua.push_str("local _handlers = {}\n");
        lua.push_str("_handlers[_opcode_map.ADD] = function(stack, top, instr)\n");
        lua.push_str("  local b = stack[top]; top = top - 1\n");
        lua.push_str("  local a = stack[top]; top = top - 1\n");
        lua.push_str("  top = top + 1; stack[top] = a + b\n");
        lua.push_str("  return top\n");
        lua.push_str("end\n");
        lua.push_str("_handlers[_opcode_map.SUB] = function(stack, top, instr)\n");
        lua.push_str("  local b = stack[top]; top = top - 1\n");
        lua.push_str("  local a = stack[top]; top = top - 1\n");
        lua.push_str("  top = top + 1; stack[top] = a - b\n");
        lua.push_str("  return top\n");
        lua.push_str("end\n");
        lua.push_str("_handlers[_opcode_map.MUL] = function(stack, top, instr)\n");
        lua.push_str("  local b = stack[top]; top = top - 1\n");
        lua.push_str("  local a = stack[top]; top = top - 1\n");
        lua.push_str("  top = top + 1; stack[top] = a * b\n");
        lua.push_str("  return top\n");
        lua.push_str("end\n\n");

        lua.push_str("local function _run_table(bytecode)\n");
        lua.push_str("  local pc = 1\n");
        lua.push_str("  local stack = {}\n");
        lua.push_str("  local top = 0\n");
        lua.push_str("  while pc <= #bytecode do\n");
        lua.push_str("    local instr = bytecode[pc]\n");
        lua.push_str("    local handler = _handlers[instr.opcode]\n");
        lua.push_str("    if handler then\n");
        lua.push_str("      top = handler(stack, top, instr)\n");
        lua.push_str("    end\n");
        lua.push_str("    pc = pc + 1\n");
        lua.push_str("  end\n");
        lua.push_str("end\n\n");

        // VM-04: 随机选择解释器
        lua.push_str("-- VM-04: Random interpreter selection\n");
        lua.push_str("local function _run_vm(bytecode)\n");
        lua.push_str("  if math.random() < 0.5 then\n");
        lua.push_str("    return _run_switch(bytecode)\n");
        lua.push_str("  else\n");
        lua.push_str("    return _run_table(bytecode)\n");
        lua.push_str("  end\n");
        lua.push_str("end\n");

        lua
    }

    /// 获取操作码映射
    pub fn opcode_mapping(&self) -> &OpcodeMapping {
        &self.opcode_mapping
    }

    /// 获取布局
    pub fn layout(&self) -> &InstructionLayout {
        &self.layout
    }

    /// 获取数据结构
    pub fn data_structure(&self) -> &VMDataStructure {
        &self.data_structure
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generator_creation() {
        let gen = VMCodeGenerator::new(42);
        assert!(gen.opcode_mapping().verify_no_conflicts());
    }

    #[test]
    fn test_compile_simple_expression() {
        let mut gen = VMCodeGenerator::new(42);
        let expr = Expression::BinaryOp {
            op: BinaryOperator::Add,
            left: Box::new(Expression::Integer(1)),
            right: Box::new(Expression::Integer(2)),
        };
        let instructions = gen.compile_expression(&expr);
        assert_eq!(instructions.len(), 3); // PUSH, PUSH, ADD
    }

    #[test]
    fn test_compile_assignment() {
        let mut gen = VMCodeGenerator::new(42);
        let stmt = Statement::LocalDeclaration {
            names: vec!["x".to_string()],
            values: Some(vec![Expression::Integer(10)]),
        };
        let instructions = gen.compile_statement(&stmt);
        assert!(instructions.len() >= 2); // PUSH, POP
    }

    #[test]
    fn test_compile_while() {
        let mut gen = VMCodeGenerator::new(42);
        let stmt = Statement::While {
            condition: Expression::Boolean(true),
            body: Block {
                statements: vec![Statement::Break],
                return_statement: None,
            },
        };
        let instructions = gen.compile_statement(&stmt);
        assert!(instructions.len() >= 3);
    }

    #[test]
    fn test_generate_vm_interpreter() {
        let gen = VMCodeGenerator::new(42);
        let lua = gen.generate_vm_interpreter_lua();
        assert!(lua.contains("_run_switch"));
        assert!(lua.contains("_run_table"));
        assert!(lua.contains("_opcode_map"));
    }

    #[test]
    fn test_compile_block() {
        let mut gen = VMCodeGenerator::new(42);
        let block = Block {
            statements: vec![
                Statement::LocalDeclaration {
                    names: vec!["x".to_string()],
                    values: Some(vec![Expression::Integer(10)]),
                },
            ],
            return_statement: None,
        };
        let program = gen.compile_block(&block);
        assert!(!program.instructions.is_empty());
    }
}
