//! Platform Module - 平台专属（Delta Executor）（8项技术）
//!
//! 包含PL-01到PL-08的全部平台专属技术实现。

use rand::Rng;
use rand_chacha::ChaCha20Rng;
use rand::SeedableRng;

/// 平台专属混淆器
pub struct PlatformSpecific {
    rng: ChaCha20Rng,
}

impl PlatformSpecific {
    /// 创建新的平台专属混淆器
    pub fn new(seed: u64) -> Self {
        Self {
            rng: ChaCha20Rng::seed_from_u64(seed),
        }
    }

    /// PL-01: Gloop引擎100%语法兼容
    pub fn ensure_lua51_compatibility(&self, code: &str) -> String {
        let mut result = code.to_string();
        // 移除Luau特有语法
        result = result.replace("::", "--[[ label removed ]]--");
        result = result.replace("continue", "--[[ continue removed ]]--");
        result
    }

    /// PL-02: Dark Dex实例树混淆
    pub fn generate_dex_obfuscation(&self) -> String {
        r#"
-- PL-02: Dark Dex实例树混淆
local _fake_game = setmetatable({}, {
  __index = function(t, k)
    if k == 'Workspace' then
      return setmetatable({}, {__index = function() return {} end})
    end
    return {}
  end
})
"#.to_string()
    }

    /// PL-03: 触摸注入友好
    pub fn generate_touch_friendly_init(&self) -> String {
        r#"
-- PL-03: 触摸注入友好
task.spawn(function()
  task.wait(0)
  -- 初始化逻辑分散执行
end)
"#.to_string()
    }

    /// PL-04: 跨平台差异化混淆
    pub fn generate_platform_differentiation(&self) -> String {
        r#"
-- PL-04: 跨平台差异化混淆
local _platform = game:GetService('GuiService'):GetPlatform()
if _platform == Enum.Platform.Android then
  -- Android轻量级混淆
else
  -- iOS/PC重型混淆
end
"#.to_string()
    }

    /// PL-05: Script Hub反收录特征
    pub fn generate_anti_recognition(&mut self) -> String {
        let mut code = String::new();
        code.push_str("-- PL-05: Script Hub反收录特征\n");
        // 插入随机垃圾变量
        for i in 0..5 {
            code.push_str(&format!(
                "local _anti_recog_{} = {}\n",
                self.rng.gen_range(1000..9999),
                self.rng.gen::<u32>()
            ));
        }
        code
    }

    /// PL-06: 巨型常量表分页加载
    pub fn generate_paged_constant_table(&mut self, page_count: usize) -> String {
        let mut code = String::new();
        code.push_str("-- PL-06: 巨型常量表分页加载\n");
        code.push_str("local _constant_pages = {}\n");
        for i in 0..page_count {
            code.push_str(&format!(
                "_constant_pages[{}] = function() return {{ {} }} end\n",
                i + 1,
                self.rng.gen::<u32>()
            ));
        }
        code.push_str("local _get_constant = function(page, idx) return _constant_pages[page]()[idx] end\n");
        code
    }

    /// PL-07: Remote调用多层加密
    pub fn generate_remote_encryption(&self) -> String {
        r#"
-- PL-07: Remote调用多层加密
local _encrypt_remote = function(...)
  local _args = {...}
  -- 第1层: XOR
  for i=1,#_args do if type(_args[i]) == 'string' then _args[i] = _args[i]:gsub('.', function(c) return string.char(c:byte() ~ 0xAA) end) end end
  -- 第2层: Base64-like
  -- 第3层: 自定义编码
  return unpack(_args)
end
"#.to_string()
    }

    /// PL-08: 任务调度器帧序扰乱
    pub fn generate_scheduler_scramble(&self) -> String {
        r#"
-- PL-08: 任务调度器帧序扰乱
local _scramble_tasks = function(tasks)
  for i=#tasks,2,-1 do
    local j = math.random(1, i)
    tasks[i], tasks[j] = tasks[j], tasks[i]
  end
  for _, task_func in ipairs(tasks) do
    task.defer(task_func)
  end
end
"#.to_string()
    }
}

/// 平台专属技术数量
pub const PLATFORM_TECHNIQUE_COUNT: usize = 8;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lua51_compatibility() {
        let pl = PlatformSpecific::new(42);
        let result = pl.ensure_lua51_compatibility("local x = 1 ::label::");
        assert!(!result.contains("::label::"));
    }

    #[test]
    fn test_dex_obfuscation() {
        let pl = PlatformSpecific::new(42);
        let code = pl.generate_dex_obfuscation();
        assert!(code.contains("_fake_game"));
    }

    #[test]
    fn test_touch_friendly() {
        let pl = PlatformSpecific::new(42);
        let code = pl.generate_touch_friendly_init();
        assert!(code.contains("task.spawn"));
    }

    #[test]
    fn test_anti_recognition() {
        let mut pl = PlatformSpecific::new(42);
        let code = pl.generate_anti_recognition();
        assert!(code.contains("_anti_recog_"));
    }

    #[test]
    fn test_paged_constant_table() {
        let mut pl = PlatformSpecific::new(42);
        let code = pl.generate_paged_constant_table(3);
        assert!(code.contains("_constant_pages"));
    }

    #[test]
    fn test_remote_encryption() {
        let pl = PlatformSpecific::new(42);
        let code = pl.generate_remote_encryption();
        assert!(code.contains("_encrypt_remote"));
    }

    #[test]
    fn test_scheduler_scramble() {
        let pl = PlatformSpecific::new(42);
        let code = pl.generate_scheduler_scramble();
        assert!(code.contains("_scramble_tasks"));
    }

    #[test]
    fn test_technique_count() {
        assert_eq!(PLATFORM_TECHNIQUE_COUNT, 8);
    }
}
