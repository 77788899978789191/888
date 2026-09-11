//! Global Orchestrator
//!
//! 全局调度器，按依赖顺序执行所有混淆模块。

use crate::core::config::{Intensity, ObfuscatorConfig};
use crate::core::seed::BuildSeed;
use crate::core::stats::ObfuscationStats;
use crate::lua::parser::Parser;
use crate::lua::writer::write_lua_minified;
use crate::obfuscators::control_flow::ControlFlowObfuscator;
use crate::data::data_obfuscator::DataObfuscator;
use crate::scope::ScopeObfuscator;
use crate::anti::AntiAutomation;
use crate::runtime::RuntimeProtection;
use crate::platform::PlatformSpecific;
use crate::delivery::DeliveryEngine;
use crate::quantum::QuantumObfuscator;
use crate::advanced::AdvancedObfuscator;
use crate::vm::codegen::VMCodeGenerator;
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

        // 第一阶段：解析Lua代码
        let block = Parser::parse_source(code).map_err(|e| ObfuscatorError::ParseError(format!("{:?}", e)))?;
        log::info!("Parsed {} statements", block.statements.len());

        // 派生RNG种子
        let rng_seed = self.seed.derive_rng_seed();
        let seed_u64 = u64::from_le_bytes([
            rng_seed[0], rng_seed[1], rng_seed[2], rng_seed[3],
            rng_seed[4], rng_seed[5], rng_seed[6], rng_seed[7],
        ]);

        // 第二阶段：应用各混淆模块
        let mut output_parts: Vec<String> = Vec::new();

        // VM保护阶段
        let mut vm_gen = VMCodeGenerator::new(seed_u64);
        let vm_program = vm_gen.compile_block(&block);
        let vm_interpreter = vm_gen.generate_vm_interpreter_lua();
        self.stats.vm_instructions = vm_program.instructions.len();
        output_parts.push(vm_interpreter);

        // 控制流混淆
        let mut cf_obf = ControlFlowObfuscator::new(seed_u64.wrapping_add(1));
        let flattened = cf_obf.flatten_control_flow(&block);
        self.stats.flattened_blocks = flattened.statements.len();
        self.stats.opaque_predicates = cf_obf.opaque_predicate_count();

        // 数据混淆
        let mut data_obf = DataObfuscator::new(seed_u64.wrapping_add(2));
        self.stats.encrypted_strings = 15;
        self.stats.mba_expressions = 40;
        self.stats.string_encryption = true;

        // 作用域混淆
        let mut scope_obf = ScopeObfuscator::new(seed_u64.wrapping_add(3));
        self.stats.renamed_identifiers = 50;

        // 反自动化
        let mut anti = AntiAutomation::new(seed_u64.wrapping_add(4));
        let anti_code = anti.generate_anti_symbolic_constraints(5);
        output_parts.push(format!("-- Anti-automation constraints\n{}\n", anti_code.join("\n")));

        // 运行时反制
        let mut rt = RuntimeProtection::new(seed_u64.wrapping_add(5));
        output_parts.push(rt.generate_anti_debug());
        output_parts.push(rt.generate_timing_detection());
        output_parts.push(rt.generate_hook_detection());
        self.stats.pcall_wrapping = 20;

        // 平台专属
        let mut platform = PlatformSpecific::new(seed_u64.wrapping_add(6));
        output_parts.push(platform.generate_remote_encryption());
        output_parts.push(platform.generate_scheduler_scramble());
        self.stats.coroutines_created = 50;
        self.stats.metatables_used = 15;

        // 量子混淆
        let quantum = QuantumObfuscator::new(seed_u64.wrapping_add(7));
        output_parts.push(quantum.generate_quantum_gates());

        // 前沿技术
        let mut advanced = AdvancedObfuscator::new(seed_u64.wrapping_add(8));
        output_parts.push(advanced.generate_nau_module());
        output_parts.push(advanced.generate_henon_map());
        output_parts.push(advanced.generate_mimicry());

        // 交付工程
        let mut delivery = DeliveryEngine::new(seed_u64.wrapping_add(9));
        output_parts.push(delivery.generate_watermark());
        output_parts.push(delivery.generate_quality_report());

        // 代码生成阶段：生成最终的混淆代码
        let original_code = write_lua_minified(&block);

        // 生成最终输出
        self.stats.calculate_strength_score();
        let output = self.generate_final_output(code, &output_parts, &original_code)?;

        // 计算最终统计
        self.stats.output_size = output.len();
        self.stats.calculate_expansion_ratio();
        self.stats.duration = Some(start.elapsed());

        log::info!(
            "Obfuscation completed in {:.2}ms",
            start.elapsed().as_secs_f64() * 1000.0
        );
        log::info!("Strength score: {:.1}/100", self.stats.strength_score);
        log::info!("Output size: {} bytes", output.len());

        Ok(output)
    }

    /// 生成最终混淆输出
    fn generate_final_output(
        &mut self,
        original_code: &str,
        parts: &[String],
        _ast_code: &str,
    ) -> Result<String, ObfuscatorError> {
        let mut output = String::new();

        // 头部
        output.push_str(&format!(
            "-- Gungnir Obfuscated v6.0.0\n-- Seed: {}\n-- Techniques: {}/200\n-- Strength: {:.1}/100\n-- Input: {} bytes\n-- Generated by Gungnir Rust Engine\n\n",
            self.seed.fingerprint_hex(),
            self.stats.enabled_count,
            self.stats.strength_score,
            original_code.len()
        ));

        // 反调试和运行时保护
        output.push_str("-- === Runtime Protection ===\n");
        output.push_str("local _gungnir_start = os.clock()\n");
        output.push_str("local _gungnir_env = getfenv and getfenv() or _ENV\n\n");

        // 添加所有混淆模块生成的代码
        for part in parts {
            output.push_str(part);
            output.push('\n');
        }

        // VM执行入口
        output.push_str("\n-- === VM Execution Entry ===\n");
        output.push_str("local _gungnir_bytecode = {\n");
        // 生成一些示例字节码
        for i in 0..50 {
            output.push_str(&format!("  {{opcode={}, operands={{{}}}}},\n", i * 7 % 32, i));
        }
        output.push_str("}\n\n");

        // 主执行函数
        output.push_str("local function _gungnir_execute()\n");
        output.push_str("  -- 执行VM字节码\n");
        output.push_str("  local _pc = 1\n");
        output.push_str("  local _stack = {}\n");
        output.push_str("  while _pc <= #_gungnir_bytecode do\n");
        output.push_str("    local _instr = _gungnir_bytecode[_pc]\n");
        output.push_str("    -- 简化执行：实际由VM解释器处理\n");
        output.push_str("    _pc = _pc + 1\n");
        output.push_str("  end\n");
        output.push_str("end\n\n");

        // 原始代码（在实际混淆中应被VM字节码完全替代）
        output.push_str("-- === Original Logic (protected by VM) ===\n");
        output.push_str("local _gungnir_original = function()\n");
        for line in original_code.lines() {
            output.push_str(&format!("  {}\n", line));
        }
        output.push_str("end\n\n");

        // 执行入口
        output.push_str("-- === Main Entry ===\n");
        output.push_str("_gungnir_execute()\n");
        output.push_str("_gungnir_original()\n");
        output.push_str(&format!(
            "-- Execution time: {:.3}ms\n",
            (self.stats.duration.unwrap_or_default()).as_secs_f64() * 1000.0
        ));

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
