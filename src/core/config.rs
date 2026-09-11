//! Core Configuration Module
//!
//! 管理混淆器的全局配置，包括强度、种子、启用的技术等。

use serde_json::{Map, Value};
use std::collections::HashSet;

/// 混淆强度等级（1-10）
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Intensity {
    Level1 = 1,
    Level2 = 2,
    Level3 = 3,
    Level4 = 4,
    Level5 = 5,
    Level6 = 6,
    Level7 = 7,
    Level8 = 8,
    Level9 = 9,
    Level10 = 10,
}

impl Intensity {
    pub fn from_u8(value: u8) -> Self {
        match value {
            1 => Self::Level1,
            2 => Self::Level2,
            3 => Self::Level3,
            4 => Self::Level4,
            5 => Self::Level5,
            6 => Self::Level6,
            7 => Self::Level7,
            8 => Self::Level8,
            9 => Self::Level9,
            _ => Self::Level10,
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s {
            "Level1" | "1" => Self::Level1,
            "Level2" | "2" => Self::Level2,
            "Level3" | "3" => Self::Level3,
            "Level4" | "4" => Self::Level4,
            "Level5" | "5" => Self::Level5,
            "Level6" | "6" => Self::Level6,
            "Level7" | "7" => Self::Level7,
            "Level8" | "8" => Self::Level8,
            "Level9" | "9" => Self::Level9,
            _ => Self::Level10,
        }
    }

    pub fn as_u8(&self) -> u8 {
        *self as u8
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Level1 => "Level1",
            Self::Level2 => "Level2",
            Self::Level3 => "Level3",
            Self::Level4 => "Level4",
            Self::Level5 => "Level5",
            Self::Level6 => "Level6",
            Self::Level7 => "Level7",
            Self::Level8 => "Level8",
            Self::Level9 => "Level9",
            Self::Level10 => "Level10",
        }
    }

    /// 获取该强度下启用的技术比例
    pub fn coverage_ratio(&self) -> f64 {
        match self {
            Self::Level1 => 0.2,
            Self::Level2 => 0.3,
            Self::Level3 => 0.4,
            Self::Level4 => 0.5,
            Self::Level5 => 0.6,
            Self::Level6 => 0.7,
            Self::Level7 => 0.8,
            Self::Level8 => 0.9,
            Self::Level9 => 0.95,
            Self::Level10 => 1.0,
        }
    }
}

/// 目标平台
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum TargetPlatform {
    Lua51,
    Roblox,
    Luau,
    DeltaExecutor,
}

impl Default for TargetPlatform {
    fn default() -> Self {
        Self::DeltaExecutor
    }
}

impl TargetPlatform {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Lua51 => "Lua51",
            Self::Roblox => "Roblox",
            Self::Luau => "Luau",
            Self::DeltaExecutor => "DeltaExecutor",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s {
            "Lua51" | "lua51" => Self::Lua51,
            "Roblox" | "roblox" => Self::Roblox,
            "Luau" | "luau" => Self::Luau,
            _ => Self::DeltaExecutor,
        }
    }
}

/// 全局混淆配置
#[derive(Clone, Debug)]
pub struct ObfuscatorConfig {
    /// 混淆强度（1-10）
    pub intensity: Intensity,
    /// 随机种子（None表示自动生成）
    pub seed: Option<u64>,
    /// 用户盐值
    pub user_salt: String,
    /// 目标平台
    pub target_platform: TargetPlatform,
    /// 启用的技术ID集合（空表示全部启用）
    pub enabled_techniques: HashSet<String>,
    /// 禁用的技术ID集合
    pub disabled_techniques: HashSet<String>,
    /// 是否启用自动验证
    pub auto_verify: bool,
    /// 是否启用多线程并行混淆
    pub parallel: bool,
    /// 输出文件路径
    pub output_path: Option<String>,
    /// 是否保留原始源码（DE-01：源码终末自毁）
    pub preserve_source: bool,
    /// 最大协程数量（防止OOM）
    pub max_coroutines: usize,
    /// 最大元表链深度
    pub max_metatable_depth: usize,
    /// 最大递归深度
    pub max_recursion_depth: usize,
    /// 版本号
    pub version: String,
}

impl Default for ObfuscatorConfig {
    fn default() -> Self {
        Self {
            intensity: Intensity::Level7,
            seed: None,
            user_salt: String::from("gungnir-default-salt"),
            target_platform: TargetPlatform::default(),
            enabled_techniques: HashSet::new(),
            disabled_techniques: HashSet::new(),
            auto_verify: true,
            parallel: true,
            output_path: None,
            preserve_source: false,
            max_coroutines: 300,
            max_metatable_depth: 16,
            max_recursion_depth: 1000,
            version: String::from("6.0.0"),
        }
    }
}

impl ObfuscatorConfig {
    /// 创建最大强度配置
    pub fn maximum() -> Self {
        Self {
            intensity: Intensity::Level10,
            seed: None,
            user_salt: String::from("gungnir-maximum-salt"),
            target_platform: TargetPlatform::DeltaExecutor,
            enabled_techniques: HashSet::new(),
            disabled_techniques: HashSet::new(),
            auto_verify: true,
            parallel: true,
            output_path: None,
            preserve_source: false,
            max_coroutines: 300,
            max_metatable_depth: 16,
            max_recursion_depth: 1000,
            version: String::from("6.0.0"),
        }
    }

    /// 检查技术是否启用
    pub fn is_technique_enabled(&self, tech_id: &str) -> bool {
        if self.disabled_techniques.contains(tech_id) {
            return false;
        }
        if self.enabled_techniques.is_empty() {
            return true;
        }
        self.enabled_techniques.contains(tech_id)
    }

    /// 启用指定技术
    pub fn enable_technique(&mut self, tech_id: &str) {
        self.enabled_techniques.insert(tech_id.to_string());
        self.disabled_techniques.remove(tech_id);
    }

    /// 禁用指定技术
    pub fn disable_technique(&mut self, tech_id: &str) {
        self.disabled_techniques.insert(tech_id.to_string());
        self.enabled_techniques.remove(tech_id);
    }

    /// 从JSON字符串解析配置
    pub fn from_json(json: &str) -> Result<Self, String> {
        let value: Value = serde_json::from_str(json).map_err(|e| e.to_string())?;
        let obj = value.as_object().ok_or("Config must be a JSON object")?;

        let mut config = Self::default();

        if let Some(intensity) = obj.get("intensity") {
            if let Some(s) = intensity.as_str() {
                config.intensity = Intensity::from_str(s);
            } else if let Some(n) = intensity.as_u64() {
                config.intensity = Intensity::from_u8(n as u8);
            }
        }

        if let Some(seed) = obj.get("seed") {
            config.seed = seed.as_u64();
        }

        if let Some(salt) = obj.get("user_salt") {
            if let Some(s) = salt.as_str() {
                config.user_salt = s.to_string();
            }
        }

        if let Some(platform) = obj.get("target_platform") {
            if let Some(s) = platform.as_str() {
                config.target_platform = TargetPlatform::from_str(s);
            }
        }

        if let Some(verify) = obj.get("auto_verify") {
            config.auto_verify = verify.as_bool().unwrap_or(true);
        }

        if let Some(parallel) = obj.get("parallel") {
            config.parallel = parallel.as_bool().unwrap_or(true);
        }

        Ok(config)
    }

    /// 序列化为JSON字符串
    pub fn to_json(&self) -> Result<String, String> {
        let mut obj = Map::new();
        obj.insert("intensity".to_string(), Value::String(self.intensity.as_str().to_string()));
        obj.insert("seed".to_string(), match self.seed {
            Some(s) => Value::Number(s.into()),
            None => Value::Null,
        });
        obj.insert("user_salt".to_string(), Value::String(self.user_salt.clone()));
        obj.insert("target_platform".to_string(), Value::String(self.target_platform.as_str().to_string()));
        obj.insert("auto_verify".to_string(), Value::Bool(self.auto_verify));
        obj.insert("parallel".to_string(), Value::Bool(self.parallel));
        obj.insert("preserve_source".to_string(), Value::Bool(self.preserve_source));
        obj.insert("max_coroutines".to_string(), Value::Number(self.max_coroutines.into()));
        obj.insert("max_metatable_depth".to_string(), Value::Number(self.max_metatable_depth.into()));
        obj.insert("max_recursion_depth".to_string(), Value::Number(self.max_recursion_depth.into()));
        obj.insert("version".to_string(), Value::String(self.version.clone()));

        serde_json::to_string_pretty(&Value::Object(obj)).map_err(|e| e.to_string())
    }

    /// 获取强度对应的技术数量
    pub fn technique_count_for_intensity(&self, total: usize) -> usize {
        let ratio = self.intensity.coverage_ratio();
        (total as f64 * ratio) as usize
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = ObfuscatorConfig::default();
        assert_eq!(config.intensity, Intensity::Level7);
        assert!(config.auto_verify);
        assert!(config.parallel);
    }

    #[test]
    fn test_maximum_config() {
        let config = ObfuscatorConfig::maximum();
        assert_eq!(config.intensity, Intensity::Level10);
    }

    #[test]
    fn test_intensity_from_u8() {
        assert_eq!(Intensity::from_u8(1), Intensity::Level1);
        assert_eq!(Intensity::from_u8(10), Intensity::Level10);
        assert_eq!(Intensity::from_u8(100), Intensity::Level10);
    }

    #[test]
    fn test_coverage_ratio() {
        assert!((Intensity::Level1.coverage_ratio() - 0.2).abs() < f64::EPSILON);
        assert!((Intensity::Level10.coverage_ratio() - 1.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_technique_enabled() {
        let mut config = ObfuscatorConfig::default();
        assert!(config.is_technique_enabled("VM-01"));
        config.disable_technique("VM-01");
        assert!(!config.is_technique_enabled("VM-01"));
        config.enable_technique("VM-01");
        assert!(config.is_technique_enabled("VM-01"));
    }

    #[test]
    fn test_config_json_roundtrip() {
        let config = ObfuscatorConfig::maximum();
        let json = config.to_json().expect("Failed to serialize");
        let parsed = ObfuscatorConfig::from_json(&json).expect("Failed to deserialize");
        assert_eq!(parsed.intensity, config.intensity);
        assert_eq!(parsed.version, config.version);
    }

    #[test]
    fn test_technique_count_for_intensity() {
        let config = ObfuscatorConfig::maximum();
        assert_eq!(config.technique_count_for_intensity(200), 200);

        let mut config = ObfuscatorConfig::default();
        config.intensity = Intensity::Level5;
        assert_eq!(config.technique_count_for_intensity(200), 120);
    }
}
