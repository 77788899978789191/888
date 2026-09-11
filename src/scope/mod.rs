//! Scope Module - 多维作用域与符号撕裂（11项技术）
//!
//! 包含SC-01到SC-11的全部作用域混淆技术实现。

use crate::lua::ast::*;
use rand::Rng;
use rand_chacha::ChaCha20Rng;
use rand::SeedableRng;

/// 作用域混淆器
pub struct ScopeObfuscator {
    rng: ChaCha20Rng,
    rename_map: std::collections::HashMap<String, String>,
}

impl ScopeObfuscator {
    /// 创建新的作用域混淆器
    pub fn new(seed: u64) -> Self {
        Self {
            rng: ChaCha20Rng::seed_from_u64(seed),
            rename_map: std::collections::HashMap::new(),
        }
    }

    /// SC-01: 全标识符重命名
    pub fn rename_identifiers(&mut self, block: &mut Block) {
        for stmt in &mut block.statements {
            self.rename_in_statement(stmt);
        }
    }

    fn rename_in_statement(&mut self, stmt: &mut Statement) {
        match stmt {
            Statement::LocalDeclaration { names, .. } => {
                for name in names {
                    let new_name = self.generate_obfuscated_name();
                    self.rename_map.insert(name.clone(), new_name.clone());
                    *name = new_name;
                }
            }
            Statement::LocalFunctionDeclaration { name, .. } => {
                let new_name = self.generate_obfuscated_name();
                self.rename_map.insert(name.clone(), new_name.clone());
                *name = new_name;
            }
            Statement::FunctionDeclaration { name, .. } => {
                let new_name = self.generate_obfuscated_name();
                *name = FunctionName::simple(&new_name);
            }
            _ => {}
        }
    }

    fn generate_obfuscated_name(&mut self) -> String {
        let chars = ['_', '0', 'O', 'o', 'I', 'l', '1'];
        let length = self.rng.gen_range(10..20);
        let mut name = String::from("_");
        for _ in 0..length {
            name.push(chars[self.rng.gen_range(0..chars.len())]);
        }
        name
    }

    /// SC-02: 全局变量暗物质隐藏
    pub fn hide_globals(&self, code: &str) -> String {
        let mut result = code.to_string();
        // 替换全局访问为_G代理
        result = result.replace("print(", "_G_proxy.print(");
        result = result.replace("math.", "_G_proxy.math.");
        result = result.replace("string.", "_G_proxy.string.");
        result = result.replace("table.", "_G_proxy.table.");
        result
    }

    /// SC-03: 局部变量代理表间接访问
    pub fn generate_proxy_access(&self, var_name: &str) -> String {
        format!("_proxy['{}']", var_name)
    }

    /// SC-04: 多级闭包Upvalue嵌套
    pub fn generate_closure_chain(&self, depth: usize, body: &str) -> String {
        let mut result = body.to_string();
        for i in 0..depth {
            result = format!(
                "(function()\n  local _upval_{} = {}\n  return (function()\n    {}\n  end)()\nend)()",
                i, i, result
            );
        }
        result
    }

    /// SC-05: 函数整体包装与作用域隔离
    pub fn wrap_function(&self, func_code: &str) -> String {
        format!(
            "(function(...) \n  local _args = {{...}}\n  {}\nend)(...)",
            func_code
        )
    }

    /// SC-06: 动态环境劫持
    pub fn generate_env_hijack(&self) -> String {
        "local _env = setmetatable({}, {__index = _G, __newindex = function(t,k,v) rawset(t,k,v) end})".to_string()
    }

    /// SC-07: 函数融合与反内联分裂
    pub fn merge_functions(&self, func1: &str, func2: &str) -> String {
        format!(
            "local _merged = function(_mode, ...)\n  if _mode == 1 then\n    {}\n  else\n    {}\n  end\nend",
            func1, func2
        )
    }

    /// SC-08: 多态函数克隆
    pub fn generate_function_clones(&self, func: &str, count: usize) -> Vec<String> {
        let mut clones = Vec::new();
        for i in 0..count {
            clones.push(format!("-- Clone {} of function\n{}", i, func));
        }
        clones
    }

    /// SC-09: 可变参数污染函数签名
    pub fn add_variadic_params(&self, func_code: &str, count: usize) -> String {
        let params: Vec<String> = (0..count).map(|i| format!("_pollute_{}", i)).collect();
        func_code.replace("function()", &format!("function({})", params.join(", ")))
    }

    /// SC-10: 环境表白名单沙盒隔离
    pub fn generate_whitelist_check(&self) -> String {
        "local _whitelist = {print=true, math=true, string=true, table=true}\nlocal _check_env = function() for k,v in pairs(_G) do if not _whitelist[k] and type(v) == 'function' then error('env tampered') end end end".to_string()
    }

    /// SC-11: 全局访问路径动态计算
    pub fn dynamic_global_access(&self, path: &str) -> String {
        let parts: Vec<&str> = path.split('.').collect();
        let mut result = "_G".to_string();
        for part in parts {
            result = format!("{}['{}']", result, part);
        }
        result
    }

    /// 获取重命名映射
    pub fn rename_map(&self) -> &std::collections::HashMap<String, String> {
        &self.rename_map
    }
}

/// 作用域技术数量
pub const SCOPE_TECHNIQUE_COUNT: usize = 11;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rename_identifiers() {
        let mut obf = ScopeObfuscator::new(42);
        let mut block = Block {
            statements: vec![
                Statement::LocalDeclaration {
                    names: vec!["secret_var".to_string()],
                    values: Some(vec![Expression::Integer(42)]),
                },
            ],
            return_statement: None,
        };
        obf.rename_identifiers(&mut block);
        if let Statement::LocalDeclaration { names, .. } = &block.statements[0] {
            assert_ne!(names[0], "secret_var");
            assert!(names[0].len() >= 10);
        }
    }

    #[test]
    fn test_generate_obfuscated_name() {
        let mut obf = ScopeObfuscator::new(42);
        let name = obf.generate_obfuscated_name();
        assert!(name.len() >= 10);
        assert!(name.starts_with('_'));
    }

    #[test]
    fn test_hide_globals() {
        let obf = ScopeObfuscator::new(42);
        let result = obf.hide_globals("print('hello')");
        assert!(result.contains("_G_proxy"));
    }

    #[test]
    fn test_closure_chain() {
        let obf = ScopeObfuscator::new(42);
        let result = obf.generate_closure_chain(3, "return 42");
        assert!(result.contains("function"));
    }

    #[test]
    fn test_wrap_function() {
        let obf = ScopeObfuscator::new(42);
        let result = obf.wrap_function("return 1");
        assert!(result.contains("function"));
    }

    #[test]
    fn test_dynamic_global_access() {
        let obf = ScopeObfuscator::new(42);
        let result = obf.dynamic_global_access("game.Workspace");
        assert!(result.contains("_G['game']"));
    }

    #[test]
    fn test_technique_count() {
        assert_eq!(SCOPE_TECHNIQUE_COUNT, 11);
    }
}
