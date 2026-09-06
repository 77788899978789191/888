//! Obfuscators Module - 炼狱级控制流混淆（20项技术）
//!
//! 包含CF-01到CF-20的全部控制流混淆技术实现。

pub mod control_flow;

pub use control_flow::ControlFlowObfuscator;

/// 控制流技术数量
pub const CONTROL_FLOW_TECHNIQUE_COUNT: usize = 20;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_technique_count() {
        assert_eq!(CONTROL_FLOW_TECHNIQUE_COUNT, 20);
    }
}
