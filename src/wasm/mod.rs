//! WASM Bindings
//!
//! 为网页端提供WASM接口，通过wasm-bindgen调用。

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use crate::{ObfuscatorConfig, Orchestrator, VERSION, TOTAL_TECHNIQUES};

/// WASM混淆结果
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub struct WasmResult {
    success: bool,
    output: String,
    error: String,
    stats_json: String,
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
impl WasmResult {
    /// 是否成功
    #[wasm_bindgen(getter)]
    pub fn success(&self) -> bool {
        self.success
    }

    /// 输出代码
    #[wasm_bindgen(getter)]
    pub fn output(&self) -> String {
        self.output.clone()
    }

    /// 错误信息
    #[wasm_bindgen(getter)]
    pub fn error(&self) -> String {
        self.error.clone()
    }

    /// 统计信息（JSON格式）
    #[wasm_bindgen(getter, js_name = "statsJson")]
    pub fn stats_json(&self) -> String {
        self.stats_json.clone()
    }
}

/// 混淆Lua代码（WASM接口）
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn obfuscate(code: &str, config_json: &str) -> WasmResult {
    let config = match ObfuscatorConfig::from_json(config_json) {
        Ok(c) => c,
        Err(e) => {
            return WasmResult {
                success: false,
                output: String::new(),
                error: format!("Config error: {}", e),
                stats_json: String::new(),
            };
        }
    };

    let mut orchestrator = Orchestrator::new(config);

    match orchestrator.obfuscate(code) {
        Ok(output) => {
            let stats_json = orchestrator
                .stats()
                .to_json()
                .unwrap_or_else(|_| "{}".to_string());

            WasmResult {
                success: true,
                output,
                error: String::new(),
                stats_json,
            }
        }
        Err(e) => WasmResult {
            success: false,
            output: String::new(),
            error: e.to_string(),
            stats_json: String::new(),
        },
    }
}

/// 使用默认最大强度配置进行混淆
#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = "obfuscateMaximum")]
pub fn obfuscate_maximum(code: &str) -> WasmResult {
    let config = ObfuscatorConfig::maximum();
    let config_json = config.to_json().unwrap_or_else(|_| "{}".to_string());
    obfuscate(code, &config_json)
}

/// 获取库版本号
#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = "getVersion")]
pub fn get_version() -> String {
    VERSION.to_string()
}

/// 获取总技术数量
#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = "getTotalTechniques")]
pub fn get_total_techniques() -> usize {
    TOTAL_TECHNIQUES
}

/// 获取默认配置（JSON格式）
#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = "getDefaultConfig")]
pub fn get_default_config() -> String {
    ObfuscatorConfig::default()
        .to_json()
        .unwrap_or_else(|_| "{}".to_string())
}

/// 获取最大强度配置（JSON格式）
#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = "getMaximumConfig")]
pub fn get_maximum_config() -> String {
    ObfuscatorConfig::maximum()
        .to_json()
        .unwrap_or_else(|_| "{}".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version() {
        assert_eq!(VERSION, "7.0.0");
        assert_eq!(TOTAL_TECHNIQUES, 238);
    }

    #[test]
    fn test_default_config_json() {
        let config = ObfuscatorConfig::default();
        let json = config.to_json().unwrap();
        assert!(json.contains("intensity"));
    }
}
