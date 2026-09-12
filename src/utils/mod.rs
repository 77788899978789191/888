//! 通用工具模块
//!
//! 提供跨平台安全的时间获取、编码等基础工具函数。
//!
//! # 背景
//!
//! `std::time::SystemTime::now()` 在 `wasm32-unknown-unknown` 目标上调用会直接
//! panic（标准库底层实现为 `panic!("time not implemented on this platform")`），
//! 导致 WASM 版本混淆时崩溃，浏览器表现为
//! `Unreachable code should not be executed (evaluating 'wasm.obfuscate(...)')`。
//!
//! 本模块统一封装安全时间获取：wasm32 目标通过 `js-sys` 读取 JS 侧 `Date.now()`
//! 获取真实时间，其他平台使用标准库 `SystemTime`。

pub mod time;

pub use time::{safe_now_millis, safe_now_nanos, safe_now_secs};
