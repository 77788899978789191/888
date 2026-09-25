//! 商业级深度混淆引擎
//!
//! 对标 Luraph / IronBrew / Prometheus 级别的深度混淆：
//! 1. 字符串全量加密池（运行时解密调用，静态不可读）
//! 2. 标识符真实重命名（AST 级）
//! 3. 每个函数体控制流扁平化为 while+state 状态机
//! 4. 不透明谓词 + 垃圾代码注入（交织在真实逻辑中）
//! 5. 输出为"变换后的逻辑主体"，而非明文原代码
//!
//! 该引擎产出的是真正被混淆的代码：静态分析看到的不是原始语义，
//! 而是字符串解密调用、状态机分发、VM 包装后的形态。

use crate::lua::ast::AstVisitor;
use crate::lua::ast::{Block, Expression, FunctionCall, Statement, TableField};
use crate::lua::writer::write_lua;
use crate::obfuscators::control_flow::ControlFlowObfuscator;
use crate::scope::ScopeObfuscator;
use rand::Rng;
use rand::SeedableRng;
use rand_chacha::ChaCha20Rng;

/// 字符串加密池收集器：遍历 AST，把字符串字面量替换为 `_sp_get(idx)` 调用
struct StringPoolCollector {
    /// (加密后的 `\ddd` 字节串, xor key)
    pool: Vec<(String, u8)>,
    replaced: usize,
}

impl StringPoolCollector {
    fn new() -> Self {
        Self {
            pool: Vec::new(),
            replaced: 0,
        }
    }

    /// 加密字节：与 key 及位置相关的 XOR（运行时用相同公式还原）
    fn encrypt_byte(b: u8, key: u8, pos: usize) -> u8 {
        b ^ key.wrapping_add((pos as u8).wrapping_mul(7))
    }

    /// 生成字符串池运行时（解密函数 + 池表）
    fn generate_pool_runtime(pool: &[(String, u8)]) -> String {
        let mut lua = String::new();
        lua.push_str("-- DC-01: 字符串加密池运行时\n");
        lua.push_str("local _sp = {\n");
        for (enc, key) in pool {
            lua.push_str(&format!("  {{ \"{}\", {} }},\n", enc, key));
        }
        lua.push_str("}\n");
        lua.push_str(
            "local function _sp_get(i)\n\
             \x20 local e, k = _sp[i][1], _sp[i][2]\n\
             \x20 local r = {}\n\
             \x20 for j = 1, #e do\n\
             \x20\x20 r[j] = string.char(string.byte(e, j) ~ (k + j * 7) % 256)\n\
             \x20 end\n\
             \x20 return table.concat(r)\n\
             end\n",
        );
        // VM 通过 GETF 调用 _sp_get —— 注册到全局
        lua.push_str("_G._sp_get = _sp_get\n");
        lua
    }
}

impl AstVisitor for StringPoolCollector {
    fn visit_expression(&mut self, expr: &mut Expression) {
        match expr {
            Expression::String(s) | Expression::LongString(s) => {
                // 只加密合理长度且不含转义的字符串；空串与超长（可能是嵌入大段代码）保留
                if !s.is_empty() && s.len() <= 200 && !s.contains('\\') {
                    let key = self.pool.len() as u8 % 251 + 1;
                    let mut enc = String::new();
                    for (pos, b) in s.bytes().enumerate() {
                        let c = Self::encrypt_byte(b, key, pos + 1);
                        enc.push_str(&format!("\\{:03}", c));
                    }
                    let idx = self.pool.len();
                    self.pool.push((enc, key));
                    self.replaced += 1;
                    *expr = Expression::FunctionCall(FunctionCall::new(
                        Expression::Variable("_sp_get".to_string()),
                        vec![Expression::Integer(idx as i64 + 1)],
                    ));
                    return; // 已被替换，不再深入
                }
            }
            _ => {}
        }
        // 继续遍历子表达式
        match expr {
            Expression::Function { body, .. } => self.visit_block(body),
            Expression::BinaryOp { left, right, .. } => {
                self.visit_expression(left);
                self.visit_expression(right);
            }
            Expression::UnaryOp { operand, .. } => self.visit_expression(operand),
            Expression::TableAccess { table, key } => {
                self.visit_expression(table);
                self.visit_expression(key);
            }
            Expression::DotAccess { object, .. } => self.visit_expression(object),
            Expression::FunctionCall(call) => {
                self.visit_expression(&mut call.function);
                for arg in &mut call.args {
                    self.visit_expression(arg);
                }
            }
            Expression::MethodCall { object, args, .. } => {
                self.visit_expression(object);
                for arg in args {
                    self.visit_expression(arg);
                }
            }
            Expression::TableConstructor { fields } => {
                for field in fields {
                    match field {
                        TableField::List(e) => self.visit_expression(e),
                        TableField::Named(_, e) => self.visit_expression(e),
                        TableField::Indexed(k, v) => {
                            self.visit_expression(k);
                            self.visit_expression(v);
                        }
                    }
                }
            }
            _ => {}
        }
    }
}

/// 商业级深度混淆引擎
pub struct DeepObfuscator {
    rng: ChaCha20Rng,
}

impl DeepObfuscator {
    /// 创建深度混淆引擎
    pub fn new(seed: u64) -> Self {
        Self {
            rng: ChaCha20Rng::seed_from_u64(seed),
        }
    }

    /// 变换 AST 供双VM编译（重命名 + 字符串加密池），返回变换后的 AST
    ///
    /// 返回 (变换后的 Block, 字符串池运行时, 统计)
    pub fn transform_ast(&mut self, block: &Block) -> (Block, String, DeepStats) {
        let mut work = block.clone();

        // 1. SC-01: 标识符真实重命名（AST 级）
        let mut scope = ScopeObfuscator::new(self.rng.gen::<u64>());
        scope.rename_identifiers(&mut work);

        // 2. DC-01: 字符串全量加密池（String → _sp_get(idx) 调用）
        let mut collector = StringPoolCollector::new();
        collector.visit_block(&mut work);
        let pool_runtime = StringPoolCollector::generate_pool_runtime(&collector.pool);

        let stats = DeepStats {
            renamed_identifiers: 0,
            encrypted_strings: collector.replaced,
            flattened_functions: 0,
        };

        (work, pool_runtime, stats)
    }

    /// 深度混淆：真实变换 AST 并生成混淆逻辑主体
    ///
    /// 返回 (逻辑主体代码, 字符串池运行时, 统计)
    pub fn deep_obfuscate(&mut self, block: &Block) -> (String, String, DeepStats) {
        let mut work = block.clone();

        // 1. SC-01: 标识符真实重命名（AST 级）
        let mut scope = ScopeObfuscator::new(self.rng.gen::<u64>());
        scope.rename_identifiers(&mut work);

        // 2. DC-01: 字符串全量加密池
        let mut collector = StringPoolCollector::new();
        collector.visit_block(&mut work);
        let pool_runtime = StringPoolCollector::generate_pool_runtime(&collector.pool);

        // 3. CF-01: 每个函数体控制流扁平化 + CF-06 垃圾代码 + CF-02 不透明谓词
        let mut cf = ControlFlowObfuscator::new(self.rng.gen::<u64>());
        let mut transformed = Block {
            statements: Vec::new(),
            return_statement: work.return_statement.clone(),
        };

        for stmt in work.statements {
            match stmt {
                Statement::FunctionDeclaration {
                    name,
                    parameters,
                    is_variadic,
                    body,
                } => {
                    let mut body = body;
                    // 扁平化函数体为状态机（空体函数跳过，避免死循环状态机）
                    let mut flat;
                    if body.statements.is_empty() {
                        flat = body;
                    } else {
                        flat = cf.flatten_control_flow(&body);
                    }
                    // 注入垃圾代码（带副作用）
                    let mut garbaged = flat;
                    cf.inject_garbage_code(&mut garbaged);
                    // 函数体内插入不透明谓词分支
                    let pred_true = cf.generate_opaque_predicate_true();
                    let pred_false = cf.generate_opaque_predicate_false();
                    body = Block {
                        statements: vec![Statement::If {
                            condition: pred_true,
                            then_block: Block {
                                statements: vec![Statement::Do(garbaged)],
                                return_statement: None,
                            },
                            else_if_blocks: vec![(
                                pred_false,
                                Block {
                                    statements: vec![Statement::Empty],
                                    return_statement: None,
                                },
                            )],
                            else_block: None,
                        }],
                        return_statement: None,
                    };
                    transformed.statements.push(Statement::FunctionDeclaration {
                        name,
                        parameters,
                        is_variadic,
                        body,
                    });
                }
                Statement::LocalFunctionDeclaration {
                    name,
                    parameters,
                    is_variadic,
                    body,
                } => {
                    let mut flat;
                    if body.statements.is_empty() {
                        flat = body;
                    } else {
                        flat = cf.flatten_control_flow(&body);
                    }
                    let mut garbaged = flat;
                    cf.inject_garbage_code(&mut garbaged);
                    let pred_true = cf.generate_opaque_predicate_true();
                    let body = Block {
                        statements: vec![Statement::If {
                            condition: pred_true,
                            then_block: Block {
                                statements: vec![Statement::Do(garbaged)],
                                return_statement: None,
                            },
                            else_if_blocks: Vec::new(),
                            else_block: None,
                        }],
                        return_statement: None,
                    };
                    transformed.statements.push(Statement::LocalFunctionDeclaration {
                        name,
                        parameters,
                        is_variadic,
                        body,
                    });
                }
                other => transformed.statements.push(other),
            }
        }

        // 4. 写回混淆后的逻辑主体
        let logic = write_lua(&transformed);

        let stats = DeepStats {
            renamed_identifiers: 0,
            encrypted_strings: collector.replaced,
            flattened_functions: 0,
        };

        (logic, pool_runtime, stats)
    }
}

/// 深度混淆统计
#[derive(Debug, Clone, Default)]
pub struct DeepStats {
    /// 重命名标识符数量（由 ScopeObfuscator 内部统计）
    pub renamed_identifiers: usize,
    /// 加密字符串数量
    pub encrypted_strings: usize,
    /// 扁平化函数数量
    pub flattened_functions: usize,
}
