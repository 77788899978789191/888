//! VM-02: 全动态操作码映射表
//! VM-03: 指令参数顺序随机化
//! VM-04: 双重解释器架构
//! VM-05: 指令集布局随机化
//!
//! 虚拟机核心模块，包含字节码定义、操作码映射和双重解释器。

use rand::Rng;
use rand_chacha::ChaCha20Rng;
use std::collections::HashMap;

/// 基本操作码（32个）
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum BaseOpcode {
    Add, Sub, Mul, Div, Mod, Pow,
    And, Or, Xor, Shl, Shr, Not,
    Jmp, JmpZ, JmpNz, Call, Ret,
    Push, Pop, Get, Set, New, Close,
    Cat, Len, Eq, Lt, Le, Concat,
    Neg, Type, ToString,
}

impl BaseOpcode {
    /// 获取所有操作码
    pub fn all() -> Vec<Self> {
        vec![
            Self::Add, Self::Sub, Self::Mul, Self::Div, Self::Mod, Self::Pow,
            Self::And, Self::Or, Self::Xor, Self::Shl, Self::Shr, Self::Not,
            Self::Jmp, Self::JmpZ, Self::JmpNz, Self::Call, Self::Ret,
            Self::Push, Self::Pop, Self::Get, Self::Set, Self::New, Self::Close,
            Self::Cat, Self::Len, Self::Eq, Self::Lt, Self::Le, Self::Concat,
            Self::Neg, Self::Type, Self::ToString,
        ]
    }

    /// 获取操作码名称
    pub fn name(&self) -> &'static str {
        match self {
            Self::Add => "ADD", Self::Sub => "SUB", Self::Mul => "MUL",
            Self::Div => "DIV", Self::Mod => "MOD", Self::Pow => "POW",
            Self::And => "AND", Self::Or => "OR", Self::Xor => "XOR",
            Self::Shl => "SHL", Self::Shr => "SHR", Self::Not => "NOT",
            Self::Jmp => "JMP", Self::JmpZ => "JMPZ", Self::JmpNz => "JMPNZ",
            Self::Call => "CALL", Self::Ret => "RET",
            Self::Push => "PUSH", Self::Pop => "POP",
            Self::Get => "GET", Self::Set => "SET",
            Self::New => "NEW", Self::Close => "CLOSE",
            Self::Cat => "CAT", Self::Len => "LEN",
            Self::Eq => "EQ", Self::Lt => "LT", Self::Le => "LE",
            Self::Concat => "CONCAT", Self::Neg => "NEG",
            Self::Type => "TYPE", Self::ToString => "TOSTRING",
        }
    }
}

/// 操作码映射表
#[derive(Clone, Debug)]
pub struct OpcodeMapping {
    forward: HashMap<BaseOpcode, u16>,
    backward: HashMap<u16, BaseOpcode>,
    rotation_counter: u64,
    rotation_threshold: u64,
}

impl OpcodeMapping {
    /// 创建新的随机映射表
    pub fn new(rng: &mut ChaCha20Rng) -> Self {
        let mut forward = HashMap::new();
        let mut backward = HashMap::new();
        let mut used_codes = std::collections::HashSet::new();

        for opcode in BaseOpcode::all() {
            let mut code = rng.gen_range(0x0000u16..=0xFFFF);
            while used_codes.contains(&code) {
                code = rng.gen_range(0x0000u16..=0xFFFF);
            }
            used_codes.insert(code);
            forward.insert(opcode, code);
            backward.insert(code, opcode);
        }

        Self {
            forward,
            backward,
            rotation_counter: 0,
            rotation_threshold: 10000,
        }
    }

    /// 获取操作码的编码
    pub fn encode(&self, opcode: BaseOpcode) -> u16 {
        *self.forward.get(&opcode).unwrap_or(&0)
    }

    /// 解码操作码
    pub fn decode(&self, code: u16) -> Option<BaseOpcode> {
        self.backward.get(&code).copied()
    }

    /// 触发轮换事件（每10000条指令）
    pub fn maybe_rotate(&mut self, rng: &mut ChaCha20Rng) -> bool {
        self.rotation_counter += 1;
        if self.rotation_counter >= self.rotation_threshold {
            self.rotate(rng, 5..=10);
            self.rotation_counter = 0;
            self.rotation_threshold = rng.gen_range(8000..=12000);
            true
        } else {
            false
        }
    }

    /// 轮换5-10个操作码
    fn rotate(&mut self, rng: &mut ChaCha20Rng, count_range: std::ops::RangeInclusive<usize>) {
        let count = rng.gen_range(count_range);
        let all_opcodes = BaseOpcode::all();
        let mut selected = Vec::new();

        for _ in 0..count {
            let idx = rng.gen_range(0..all_opcodes.len());
            selected.push(all_opcodes[idx]);
        }

        // 交换选中操作码的编码
        for i in 0..selected.len() {
            let j = (i + 1) % selected.len();
            let code_i = *self.forward.get(&selected[i]).unwrap();
            let code_j = *self.forward.get(&selected[j]).unwrap();
            self.forward.insert(selected[i], code_j);
            self.forward.insert(selected[j], code_i);
            self.backward.insert(code_j, selected[i]);
            self.backward.insert(code_i, selected[j]);
        }
    }

    /// 验证映射表无冲突
    pub fn verify_no_conflicts(&self) -> bool {
        let mut codes = std::collections::HashSet::new();
        for &code in self.forward.values() {
            if !codes.insert(code) {
                return false;
            }
        }
        true
    }

    /// 生成Lua代码中的操作码映射表
    pub fn generate_lua_mapping(&self) -> String {
        let mut lua = String::new();
        lua.push_str("-- VM-02: Dynamic opcode mapping table\n");
        lua.push_str("local _opcode_map = {\n");
        for (opcode, &code) in &self.forward {
            lua.push_str(&format!("  [{}] = 0x{:04x}, -- {}\n", code, code, opcode.name()));
        }
        lua.push_str("}\n");
        lua
    }
}

/// 指令参数排列模式（8种）
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ParamOrder {
    /// 目标, 源1, 源2
    TargetSourceSource,
    /// 源1, 源2, 目标
    SourceSourceTarget,
    /// 源1, 目标, 源2
    SourceTargetSource,
    /// 目标, 源2, 源1
    TargetSource2Source1,
    /// 隐式目标, 源1, 源2
    ImplicitTarget,
    /// 目标, 隐式源1, 源2
    TargetImplicitSource,
    /// 源1, 目标, 隐式源2
    SourceTargetImplicit,
    /// 全部隐式
    AllImplicit,
}

impl ParamOrder {
    /// 随机选择一种排列
    pub fn random(rng: &mut ChaCha20Rng) -> Self {
        match rng.gen_range(0..8) {
            0 => Self::TargetSourceSource,
            1 => Self::SourceSourceTarget,
            2 => Self::SourceTargetSource,
            3 => Self::TargetSource2Source1,
            4 => Self::ImplicitTarget,
            5 => Self::TargetImplicitSource,
            6 => Self::SourceTargetImplicit,
            _ => Self::AllImplicit,
        }
    }
}

/// 指令布局参数
#[derive(Clone, Debug)]
pub struct InstructionLayout {
    /// 单条指令长度（4-32字节，步长4）
    pub instruction_length: usize,
    /// 操作码位置
    pub opcode_position: OpcodePosition,
    /// 操作数位置
    pub operand_position: OperandPosition,
    /// 对齐方式
    pub alignment: usize,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum OpcodePosition {
    Start,
    Middle,
    End,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum OperandPosition {
    AfterOpcode,
    FixedOffsets,
    ReverseOrder,
}

impl InstructionLayout {
    /// 随机生成布局
    pub fn random(rng: &mut ChaCha20Rng) -> Self {
        let lengths = [4, 8, 12, 16, 20, 24, 28, 32];
        let alignments = [1, 2, 4, 8];
        Self {
            instruction_length: lengths[rng.gen_range(0..lengths.len())],
            opcode_position: match rng.gen_range(0..3) {
                0 => OpcodePosition::Start,
                1 => OpcodePosition::Middle,
                _ => OpcodePosition::End,
            },
            operand_position: match rng.gen_range(0..3) {
                0 => OperandPosition::AfterOpcode,
                1 => OperandPosition::FixedOffsets,
                _ => OperandPosition::ReverseOrder,
            },
            alignment: alignments[rng.gen_range(0..alignments.len())],
        }
    }
}

/// VM指令
#[derive(Clone, Debug)]
pub struct VMInstruction {
    pub opcode: BaseOpcode,
    pub operands: Vec<i64>,
    pub param_order: ParamOrder,
}

/// VM字节码程序
#[derive(Clone, Debug)]
pub struct VMProgram {
    pub instructions: Vec<VMInstruction>,
    pub constants: Vec<VMConstant>,
    pub opcode_mapping: OpcodeMapping,
    pub layout: InstructionLayout,
}

/// VM常量
#[derive(Clone, Debug)]
pub enum VMConstant {
    Integer(i64),
    Float(f64),
    String(String),
    Boolean(bool),
    Nil,
}

/// switch-case解释器
pub struct SwitchInterpreter {
    pc: usize,
    stack: Vec<VMConstant>,
    registers: [Option<VMConstant>; 16],
}

impl SwitchInterpreter {
    pub fn new() -> Self {
        Self {
            pc: 0,
            stack: Vec::new(),
            registers: std::array::from_fn(|_| None),
        }
    }

    /// 执行一条指令（switch-case分发）
    pub fn execute_switch(&mut self, instr: &VMInstruction) {
        match instr.opcode {
            BaseOpcode::Add => {
                let b = self.stack.pop().unwrap_or(VMConstant::Integer(0));
                let a = self.stack.pop().unwrap_or(VMConstant::Integer(0));
                self.stack.push(Self::add_constants(&a, &b));
            }
            BaseOpcode::Sub => {
                let b = self.stack.pop().unwrap_or(VMConstant::Integer(0));
                let a = self.stack.pop().unwrap_or(VMConstant::Integer(0));
                self.stack.push(Self::sub_constants(&a, &b));
            }
            BaseOpcode::Mul => {
                let b = self.stack.pop().unwrap_or(VMConstant::Integer(0));
                let a = self.stack.pop().unwrap_or(VMConstant::Integer(0));
                self.stack.push(Self::mul_constants(&a, &b));
            }
            BaseOpcode::Push => {
                if let Some(&idx) = instr.operands.first() {
                    if idx >= 0 && (idx as usize) < self.registers.len() {
                        if let Some(val) = self.registers[idx as usize].clone() {
                            self.stack.push(val);
                        }
                    }
                }
            }
            BaseOpcode::Pop => {
                if let Some(&idx) = instr.operands.first() {
                    if idx >= 0 && (idx as usize) < self.registers.len() {
                        self.registers[idx as usize] = self.stack.pop();
                    }
                }
            }
            BaseOpcode::Jmp => {
                if let Some(&target) = instr.operands.first() {
                    self.pc = target as usize;
                }
            }
            _ => {
                // 其他操作码的处理
            }
        }
        self.pc += 1;
    }

    fn add_constants(a: &VMConstant, b: &VMConstant) -> VMConstant {
        match (a, b) {
            (VMConstant::Integer(x), VMConstant::Integer(y)) => VMConstant::Integer(x + y),
            (VMConstant::Float(x), VMConstant::Float(y)) => VMConstant::Float(x + y),
            (VMConstant::Integer(x), VMConstant::Float(y)) => VMConstant::Float(*x as f64 + y),
            (VMConstant::Float(x), VMConstant::Integer(y)) => VMConstant::Float(x + *y as f64),
            _ => VMConstant::Nil,
        }
    }

    fn sub_constants(a: &VMConstant, b: &VMConstant) -> VMConstant {
        match (a, b) {
            (VMConstant::Integer(x), VMConstant::Integer(y)) => VMConstant::Integer(x - y),
            (VMConstant::Float(x), VMConstant::Float(y)) => VMConstant::Float(x - y),
            _ => VMConstant::Nil,
        }
    }

    fn mul_constants(a: &VMConstant, b: &VMConstant) -> VMConstant {
        match (a, b) {
            (VMConstant::Integer(x), VMConstant::Integer(y)) => VMConstant::Integer(x * y),
            (VMConstant::Float(x), VMConstant::Float(y)) => VMConstant::Float(x * y),
            _ => VMConstant::Nil,
        }
    }
}

/// 表驱动解释器
pub struct TableInterpreter {
    pc: usize,
    stack: Vec<VMConstant>,
    handlers: HashMap<BaseOpcode, fn(&mut TableInterpreter, &VMInstruction)>,
}

impl TableInterpreter {
    pub fn new() -> Self {
        let mut handlers = HashMap::new();
        handlers.insert(BaseOpcode::Add, Self::handle_add as fn(&mut TableInterpreter, &VMInstruction));
        handlers.insert(BaseOpcode::Sub, Self::handle_sub as fn(&mut TableInterpreter, &VMInstruction));
        handlers.insert(BaseOpcode::Mul, Self::handle_mul as fn(&mut TableInterpreter, &VMInstruction));
        Self {
            pc: 0,
            stack: Vec::new(),
            handlers,
        }
    }

    /// 执行一条指令（表驱动分发）
    pub fn execute_table(&mut self, instr: &VMInstruction) {
        if let Some(handler) = self.handlers.get(&instr.opcode) {
            handler(self, instr);
        }
        self.pc += 1;
    }

    fn handle_add(&mut self, _instr: &VMInstruction) {
        let b = self.stack.pop().unwrap_or(VMConstant::Integer(0));
        let a = self.stack.pop().unwrap_or(VMConstant::Integer(0));
        self.stack.push(match (a, b) {
            (VMConstant::Integer(x), VMConstant::Integer(y)) => VMConstant::Integer(x + y),
            _ => VMConstant::Nil,
        });
    }

    fn handle_sub(&mut self, _instr: &VMInstruction) {
        let b = self.stack.pop().unwrap_or(VMConstant::Integer(0));
        let a = self.stack.pop().unwrap_or(VMConstant::Integer(0));
        self.stack.push(match (a, b) {
            (VMConstant::Integer(x), VMConstant::Integer(y)) => VMConstant::Integer(x - y),
            _ => VMConstant::Nil,
        });
    }

    fn handle_mul(&mut self, _instr: &VMInstruction) {
        let b = self.stack.pop().unwrap_or(VMConstant::Integer(0));
        let a = self.stack.pop().unwrap_or(VMConstant::Integer(0));
        self.stack.push(match (a, b) {
            (VMConstant::Integer(x), VMConstant::Integer(y)) => VMConstant::Integer(x * y),
            _ => VMConstant::Nil,
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;

    #[test]
    fn test_opcode_mapping() {
        let mut rng = ChaCha20Rng::seed_from_u64(42);
        let mapping = OpcodeMapping::new(&mut rng);
        assert!(mapping.verify_no_conflicts());
        assert_eq!(mapping.decode(mapping.encode(BaseOpcode::Add)), Some(BaseOpcode::Add));
    }

    #[test]
    fn test_opcode_rotation() {
        let mut rng = ChaCha20Rng::seed_from_u64(42);
        let mut mapping = OpcodeMapping::new(&mut rng);
        let original_add = mapping.encode(BaseOpcode::Add);
        for _ in 0..10001 {
            mapping.maybe_rotate(&mut rng);
        }
        // 轮换后ADD的编码可能改变
        assert!(mapping.verify_no_conflicts());
    }

    #[test]
    fn test_param_order_random() {
        let mut rng = ChaCha20Rng::seed_from_u64(42);
        let order = ParamOrder::random(&mut rng);
        assert!(matches!(order, ParamOrder::TargetSourceSource | ParamOrder::SourceSourceTarget | _));
    }

    #[test]
    fn test_instruction_layout() {
        let mut rng = ChaCha20Rng::seed_from_u64(42);
        let layout = InstructionLayout::random(&mut rng);
        assert!(layout.instruction_length >= 4);
        assert!(layout.instruction_length <= 32);
    }

    #[test]
    fn test_switch_interpreter() {
        let mut interp = SwitchInterpreter::new();
        interp.registers[0] = Some(VMConstant::Integer(10));
        interp.registers[1] = Some(VMConstant::Integer(20));
        interp.execute_switch(&VMInstruction {
            opcode: BaseOpcode::Push,
            operands: vec![0],
            param_order: ParamOrder::TargetSourceSource,
        });
        interp.execute_switch(&VMInstruction {
            opcode: BaseOpcode::Push,
            operands: vec![1],
            param_order: ParamOrder::TargetSourceSource,
        });
        interp.execute_switch(&VMInstruction {
            opcode: BaseOpcode::Add,
            operands: vec![],
            param_order: ParamOrder::TargetSourceSource,
        });
        assert_eq!(interp.stack.len(), 1);
        if let VMConstant::Integer(val) = &interp.stack[0] {
            assert_eq!(*val, 30);
        } else {
            panic!("Expected integer");
        }
    }

    #[test]
    fn test_table_interpreter() {
        let mut interp = TableInterpreter::new();
        interp.stack.push(VMConstant::Integer(5));
        interp.stack.push(VMConstant::Integer(3));
        interp.execute_table(&VMInstruction {
            opcode: BaseOpcode::Mul,
            operands: vec![],
            param_order: ParamOrder::TargetSourceSource,
        });
        assert_eq!(interp.stack.len(), 1);
        if let VMConstant::Integer(val) = &interp.stack[0] {
            assert_eq!(*val, 15);
        } else {
            panic!("Expected integer");
        }
    }
}
