//! Data Module - 量子级数据与常量混淆（18项技术）
//!
//! 包含DC-01到DC-18的全部数据混淆技术实现。

pub mod data_obfuscator;

pub use data_obfuscator::{ConstantValue, DataObfuscator};

/// 数据混淆技术数量
pub const DATA_TECHNIQUE_COUNT: usize = 18;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_technique_count() {
        assert_eq!(DATA_TECHNIQUE_COUNT, 18);
    }
}
