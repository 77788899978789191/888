//! Obfuscation Statistics
//!
//! 记录混淆过程中的各项统计数据。

use serde_json::{Map, Value};
use std::collections::HashMap;
use std::time::Duration;

/// 混淆统计信息
#[derive(Clone, Debug, Default)]
pub struct ObfuscationStats {
    /// 启用的技术数量
    pub enabled_count: usize,
    /// 总技术数量
    pub total_count: usize,
    /// 输入代码大小（字节）
    pub input_size: usize,
    /// 输出代码大小（字节）
    pub output_size: usize,
    /// 体积膨胀率
    pub expansion_ratio: f64,
    /// 重命名的标识符数量
    pub renamed_identifiers: usize,
    /// 加密的字符串数量
    pub encrypted_strings: usize,
    /// 混淆的常量数量
    pub obfuscated_constants: usize,
    /// 分解的表达式数量
    pub decomposed_expressions: usize,
    /// 扁平化的基本块数量
    pub flattened_blocks: usize,
    /// 插入的不透明谓词数量
    pub opaque_predicates: usize,
    /// 插入的垃圾代码数量
    pub garbage_code_count: usize,
    /// 生成的VM指令数量
    pub vm_instructions: usize,
    /// 创建的协程数量
    pub coroutines_created: usize,
    /// 使用的元表数量
    pub metatables_used: usize,
    /// pcall包装数量
    pub pcall_wrapping: usize,
    /// 位运算辅助函数数量
    pub bitwise_helpers: usize,
    /// 间接跳转数量
    pub indirect_jumps: usize,
    /// MBA表达式数量
    pub mba_expressions: usize,
    /// 字符串加密标志
    pub string_encryption: bool,
    /// 各技术的执行统计
    pub technique_stats: HashMap<String, TechniqueStat>,
    /// 混淆耗时
    pub duration: Option<Duration>,
    /// 强度评分（0-100）
    pub strength_score: f64,
}

/// 单个技术的执行统计
#[derive(Clone, Debug, Default)]
pub struct TechniqueStat {
    /// 技术ID
    pub tech_id: String,
    /// 技术名称
    pub tech_name: String,
    /// 是否启用
    pub enabled: bool,
    /// 是否成功执行
    pub executed: bool,
    /// 执行耗时（毫秒）
    pub duration_ms: u128,
    /// 处理的节点数量
    pub nodes_processed: usize,
    /// 生成的代码行数
    pub code_lines_generated: usize,
    /// 错误信息（如果有）
    pub error: Option<String>,
}

impl ObfuscationStats {
    /// 创建新的统计实例
    pub fn new(total_count: usize) -> Self {
        Self {
            total_count,
            ..Default::default()
        }
    }

    /// 计算体积膨胀率
    pub fn calculate_expansion_ratio(&mut self) {
        if self.input_size > 0 {
            self.expansion_ratio = self.output_size as f64 / self.input_size as f64;
        }
    }

    /// 计算强度评分
    pub fn calculate_strength_score(&mut self) -> f64 {
        let mut score = 0.0;

        // 基础分：启用技术比例
        if self.total_count > 0 {
            score += (self.enabled_count as f64 / self.total_count as f64) * 30.0;
        }

        // 字符串加密（+10分）
        if self.string_encryption || self.encrypted_strings > 0 {
            score += 10.0;
        }

        // MBA表达式（+10分，最多）
        score += (self.mba_expressions.min(100) as f64 / 100.0) * 10.0;

        // 不透明谓词（+10分，最多）
        score += (self.opaque_predicates.min(50) as f64 / 50.0) * 10.0;

        // 控制流扁平化（+10分，最多）
        score += (self.flattened_blocks.min(50) as f64 / 50.0) * 10.0;

        // VM指令（+10分，最多）
        score += (self.vm_instructions.min(1000) as f64 / 1000.0) * 10.0;

        // 反调试/反自动化（+10分）
        if self.pcall_wrapping > 0 || self.bitwise_helpers > 0 {
            score += 10.0;
        }

        self.strength_score = score.min(100.0);
        self.strength_score
    }

    /// 记录技术执行
    pub fn record_technique(&mut self, stat: TechniqueStat) {
        self.technique_stats.insert(stat.tech_id.clone(), stat);
    }

    /// 获取技术覆盖率
    pub fn coverage(&self) -> f64 {
        if self.total_count > 0 {
            self.enabled_count as f64 / self.total_count as f64
        } else {
            0.0
        }
    }

    /// 生成统计报告
    pub fn generate_report(&self) -> String {
        format!(
            r#"═══════════════════════════════════════════════════════════════
  GUNGNIR OBFUSCATION REPORT
═══════════════════════════════════════════════════════════════

  Techniques: {}/{} ({:.1}%)
  Input size: {} bytes
  Output size: {} bytes
  Expansion ratio: {:.2}x
  Strength score: {:.1}/100

  ── Transformations ──
  Renamed identifiers: {}
  Encrypted strings: {}
  Obfuscated constants: {}
  Decomposed expressions: {}
  Flattened blocks: {}
  Opaque predicates: {}
  Garbage code inserted: {}
  VM instructions: {}
  Coroutines created: {}
  Metatables used: {}
  pcall wrapping: {}
  MBA expressions: {}
  Indirect jumps: {}

═══════════════════════════════════════════════════════════════
"#,
            self.enabled_count,
            self.total_count,
            self.coverage() * 100.0,
            self.input_size,
            self.output_size,
            self.expansion_ratio,
            self.strength_score,
            self.renamed_identifiers,
            self.encrypted_strings,
            self.obfuscated_constants,
            self.decomposed_expressions,
            self.flattened_blocks,
            self.opaque_predicates,
            self.garbage_code_count,
            self.vm_instructions,
            self.coroutines_created,
            self.metatables_used,
            self.pcall_wrapping,
            self.mba_expressions,
            self.indirect_jumps,
        )
    }

    /// 转换为JSON值
    pub fn to_json(&self) -> Result<String, String> {
        let mut obj = Map::new();
        obj.insert("enabled_count".to_string(), Value::Number(self.enabled_count.into()));
        obj.insert("total_count".to_string(), Value::Number(self.total_count.into()));
        obj.insert("input_size".to_string(), Value::Number(self.input_size.into()));
        obj.insert("output_size".to_string(), Value::Number(self.output_size.into()));
        obj.insert("expansion_ratio".to_string(), Value::from(self.expansion_ratio));
        obj.insert("renamed_identifiers".to_string(), Value::Number(self.renamed_identifiers.into()));
        obj.insert("encrypted_strings".to_string(), Value::Number(self.encrypted_strings.into()));
        obj.insert("obfuscated_constants".to_string(), Value::Number(self.obfuscated_constants.into()));
        obj.insert("decomposed_expressions".to_string(), Value::Number(self.decomposed_expressions.into()));
        obj.insert("flattened_blocks".to_string(), Value::Number(self.flattened_blocks.into()));
        obj.insert("opaque_predicates".to_string(), Value::Number(self.opaque_predicates.into()));
        obj.insert("garbage_code_count".to_string(), Value::Number(self.garbage_code_count.into()));
        obj.insert("vm_instructions".to_string(), Value::Number(self.vm_instructions.into()));
        obj.insert("coroutines_created".to_string(), Value::Number(self.coroutines_created.into()));
        obj.insert("metatables_used".to_string(), Value::Number(self.metatables_used.into()));
        obj.insert("pcall_wrapping".to_string(), Value::Number(self.pcall_wrapping.into()));
        obj.insert("bitwise_helpers".to_string(), Value::Number(self.bitwise_helpers.into()));
        obj.insert("indirect_jumps".to_string(), Value::Number(self.indirect_jumps.into()));
        obj.insert("mba_expressions".to_string(), Value::Number(self.mba_expressions.into()));
        obj.insert("string_encryption".to_string(), Value::Bool(self.string_encryption));
        obj.insert("strength_score".to_string(), Value::from(self.strength_score));

        serde_json::to_string_pretty(&Value::Object(obj)).map_err(|e| e.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_stats_creation() {
        let stats = ObfuscationStats::new(200);
        assert_eq!(stats.total_count, 200);
    }

    #[test]
    fn test_expansion_ratio() {
        let mut stats = ObfuscationStats::default();
        stats.input_size = 100;
        stats.output_size = 300;
        stats.calculate_expansion_ratio();
        assert!((stats.expansion_ratio - 3.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_strength_score() {
        let mut stats = ObfuscationStats::new(200);
        stats.enabled_count = 200;
        stats.string_encryption = true;
        stats.mba_expressions = 100;
        stats.opaque_predicates = 50;
        stats.flattened_blocks = 50;
        stats.vm_instructions = 1000;
        stats.pcall_wrapping = 10;
        let score = stats.calculate_strength_score();
        assert!(score >= 90.0);
        assert!(score <= 100.0);
    }

    #[test]
    fn test_technique_stat() {
        let mut stats = ObfuscationStats::default();
        let stat = TechniqueStat {
            tech_id: "VM-01".to_string(),
            tech_name: "Random Build Seed System".to_string(),
            enabled: true,
            executed: true,
            duration_ms: 100,
            nodes_processed: 50,
            code_lines_generated: 200,
            error: None,
        };
        stats.record_technique(stat);
        assert_eq!(stats.technique_stats.len(), 1);
        assert!(stats.technique_stats.contains_key("VM-01"));
    }

    #[test]
    fn test_report_generation() {
        let stats = ObfuscationStats::new(200);
        let report = stats.generate_report();
        assert!(report.contains("GUNGNIR OBFUSCATION REPORT"));
        assert!(report.contains("200"));
    }
}
