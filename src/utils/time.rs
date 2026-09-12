//! 跨平台安全时间工具
//!
//! `std::time::SystemTime` 在 `wasm32-unknown-unknown` 目标上调用会直接 panic
//! （标准库底层为 `wasm32::time::now()` → `panic!("time not implemented")`），
//! 导致 WASM 版本混淆时崩溃（浏览器表现为
//! `Unreachable code should not be executed`）。
//!
//! 这里统一封装安全时间获取：
//! - `wasm32` 目标：通过 `js-sys` 读取 JS 侧 `Date.now()`（真实毫秒时间戳）
//! - 其他平台：标准库 `SystemTime`

/// 安全获取当前 Unix 时间戳（毫秒）
///
/// - wasm32：`Date.now()`（JS 侧毫秒时间戳）
/// - 其他平台：`SystemTime::now()` 距 Unix 纪元毫秒数
pub fn safe_now_millis() -> u64 {
    #[cfg(target_arch = "wasm32")]
    {
        js_sys::Date::now() as u64
    }
    #[cfg(not(target_arch = "wasm32"))]
    {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0)
    }
}

/// 安全获取当前 Unix 时间戳（秒）
///
/// - wasm32：`Date.now() / 1000`
/// - 其他平台：`SystemTime::now()` 距 Unix 纪元秒数
pub fn safe_now_secs() -> u64 {
    #[cfg(target_arch = "wasm32")]
    {
        (js_sys::Date::now() / 1000.0) as u64
    }
    #[cfg(not(target_arch = "wasm32"))]
    {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0)
    }
}

/// 安全获取当前时间（纳秒精度）
///
/// - wasm32：`Date.now() * 1_000_000`（毫秒精度放大到纳秒量级）
/// - 其他平台：`SystemTime::now()` 距 Unix 纪元纳秒数
pub fn safe_now_nanos() -> u64 {
    #[cfg(target_arch = "wasm32")]
    {
        (js_sys::Date::now() * 1_000_000.0) as u64
    }
    #[cfg(not(target_arch = "wasm32"))]
    {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos() as u64)
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_safe_now_returns_reasonable_values() {
        // 时间戳应该大于 2020-01-01（1577836800 秒），证明获取成功
        let secs = safe_now_secs();
        assert!(
            secs > 1_577_836_800,
            "当前时间戳异常: {}",
            secs
        );

        let millis = safe_now_millis();
        assert!(millis > secs * 1000, "毫秒时间戳应大于秒时间戳*1000");

        let nanos = safe_now_nanos();
        assert!(nanos > 0, "纳秒时间戳应为正数");
    }

    #[test]
    fn test_safe_now_monotonic_behavior() {
        // 连续两次调用，第二次不应小于第一次（同一平台实现）
        let a = safe_now_millis();
        let b = safe_now_millis();
        assert!(b >= a, "时间戳不应回退");
    }
}
