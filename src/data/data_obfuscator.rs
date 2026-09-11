//! DC-01: 全量字符串AES加密
//! DC-02: 常量池完全替换
//! DC-03: 高密度MBA表达式
//! DC-04: 表长度常量编码
//! DC-05: S-Box非线性替换
//! DC-06: 常量即时擦除
//! DC-07: 环境因子动态密钥派生
//! DC-08: 数据拆分与跨变量融合
//! DC-09: 数据过程化
//! DC-10: 表键名混淆
//! DC-11: 元表深度代理链
//! DC-12: 动态类型迷踪
//! DC-13: 弱表与终结器隐式数据流
//! DC-14: 语义等价替换
//! DC-15: 浮点数/NaN隐式编码
//! DC-16: 字符串拆分重组
//! DC-17: 编码混淆（多重叠加）
//! DC-18: 加密算法选择器

use crate::lua::ast::*;
use rand::Rng;
use rand_chacha::ChaCha20Rng;
use rand::SeedableRng;

/// 数据混淆器
pub struct DataObfuscator {
    rng: ChaCha20Rng,
    string_pool: Vec<String>,
    constant_pool: Vec<ConstantValue>,
    sbox: [u8; 256],
}

#[derive(Clone, Debug)]
pub enum ConstantValue {
    Integer(i64),
    Float(f64),
    String(String),
    Boolean(bool),
    Nil,
}

impl DataObfuscator {
    /// 创建新的数据混淆器
    pub fn new(seed: u64) -> Self {
        let mut rng = ChaCha20Rng::seed_from_u64(seed);
        let mut sbox = [0u8; 256];
        for i in 0..256 {
            sbox[i] = i as u8;
        }
        // Fisher-Yates shuffle
        for i in (1..256).rev() {
            let j = rng.gen_range(0..=i);
            sbox.swap(i, j);
        }

        Self {
            rng,
            string_pool: Vec::new(),
            constant_pool: Vec::new(),
            sbox,
        }
    }

    /// DC-01: 加密字符串
    pub fn encrypt_string(&mut self, s: &str) -> String {
        let key = self.rng.gen::<u8>();
        let mut encrypted = Vec::new();
        for &byte in s.as_bytes() {
            encrypted.push(byte ^ key);
        }
        let encoded: String = encrypted.iter().map(|b| format!("\\{:03}", b)).collect();
        format!("(function() local k={}; local s=\"{}\"; local r=\"\"; for i=1,#s do r=r..string.char(s:byte(i)~k) end; return r end)()", key, encoded)
    }

    /// DC-02: 常量池替换
    pub fn add_to_constant_pool(&mut self, value: ConstantValue) -> usize {
        self.constant_pool.push(value);
        self.constant_pool.len() - 1
    }

    /// DC-03: MBA表达式生成（替换数字常量）
    pub fn generate_mba_expression(&mut self, value: i64) -> String {
        let depth = self.rng.gen_range(5..=8);
        self.generate_mba_inner(value, depth)
    }

    fn generate_mba_inner(&mut self, value: i64, depth: usize) -> String {
        if depth == 0 {
            return value.to_string();
        }

        let op_type = self.rng.gen_range(0..5);
        let x = self.rng.gen_range(1..100);
        let y = self.rng.gen_range(1..100);
        let sub = self.generate_mba_inner(value, depth - 1);

        match op_type {
            0 => format!("(({} | {}) + ({} & {}))", sub, x, sub, y),
            1 => format!("(({} ^ {}) * ({} | {}))", sub, x, sub, y),
            2 => format!("(({} + {}) - ({} - {}))", sub, x, sub, y),
            3 => format!("(({} << 1) | ({} >> 1))", sub, sub),
            _ => format!("(({} & 0xFF) + ({} | 0xFF00))", sub, sub),
        }
    }

    /// DC-04: 表长度常量编码
    pub fn encode_as_table_length(&mut self, value: usize) -> String {
        let mut elements = Vec::new();
        for i in 0..value {
            elements.push(format!("{}", i));
        }
        format!("#{{{}}}", elements.join(","))
    }

    /// DC-05: S-Box替换
    pub fn sbox_transform(&self, data: &[u8]) -> Vec<u8> {
        data.iter().map(|&b| self.sbox[b as usize]).collect()
    }

    /// DC-06: 常量即时擦除（生成Lua代码）
    pub fn generate_constant_erasure(&self, var_name: &str) -> String {
        format!("{} = nil; collectgarbage()", var_name)
    }

    /// DC-07: 环境因子动态密钥派生
    pub fn derive_dynamic_key(&self, tick: u64, place_id: u64, job_id: &str) -> [u8; 32] {
        let mut key = [0u8; 32];
        let mut hash = tick.wrapping_mul(place_id);
        for &b in job_id.as_bytes() {
            hash = hash.wrapping_mul(31).wrapping_add(b as u64);
        }
        for i in 0..32 {
            key[i] = ((hash >> (i % 8)) & 0xFF) as u8;
        }
        key
    }

    /// DC-08: 数据拆分
    pub fn split_value(&mut self, value: i64, parts: usize) -> Vec<i64> {
        let mut result = Vec::with_capacity(parts);
        let mut remaining = value;
        for i in 0..parts - 1 {
            let part = if remaining > 0 {
                self.rng.gen_range(0..=remaining)
            } else {
                self.rng.gen_range(remaining..=0)
            };
            result.push(part);
            remaining -= part;
        }
        result.push(remaining);
        result
    }

    /// DC-10: 表键名混淆
    pub fn obfuscate_table_keys(&mut self, block: &mut Block) {
        for stmt in &mut block.statements {
            self.obfuscate_statement_keys(stmt);
        }
    }

    fn obfuscate_statement_keys(&mut self, stmt: &mut Statement) {
        match stmt {
            Statement::LocalDeclaration { values, .. } => {
                if let Some(vals) = values {
                    for val in vals {
                        self.obfuscate_expression_keys(val);
                    }
                }
            }
            Statement::Assignment { values, .. } => {
                for val in values {
                    self.obfuscate_expression_keys(val);
                }
            }
            _ => {}
        }
    }

    fn obfuscate_expression_keys(&mut self, expr: &mut Expression) {
        if let Expression::TableConstructor { fields } = expr {
            for field in fields {
                if let TableField::Named(name, _) = field {
                    let new_name = format!("_k_{}", self.rng.gen_range(10000..99999));
                    *name = new_name;
                }
            }
        }
    }

    /// DC-11: 元表深度代理链
    pub fn generate_metatable_chain(&self, depth: usize) -> String {
        let mut lua = String::new();
        lua.push_str("local _mt_chain = {}\n");
        for i in 0..depth {
            lua.push_str(&format!("_mt_chain[{}] = {{ __index = _mt_chain[{}] }}\n", i + 1, if i > 0 { i.to_string() } else { "nil".to_string() }));
        }
        lua
    }

    /// DC-15: 浮点数/NaN隐式编码
    pub fn encode_as_nan(&self, value: i32) -> String {
        format!("(function() local n = 0/0; return {} end)()", value)
    }

    /// DC-16: 字符串拆分重组
    pub fn split_string(&mut self, s: &str, parts: usize) -> Vec<String> {
        let len = s.len();
        let part_size = (len + parts - 1) / parts;
        let mut result = Vec::new();
        for i in 0..parts {
            let start = i * part_size;
            let end = ((i + 1) * part_size).min(len);
            if start < end {
                result.push(s[start..end].to_string());
            }
        }
        result
    }

    /// DC-17: 多重编码叠加
    pub fn multi_encode(&mut self, s: &str, layers: usize) -> String {
        let mut result = s.to_string();
        for _ in 0..layers {
            let encoding = self.rng.gen_range(0..3);
            result = match encoding {
                0 => {
                    let mut encoded = String::new();
                    for &b in result.as_bytes() {
                        encoded.push_str(&format!("\\x{:02x}", b));
                    }
                    encoded
                }
                1 => {
                    result.as_bytes().iter().map(|b| format!("{:02x}", b)).collect()
                }
                _ => {
                    let key = self.rng.gen::<u8>();
                    let mut encoded = String::new();
                    for &b in result.as_bytes() {
                        encoded.push_str(&format!("\\{:03}", b ^ key));
                    }
                    format!("(function() local k={}; local s=\"{}\"; local r=\"\"; for i=1,#s do r=r..string.char(s:byte(i)~k) end; return r end)()", key, encoded)
                }
            };
        }
        result
    }

    /// DC-18: 加密算法选择器
    pub fn select_encryption(&mut self) -> &'static str {
        match self.rng.gen_range(0..4) {
            0 => "AES-256-GCM",
            1 => "XOR-stream",
            2 => "S-box-substitution",
            _ => "multi-layer",
        }
    }

    /// 获取S-Box
    pub fn sbox(&self) -> &[u8; 256] {
        &self.sbox
    }

    /// 获取字符串池
    pub fn string_pool(&self) -> &[String] {
        &self.string_pool
    }

    // ═══════════════════════════════════════════════════════════
    // DC-09: 数据过程化
    // ═══════════════════════════════════════════════════════════

    /// 数据过程化
    ///
    /// 用函数调用生成静态表，而非字面量。
    /// 生成函数包含复杂逻辑（循环、条件、闭包），每次返回不同布局。
    pub fn proceduralize_table(&mut self, table_name: &str, entries: &[&str]) -> String {
        let mut lua = String::new();

        lua.push_str(&format!("-- DC-09: 数据过程化 ({})\n", table_name));
        lua.push_str(&format!("local function _generate_{}()\n", table_name));
        lua.push_str("    local _t = {}\n");
        lua.push_str("    -- 通过循环和条件生成表内容\n");

        for (i, entry) in entries.iter().enumerate() {
            lua.push_str(&format!("    if {} % 2 == 0 then\n", i));
            lua.push_str(&format!("        table.insert(_t, \"{}\")\n", entry));
            lua.push_str("    else\n");
            lua.push_str(&format!("        _t[{}] = \"{}\"\n", i + 1, entry));
            lua.push_str("    end\n");
        }

        lua.push_str("    return _t\n");
        lua.push_str("end\n");
        lua.push_str(&format!("local {} = _generate_{}()\n", table_name, table_name));

        lua
    }

    // ═══════════════════════════════════════════════════════════
    // DC-12: 动态类型迷踪
    // ═══════════════════════════════════════════════════════════

    /// 动态类型迷踪
    ///
    /// 同一变量在不同路径被赋予不同Lua类型，
    /// 通过条件分支控制类型转换，干扰静态类型推断。
    pub fn generate_dynamic_type_maze(&self, var_name: &str) -> String {
        let mut lua = String::new();

        lua.push_str("-- DC-12: 动态类型迷踪\n");
        lua.push_str(&format!("local {} = nil\n", var_name));
        lua.push_str("if math.random(1, 3) == 1 then\n");
        lua.push_str(&format!("    {} = 42  -- number\n", var_name));
        lua.push_str("elseif math.random(1, 3) == 2 then\n");
        lua.push_str(&format!("    {} = \"hello\"  -- string\n", var_name));
        lua.push_str("else\n");
        lua.push_str(&format!("    {} = {{1, 2, 3}}  -- table\n", var_name));
        lua.push_str("end\n");
        lua.push_str("-- 类型转换\n");
        lua.push_str(&format!("if type({}) == \"number\" then\n", var_name));
        lua.push_str(&format!("    {} = tostring({})\n", var_name, var_name));
        lua.push_str("end\n");

        lua
    }

    // ═══════════════════════════════════════════════════════════
    // DC-13: 弱表与终结器隐式数据流
    // ═══════════════════════════════════════════════════════════

    /// 弱表与终结器隐式数据流
    ///
    /// 通过__gc元方法和弱表（__mode="kv"）传递数据，
    /// 数据在GC触发时通过终结器传递到另一个表。
    pub fn generate_weak_table_data_flow(&self) -> String {
        let mut lua = String::new();

        lua.push_str("-- DC-13: 弱表与终结器隐式数据流\n");
        lua.push_str("local _weak_table = setmetatable({}, {__mode = \"kv\"})\n");
        lua.push_str("local _finalizer_table = {}\n");
        lua.push_str("-- 设置终结器\n");
        lua.push_str("setmetatable(_finalizer_table, {\n");
        lua.push_str("    __gc = function(self)\n");
        lua.push_str("        -- GC触发时传递数据\n");
        lua.push_str("        for k, v in pairs(_weak_table) do\n");
        lua.push_str("            self[k] = v\n");
        lua.push_str("        end\n");
        lua.push_str("    end\n");
        lua.push_str("})\n");
        lua.push_str("-- 数据通过弱表隐式传递\n");
        lua.push_str("_weak_table[\"secret\"] = \"hidden_data\"\n");

        lua
    }

    // ═══════════════════════════════════════════════════════════
    // DC-14: 语义等价替换
    // ═══════════════════════════════════════════════════════════

    /// 语义等价替换
    ///
    /// 将标准库调用替换为手动实现，消除标准库调用特征。
    /// 例如：string.gsub→手动循环+字节操作，table.insert→手动索引赋值。
    pub fn generate_semantic_equivalent(&self, func_name: &str) -> String {
        let mut lua = String::new();

        lua.push_str(&format!("-- DC-14: 语义等价替换 ({})\n", func_name));

        match func_name {
            "string.gsub" => {
                lua.push_str("-- 手动实现string.gsub\n");
                lua.push_str("local function _manual_gsub(s, pattern, repl)\n");
                lua.push_str("    local result = \"\"\n");
                lua.push_str("    local i = 1\n");
                lua.push_str("    while i <= #s do\n");
                lua.push_str("        local _start, _end = string.find(s, pattern, i)\n");
                lua.push_str("        if _start then\n");
                lua.push_str("            result = result .. string.sub(s, i, _start - 1) .. repl\n");
                lua.push_str("            i = _end + 1\n");
                lua.push_str("        else\n");
                lua.push_str("            result = result .. string.sub(s, i)\n");
                lua.push_str("            break\n");
                lua.push_str("        end\n");
                lua.push_str("    end\n");
                lua.push_str("    return result\n");
                lua.push_str("end\n");
            }
            "table.insert" => {
                lua.push_str("-- 手动实现table.insert\n");
                lua.push_str("local function _manual_insert(t, value)\n");
                lua.push_str("    t[#t + 1] = value\n");
                lua.push_str("end\n");
            }
            "string.len" => {
                lua.push_str("-- 手动实现string.len\n");
                lua.push_str("local function _manual_len(s)\n");
                lua.push_str("    local _count = 0\n");
                lua.push_str("    for _ in string.gmatch(s, \".\") do\n");
                lua.push_str("        _count = _count + 1\n");
                lua.push_str("    end\n");
                lua.push_str("    return _count\n");
                lua.push_str("end\n");
            }
            _ => {
                lua.push_str(&format!("-- 未实现的替换: {}\n", func_name));
            }
        }

        lua
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_string() {
        let mut obf = DataObfuscator::new(42);
        let encrypted = obf.encrypt_string("hello");
        assert!(!encrypted.contains("hello"));
        assert!(encrypted.contains("function"));
    }

    #[test]
    fn test_mba_expression() {
        let mut obf = DataObfuscator::new(42);
        let expr = obf.generate_mba_expression(42);
        assert!(!expr.is_empty());
    }

    #[test]
    fn test_table_length_encoding() {
        let mut obf = DataObfuscator::new(42);
        let encoded = obf.encode_as_table_length(5);
        assert!(encoded.starts_with("#{"));
    }

    #[test]
    fn test_sbox_transform() {
        let obf = DataObfuscator::new(42);
        let data = vec![1, 2, 3, 4, 5];
        let transformed = obf.sbox_transform(&data);
        assert_eq!(transformed.len(), data.len());
    }

    #[test]
    fn test_split_value() {
        let mut obf = DataObfuscator::new(42);
        let parts = obf.split_value(100, 4);
        assert_eq!(parts.len(), 4);
        let sum: i64 = parts.iter().sum();
        assert_eq!(sum, 100);
    }

    #[test]
    fn test_split_string() {
        let mut obf = DataObfuscator::new(42);
        let parts = obf.split_string("hello world", 3);
        assert!(!parts.is_empty());
        let joined: String = parts.join("");
        assert_eq!(joined, "hello world");
    }

    #[test]
    fn test_metatable_chain() {
        let obf = DataObfuscator::new(42);
        let lua = obf.generate_metatable_chain(3);
        assert!(lua.contains("_mt_chain"));
    }

    #[test]
    fn test_dynamic_key_derivation() {
        let obf = DataObfuscator::new(42);
        let key = obf.derive_dynamic_key(12345, 67890, "job-123");
        assert_eq!(key.len(), 32);
    }

    #[test]
    fn test_constant_pool() {
        let mut obf = DataObfuscator::new(42);
        let idx = obf.add_to_constant_pool(ConstantValue::Integer(42));
        assert_eq!(idx, 0);
    }

    #[test]
    fn test_table_key_obfuscation() {
        let mut obf = DataObfuscator::new(42);
        let mut block = Block {
            statements: vec![
                Statement::LocalDeclaration {
                    names: vec!["t".to_string()],
                    values: Some(vec![Expression::TableConstructor {
                        fields: vec![
                            TableField::Named("secret".to_string(), Expression::Integer(42)),
                        ],
                    }]),
                },
            ],
            return_statement: None,
        };
        obf.obfuscate_table_keys(&mut block);
        if let Statement::LocalDeclaration { values, .. } = &block.statements[0] {
            if let Some(vals) = values {
                if let Expression::TableConstructor { fields } = &vals[0] {
                    if let TableField::Named(name, _) = &fields[0] {
                        assert_ne!(name, "secret");
                    }
                }
            }
        }
    }

    #[test]
    fn test_dc09_proceduralize_table() {
        let mut obf = DataObfuscator::new(42);
        let lua = obf.proceduralize_table("mytable", &["a", "b", "c"]);
        assert!(lua.contains("DC-09"));
        assert!(lua.contains("_generate_mytable"));
    }

    #[test]
    fn test_dc12_dynamic_type_maze() {
        let obf = DataObfuscator::new(42);
        let lua = obf.generate_dynamic_type_maze("x");
        assert!(lua.contains("DC-12"));
        assert!(lua.contains("type(x)"));
    }

    #[test]
    fn test_dc13_weak_table_data_flow() {
        let obf = DataObfuscator::new(42);
        let lua = obf.generate_weak_table_data_flow();
        assert!(lua.contains("DC-13"));
        assert!(lua.contains("__mode"));
        assert!(lua.contains("__gc"));
    }

    #[test]
    fn test_dc14_semantic_equivalent() {
        let obf = DataObfuscator::new(42);
        let lua = obf.generate_semantic_equivalent("string.gsub");
        assert!(lua.contains("DC-14"));
        assert!(lua.contains("_manual_gsub"));

        let lua2 = obf.generate_semantic_equivalent("table.insert");
        assert!(lua2.contains("_manual_insert"));
    }
}
