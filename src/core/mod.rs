//! Core Module
//!
//! 包含种子系统、配置管理和全局调度器。

pub mod config;
pub mod orchestrator;
pub mod seed;
pub mod stats;

pub use config::{Intensity, ObfuscatorConfig, TargetPlatform};
pub use orchestrator::Orchestrator;
pub use seed::{BuildSeed, LayoutParams, OpcodePosition, OperandPosition};
pub use stats::ObfuscationStats;
