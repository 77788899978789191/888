//! Gungnir - Ultimate Lua 5.1 Obfuscator
//!
//! 200+项混淆技术，支持WASM、CLI、安卓、iOS多端部署。
//!
//! # 示例
//!
//! ```rust
//! use gungnir::{ObfuscatorConfig, Orchestrator};
//!
//! let config = ObfuscatorConfig::maximum();
//! let mut orchestrator = Orchestrator::new(config);
//! let result = orchestrator.obfuscate("local x = 10");
//! assert!(result.is_ok());
//! ```

pub mod core;
pub mod vm;
pub mod obfuscators;
pub mod data;
pub mod scope;
pub mod anti;
pub mod runtime;
pub mod platform;
pub mod delivery;
pub mod quantum;
pub mod advanced;
pub mod lua;
pub mod wasm;

// 核心导出
pub use core::config::{Intensity, ObfuscatorConfig, TargetPlatform};
pub use core::orchestrator::{ObfuscationPhase, Orchestrator, ObfuscatorError};
pub use core::seed::{BuildSeed, LayoutParams, OpcodePosition, OperandPosition};
pub use core::stats::{ObfuscationStats, TechniqueStat};

/// 库版本号
pub const VERSION: &str = "7.0.0";

/// 总技术数量
pub const TOTAL_TECHNIQUES: usize = 238;

/// 统一混淆入口
///
/// # 参数
/// * `code` - Lua源代码
/// * `config_json` - JSON格式的配置字符串
///
/// # 返回
/// 混淆后的Lua代码
pub fn obfuscate(code: &str, config_json: &str) -> Result<String, ObfuscatorError> {
    let config = ObfuscatorConfig::from_json(config_json)
        .map_err(|e| ObfuscatorError::ConfigError(e.to_string()))?;
    let mut orchestrator = Orchestrator::new(config);
    orchestrator.obfuscate(code)
}

/// 使用默认配置进行混淆
pub fn obfuscate_default(code: &str) -> Result<String, ObfuscatorError> {
    let config = ObfuscatorConfig::maximum();
    let mut orchestrator = Orchestrator::new(config);
    orchestrator.obfuscate(code)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version() {
        assert_eq!(VERSION, "7.0.0");
    }

    #[test]
    fn test_total_techniques() {
        assert_eq!(TOTAL_TECHNIQUES, 238);
    }

    #[test]
    fn test_obfuscate_default() {
        let result = obfuscate_default("local x = 10");
        assert!(result.is_ok());
        let output = result.unwrap();
        assert!(output.contains("Gungnir"));
    }

    #[test]
    fn test_obfuscate_with_config() {
        let config = r#"{
            "intensity": "Level10",
            "user_salt": "test-salt",
            "auto_verify": true
        }"#;
        let result = obfuscate("local x = 10", config);
        assert!(result.is_ok());
    }
}
