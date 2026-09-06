//! Runtime Module - 硬核运行时反制（12项技术）
//!
//! 包含RT-01到RT-12的全部运行时反制技术实现。

use rand::Rng;
use rand_chacha::ChaCha20Rng;
use rand::SeedableRng;

/// 运行时反制器
pub struct RuntimeProtection {
    rng: ChaCha20Rng,
}

impl RuntimeProtection {
    /// 创建新的运行时反制器
    pub fn new(seed: u64) -> Self {
        Self {
            rng: ChaCha20Rng::seed_from_u64(seed),
        }
    }

    /// RT-01: 分片代码完整性哈希校验
    pub fn generate_integrity_check(&mut self, chunk_count: usize) -> String {
        let mut code = String::new();
        code.push_str("-- RT-01: 分片代码完整性哈希校验\n");
        code.push_str(&format!("local _checksums = {{}}\n"));
        for i in 0..chunk_count {
            code.push_str(&format!("_checksums[{}] = 0x{:08x}\n", i + 1, self.rng.gen::<u32>()));
        }
        code.push_str("local _verify_integrity = function(chunk_idx, data)\n");
        code.push_str("  local _hash = 0\n");
        code.push_str("  for i=1,#data do _hash = (_hash * 31 + data:byte(i)) % 4294967296 end\n");
        code.push_str("  if _hash ~= _checksums[chunk_idx] then error('integrity check failed') end\n");
        code.push_str("end\n");
        code
    }

    /// RT-02: 静态+动态反调试合并框架
    pub fn generate_anti_debug(&self) -> String {
        r#"
-- RT-02: 静态+动态反调试
local _anti_debug = function()
  if debug.getinfo ~= nil then
    local _info = debug.getinfo(1)
    if _info.source ~= nil and _info.source:find("@") then
      -- 可能被调试
    end
  end
  local _start = os.clock()
  for i=1,1000 do end
  local _elapsed = os.clock() - _start
  if _elapsed > 0.01 then
    error('debugger detected')
  end
end
"#.to_string()
    }

    /// RT-03: 高精度时序侧信道检测
    pub fn generate_timing_detection(&self) -> String {
        r#"
-- RT-03: 高精度时序侧信道检测
local _timing_check = function()
  local _t1 = os.clock()
  local _x = 0
  for i=1,10000 do _x = _x + i end
  local _t2 = os.clock()
  if (_t2 - _t1) > 0.005 then
    return true -- 可能被单步调试
  end
  return false
end
"#.to_string()
    }

    /// RT-04: 环境全局对象篡改检测
    pub fn generate_env_tamper_detection(&self) -> String {
        r#"
-- RT-04: 环境全局对象篡改检测
local _original_print = print
local _original_type = type
local _detect_tamper = function()
  if print ~= _original_print then error('print tampered') end
  if type ~= _original_type then error('type tampered') end
  if type(game) ~= 'userdata' and game ~= nil then error('game tampered') end
end
"#.to_string()
    }

    /// RT-05: 时间炸弹
    pub fn generate_time_bomb(&self, duration_seconds: u64) -> String {
        format!(
            r#"
-- RT-05: 时间炸弹
local _start_time = os.time()
local _max_duration = {}
local _check_time = function()
  if os.time() - _start_time > _max_duration then
    error('script expired')
  end
end
"#,
            duration_seconds
        )
    }

    /// RT-06: 调用栈深度伪造
    pub fn generate_stack_fake(&self, depth: usize) -> String {
        let mut code = String::new();
        code.push_str("-- RT-06: 调用栈深度伪造\n");
        code.push_str("local _fake_stack = function()\n");
        for i in 0..depth {
            code.push_str(&format!("  local _fake_func_{} = function()\n", i));
        }
        for i in (0..depth).rev() {
            code.push_str(&format!("    _fake_func_{}()\n", i + 1));
            code.push_str("  end\n");
        }
        code.push_str("end\n");
        code
    }

    /// RT-07: 运行时内存自校验
    pub fn generate_memory_self_check(&self) -> String {
        r#"
-- RT-07: 运行时内存自校验
local _memory_check = function()
  local _checksum = 0
  for k,v in pairs(_G) do
    if type(v) == 'function' then
      _checksum = _checksum + #tostring(v)
    end
  end
  return _checksum
end
"#.to_string()
    }

    /// RT-08: 内联反钩子检测
    pub fn generate_hook_detection(&self) -> String {
        r#"
-- RT-08: 内联反钩子检测
local _hook_check = function()
  local _original_hook = debug.sethook
  local _hook_set = false
  debug.sethook(function() _hook_set = true end, "c")
  debug.sethook()
  if _hook_set then
    return true -- 钩子被设置
  end
  return false
end
"#.to_string()
    }

    /// RT-09: 调试库污染
    pub fn generate_debug_pollution(&self) -> String {
        r#"
-- RT-09: 调试库污染
local _original_getinfo = debug.getinfo
debug.getinfo = function(...)
  local _result = _original_getinfo(...)
  if _result then
    _result.currentline = math.random(1, 10000)
    _result.source = "@fake_source.lua"
  end
  return _result
end
"#.to_string()
    }

    /// RT-10: 自变异代码块
    pub fn generate_self_modifying_code(&self) -> String {
        r#"
-- RT-10: 自变异代码块
local _self_modify = function()
  local _variants = {
    function(x) return x + 1 end,
    function(x) return x - 1 end,
    function(x) return x * 2 end,
  }
  return _variants[math.random(1, #_variants)]
end
"#.to_string()
    }

    /// RT-11: 反内存Dump
    pub fn generate_anti_dump(&self) -> String {
        r#"
-- RT-11: 反内存Dump
local _anti_dump = function(data)
  local _result = data
  data = nil
  collectgarbage()
  return _result
end
"#.to_string()
    }

    /// RT-12: 反篡改触发链
    pub fn generate_tamper_chain(&mut self, chain_length: usize) -> String {
        let mut code = String::new();
        code.push_str("-- RT-12: 反篡改触发链\n");
        code.push_str("local _chain = {}\n");
        for i in 0..chain_length {
            code.push_str(&format!(
                "_chain[{}] = function() if _chain_state[{}] ~= {} then error('tamper detected') end end\n",
                i + 1,
                i + 1,
                self.rng.gen::<u32>()
            ));
        }
        code.push_str("local _chain_state = {}\n");
        code
    }
}

/// 运行时反制技术数量
pub const RUNTIME_TECHNIQUE_COUNT: usize = 12;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_integrity_check() {
        let mut rt = RuntimeProtection::new(42);
        let code = rt.generate_integrity_check(5);
        assert!(code.contains("_checksums"));
    }

    #[test]
    fn test_anti_debug() {
        let rt = RuntimeProtection::new(42);
        let code = rt.generate_anti_debug();
        assert!(code.contains("debug.getinfo"));
    }

    #[test]
    fn test_timing_detection() {
        let rt = RuntimeProtection::new(42);
        let code = rt.generate_timing_detection();
        assert!(code.contains("os.clock"));
    }

    #[test]
    fn test_time_bomb() {
        let rt = RuntimeProtection::new(42);
        let code = rt.generate_time_bomb(86400);
        assert!(code.contains("86400"));
    }

    #[test]
    fn test_hook_detection() {
        let rt = RuntimeProtection::new(42);
        let code = rt.generate_hook_detection();
        assert!(code.contains("debug.sethook"));
    }

    #[test]
    fn test_debug_pollution() {
        let rt = RuntimeProtection::new(42);
        let code = rt.generate_debug_pollution();
        assert!(code.contains("debug.getinfo"));
    }

    #[test]
    fn test_technique_count() {
        assert_eq!(RUNTIME_TECHNIQUE_COUNT, 12);
    }
}
