//! Lua 5.1 Code Writer
//!
//! Lua 5.1 代码生成器，将AST转换为Lua源码。
//! 支持格式化选项和混淆友好的输出。

use super::ast::*;

/// 代码生成器配置
#[derive(Clone, Debug)]
pub struct WriterConfig {
    /// 缩进字符串
    pub indent: String,
    /// 是否使用空格
    pub use_spaces: bool,
    /// 每行最大长度（0表示不限制）
    pub max_line_length: usize,
    /// 是否保留注释
    pub preserve_comments: bool,
    /// 字符串引号风格（true: 双引号, false: 单引号）
    pub use_double_quotes: bool,
    /// 数字输出格式
    pub number_format: NumberFormat,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum NumberFormat {
    /// 十进制
    Decimal,
    /// 十六进制
    Hexadecimal,
    /// 科学计数法
    Scientific,
}

impl Default for WriterConfig {
    fn default() -> Self {
        Self {
            indent: "  ".to_string(),
            use_spaces: true,
            max_line_length: 0,
            preserve_comments: false,
            use_double_quotes: true,
            number_format: NumberFormat::Decimal,
        }
    }
}

impl WriterConfig {
    /// 混淆友好配置（最小化输出）
    pub fn minified() -> Self {
        Self {
            indent: String::new(),
            use_spaces: false,
            max_line_length: 0,
            preserve_comments: false,
            use_double_quotes: true,
            number_format: NumberFormat::Decimal,
        }
    }
}

/// Lua代码生成器
pub struct LuaWriter {
    config: WriterConfig,
    output: String,
    indent_level: usize,
}

impl LuaWriter {
    /// 创建新的代码生成器
    pub fn new(config: WriterConfig) -> Self {
        Self {
            config,
            output: String::new(),
            indent_level: 0,
        }
    }

    /// 使用默认配置创建
    pub fn default() -> Self {
        Self::new(WriterConfig::default())
    }

    /// 生成代码
    pub fn generate(&mut self, block: &Block) -> String {
        self.output.clear();
        self.indent_level = 0;
        self.write_block(block);
        self.output.clone()
    }

    /// 写入缩进
    fn write_indent(&mut self) {
        if !self.config.indent.is_empty() {
            for _ in 0..self.indent_level {
                self.output.push_str(&self.config.indent);
            }
        }
    }

    /// 写入换行
    fn write_newline(&mut self) {
        if !self.config.indent.is_empty() {
            self.output.push('\n');
        }
    }

    /// 写入空格
    fn write_space(&mut self) {
        if self.config.use_spaces {
            self.output.push(' ');
        }
    }

    /// 写入块
    fn write_block(&mut self, block: &Block) {
        self.indent_level += 1;
        for stmt in &block.statements {
            self.write_indent();
            self.write_statement(stmt);
            self.write_newline();
        }
        if let Some(ret) = &block.return_statement {
            self.write_indent();
            self.output.push_str("return");
            if !ret.is_empty() {
                self.write_space();
                for (i, expr) in ret.iter().enumerate() {
                    if i > 0 {
                        self.output.push(',');
                        self.write_space();
                    }
                    self.write_expression(expr);
                }
            }
            self.write_newline();
        }
        self.indent_level -= 1;
    }

    /// 写入语句
    fn write_statement(&mut self, stmt: &Statement) {
        match stmt {
            Statement::Empty => {
                self.output.push(';');
            }
            Statement::Assignment { targets, values } => {
                for (i, t) in targets.iter().enumerate() {
                    if i > 0 {
                        self.output.push(',');
                        self.write_space();
                    }
                    self.write_expression(t);
                }
                self.write_space();
                self.output.push('=');
                self.write_space();
                for (i, v) in values.iter().enumerate() {
                    if i > 0 {
                        self.output.push(',');
                        self.write_space();
                    }
                    self.write_expression(v);
                }
            }
            Statement::LocalDeclaration { names, values } => {
                self.output.push_str("local");
                self.write_space();
                for (i, name) in names.iter().enumerate() {
                    if i > 0 {
                        self.output.push(',');
                        self.write_space();
                    }
                    self.output.push_str(name);
                }
                if let Some(vals) = values {
                    self.write_space();
                    self.output.push('=');
                    self.write_space();
                    for (i, v) in vals.iter().enumerate() {
                        if i > 0 {
                            self.output.push(',');
                            self.write_space();
                        }
                        self.write_expression(v);
                    }
                }
            }
            Statement::If { condition, then_block, else_if_blocks, else_block } => {
                self.output.push_str("if");
                self.write_space();
                self.write_expression(condition);
                self.write_space();
                self.output.push_str("then");
                self.write_newline();
                self.write_block(then_block);
                for (cond, block) in else_if_blocks {
                    self.write_indent();
                    self.output.push_str("elseif");
                    self.write_space();
                    self.write_expression(cond);
                    self.write_space();
                    self.output.push_str("then");
                    self.write_newline();
                    self.write_block(block);
                }
                if let Some(block) = else_block {
                    self.write_indent();
                    self.output.push_str("else");
                    self.write_newline();
                    self.write_block(block);
                }
                self.write_indent();
                self.output.push_str("end");
            }
            Statement::While { condition, body } => {
                self.output.push_str("while");
                self.write_space();
                self.write_expression(condition);
                self.write_space();
                self.output.push_str("do");
                self.write_newline();
                self.write_block(body);
                self.write_indent();
                self.output.push_str("end");
            }
            Statement::Repeat { body, condition } => {
                self.output.push_str("repeat");
                self.write_newline();
                self.write_block(body);
                self.write_indent();
                self.output.push_str("until");
                self.write_space();
                self.write_expression(condition);
            }
            Statement::ForNumeric { variable, start, end, step, body } => {
                self.output.push_str("for");
                self.write_space();
                self.output.push_str(variable);
                self.write_space();
                self.output.push('=');
                self.write_space();
                self.write_expression(start);
                self.output.push(',');
                self.write_space();
                self.write_expression(end);
                if let Some(s) = step {
                    self.output.push(',');
                    self.write_space();
                    self.write_expression(s);
                }
                self.write_space();
                self.output.push_str("do");
                self.write_newline();
                self.write_block(body);
                self.write_indent();
                self.output.push_str("end");
            }
            Statement::ForGeneric { variables, iterators, body } => {
                self.output.push_str("for");
                self.write_space();
                for (i, v) in variables.iter().enumerate() {
                    if i > 0 {
                        self.output.push(',');
                        self.write_space();
                    }
                    self.output.push_str(v);
                }
                self.write_space();
                self.output.push_str("in");
                self.write_space();
                for (i, it) in iterators.iter().enumerate() {
                    if i > 0 {
                        self.output.push(',');
                        self.write_space();
                    }
                    self.write_expression(it);
                }
                self.write_space();
                self.output.push_str("do");
                self.write_newline();
                self.write_block(body);
                self.write_indent();
                self.output.push_str("end");
            }
            Statement::Do(block) => {
                self.output.push_str("do");
                self.write_newline();
                self.write_block(block);
                self.write_indent();
                self.output.push_str("end");
            }
            Statement::Break => {
                self.output.push_str("break");
            }
            Statement::Return(exprs) => {
                self.output.push_str("return");
                if !exprs.is_empty() {
                    self.write_space();
                    for (i, e) in exprs.iter().enumerate() {
                        if i > 0 {
                            self.output.push(',');
                            self.write_space();
                        }
                        self.write_expression(e);
                    }
                }
            }
            Statement::FunctionCall(call) => {
                self.write_function_call(call);
            }
            Statement::MethodCall { object, method, args } => {
                self.write_expression(object);
                self.output.push(':');
                self.output.push_str(method);
                self.output.push('(');
                for (i, arg) in args.iter().enumerate() {
                    if i > 0 {
                        self.output.push(',');
                        self.write_space();
                    }
                    self.write_expression(arg);
                }
                self.output.push(')');
            }
            Statement::FunctionDeclaration { name, parameters, is_variadic, body } => {
                self.output.push_str("function");
                self.write_space();
                for (i, p) in name.parts.iter().enumerate() {
                    if i > 0 {
                        self.output.push('.');
                    }
                    self.output.push_str(p);
                }
                if let Some(m) = &name.method {
                    self.output.push(':');
                    self.output.push_str(m);
                }
                self.output.push('(');
                self.write_parameters(parameters, *is_variadic);
                self.output.push(')');
                self.write_newline();
                self.write_block(body);
                self.write_indent();
                self.output.push_str("end");
            }
            Statement::LocalFunctionDeclaration { name, parameters, is_variadic, body } => {
                self.output.push_str("local");
                self.write_space();
                self.output.push_str("function");
                self.write_space();
                self.output.push_str(name);
                self.output.push('(');
                self.write_parameters(parameters, *is_variadic);
                self.output.push(')');
                self.write_newline();
                self.write_block(body);
                self.write_indent();
                self.output.push_str("end");
            }
            Statement::Raw(code) => {
                self.output.push_str(code);
            }
        }
    }

    /// 写入参数列表
    fn write_parameters(&mut self, parameters: &[String], is_variadic: bool) {
        for (i, p) in parameters.iter().enumerate() {
            if i > 0 {
                self.output.push(',');
                self.write_space();
            }
            self.output.push_str(p);
        }
        if is_variadic {
            if !parameters.is_empty() {
                self.output.push(',');
                self.write_space();
            }
            self.output.push_str("...");
        }
    }

    /// 写入函数调用
    fn write_function_call(&mut self, call: &FunctionCall) {
        self.write_expression(&call.function);
        self.output.push('(');
        for (i, arg) in call.args.iter().enumerate() {
            if i > 0 {
                self.output.push(',');
                self.write_space();
            }
            self.write_expression(arg);
        }
        self.output.push(')');
    }

    /// 写入表达式
    fn write_expression(&mut self, expr: &Expression) {
        match expr {
            Expression::Nil => {
                self.output.push_str("nil");
            }
            Expression::Boolean(b) => {
                self.output.push_str(if *b { "true" } else { "false" });
            }
            Expression::Integer(n) => {
                match self.config.number_format {
                    NumberFormat::Decimal => self.output.push_str(&n.to_string()),
                    NumberFormat::Hexadecimal => {
                        if *n >= 0 {
                            self.output.push_str(&format!("0x{:x}", n));
                        } else {
                            self.output.push_str(&format!("-0x{:x}", -n));
                        }
                    }
                    NumberFormat::Scientific => self.output.push_str(&format!("{:e}", *n as f64)),
                }
            }
            Expression::Float(n) => {
                match self.config.number_format {
                    NumberFormat::Scientific => self.output.push_str(&format!("{:e}", n)),
                    _ => {
                        if n.fract() == 0.0 && n.abs() < 1e15 {
                            self.output.push_str(&format!("{:.1}", n));
                        } else {
                            self.output.push_str(&n.to_string());
                        }
                    }
                }
            }
            Expression::String(s) => {
                self.write_string(s);
            }
            Expression::LongString(s) => {
                self.output.push_str("[[");
                self.output.push_str(s);
                self.output.push_str("]]");
            }
            Expression::Variable(name) => {
                self.output.push_str(name);
            }
            Expression::TableAccess { table, key } => {
                self.write_expression(table);
                self.output.push('[');
                self.write_expression(key);
                self.output.push(']');
            }
            Expression::DotAccess { object, field } => {
                self.write_expression(object);
                self.output.push('.');
                self.output.push_str(field);
            }
            Expression::FunctionCall(call) => {
                self.write_function_call(call);
            }
            Expression::MethodCall { object, method, args } => {
                self.write_expression(object);
                self.output.push(':');
                self.output.push_str(method);
                self.output.push('(');
                for (i, arg) in args.iter().enumerate() {
                    if i > 0 {
                        self.output.push(',');
                        self.write_space();
                    }
                    self.write_expression(arg);
                }
                self.output.push(')');
            }
            Expression::Function { parameters, is_variadic, body } => {
                self.output.push_str("function");
                self.output.push('(');
                self.write_parameters(parameters, *is_variadic);
                self.output.push(')');
                self.write_newline();
                self.write_block(body);
                self.write_indent();
                self.output.push_str("end");
            }
            Expression::TableConstructor { fields } => {
                self.output.push('{');
                if !fields.is_empty() && !self.config.indent.is_empty() {
                    self.write_newline();
                    self.indent_level += 1;
                }
                for (i, field) in fields.iter().enumerate() {
                    if !self.config.indent.is_empty() {
                        self.write_indent();
                    }
                    match field {
                        TableField::List(e) => self.write_expression(e),
                        TableField::Named(name, value) => {
                            self.output.push_str(name);
                            self.write_space();
                            self.output.push('=');
                            self.write_space();
                            self.write_expression(value);
                        }
                        TableField::Indexed(key, value) => {
                            self.output.push('[');
                            self.write_expression(key);
                            self.output.push(']');
                            self.write_space();
                            self.output.push('=');
                            self.write_space();
                            self.write_expression(value);
                        }
                    }
                    if i < fields.len() - 1 {
                        self.output.push(',');
                    }
                    if !self.config.indent.is_empty() {
                        self.write_newline();
                    }
                }
                if !fields.is_empty() && !self.config.indent.is_empty() {
                    self.indent_level -= 1;
                    self.write_indent();
                }
                self.output.push('}');
            }
            Expression::BinaryOp { op, left, right } => {
                self.output.push('(');
                self.write_expression(left);
                self.write_space();
                self.output.push_str(op.as_str());
                self.write_space();
                self.write_expression(right);
                self.output.push(')');
            }
            Expression::UnaryOp { op, operand } => {
                self.output.push('(');
                self.output.push_str(op.as_str());
                self.write_space();
                self.write_expression(operand);
                self.output.push(')');
            }
            Expression::Vararg => {
                self.output.push_str("...");
            }
        }
    }

    /// 写入字符串（处理转义）
    fn write_string(&mut self, s: &str) {
        let quote = if self.config.use_double_quotes { '"' } else { '\'' };
        self.output.push(quote);
        for c in s.chars() {
            match c {
                '\\' => self.output.push_str("\\\\"),
                '\n' => self.output.push_str("\\n"),
                '\r' => self.output.push_str("\\r"),
                '\t' => self.output.push_str("\\t"),
                '"' if self.config.use_double_quotes => self.output.push_str("\\\""),
                '\'' if !self.config.use_double_quotes => self.output.push_str("\\'"),
                c if (c as u32) < 0x20 => {
                    self.output.push_str(&format!("\\{:03}", c as u32));
                }
                c => self.output.push(c),
            }
        }
        self.output.push(quote);
    }
}

/// 便捷函数：将AST转换为Lua源码
pub fn write_lua(block: &Block) -> String {
    let mut writer = LuaWriter::default();
    writer.generate(block)
}

/// 便捷函数：将AST转换为最小化Lua源码
pub fn write_lua_minified(block: &Block) -> String {
    let mut writer = LuaWriter::new(WriterConfig::minified());
    writer.generate(block)
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::parser::Parser;

    #[test]
    fn test_write_simple() {
        let source = "local x = 10\nprint(x)";
        let block = Parser::parse_source(source).unwrap();
        let output = write_lua(&block);
        assert!(output.contains("local x = 10"));
        assert!(output.contains("print(x)"));
    }

    #[test]
    fn test_write_if() {
        let source = "if x > 0 then\n  print('positive')\nelse\n  print('negative')\nend";
        let block = Parser::parse_source(source).unwrap();
        let output = write_lua(&block);
        assert!(output.contains("if"));
        assert!(output.contains("then"));
        assert!(output.contains("else"));
        assert!(output.contains("end"));
    }

    #[test]
    fn test_write_function() {
        let source = "function add(a, b)\n  return a + b\nend";
        let block = Parser::parse_source(source).unwrap();
        let output = write_lua(&block);
        assert!(output.contains("function add(a, b)"));
        assert!(output.contains("return (a + b)"));
        assert!(output.contains("end"));
    }

    #[test]
    fn test_write_table() {
        let source = "local t = {1, 2, 3}";
        let block = Parser::parse_source(source).unwrap();
        let output = write_lua(&block);
        assert!(output.contains("{"));
        assert!(output.contains("}"));
    }

    #[test]
    fn test_write_minified() {
        let source = "local x = 10\nprint(x)";
        let block = Parser::parse_source(source).unwrap();
        let output = write_lua_minified(&block);
        assert!(!output.contains('\n'));
    }

    #[test]
    fn test_string_escaping() {
        let source = "local s = \"hello\\nworld\"";
        let block = Parser::parse_source(source).unwrap();
        let output = write_lua(&block);
        assert!(output.contains("\\n"));
    }

    #[test]
    fn test_hex_numbers() {
        let mut config = WriterConfig::default();
        config.number_format = NumberFormat::Hexadecimal;
        let mut writer = LuaWriter::new(config);
        let block = Parser::parse_source("local x = 255").unwrap();
        let output = writer.generate(&block);
        assert!(output.contains("0xff"));
    }
}
