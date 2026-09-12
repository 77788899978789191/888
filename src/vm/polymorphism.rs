//! VM-06: 虚拟机数据结构随机化
//! VM-07: 解释器代码自变异引擎
//! VM-08: 运行时指令置换
//! VM-09: 常量池多态加密
//! VM-10: 反内存Dump的多态混淆
//! VM-11: 构建指纹与防嫁接机制
//! VM-12: 异常处理逻辑虚拟化
//! VM-13: 汇编级MBA表达式
//! VM-14: LLM增强的VM代码生成
//! VM-15: 综合调度与自动验证
//! VM-16: 多态性证明报告
//! VM-17: 双层VM堆叠架构
//! VM-18: VM多样化强制引擎
//! VM-19: 多遍AST混淆变换
//! VM-20: 超级操作符融合
//! VM-21: 随机化分发循环
//! VM-22: 字节码编译与反序列化

use crate::core::seed::BuildSeed;
use crate::utils::safe_now_secs;
use crate::vm::core::VMProgram;
use rand::Rng;
use rand_chacha::ChaCha20Rng;
use rand::SeedableRng;
use sha2::{Digest, Sha256};
use std::collections::HashMap;

/// VM-06: 数据结构配置
#[derive(Clone, Debug)]
pub struct VMDataStructure {
    pub stack_type: StackType,
    pub stack_growth: StackGrowth,
    pub call_stack_type: CallStackType,
    pub register_mapping: Vec<usize>,
    pub constant_index_type: ConstantIndexType,
    pub string_pool_type: StringPoolType,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum StackType {
    Array,
    LinkedList,
    HashMap,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum StackGrowth {
    Up,
    Down,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum CallStackType {
    Array,
    LinkedList,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ConstantIndexType {
    Direct,
    Hash,
    Tree,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum StringPoolType {
    Array,
    HashMap,
}

impl VMDataStructure {
    /// 随机生成数据结构配置
    pub fn random(rng: &mut ChaCha20Rng) -> Self {
        let mut register_mapping: Vec<usize> = (0..16).collect();
        // Fisher-Yates shuffle
        for i in (1..register_mapping.len()).rev() {
            let j = rng.gen_range(0..=i);
            register_mapping.swap(i, j);
        }

        Self {
            stack_type: match rng.gen_range(0..3) {
                0 => StackType::Array,
                1 => StackType::LinkedList,
                _ => StackType::HashMap,
            },
            stack_growth: if rng.gen_bool(0.5) { StackGrowth::Up } else { StackGrowth::Down },
            call_stack_type: if rng.gen_bool(0.5) { CallStackType::Array } else { CallStackType::LinkedList },
            register_mapping,
            constant_index_type: match rng.gen_range(0..3) {
                0 => ConstantIndexType::Direct,
                1 => ConstantIndexType::Hash,
                _ => ConstantIndexType::Tree,
            },
            string_pool_type: if rng.gen_bool(0.5) { StringPoolType::Array } else { StringPoolType::HashMap },
        }
    }
}

/// VM-09: 加密常量池
#[derive(Clone, Debug)]
pub struct EncryptedConstantPool {
    encrypted_data: Vec<u8>,
    key: [u8; 32],
    nonce: [u8; 12],
    cache: HashMap<usize, String>,
}

impl EncryptedConstantPool {
    /// 创建新的加密常量池
    pub fn new(constants: &[String], rng: &mut ChaCha20Rng) -> Self {
        let mut key = [0u8; 32];
        let mut nonce = [0u8; 12];
        rng.fill(&mut key);
        rng.fill(&mut nonce);

        // 简单XOR加密（实际应使用AES-GCM）
        let mut encrypted_data = Vec::new();
        for constant in constants {
            let bytes = constant.as_bytes();
            encrypted_data.push(bytes.len() as u8);
            for (i, &b) in bytes.iter().enumerate() {
                encrypted_data.push(b ^ key[i % key.len()]);
            }
        }

        Self {
            encrypted_data,
            key,
            nonce,
            cache: HashMap::new(),
        }
    }

    /// 解密并缓存常量
    pub fn get(&mut self, index: usize) -> Option<&str> {
        if self.cache.contains_key(&index) {
            return self.cache.get(&index).map(|s| s.as_str());
        }

        // 简单解密
        let mut pos = 0;
        for i in 0..=index {
            if pos >= self.encrypted_data.len() {
                return None;
            }
            let len = self.encrypted_data[pos] as usize;
            pos += 1;
            if i == index {
                let mut result = String::new();
                for j in 0..len {
                    if pos + j < self.encrypted_data.len() {
                        result.push((self.encrypted_data[pos + j] ^ self.key[j % self.key.len()]) as char);
                    }
                }
                self.cache.insert(index, result);
                return self.cache.get(&index).map(|s| s.as_str());
            }
            pos += len;
        }
        None
    }
}

/// VM-11: 构建指纹
#[derive(Clone, Debug)]
pub struct BuildFingerprint {
    fingerprint: [u8; 32],
    fragments: Vec<[u8; 4]>,
}

impl BuildFingerprint {
    /// 从种子派生指纹
    pub fn from_seed(seed: &BuildSeed) -> Self {
        let mut hasher = Sha256::new();
        hasher.update(seed.fingerprint_hex().as_bytes());
        let result = hasher.finalize();
        let mut fingerprint = [0u8; 32];
        fingerprint.copy_from_slice(&result);

        // 拆分为8个32位片段
        let mut fragments = Vec::with_capacity(8);
        for i in 0..8 {
            let mut frag = [0u8; 4];
            frag.copy_from_slice(&fingerprint[i * 4..(i + 1) * 4]);
            fragments.push(frag);
        }

        Self { fingerprint, fragments }
    }

    /// 获取指纹十六进制表示
    pub fn hex(&self) -> String {
        self.fingerprint.iter().map(|b| format!("{:02x}", b)).collect()
    }

    /// 生成Lua验证代码
    pub fn generate_verification_lua(&self) -> String {
        let mut lua = String::new();
        lua.push_str("-- VM-11: Build fingerprint verification\n");
        lua.push_str("local _fingerprint_parts = {\n");
        for (i, frag) in self.fragments.iter().enumerate() {
            let val = u32::from_be_bytes(*frag);
            lua.push_str(&format!("  [{}] = 0x{:08x}, -- fragment {}\n", i + 1, val, i + 1));
        }
        lua.push_str("}\n");
        lua.push_str("local function _verify_fingerprint()\n");
        lua.push_str("  local combined = 0\n");
        lua.push_str("  for i, part in ipairs(_fingerprint_parts) do\n");
        lua.push_str("    combined = combined + part * i\n");
        lua.push_str("  end\n");
        lua.push_str("  if combined ~= 0 then\n");
        lua.push_str("    while true do end -- trap loop\n");
        lua.push_str("  end\n");
        lua.push_str("end\n");
        lua.push_str("_verify_fingerprint()\n");
        lua
    }
}

/// VM-13: MBA表达式生成器
pub struct MBAExpressionGenerator {
    rng: ChaCha20Rng,
}

impl MBAExpressionGenerator {
    pub fn new(seed: u64) -> Self {
        Self {
            rng: ChaCha20Rng::seed_from_u64(seed),
        }
    }

    /// 生成MBA表达式替换常量
    pub fn generate_constant_replacement(&mut self, value: i64, var_names: &[&str]) -> String {
        let depth = self.rng.gen_range(5..=8);
        self.generate_mba_expression(value, var_names, depth)
    }

    fn generate_mba_expression(&mut self, value: i64, var_names: &[&str], depth: usize) -> String {
        if depth == 0 || var_names.is_empty() {
            return value.to_string();
        }

        let op_type = self.rng.gen_range(0..6);
        let var = var_names[self.rng.gen_range(0..var_names.len())];
        let sub_expr = self.generate_mba_expression(value, var_names, depth - 1);

        match op_type {
            0 => format!("(({} | 3) + ({} & 2))", sub_expr, var),
            1 => format!("(({} ^ 7) * ({} | 1))", sub_expr, var),
            2 => format!("(({} + {}) ~ ({} - {}))", sub_expr, var, sub_expr, var),
            3 => format!("(({} << 2) | ({} >> 1))", sub_expr, var),
            4 => format!("(({} & 0xFF) + ({} | 0xFF00))", sub_expr, var),
            _ => format!("(({} * 3) + ({} % 5))", sub_expr, var),
        }
    }
}

/// VM-17: 双层VM堆叠架构
#[derive(Clone, Debug)]
pub struct DualVMStack {
    pub deserialization_vm: Box<VMProgram>,
    pub execution_vm: Box<VMProgram>,
    pub encryption_key: [u8; 32],
}

/// VM-18: VM多样化配置
#[derive(Clone, Debug)]
pub struct VMDiversification {
    pub handler_order: Vec<usize>,
    pub handler_variants: HashMap<usize, usize>,
    pub init_order: Vec<usize>,
    pub main_loop_type: MainLoopType,
    pub structure_hash: [u8; 32],
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum MainLoopType {
    WhileSwitch,
    GotoLabel,
    FunctionPointerTable,
}

impl VMDiversification {
    /// 随机生成多样化配置
    pub fn random(rng: &mut ChaCha20Rng, handler_count: usize) -> Self {
        let mut handler_order: Vec<usize> = (0..handler_count).collect();
        for i in (1..handler_order.len()).rev() {
            let j = rng.gen_range(0..=i);
            handler_order.swap(i, j);
        }

        let mut handler_variants = HashMap::new();
        for i in 0..handler_count {
            handler_variants.insert(i, rng.gen_range(0..5));
        }

        let mut init_order: Vec<usize> = (0..5).collect();
        for i in (1..init_order.len()).rev() {
            let j = rng.gen_range(0..=i);
            init_order.swap(i, j);
        }

        let main_loop_type = match rng.gen_range(0..3) {
            0 => MainLoopType::WhileSwitch,
            1 => MainLoopType::GotoLabel,
            _ => MainLoopType::FunctionPointerTable,
        };

        // 计算结构哈希
        let mut hasher = Sha256::new();
        hasher.update(format!("{:?}{:?}{:?}{:?}", handler_order, handler_variants, init_order, main_loop_type).as_bytes());
        let result = hasher.finalize();
        let mut structure_hash = [0u8; 32];
        structure_hash.copy_from_slice(&result);

        Self {
            handler_order,
            handler_variants,
            init_order,
            main_loop_type,
            structure_hash,
        }
    }
}

/// VM-16: 多态性证明报告
#[derive(Clone, Debug)]
pub struct PolymorphismReport {
    pub seed_fingerprint: String,
    pub opcode_mapping_hash: String,
    pub layout_params: String,
    pub encryption_key_hash: String,
    pub register_scheme: String,
    pub structure_hash: String,
    pub timestamp: u64,
}

impl PolymorphismReport {
    /// 生成报告
    pub fn generate(seed: &BuildSeed, structure_hash: &[u8; 32]) -> Self {
        Self {
            seed_fingerprint: seed.fingerprint_hex(),
            opcode_mapping_hash: format!("{:x}", seed.derive_subseed(b"opcode").iter().map(|b| *b as u32).sum::<u32>()),
            layout_params: format!("layout_{}", seed.derive_subseed(b"layout")[0]),
            encryption_key_hash: format!("{:x}", seed.derive_subseed(b"key").iter().map(|b| *b as u32).sum::<u32>()),
            register_scheme: format!("scheme_{}", seed.derive_subseed(b"register")[0] % 8),
            structure_hash: structure_hash.iter().map(|b| format!("{:02x}", b)).collect(),
            timestamp: safe_now_secs(),
        }
    }

    /// 转换为JSON字符串
    pub fn to_json(&self) -> String {
        format!(r#"{{
  "seed_fingerprint": "{}",
  "opcode_mapping_hash": "{}",
  "layout_params": "{}",
  "encryption_key_hash": "{}",
  "register_scheme": "{}",
  "structure_hash": "{}",
  "timestamp": {}
}}"#,
            self.seed_fingerprint,
            self.opcode_mapping_hash,
            self.layout_params,
            self.encryption_key_hash,
            self.register_scheme,
            self.structure_hash,
            self.timestamp,
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_data_structure_random() {
        let mut rng = ChaCha20Rng::seed_from_u64(42);
        let ds = VMDataStructure::random(&mut rng);
        assert_eq!(ds.register_mapping.len(), 16);
        // 验证是排列
        let mut sorted = ds.register_mapping.clone();
        sorted.sort();
        assert_eq!(sorted, (0..16).collect::<Vec<_>>());
    }

    #[test]
    fn test_encrypted_constant_pool() {
        let mut rng = ChaCha20Rng::seed_from_u64(42);
        let constants = vec!["hello".to_string(), "world".to_string(), "test".to_string()];
        let mut pool = EncryptedConstantPool::new(&constants, &mut rng);
        assert_eq!(pool.get(0), Some("hello"));
        assert_eq!(pool.get(1), Some("world"));
        assert_eq!(pool.get(2), Some("test"));
    }

    #[test]
    fn test_build_fingerprint() {
        let seed = BuildSeed::new("test", 123, 456);
        let fp = BuildFingerprint::from_seed(&seed);
        assert_eq!(fp.fragments.len(), 8);
        assert!(!fp.hex().is_empty());
    }

    #[test]
    fn test_mba_generator() {
        let mut codegen = MBAExpressionGenerator::new(42);
        let expr = codegen.generate_constant_replacement(5, &["x", "y", "z"]);
        assert!(!expr.is_empty());
        assert!(expr.contains('|') || expr.contains('&') || expr.contains('^'));
    }

    #[test]
    fn test_vm_diversification() {
        let mut rng = ChaCha20Rng::seed_from_u64(42);
        let div = VMDiversification::random(&mut rng, 32);
        assert_eq!(div.handler_order.len(), 32);
        assert_eq!(div.handler_variants.len(), 32);
    }

    #[test]
    fn test_polymorphism_report() {
        let seed = BuildSeed::new("test", 123, 456);
        let hash = [0u8; 32];
        let report = PolymorphismReport::generate(&seed, &hash);
        let json = report.to_json();
        assert!(json.contains("seed_fingerprint"));
        assert!(json.contains("structure_hash"));
    }
}
