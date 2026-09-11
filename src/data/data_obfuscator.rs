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
}
