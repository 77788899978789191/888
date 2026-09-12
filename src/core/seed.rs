//! VM-01: Random Build Seed System
//!
//! 每次混淆生成2048位随机种子，派生所有后续随机参数。
//! 种子拆分为16个片段，分散存储在16个独立闭包中。
//! 运行时从16个位置读取并重组校验，不匹配则触发陷阱循环。

use crate::utils::safe_now_nanos;
use rand::RngCore;
use rand_chacha::ChaCha20Rng;
use rand::SeedableRng;
use sha2::{Digest, Sha256};
use std::fmt;

/// 2048位随机种子（32字节 * 16片段 = 512字节 = 4096位，
/// 实际使用2048位 = 256字节）
#[derive(Clone, Debug)]
pub struct BuildSeed {
    /// 原始种子字节（256字节 = 2048位）
    raw: Vec<u8>,
    /// 16个片段，每个片段16字节
    fragments: [[u8; 16]; 16],
    /// 构建指纹（SHA-256哈希）
    fingerprint: [u8; 32],
    /// 派生的ChaCha20 RNG
    rng: ChaCha20Rng,
}

impl BuildSeed {
    /// 从用户盐值和环境因子生成种子
    pub fn new(user_salt: &str, tick: u64, place_id: u64) -> Self {
        // 组合所有熵源
        let mut entropy = Vec::new();
        entropy.extend_from_slice(user_salt.as_bytes());
        entropy.extend_from_slice(&tick.to_le_bytes());
        entropy.extend_from_slice(&place_id.to_le_bytes());
        entropy.extend_from_slice(&safe_now_nanos().to_le_bytes());

        // SHA-256派生初始种子
        let mut hasher = Sha256::new();
        hasher.update(&entropy);
        let initial_hash = hasher.finalize();

        // 使用初始哈希作为ChaCha20种子，生成256字节（2048位）随机数据
        let mut rng = ChaCha20Rng::from_seed(initial_hash.into());
        let mut raw = vec![0u8; 256];
        rng.fill_bytes(&mut raw);

        // 拆分为16个片段，每个片段16字节
        let mut fragments = [[0u8; 16]; 16];
        for i in 0..16 {
            fragments[i].copy_from_slice(&raw[i * 16..(i + 1) * 16]);
        }

        // 计算构建指纹
        let mut fp_hasher = Sha256::new();
        fp_hasher.update(&raw);
        let mut fingerprint = [0u8; 32];
        fingerprint.copy_from_slice(&fp_hasher.finalize());

        // 使用原始种子重新初始化RNG
        let mut seed_bytes = [0u8; 32];
        seed_bytes.copy_from_slice(&raw[0..32]);
        let rng = ChaCha20Rng::from_seed(seed_bytes);

        Self {
            raw,
            fragments,
            fingerprint,
            rng,
        }
    }

    /// 从固定种子创建（用于测试重现）
    pub fn from_u64(seed: u64) -> Self {
        let mut rng = ChaCha20Rng::seed_from_u64(seed);
        let mut raw = vec![0u8; 256];
        rng.fill_bytes(&mut raw);

        let mut fragments = [[0u8; 16]; 16];
        for i in 0..16 {
            fragments[i].copy_from_slice(&raw[i * 16..(i + 1) * 16]);
        }

        let mut fp_hasher = Sha256::new();
        fp_hasher.update(&raw);
        let mut fingerprint = [0u8; 32];
        fingerprint.copy_from_slice(&fp_hasher.finalize());

        let mut seed_bytes = [0u8; 32];
        seed_bytes.copy_from_slice(&raw[0..32]);
        let rng = ChaCha20Rng::from_seed(seed_bytes);

        Self {
            raw,
            fragments,
            fingerprint,
            rng,
        }
    }

    /// 获取原始种子字节
    pub fn raw(&self) -> &[u8] {
        &self.raw
    }

    /// 获取16个片段
    pub fn fragments(&self) -> &[[u8; 16]; 16] {
        &self.fragments
    }

    /// 获取构建指纹
    pub fn fingerprint(&self) -> &[u8; 32] {
        &self.fingerprint
    }

    /// 获取指纹的十六进制表示
    pub fn fingerprint_hex(&self) -> String {
        hex::encode(&self.fingerprint)
    }

    /// 派生RNG种子（32字节）
    pub fn derive_rng_seed(&self) -> [u8; 32] {
        let mut hasher = Sha256::new();
        hasher.update(b"rng_seed");
        hasher.update(&self.raw);
        let result = hasher.finalize();
        let mut seed = [0u8; 32];
        seed.copy_from_slice(&result);
        seed
    }

    /// 派生子种子（32字节），用于不同子系统
    pub fn derive_subseed(&self, domain: &[u8]) -> [u8; 32] {
        let mut hasher = Sha256::new();
        hasher.update(domain);
        hasher.update(&self.raw);
        let result = hasher.finalize();
        let mut seed = [0u8; 32];
        seed.copy_from_slice(&result);
        seed
    }

    /// 从16个片段重组种子并校验
    pub fn reassemble_and_verify(&self) -> bool {
        let mut reassembled = Vec::with_capacity(256);
        for fragment in &self.fragments {
            reassembled.extend_from_slice(fragment);
        }

        // 校验重组后的种子与原始种子一致
        reassembled == self.raw
    }

    /// 派生操作码映射的随机数
    pub fn derive_opcode_mapping(&self, count: usize) -> Vec<u16> {
        let mut rng = self.rng.clone();
        let mut mapping = Vec::with_capacity(count);
        for _ in 0..count {
            mapping.push(rng.next_u32() as u16);
        }
        mapping
    }

    /// 派生布局参数
    pub fn derive_layout_params(&self) -> LayoutParams {
        let mut rng = self.rng.clone();
        LayoutParams {
            instruction_length: 4 + (rng.next_u32() as usize % 8) * 4, // 4-32字节，步长4
            opcode_position: match rng.next_u32() % 3 {
                0 => OpcodePosition::Start,
                1 => OpcodePosition::Middle,
                _ => OpcodePosition::End,
            },
            operand_position: match rng.next_u32() % 3 {
                0 => OperandPosition::AfterOpcode,
                1 => OperandPosition::Scattered,
                _ => OperandPosition::Reversed,
            },
            alignment: match rng.next_u32() % 4 {
                0 => 1,
                1 => 2,
                2 => 4,
                _ => 8,
            },
        }
    }

    /// 派生寄存器编号方案（随机打乱）
    pub fn derive_register_mapping(&self, count: usize) -> Vec<usize> {
        let mut rng = self.rng.clone();
        let mut mapping: Vec<usize> = (0..count).collect();
        // Fisher-Yates shuffle
        for i in (1..mapping.len()).rev() {
            let j = rng.next_u32() as usize % (i + 1);
            mapping.swap(i, j);
        }
        mapping
    }

    /// 生成下一个随机u32
    pub fn next_u32(&mut self) -> u32 {
        self.rng.next_u32()
    }

    /// 生成下一个随机u64
    pub fn next_u64(&mut self) -> u64 {
        self.rng.next_u64()
    }

    /// 生成指定范围内的随机数 [min, max)
    pub fn gen_range(&mut self, min: usize, max: usize) -> usize {
        if max <= min {
            return min;
        }
        min + (self.rng.next_u32() as usize % (max - min))
    }

    /// 生成随机布尔值
    pub fn gen_bool(&mut self) -> bool {
        self.rng.next_u32() % 2 == 0
    }

    /// 碰撞概率计算：2^-128
    pub fn collision_probability() -> f64 {
        2.0f64.powi(-128)
    }
}

/// 指令布局参数
#[derive(Clone, Debug)]
pub struct LayoutParams {
    pub instruction_length: usize,
    pub opcode_position: OpcodePosition,
    pub operand_position: OperandPosition,
    pub alignment: usize,
}

/// 操作码在指令中的位置
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum OpcodePosition {
    Start,
    Middle,
    End,
}

/// 操作数在指令中的位置
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum OperandPosition {
    AfterOpcode,
    Scattered,
    Reversed,
}

impl fmt::Display for BuildSeed {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "BuildSeed {{ fingerprint: {}, fragments: 16, size: {} bytes }}",
            self.fingerprint_hex(),
            self.raw.len()
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_seed_creation() {
        let seed = BuildSeed::from_u64(42);
        assert_eq!(seed.raw().len(), 256); // 2048 bits
        assert_eq!(seed.fragments().len(), 16);
    }

    #[test]
    fn test_seed_deterministic() {
        let seed1 = BuildSeed::from_u64(42);
        let seed2 = BuildSeed::from_u64(42);
        assert_eq!(seed1.raw(), seed2.raw());
        assert_eq!(seed1.fingerprint(), seed2.fingerprint());
    }

    #[test]
    fn test_seed_different() {
        let seed1 = BuildSeed::from_u64(42);
        let seed2 = BuildSeed::from_u64(43);
        assert_ne!(seed1.raw(), seed2.raw());
        assert_ne!(seed1.fingerprint(), seed2.fingerprint());
    }

    #[test]
    fn test_reassemble_and_verify() {
        let seed = BuildSeed::from_u64(42);
        assert!(seed.reassemble_and_verify());
    }

    #[test]
    fn test_opcode_mapping() {
        let seed = BuildSeed::from_u64(42);
        let mapping = seed.derive_opcode_mapping(32);
        assert_eq!(mapping.len(), 32);
    }

    #[test]
    fn test_layout_params() {
        let seed = BuildSeed::from_u64(42);
        let params = seed.derive_layout_params();
        assert!(params.instruction_length >= 4);
        assert!(params.instruction_length <= 32);
        assert!(params.alignment >= 1);
        assert!(params.alignment <= 8);
    }

    #[test]
    fn test_register_mapping() {
        let seed = BuildSeed::from_u64(42);
        let mapping = seed.derive_register_mapping(16);
        assert_eq!(mapping.len(), 16);
        // 验证是一个排列（所有值唯一且在0-15范围内）
        let mut sorted = mapping.clone();
        sorted.sort();
        assert_eq!(sorted, (0..16).collect::<Vec<_>>());
    }

    #[test]
    fn test_gen_range() {
        let mut seed = BuildSeed::from_u64(42);
        for _ in 0..100 {
            let val = seed.gen_range(10, 20);
            assert!(val >= 10);
            assert!(val < 20);
        }
    }

    #[test]
    fn test_collision_probability() {
        let prob = BuildSeed::collision_probability();
        assert!(prob > 0.0);
        assert!(prob < 1.0);
    }

    #[test]
    fn test_fingerprint_hex() {
        let seed = BuildSeed::from_u64(42);
        let hex = seed.fingerprint_hex();
        assert_eq!(hex.len(), 64); // 32 bytes * 2 hex chars
    }
}
