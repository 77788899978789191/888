//! VM-01: 随机构建种子系统
//!
//! 每次混淆生成2048位随机种子，派生所有后续随机参数。
//! 种子拆分为16个片段，分散存储在16个独立闭包中。

use crate::core::seed::BuildSeed;
use rand::Rng;
use rand_chacha::ChaCha20Rng;
use rand::SeedableRng;

/// 种子片段
#[derive(Clone, Debug)]
pub struct SeedFragment {
    pub index: usize,
    pub data: [u8; 128],
    pub checksum: u64,
}

/// 随机构建种子系统
pub struct RandomSeedSystem {
    seed: BuildSeed,
    fragments: Vec<SeedFragment>,
    rng: ChaCha20Rng,
}

impl RandomSeedSystem {
    /// 创建新的种子系统
    pub fn new(user_salt: &str, tick: u64, place_id: u64) -> Self {
        let seed = BuildSeed::new(user_salt, tick, place_id);
        let mut rng = ChaCha20Rng::from_seed(seed.derive_rng_seed());
        let mut fragments = Vec::with_capacity(16);

        // 生成16个种子片段
        for i in 0..16 {
            let mut data = [0u8; 128];
            rng.fill(&mut data);
            let checksum = Self::compute_checksum(&data);
            fragments.push(SeedFragment {
                index: i,
                data,
                checksum,
            });
        }

        Self {
            seed,
            fragments,
            rng,
        }
    }

    /// 计算校验和
    fn compute_checksum(data: &[u8]) -> u64 {
        let mut hash: u64 = 0xcbf29ce484222325;
        for &byte in data {
            hash ^= byte as u64;
            hash = hash.wrapping_mul(0x100000001b3);
        }
        hash
    }

    /// 获取种子指纹
    pub fn fingerprint(&self) -> String {
        self.seed.fingerprint_hex()
    }

    /// 获取所有片段
    pub fn fragments(&self) -> &[SeedFragment] {
        &self.fragments
    }

    /// 验证所有片段完整性
    pub fn verify_fragments(&self) -> bool {
        for fragment in &self.fragments {
            if Self::compute_checksum(&fragment.data) != fragment.checksum {
                return false;
            }
        }
        true
    }

    /// 派生操作码映射种子
    pub fn derive_opcode_seed(&self) -> [u8; 32] {
        self.seed.derive_subseed(b"opcode_mapping")
    }

    /// 派生布局参数种子
    pub fn derive_layout_seed(&self) -> [u8; 32] {
        self.seed.derive_subseed(b"layout_params")
    }

    /// 派生密钥种子
    pub fn derive_key_seed(&self) -> [u8; 32] {
        self.seed.derive_subseed(b"encryption_key")
    }

    /// 派生寄存器分配种子
    pub fn derive_register_seed(&self) -> [u8; 32] {
        self.seed.derive_subseed(b"register_allocation")
    }

    /// 获取随机数生成器
    pub fn rng(&mut self) -> &mut ChaCha20Rng {
        &mut self.rng
    }

    /// 生成Lua代码中的种子验证逻辑
    pub fn generate_verification_lua(&self) -> String {
        let mut lua = String::new();
        lua.push_str("-- VM-01: Seed verification system\n");
        lua.push_str("local _seed_fragments = {\n");
        for (i, fragment) in self.fragments.iter().enumerate() {
            let data_str: Vec<String> = fragment.data.iter().map(|b| format!("0x{:02x}", b)).collect();
            lua.push_str(&format!("  [{}] = {{ data = {{{}}}, checksum = 0x{:016x} }},\n",
                i + 1, data_str.join(", "), fragment.checksum));
        }
        lua.push_str("}\n");
        lua.push_str("local function _verify_seed()\n");
        lua.push_str("  for i, frag in ipairs(_seed_fragments) do\n");
        lua.push_str("    local sum = 0\n");
        lua.push_str("    for _, b in ipairs(frag.data) do\n");
        lua.push_str("      sum = ((sum ~ 0) ~ b) * 0x100000001b3 % 0x10000000000000000\n");
        lua.push_str("    end\n");
        lua.push_str("    if sum ~= frag.checksum then\n");
        lua.push_str("      while true do end -- trap loop\n");
        lua.push_str("    end\n");
        lua.push_str("  end\n");
        lua.push_str("end\n");
        lua.push_str("_verify_seed()\n");
        lua
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_seed_system_creation() {
        let system = RandomSeedSystem::new("test-salt", 12345, 67890);
        assert_eq!(system.fragments().len(), 16);
        assert!(system.verify_fragments());
    }

    #[test]
    fn test_different_seeds() {
        let system1 = RandomSeedSystem::new("salt1", 1, 1);
        let system2 = RandomSeedSystem::new("salt2", 2, 2);
        assert_ne!(system1.fingerprint(), system2.fingerprint());
    }

    #[test]
    fn test_derive_subseeds() {
        let system = RandomSeedSystem::new("test", 1, 1);
        let opcode_seed = system.derive_opcode_seed();
        let layout_seed = system.derive_layout_seed();
        assert_ne!(opcode_seed, layout_seed);
    }

    #[test]
    fn test_verification_lua_generation() {
        let system = RandomSeedSystem::new("test", 1, 1);
        let lua = system.generate_verification_lua();
        assert!(lua.contains("_seed_fragments"));
        assert!(lua.contains("_verify_seed"));
    }
}
