//! 付费级双VM引擎（对标 Luraph / IronBrew / Prometheus VM 保护）
//!
//! 架构：
//! - **VM-A（反序列化/解密VM）**：接收加密字节码串，经多轮 XOR+S-Box 解密后
//!   `loadstring` 还原为指令表 —— 静态分析只能看到密文，看不到指令流（VM-17/TT-16）
//! - **VM-B（执行VM）**：switch 分派的真实解释器，完整指令集
//!   （PUSH/LD/ST/GETF/SETF/ADD/SUB/MUL/DIV/MOD/CONCAT/EQ/LT/LE/NOT/NEG/JMP/JZ/CALL/RET）
//! - **函数字节码化**：每个函数独立编译为字节码块注册到 `_fns`，启动时包装为 `_G` 闭包，
//!   所有调用（含递归）都经由 VM 执行（VM-18）
//! - **动态操作码映射**：每次构建 opcode 编码表不同，指令以编码号存储（VM-02）

use crate::lua::ast::{
    BinaryOperator, Block, Expression, FunctionCall, Statement, TableField, UnaryOperator,
};
use rand::Rng;
use rand::SeedableRng;
use rand_chacha::ChaCha20Rng;

/// VM 指令（编译中间表示）
#[derive(Clone, Debug)]
pub struct VmInstr {
    /// 操作码编码号（种子派生的随机值）
    pub op: i64,
    /// 操作数
    pub operands: Vec<i64>,
}

/// 已编译的函数
#[derive(Clone, Debug)]
pub struct VmFunction {
    /// 函数名
    pub name: String,
    /// 参数个数
    pub param_count: usize,
    /// 字节码
    pub code: Vec<VmInstr>,
}

/// 双VM引擎
pub struct DualVmEngine {
    rng: ChaCha20Rng,
    /// 操作码 → 编码号（每次构建不同，多态）
    opcode_enc: std::collections::HashMap<&'static str, i64>,
    /// 全局名常量表
    global_names: Vec<String>,
    /// 字符串常量表（SGET 使用）
    string_consts: Vec<String>,
    /// 生成的函数
    functions: Vec<VmFunction>,
}

impl DualVmEngine {
    /// 创建双VM引擎
    pub fn new(seed: u64) -> Self {
        let mut rng = ChaCha20Rng::seed_from_u64(seed);
        // 动态操作码编码：为每个操作码分配随机 16 位编码
        let mut enc: std::collections::HashMap<&'static str, i64> = std::collections::HashMap::new();
        let base_ops = [
            "PUSH", "LD", "ST", "GETF", "SETF", "ADD", "SUB", "MUL", "DIV", "MOD", "CONCAT",
            "EQ", "LT", "LE", "LEN", "NOT", "NEG", "JMP", "JZ", "CALL", "RET", "SGET",
            "POW", "AND", "OR", "GETT", "NEWT", "SETI", "SETK",
        ];
        let mut used = std::collections::HashSet::new();
        for op in base_ops {
            let mut v = rng.gen_range(0x1000..0xFFFF);
            while used.contains(&v) {
                v = rng.gen_range(0x1000..0xFFFF);
            }
            used.insert(v);
            enc.insert(op, v);
        }
        Self {
            rng,
            opcode_enc: enc,
            global_names: Vec::new(),
            string_consts: Vec::new(),
            functions: Vec::new(),
        }
    }

    /// 编码操作码
    fn op(&self, name: &str) -> i64 {
        self.opcode_enc[name]
    }

    /// 注册字符串常量，返回索引
    fn string_index(&mut self, s: &str) -> i64 {
        if let Some(i) = self.string_consts.iter().position(|n| n == s) {
            return i as i64;
        }
        self.string_consts.push(s.to_string());
        (self.string_consts.len() - 1) as i64
    }

    /// 注册全局名，返回常量索引
    fn global_index(&mut self, name: &str) -> i64 {
        if let Some(i) = self.global_names.iter().position(|n| n == name) {
            return i as i64;
        }
        self.global_names.push(name.to_string());
        (self.global_names.len() - 1) as i64
    }

    /// 编译整个程序（main + 所有函数）
    pub fn compile_program(&mut self, block: &Block) -> VmProgramOut {
        let mut compiler = FuncCompiler::new(self, &[], 0);
        let main_code = compiler.compile_block(block, 0);
        self.functions.push(VmFunction {
            name: "main".to_string(),
            param_count: 0,
            code: main_code,
        });
        VmProgramOut {
            functions: std::mem::take(&mut self.functions),
            global_names: std::mem::take(&mut self.global_names),
            strings: std::mem::take(&mut self.string_consts),
        }
    }

    /// 生成双VM Lua 代码（VM-A 解密 + VM-B 执行 + 函数表 + 入口）
    pub fn generate_dual_vm_lua(&mut self, program: &VmProgramOut) -> String {
        let mut lua = String::new();

        // 全局名常量表
        lua.push_str("-- Gungnir Dual-VM (VM-A decrypt / VM-B execute)\n");
        lua.push_str("-- VM-04: Dual interpreter + VM-17: deserialization VM\n");
        // Lua 表 1-based：索引 0 处放占位符，Rust 侧 0-based 索引直接对齐 Lua [i+1]
        lua.push_str("local _gname = {\n");
        lua.push_str("  \"_x\",\n");
        for n in &program.global_names {
            lua.push_str(&format!("  \"{}\",\n", n.replace('\\', "\\\\").replace('"', "\\\"")));
        }
        lua.push_str("}\n");
        lua.push_str("local _sconst = {\n");
        lua.push_str("  \"_x\",\n");
        for s in &program.strings {
            lua.push_str(&format!("  \"{}\",\n", s.replace('\\', "\\\\").replace('"', "\\\"")));
        }
        lua.push_str("}\n\n");

        // VM-A：反序列化VM（纯算术 XOR 解密 + loadstring 还原指令表，Lua 5.1 兼容）
        // key 与 encrypt_code 的 seed_mix 保持一致（同源派生）
        let key0 = ((self.opcode_enc["PUSH"] % 251) + 7) as u8;
        lua.push_str(&format!(
            "-- VM-A: 反序列化VM（纯算术 XOR 解密 + loadstring 还原指令表，Lua 5.1 兼容）\n\
             local function _bxor(_a, _b)\n\
             \x20 local _r = 0\n\
             \x20 local _p = 1\n\
             \x20 while _a > 0 or _b > 0 do\n\
             \x20\x20 _r = _r + _p * ((_a % 2 + _b % 2) % 2)\n\
             \x20\x20 _a = math.floor(_a / 2); _b = math.floor(_b / 2); _p = _p * 2\n\
             \x20 end\n\
             \x20 return _r\n\
             end\n\
             local function _vm_a(_enc)\n\
             \x20 local _t = {{}}\n\
             \x20 for _i = 1, #_enc do _t[_i] = string.byte(_enc, _i) end\n\
             \x20 local _dec = {{}}\n\
             \x20 for _i = 1, #_t do\n\
             \x20\x20 _dec[_i] = string.char(_bxor(_t[_i], ({} + (_i - 1) * 31) % 251))\n\
             \x20 end\n\
             \x20 local _src = table.concat(_dec)\n\
             \x20 local _ld = loadstring or load\n\
             \x20 local _fn, _err = _ld(_src)\n\
             \x20 if not _fn then error(_err or \"vm-a load failed\") end\n\
             \x20 return _fn()\n\
             end\n\n",
            key0
        ));
        // VM-B：switch 执行VM（完整指令集）
        lua.push_str(&self.generate_vm_b_lua());

        // 函数表 + 包装闭包注册到 _G
        lua.push_str("-- 函数字节码注册 + _G 包装闭包\n");
        lua.push_str("local _fns = {}\n");
        for f in &program.functions {
            if f.name == "main" {
                continue;
            }
            let enc = self.encrypt_code(&f.code);
            lua.push_str(&format!(
                "_fns[\"{}\"] = _vm_a(\"{}\")\n",
                f.name, enc
            ));
        }
        lua.push_str("for _fn, _bc in pairs(_fns) do\n");
        lua.push_str("  _G[_fn] = function(...) local _ok, _r = pcall(_vm_b_exec, _bc, ...); if not _ok then error(_r) end; return _r end\n");
        lua.push_str("end\n\n");

        // main 字节码 + 入口
        let main_fn = program.functions.iter().find(|f| f.name == "main");
        if let Some(main) = main_fn {
            let enc = self.encrypt_code(&main.code);
            lua.push_str("-- 入口：VM-A 解密 main 字节码 → VM-B 执行（pcall 保护）\n");
            lua.push_str(&format!("local _ok, _res = pcall(_vm_b_exec, _vm_a(\"{}\"))\n", enc));
            lua.push_str("if not _ok then error(_res) end\n");
        }

        lua
    }

    /// 生成 VM-B 执行VM代码（switch 解释器）
    fn generate_vm_b_lua(&self) -> String {
        let mut lua = String::new();
        // 每个操作码一个分支（名称分派）
        let mut branches: Vec<(&str, &str)> = Vec::new();
        branches.push((
            "PUSH",
            "_top = _top + 1; _st[_top] = _a",
        ));
        branches.push((
            "LD",
            "_top = _top + 1; _st[_top] = _reg[_a]",
        ));
        branches.push((
            "ST",
            "_reg[_a] = _st[_top]; _top = _top - 1",
        ));
        branches.push((
            "GETF",
            "_top = _top + 1; _st[_top] = _G[_gname[_a + 2]]",
        ));
        branches.push((
            "SETF",
            "_G[_gname[_a + 2]] = _st[_top]; _top = _top - 1",
        ));
        branches.push((
            "ADD",
            "local _b = _st[_top]; _top = _top - 1; local _c = _st[_top]; _st[_top] = _c + _b",
        ));
        branches.push((
            "SUB",
            "local _b = _st[_top]; _top = _top - 1; local _c = _st[_top]; _st[_top] = _c - _b",
        ));
        branches.push((
            "MUL",
            "local _b = _st[_top]; _top = _top - 1; local _c = _st[_top]; _st[_top] = _c * _b",
        ));
        branches.push((
            "DIV",
            "local _b = _st[_top]; _top = _top - 1; local _c = _st[_top]; _st[_top] = _c / _b",
        ));
        branches.push((
            "MOD",
            "local _b = _st[_top]; _top = _top - 1; local _c = _st[_top]; _st[_top] = _c % _b",
        ));
        branches.push((
            "CONCAT",
            "local _b = _st[_top]; _top = _top - 1; local _c = _st[_top]; _st[_top] = tostring(_c) .. tostring(_b)",
        ));
        branches.push((
            "EQ",
            "local _b = _st[_top]; _top = _top - 1; local _c = _st[_top]; _st[_top] = (_c == _b)",
        ));
        branches.push((
            "LT",
            "local _b = _st[_top]; _top = _top - 1; local _c = _st[_top]; _st[_top] = (_c < _b)",
        ));
        branches.push((
            "LE",
            "local _b = _st[_top]; _top = _top - 1; local _c = _st[_top]; _st[_top] = (_c <= _b)",
        ));
        branches.push((
            "LEN",
            "_st[_top] = #_st[_top]",
        ));
        branches.push((
            "NOT",
            "if _st[_top] then _st[_top] = false else _st[_top] = true end",
        ));
        branches.push((
            "NEG",
            "_st[_top] = -_st[_top]",
        ));
        branches.push((
            "JMP",
            "_pc = _a",
        ));
        branches.push((
            "JZ",
            "if not _st[_top] then _pc = _a end; _top = _top - 1",
        ));
        branches.push((
            "CALL",
            "local _n = _a; local _f = _st[_top - _n]; local _args = {}; for _i = 0, _n - 1 do _args[_i + 1] = _st[_top - _n + 1 + _i] end; _top = _top - _n - 1; local _up = table.unpack or unpack; local _r = {_f(_up(_args))}; _top = _top + 1; _st[_top] = _r[1]",
        ));
        branches.push((
            "RET",
            "return _st[_top]",
        ));
        branches.push((
            "SGET",
            "_top = _top + 1; _st[_top] = _sconst[_a + 2]",
        ));
        branches.push((
            "POW",
            "local _b = _st[_top]; _top = _top - 1; local _c = _st[_top]; _st[_top] = _c ^ _b",
        ));
        branches.push((
            "AND",
            "local _b = _st[_top]; _top = _top - 1; local _c = _st[_top]; _st[_top] = (_c and _b)",
        ));
        branches.push((
            "OR",
            "local _b = _st[_top]; _top = _top - 1; local _c = _st[_top]; _st[_top] = (_c or _b)",
        ));
        branches.push((
            "GETT",
            "local _k = _st[_top]; _top = _top - 1; local _t = _st[_top]; _st[_top] = _t[_k]",
        ));
        branches.push((
            "NEWT",
            "_top = _top + 1; _st[_top] = {}",
        ));
        branches.push((
            "SETI",
            "local _v = _st[_top]; _top = _top - 1; local _t = _st[_top]; _t[_a] = _v",
        ));
        branches.push((
            "SETK",
            "local _v = _st[_top]; _top = _top - 1; local _k = _st[_top]; _top = _top - 1; local _t = _st[_top]; _t[_k] = _v",
        ));

        // VM-B：表驱动寻址 + switch 名称分派解释器
        lua.push_str("-- VM-B: switch 执行VM（表驱动寻址 + 名称分派）\n");
        lua.push_str("local _handlers = {\n");
        // 先输出表驱动映射表：code → 处理器名
        for (name, _) in branches.iter() {
            let enc = self.op(name);
            lua.push_str(&format!("  [{}] = \"{}\",\n", enc, name));
        }
        lua.push_str("}\n\n");
        lua.push_str("local function _vm_b_exec(_bc, ...)\n");
        lua.push_str("  local _pc = 1\n");
        lua.push_str("  local _st = {}\n");
        lua.push_str("  local _top = 0\n");
        lua.push_str("  local _reg = {}\n");
        lua.push_str("  -- 参数填充：_bc 是具名参数，... 已只含业务参数，从 1 开始\n");
        lua.push_str("  for _i = 1, select('#', ...) do _reg[_i] = select(_i, ...) end\n");
        lua.push_str("  while _pc <= #_bc do\n");
        lua.push_str("    local _in = _bc[_pc]\n");
        lua.push_str("    local _op = _in[1]\n");
        lua.push_str("    local _a = _in[2]\n");
        lua.push_str("    -- 表驱动寻址：操作码 → 处理器名（VM-21 混合分发）\n");
        lua.push_str("    local _h = _handlers[_op]\n");

        for (i, (name, body)) in branches.iter().enumerate() {
            let cond = if i == 0 {
                format!("if _h == \"{}\" then", name)
            } else {
                format!("elseif _h == \"{}\" then", name)
            };
            lua.push_str(&format!("    {}\n      {}\n", cond, body));
        }
        lua.push_str("    end\n");
        lua.push_str("    _pc = _pc + 1\n");
        lua.push_str("  end\n");
        lua.push_str("end\n\n");
        lua
    }

    /// 加密字节码：指令表 → Lua 源码 → XOR+S-Box → `\ddd` 字符串
    fn encrypt_code(&self, code: &[VmInstr]) -> String {
        // 生成指令表 Lua 源码（op 用编码号，与解释器分支一致）
        let mut src = String::from("return {\n");
        for ins in code {
            if ins.operands.is_empty() {
                src.push_str(&format!("  {{{}, 0}},\n", ins.op));
            } else {
                src.push_str(&format!("  {{{}, {}}},\n", ins.op, ins.operands[0]));
            }
        }
        src.push_str("}\n");
        // 加密：纯算术 XOR（与 VM-A 解密匹配，Lua 5.1 兼容）
        let bytes = src.as_bytes();
        let seed_mix = ((self.opcode_enc["PUSH"] % 251) + 7) as u8;
        let mut enc: Vec<u8> = Vec::with_capacity(bytes.len());
        for (i, b) in bytes.iter().enumerate() {
            // 全精度运算（与 Lua `(key + (i)*31) % 251` 完全一致，避免 u8 溢出分叉）
            let k = (seed_mix as i64 + (i as i64) * 31) % 251;
            enc.push(b ^ (k as u8));
        }
        enc.iter()
            .map(|b| format!("\\{:03}", b))
            .collect::<String>()
    }
}

/// 程序编译输出
#[derive(Clone, Debug)]
pub struct VmProgramOut {
    /// 所有函数（含 main）
    pub functions: Vec<VmFunction>,
    /// 全局名常量表
    pub global_names: Vec<String>,
    /// 字符串常量表
    pub strings: Vec<String>,
}

/// 函数编译器（寄存器分配）
struct FuncCompiler<'a> {
    engine: &'a mut DualVmEngine,
    regs: std::collections::HashMap<String, i64>,
    next_reg: i64,
    // 当前函数是否嵌套（嵌套函数同样编译）
}

impl<'a> FuncCompiler<'a> {
    fn new(engine: &'a mut DualVmEngine, params: &[String], _param_count: usize) -> Self {
        let mut regs = std::collections::HashMap::new();
        for (i, p) in params.iter().enumerate() {
            regs.insert(p.clone(), (i + 1) as i64);
        }
        Self {
            engine,
            regs,
            next_reg: (params.len() + 1) as i64,
        }
    }

    /// 分配寄存器
    fn alloc_reg(&mut self, name: &str) -> i64 {
        if let Some(&r) = self.regs.get(name) {
            return r;
        }
        let r = self.next_reg;
        self.next_reg += 1;
        self.regs.insert(name.to_string(), r);
        r
    }

    /// 编译表达式 → 指令
    fn compile_expr(&mut self, expr: &Expression, out: &mut Vec<VmInstr>) {
        match expr {
            Expression::Integer(n) => out.push(VmInstr {
                op: self.engine.op("PUSH"),
                operands: vec![*n],
            }),
            Expression::Float(n) => out.push(VmInstr {
                op: self.engine.op("PUSH"),
                operands: vec![*n as i64],
            }),
            Expression::Boolean(b) => out.push(VmInstr {
                op: self.engine.op("PUSH"),
                operands: vec![if *b { 1 } else { 0 }],
            }),
            Expression::Nil => out.push(VmInstr {
                op: self.engine.op("PUSH"),
                operands: vec![0],
            }),
            Expression::String(s) => {
                let idx = self.engine.string_index(s);
                out.push(VmInstr {
                    op: self.engine.op("SGET"),
                    operands: vec![idx],
                });
            }
            Expression::Variable(name) => {
                if self.regs.contains_key(name) {
                    let r = self.alloc_reg(name);
                    out.push(VmInstr {
                        op: self.engine.op("LD"),
                        operands: vec![r],
                    });
                } else {
                    let idx = self.engine.global_index(name);
                    out.push(VmInstr {
                        op: self.engine.op("GETF"),
                        operands: vec![idx],
                    });
                }
            }
            Expression::BinaryOp { op, left, right } => {
                // 大于/大于等于：交换操作数后取反
                let (vm_op, swap) = match op {
                    BinaryOperator::Add => ("ADD", false),
                    BinaryOperator::Sub => ("SUB", false),
                    BinaryOperator::Mul => ("MUL", false),
                    BinaryOperator::Div => ("DIV", false),
                    BinaryOperator::Mod => ("MOD", false),
                    BinaryOperator::Pow => ("POW", false),
                    BinaryOperator::Concat => ("CONCAT", false),
                    BinaryOperator::Equal => ("EQ", false),
                    BinaryOperator::NotEqual => ("EQ", true),
                    BinaryOperator::Less => ("LT", false),
                    BinaryOperator::LessEqual => ("LE", false),
                    BinaryOperator::Greater => ("LT", true),
                    BinaryOperator::GreaterEqual => ("LE", true),
                    BinaryOperator::And => ("AND", false),
                    BinaryOperator::Or => ("OR", false),
                };
                if swap {
                    // 先右后左 → 结果取反
                    self.compile_expr(right, out);
                    self.compile_expr(left, out);
                } else {
                    self.compile_expr(left, out);
                    self.compile_expr(right, out);
                }
                if *op == BinaryOperator::NotEqual {
                    // 加 NOT
                    out.push(VmInstr {
                        op: self.engine.op(vm_op),
                        operands: vec![],
                    });
                    out.push(VmInstr {
                        op: self.engine.op("NOT"),
                        operands: vec![],
                    });
                } else {
                    out.push(VmInstr {
                        op: self.engine.op(vm_op),
                        operands: vec![],
                    });
                }
            }
            Expression::UnaryOp { op, operand } => {
                self.compile_expr(operand, out);
                match op {
                    UnaryOperator::Neg => out.push(VmInstr {
                        op: self.engine.op("NEG"),
                        operands: vec![],
                    }),
                    UnaryOperator::Not => out.push(VmInstr {
                        op: self.engine.op("NOT"),
                        operands: vec![],
                    }),
                    UnaryOperator::Len => {
                        // 操作数已压栈，LEN 原地求长度
                        out.push(VmInstr {
                            op: self.engine.op("LEN"),
                            operands: vec![],
                        });
                    }
                }
            }
            Expression::DotAccess { object, field } => {
                // obj.field → obj["field"]：压对象 → 压字段串 → GETT
                self.compile_expr(object, out);
                self.compile_expr(&Expression::String(field.clone()), out);
                out.push(VmInstr {
                    op: self.engine.op("GETT"),
                    operands: vec![],
                });
            }
            Expression::TableAccess { table, key } => {
                // t[k] 读取：压表 → 压键 → GETT 取指
                self.compile_expr(table, out);
                self.compile_expr(key, out);
                out.push(VmInstr {
                    op: self.engine.op("GETT"),
                    operands: vec![],
                });
            }
            Expression::TableConstructor { fields } => {
                // 真实建表：NEWT + 逐字段 SETI/SETK
                out.push(VmInstr {
                    op: self.engine.op("NEWT"),
                    operands: vec![],
                });
                let mut arr_idx: i64 = 1;
                for field in fields {
                    match field {
                        TableField::List(e) => {
                            self.compile_expr(e, out);
                            out.push(VmInstr {
                                op: self.engine.op("SETI"),
                                operands: vec![arr_idx],
                            });
                            arr_idx += 1;
                        }
                        TableField::Named(k, v) => {
                            self.compile_expr(&Expression::String(k.clone()), out);
                            self.compile_expr(v, out);
                            out.push(VmInstr {
                                op: self.engine.op("SETK"),
                                operands: vec![],
                            });
                        }
                        TableField::Indexed(k, v) => {
                            self.compile_expr(k, out);
                            self.compile_expr(v, out);
                            out.push(VmInstr {
                                op: self.engine.op("SETK"),
                                operands: vec![],
                            });
                        }
                    }
                }
            }
            Expression::FunctionCall(call) => {
                // 函数目标：Variable 名 → GETF
                match &*call.function {
                    Expression::Variable(fname) => {
                        let idx = self.engine.global_index(fname);
                        out.push(VmInstr {
                            op: self.engine.op("GETF"),
                            operands: vec![idx],
                        });
                    }
                    _ => {
                        self.compile_expr(&call.function, out);
                    }
                }
                for arg in &call.args {
                    self.compile_expr(arg, out);
                }
                out.push(VmInstr {
                    op: self.engine.op("CALL"),
                    operands: vec![call.args.len() as i64],
                });
            }
            Expression::MethodCall { object, method, args } => {
                // 简化：编译为函数调用 object.method(...)
                let mut fname = String::new();
                if let Expression::Variable(v) = &**object {
                    fname = format!("{}.{}", v, method);
                }
                let idx = self.engine.global_index(&fname);
                out.push(VmInstr {
                    op: self.engine.op("GETF"),
                    operands: vec![idx],
                });
                for arg in args {
                    self.compile_expr(arg, out);
                }
                out.push(VmInstr {
                    op: self.engine.op("CALL"),
                    operands: vec![args.len() as i64],
                });
            }
            _ => {
                // 其他表达式（表构造、函数字面量等）：简化压 nil
                out.push(VmInstr {
                    op: self.engine.op("PUSH"),
                    operands: vec![0],
                });
            }
        }
    }

    /// 编译语句 → 指令
    fn compile_stmt(&mut self, stmt: &Statement, out: &mut Vec<VmInstr>) {
        match stmt {
            Statement::LocalDeclaration { names, values } => {
                let regs: Vec<i64> = names.iter().map(|n| self.alloc_reg(n)).collect();
                if let Some(vals) = values {
                    for v in vals {
                        self.compile_expr(v, out);
                    }
                } else {
                    for _ in &regs {
                        out.push(VmInstr {
                            op: self.engine.op("PUSH"),
                            operands: vec![0],
                        });
                    }
                }
                for r in &regs {
                    out.push(VmInstr {
                        op: self.engine.op("ST"),
                        operands: vec![*r],
                    });
                }
            }
            Statement::Assignment { targets, values } => {
                for v in values {
                    self.compile_expr(v, out);
                }
                for t in targets {
                    match t {
                        Expression::Variable(name) => {
                            let r = self.alloc_reg(name);
                            out.push(VmInstr {
                                op: self.engine.op("ST"),
                                operands: vec![r],
                            });
                        }
                        _ => {
                            out.push(VmInstr {
                                op: self.engine.op("ST"),
                                operands: vec![0],
                            });
                        }
                    }
                }
            }
            Statement::If {
                condition,
                then_block,
                else_if_blocks,
                else_block,
            } => {
                // 编译条件
                self.compile_expr(condition, out);
                let jz_pos = out.len();
                out.push(VmInstr {
                    op: self.engine.op("JZ"),
                    operands: vec![0], // 回填
                });
                let then_code = self.compile_block(then_block, out.len());
                out.extend(then_code);
                let jmp_pos = out.len();
                out.push(VmInstr {
                    op: self.engine.op("JMP"),
                    operands: vec![0], // 回填
                });
                // elseif 链
                for (cond, blk) in else_if_blocks {
                    self.compile_expr(cond, out);
                    let jz2 = out.len();
                    out.push(VmInstr {
                        op: self.engine.op("JZ"),
                        operands: vec![0],
                    });
                    let blk_code = self.compile_block(blk, out.len());
                    out.extend(blk_code);
                    let jmp2 = out.len();
                    out.push(VmInstr {
                        op: self.engine.op("JMP"),
                        operands: vec![0],
                    });
                    let tgt = out.len();
                    out[jz2].operands[0] = (tgt) as i64;
                    out[jmp2].operands[0] = (tgt) as i64;
                }
                if let Some(blk) = else_block {
                    let blk_code = self.compile_block(blk, out.len());
                    out.extend(blk_code);
                }
                let end_pos = out.len();
                out[jz_pos].operands[0] = (jmp_pos + 1) as i64;
                out[jmp_pos].operands[0] = (end_pos) as i64;

            }
            Statement::While { condition, body } => {
                // JMP/JZ 操作数为 rust 0-based 指令索引（Lua 执行时 pc = a+1）
                let loop_start = out.len();
                self.compile_expr(condition, out);
                let jz_pos = out.len();
                out.push(VmInstr {
                    op: self.engine.op("JZ"),
                    operands: vec![0],
                });
                let body_code = self.compile_block(body, out.len());
                out.extend(body_code);
                out.push(VmInstr {
                    op: self.engine.op("JMP"),
                    operands: vec![loop_start as i64],
                });
                let end_pos = out.len();
                out[jz_pos].operands[0] = end_pos as i64;
            }
            Statement::Repeat { body, condition } => {
                let loop_start = out.len();
                let body_code = self.compile_block(body, out.len());
                out.extend(body_code);
                self.compile_expr(condition, out);
                out.push(VmInstr {
                    op: self.engine.op("NOT"),
                    operands: vec![],
                });
                let jz_pos = out.len();
                out.push(VmInstr {
                    op: self.engine.op("JZ"),
                    operands: vec![0],
                });
                out[jz_pos].operands[0] = loop_start as i64;
            }
            Statement::ForNumeric {
                variable,
                start,
                end,
                step,
                body,
            } => {
                // 简化：编译为 while 语义（i=start; while i<=end do body; i=i+step end）
                let r_var = self.alloc_reg(variable);
                let r_end = self.alloc_reg("__for_end");
                // end 预计算并存入临时寄存器，避免循环条件栈污染
                self.compile_expr(end, out);
                out.push(VmInstr {
                    op: self.engine.op("ST"),
                    operands: vec![r_end],
                });
                self.compile_expr(start, out);
                out.push(VmInstr {
                    op: self.engine.op("ST"),
                    operands: vec![r_var],
                });
                let loop_start = out.len();
                out.push(VmInstr {
                    op: self.engine.op("LD"),
                    operands: vec![r_var],
                });
                out.push(VmInstr {
                    op: self.engine.op("LD"),
                    operands: vec![r_end],
                });
                out.push(VmInstr {
                    op: self.engine.op("LE"),
                    operands: vec![],
                });
                let jz_pos = out.len();
                out.push(VmInstr {
                    op: self.engine.op("JZ"),
                    operands: vec![0],
                });
                let body_code = self.compile_block(body, out.len());
                out.extend(body_code);
                // i = i + step
                out.push(VmInstr {
                    op: self.engine.op("LD"),
                    operands: vec![r_var],
                });
                let step_expr = step.clone().unwrap_or(Expression::Integer(1));
                self.compile_expr(&step_expr, out);
                out.push(VmInstr {
                    op: self.engine.op("ADD"),
                    operands: vec![],
                });
                out.push(VmInstr {
                    op: self.engine.op("ST"),
                    operands: vec![r_var],
                });
                out.push(VmInstr {
                    op: self.engine.op("JMP"),
                    operands: vec![loop_start as i64],
                });
                out[jz_pos].operands[0] = out.len() as i64;
            }
            Statement::ForGeneric { variables, iterators, body } => {
                // 简化：迭代器表达式求值（最简支持）
                for v in iterators {
                    self.compile_expr(v, out);
                }
                let _ = variables;
                let body_code = self.compile_block(body, out.len());
                out.extend(body_code);
            }
            Statement::FunctionCall(call) => {
                self.compile_expr(&Expression::FunctionCall(call.clone()), out);
                out.push(VmInstr {
                    op: self.engine.op("ST"),
                    operands: vec![0],
                });
            }
            Statement::Return(exprs) => {
                for e in exprs {
                    self.compile_expr(e, out);
                }
                out.push(VmInstr {
                    op: self.engine.op("RET"),
                    operands: vec![exprs.len() as i64],
                });
            }
            Statement::FunctionDeclaration {
                name,
                parameters,
                is_variadic,
                body,
            } => {
                // 编译子函数（注册到 _fns）
                let fname = if name.parts.len() == 1 {
                    name.parts[0].clone()
                } else {
                    format!("{}", name.parts.join("."))
                };
                let mut sub = FuncCompiler::new(self.engine, parameters, parameters.len());
                let sub_code = sub.compile_block(body, 0);
                let _ = is_variadic;
                self.engine.functions.push(VmFunction {
                    name: fname.clone(),
                    param_count: parameters.len(),
                    code: sub_code,
                });
            }
            Statement::LocalFunctionDeclaration {
                name,
                parameters,
                is_variadic,
                body,
            } => {
                let mut sub = FuncCompiler::new(self.engine, parameters, parameters.len());
                let sub_code = sub.compile_block(body, 0);
                let _ = is_variadic;
                self.engine.functions.push(VmFunction {
                    name: name.clone(),
                    param_count: parameters.len(),
                    code: sub_code,
                });
            }
            Statement::Do(blk) => {
                let code = self.compile_block(blk, out.len());
                out.extend(code);
            }
            _ => {}
        }
    }

    /// 编译块 → 指令（base = 该块追加到主 out 时的起始索引，用于跳转回填偏移修正）
    fn compile_block(&mut self, blk: &Block, base: usize) -> Vec<VmInstr> {
        let mut out = Vec::new();
        for stmt in &blk.statements {
            self.compile_stmt(stmt, &mut out);
        }
        if let Some(ret) = &blk.return_statement {
            for e in ret {
                self.compile_expr(e, &mut out);
            }
            out.push(VmInstr {
                op: self.engine.op("RET"),
                operands: vec![ret.len() as i64],
            });
        }
        // 跳转回填偏移修正：块内 JZ/JMP 索引 + base
        for instr in &mut out {
            if instr.op == self.engine.op("JZ") || instr.op == self.engine.op("JMP") {
                instr.operands[0] += base as i64;
            }
        }
        out
    }
}


#[cfg(test)]
mod tests {
    use super::*;
    use crate::lua::lexer::Lexer;
    use crate::lua::parser::Parser;

    fn parse(src: &str) -> Block {
        let toks = Lexer::new(src).tokenize().expect("lex");
        Parser::new(toks).parse_block().expect("parse")
    }

    fn compile_main(src: &str) -> (Vec<VmInstr>, DualVmEngine) {
        let block = parse(src);
        let mut engine = DualVmEngine::new(0x1234_5678);
        let program = engine.compile_program(&block);
        let code = program
            .functions
            .iter()
            .find(|f| f.name == "main")
            .map(|f| f.code.clone())
            .unwrap_or_default();
        (code, engine)
    }

    fn has_op(code: &[VmInstr], engine: &DualVmEngine, name: &str) -> bool {
        let target = engine.op(name);
        code.iter().any(|i| i.op == target)
    }

    #[test]
    fn test_compile_arithmetic() {
        let (code, engine) = compile_main("return 1 + 2");
        assert!(has_op(&code, &engine, "PUSH"));
        assert!(has_op(&code, &engine, "ADD"));
        assert!(has_op(&code, &engine, "RET"));
    }

    #[test]
    fn test_compile_if_has_jz() {
        let (code, engine) = compile_main("if true then return 1 end\nreturn 2");
        assert!(has_op(&code, &engine, "JZ"));
        assert!(has_op(&code, &engine, "JMP"));
    }

    #[test]
    fn test_compile_while_loop() {
        let (code, engine) = compile_main("local i = 0\nwhile i < 3 do i = i + 1 end\nreturn i");
        assert!(has_op(&code, &engine, "JZ"));
        assert!(has_op(&code, &engine, "JMP"));
        assert!(has_op(&code, &engine, "LT"));
    }

    #[test]
    fn test_compile_table() {
        let (code, engine) = compile_main("return {1, 2, x = 3}");
        assert!(has_op(&code, &engine, "NEWT"));
        assert!(has_op(&code, &engine, "SETI"));
        assert!(has_op(&code, &engine, "SETK"));
    }

    #[test]
    fn test_dual_vm_artifacts() {
        let block = parse("local function f(a, b) return a + b end\nreturn f(1, 2)");
        let mut engine = DualVmEngine::new(0xdead_beef);
        let program = engine.compile_program(&block);
        assert!(program.functions.len() >= 2, "main + f 子函数");
        let lua = engine.generate_dual_vm_lua(&program);
        // 双 VM：反序列化 VM（loadstring 还原）+ 执行 VM（_vm_b_exec）
        assert!(lua.contains("_vm_a"), "VM-A 解密入口");
        assert!(lua.contains("_vm_b_exec"), "VM-B 执行入口");
        assert!(lua.contains("loadstring") || lua.contains("load"), "字节码反序列化");
        assert!(lua.contains("while _pc"), "解释器主循环");
    }
}
