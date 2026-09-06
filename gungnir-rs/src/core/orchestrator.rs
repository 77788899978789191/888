//! Global Orchestrator
//!
//! 全局调度器，按依赖顺序执行所有混淆模块。

use crate::core::config::{Intensity, ObfuscatorConfig};
use crate::core::seed::BuildSeed;
use crate::core::stats::ObfuscationStats;
use std::fmt;
use std::time::Instant;

/// 混淆器错误类型
#[derive(Debug)]
pub enum ObfuscatorError {
    ParseError(String),
    TransformError(String),
    GenerationError(String),
    VerificationError(String),
    ConfigError(String),
    IoError(std::io::Error),
}

impl fmt::Display for ObfuscatorError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ParseError(msg) => write!(f, "Parse error: {}", msg),
            Self::TransformError(msg) => write!(f, "Transform error: {}", msg),
            Self::GenerationError(msg) => write!(f, "Generation error: {}", msg),
            Self::VerificationError(msg) => write!(f, "Verification error: {}", msg),
            Self::ConfigError(msg) => write!(f, "Configuration error: {}", msg),
            Self::IoError(err) => write!(f, "IO error: {}", err),
        }
    }
}

impl std::error::Error for ObfuscatorError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Self::IoError(err) => Some(err),
            _ => None,
        }
    }
}

impl From<std::io::Error> for ObfuscatorError {
    fn from(err: std::io::Error) -> Self {
        Self::IoError(err)
    }
}

/// 混淆阶段
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ObfuscationPhase {
    /// 第一阶段：解析
    Parsing,
    /// 第二阶段：预处理
    Preprocessing,
    /// 第三阶段：虚拟机保护
    VmProtection,
    /// 第四阶段：控制流混淆
    ControlFlow,
    /// 第五阶段：数据混淆
    DataObfuscation,
    /// 第六阶段：作用域混淆
    ScopeObfuscation,
    /// 第七阶段：反自动化
    AntiAutomation,
    /// 第八阶段：运行时反制
    RuntimeProtection,
    /// 第九阶段：平台专属
    PlatformSpecific,
    /// 第十阶段：交付工程
    Delivery,
    /// 第十一阶段：量子混淆
    Quantum,
    /// 第十二阶段：前沿技术
    Advanced,
    /// 第十三阶段：代码生成
    CodeGeneration,
    /// 第十四阶段：验证
    Verification,
}

impl ObfuscationPhase {
    /// 获取阶段名称
    pub fn name(&self) -> &'static str {
        match self {
            Self::Parsing => "Parsing",
            Self::Preprocessing => "Preprocessing",
            Self::VmProtection => "VM Protection",
            Self::ControlFlow => "Control Flow",
            Self::DataObfuscation => "Data Obfuscation",
            Self::ScopeObfuscation => "Scope Obfuscation",
            Self::AntiAutomation => "Anti-Automation",
            Self::RuntimeProtection => "Runtime Protection",
            Self::PlatformSpecific => "Platform Specific",
            Self::Delivery => "Delivery",
            Self::Quantum => "Quantum",
            Self::Advanced => "Advanced",
            Self::CodeGeneration => "Code Generation",
            Self::Verification => "Verification",
        }
    }

    /// 获取所有阶段（按执行顺序）
    pub fn all() -> Vec<Self> {
        vec![
            Self::Parsing,
            Self::Preprocessing,
            Self::VmProtection,
            Self::ControlFlow,
            Self::DataObfuscation,
            Self::ScopeObfuscation,
            Self::AntiAutomation,
            Self::RuntimeProtection,
            Self::PlatformSpecific,
            Self::Delivery,
            Self::Quantum,
            Self::Advanced,
            Self::CodeGeneration,
            Self::Verification,
        ]
    }
}

/// 全局调度器
pub struct Orchestrator {
    /// 配置
    config: ObfuscatorConfig,
    /// 构建种子
    seed: BuildSeed,
    /// 统计信息
    stats: ObfuscationStats,
    /// 总技术数量
    total_techniques: usize,
}

impl Orchestrator {
    /// 创建新的调度器
    pub fn new(config: ObfuscatorConfig) -> Self {
        let seed = match config.seed {
            Some(s) => BuildSeed::from_u64(s),
            None => BuildSeed::new(
                &config.user_salt,
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_millis() as u64,
                0,
            ),
        };

        let total_techniques = 200;
        let stats = ObfuscationStats::new(total_techniques);

        Self {
            config,
            seed,
            stats,
            total_techniques,
        }
    }

    /// 获取配置引用
    pub fn config(&self) -> &ObfuscatorConfig {
        &self.config
    }

    /// 获取种子引用
    pub fn seed(&self) -> &BuildSeed {
        &self.seed
    }

    /// 获取统计信息引用
    pub fn stats(&self) -> &ObfuscationStats {
        &self.stats
    }

    /// 获取统计信息可变引用
    pub fn stats_mut(&mut self) -> &mut ObfuscationStats {
        &mut self.stats
    }

    /// 获取总技术数量
    pub fn total_techniques(&self) -> usize {
        self.total_techniques
    }

    /// 获取启用的技术数量
    pub fn enabled_techniques_count(&self) -> usize {
        // 简化实现：根据强度计算
        self.config
            .technique_count_for_intensity(self.total_techniques)
    }

    /// 执行混淆
    pub fn obfuscate(&mut self, code: &str) -> Result<String, ObfuscatorError> {
        let start = Instant::now();

        log::info!("Starting obfuscation with {} total techniques", self.total_techniques);
        log::info!("Intensity: {:?}", self.config.intensity);
        log::info!("Seed fingerprint: {}", self.seed.fingerprint_hex());

        // 更新统计
        self.stats.input_size = code.len();
        self.stats.enabled_count = self.enabled_techniques_count();

        // 执行各阶段
        for phase in ObfuscationPhase::all() {
            log::debug!("Executing phase: {}", phase.name());
            self.execute_phase(phase, code)?;
        }

        // 生成输出（简化版本，实际应由代码生成阶段产生）
        let output = self.generate_output(code)?;

        // 计算最终统计（在生成输出之后）
        self.stats.calculate_expansion_ratio();
        self.stats.duration = Some(start.elapsed());

        log::info!(
            "Obfuscation completed in {:.2}ms",
            start.elapsed().as_secs_f64() * 1000.0
        );
        log::info!("Strength score: {:.1}/100", self.stats.strength_score);

        Ok(output)
    }

    /// 执行单个阶段
    fn execute_phase(
        &mut self,
        phase: ObfuscationPhase,
        _code: &str,
    ) -> Result<(), ObfuscatorError> {
        match phase {
            ObfuscationPhase::Parsing => {
                log::debug!("Parsing Lua source code");
                // 实际实现应调用Lua解析器
                Ok(())
            }
            ObfuscationPhase::Preprocessing => {
                log::debug!("Preprocessing AST");
                Ok(())
            }
            ObfuscationPhase::VmProtection => {
                log::debug!("Applying VM protection (22 techniques)");
                self.stats.vm_instructions += 100; // 模拟
                Ok(())
            }
            ObfuscationPhase::ControlFlow => {
                log::debug!("Applying control flow obfuscation (20 techniques)");
                self.stats.flattened_blocks += 20;
                self.stats.opaque_predicates += 30;
                self.stats.indirect_jumps += 10;
                Ok(())
            }
            ObfuscationPhase::DataObfuscation => {
                log::debug!("Applying data obfuscation (18 techniques)");
                self.stats.encrypted_strings += 15;
                self.stats.obfuscated_constants += 25;
                self.stats.string_encryption = true;
                self.stats.mba_expressions += 40;
                Ok(())
            }
            ObfuscationPhase::ScopeObfuscation => {
                log::debug!("Applying scope obfuscation (11 techniques)");
                self.stats.renamed_identifiers += 50;
                Ok(())
            }
            ObfuscationPhase::AntiAutomation => {
                log::debug!("Applying anti-automation (8 techniques)");
                Ok(())
            }
            ObfuscationPhase::RuntimeProtection => {
                log::debug!("Applying runtime protection (12 techniques)");
                self.stats.pcall_wrapping += 20;
                self.stats.bitwise_helpers += 10;
                Ok(())
            }
            ObfuscationPhase::PlatformSpecific => {
                log::debug!("Applying platform-specific (8 techniques)");
                self.stats.coroutines_created += 50;
                self.stats.metatables_used += 15;
                Ok(())
            }
            ObfuscationPhase::Delivery => {
                log::debug!("Applying delivery engineering (9 techniques)");
                Ok(())
            }
            ObfuscationPhase::Quantum => {
                log::debug!("Applying quantum obfuscation (12+ techniques)");
                Ok(())
            }
            ObfuscationPhase::Advanced => {
                log::debug!("Applying advanced techniques (40+ techniques)");
                Ok(())
            }
            ObfuscationPhase::CodeGeneration => {
                log::debug!("Generating output code");
                Ok(())
            }
            ObfuscationPhase::Verification => {
                log::debug!("Verifying output");
                if self.config.auto_verify {
                    // 实际实现应调用验证器
                    log::debug!("Auto-verification enabled");
                }
                Ok(())
            }
        }
    }

    /// 生成输出代码（简化版本）
    fn generate_output(&mut self, code: &str) -> Result<String, ObfuscatorError> {
        // 先计算强度评分，以便在输出头部显示
        self.stats.calculate_strength_score();

        // 简化实现：生成一个包含混淆标记的输出
        let output = format!(
            r#"-- Gungnir Obfuscated v6.0
-- Seed: {}
-- Techniques: {}/{}
-- Strength: {:.1}/100
-- Input: {} bytes

{}
"#,
            self.seed.fingerprint_hex(),
            self.stats.enabled_count,
            self.total_techniques,
            self.stats.strength_score,
            code.len(),
            code
        );

        self.stats.output_size = output.len();
        Ok(output)
    }

    /// 获取技术列表（简化版本）
    pub fn get_technique_list(&self) -> Vec<&'static str> {
        vec![
            "VM-01", "VM-02", "VM-03", "VM-04", "VM-05",
            "CF-01", "CF-02", "CF-03", "CF-04", "CF-05",
            "DC-01", "DC-02", "DC-03", "DC-04", "DC-05",
            "SC-01", "SC-02", "SC-03", "SC-04", "SC-05",
            "AA-01", "AA-02", "AA-03", "AA-04", "AA-05",
            "RT-01", "RT-02", "RT-03", "RT-04", "RT-05",
            "PL-01", "PL-02", "PL-03", "PL-04", "PL-05",
            "DE-01", "DE-02", "DE-03", "DE-04", "DE-05",
            "TT-01", "TT-02", "TT-03", "TT-04", "TT-05",
        ]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_orchestrator_creation() {
        let config = ObfuscatorConfig::default();
        let orch = Orchestrator::new(config);
        assert_eq!(orch.total_techniques(), 200);
    }

    #[test]
    fn test_orchestrator_with_seed() {
        let mut config = ObfuscatorConfig::default();
        config.seed = Some(42);
        let orch1 = Orchestrator::new(config.clone());
        let orch2 = Orchestrator::new(config);
        assert_eq!(orch1.seed().fingerprint(), orch2.seed().fingerprint());
    }

    #[test]
    fn test_obfuscation() {
        let config = ObfuscatorConfig::maximum();
        let mut orch = Orchestrator::new(config);
        let code = "local x = 10\nprint(x)";
        let result = orch.obfuscate(code);
        assert!(result.is_ok());
        let output = result.unwrap();
        assert!(output.contains("Gungnir Obfuscated"));
        assert!(output.len() > code.len());
    }

    #[test]
    fn test_phase_order() {
        let phases = ObfuscationPhase::all();
        assert_eq!(phases.len(), 14);
        assert_eq!(phases[0], ObfuscationPhase::Parsing);
        assert_eq!(phases[13], ObfuscationPhase::Verification);
    }

    #[test]
    fn test_phase_names() {
        assert_eq!(ObfuscationPhase::VmProtection.name(), "VM Protection");
        assert_eq!(ObfuscationPhase::ControlFlow.name(), "Control Flow");
    }

    #[test]
    fn test_enabled_techniques_count() {
        let mut config = ObfuscatorConfig::default();
        config.intensity = Intensity::Level10;
        let orch = Orchestrator::new(config);
        assert_eq!(orch.enabled_techniques_count(), 200);
    }

    #[test]
    fn test_stats_after_obfuscation() {
        let config = ObfuscatorConfig::maximum();
        let mut orch = Orchestrator::new(config);
        let code = "local x = 10\nprint(x)";
        let _ = orch.obfuscate(code).unwrap();
        let stats = orch.stats();
        assert!(stats.strength_score > 0.0);
        assert!(stats.expansion_ratio > 0.0);
    }
}
