//! Lua 5.1 AST (Abstract Syntax Tree)
//!
//! Lua 5.1 抽象语法树定义，用于混淆变换。

use std::fmt;

/// 块（一组语句）
#[derive(Clone, Debug, Default)]
pub struct Block {
    pub statements: Vec<Statement>,
    pub return_statement: Option<Vec<Expression>>,
}

/// 语句
#[derive(Clone, Debug)]
pub enum Statement {
    /// 空语句
    Empty,
    /// 赋值语句
    Assignment {
        targets: Vec<Expression>,
        values: Vec<Expression>,
    },
    /// 局部变量声明
    LocalDeclaration {
        names: Vec<String>,
        values: Option<Vec<Expression>>,
    },
    /// if语句
    If {
        condition: Expression,
        then_block: Block,
        else_if_blocks: Vec<(Expression, Block)>,
        else_block: Option<Block>,
    },
    /// while语句
    While {
        condition: Expression,
        body: Block,
    },
    /// repeat语句
    Repeat {
        body: Block,
        condition: Expression,
    },
    /// for数值循环
    ForNumeric {
        variable: String,
        start: Expression,
        end: Expression,
        step: Option<Expression>,
        body: Block,
    },
    /// for通用循环
    ForGeneric {
        variables: Vec<String>,
        iterators: Vec<Expression>,
        body: Block,
    },
    /// do语句
    Do(Block),
    /// break语句
    Break,
    /// return语句
    Return(Vec<Expression>),
    /// 函数调用语句
    FunctionCall(FunctionCall),
    /// 方法调用语句
    MethodCall {
        object: Box<Expression>,
        method: String,
        args: Vec<Expression>,
    },
    /// 函数声明
    FunctionDeclaration {
        name: FunctionName,
        parameters: Vec<String>,
        is_variadic: bool,
        body: Block,
    },
    /// 局部函数声明
    LocalFunctionDeclaration {
        name: String,
        parameters: Vec<String>,
        is_variadic: bool,
        body: Block,
    },
    /// 原始Lua代码（用于混淆器插入自定义代码）
    Raw(String),
}

/// 函数名
#[derive(Clone, Debug)]
pub struct FunctionName {
    pub parts: Vec<String>,
    pub method: Option<String>,
}

impl FunctionName {
    pub fn simple(name: &str) -> Self {
        Self {
            parts: vec![name.to_string()],
            method: None,
        }
    }
}

/// 表达式
#[derive(Clone, Debug)]
pub enum Expression {
    /// nil
    Nil,
    /// 布尔值
    Boolean(bool),
    /// 数字（整数）
    Integer(i64),
    /// 数字（浮点数）
    Float(f64),
    /// 字符串
    String(String),
    /// 长字符串
    LongString(String),
    /// 变量引用
    Variable(String),
    /// 表索引访问
    TableAccess {
        table: Box<Expression>,
        key: Box<Expression>,
    },
    /// 点访问
    DotAccess {
        object: Box<Expression>,
        field: String,
    },
    /// 函数调用
    FunctionCall(FunctionCall),
    /// 方法调用
    MethodCall {
        object: Box<Expression>,
        method: String,
        args: Vec<Expression>,
    },
    /// 匿名函数
    Function {
        parameters: Vec<String>,
        is_variadic: bool,
        body: Block,
    },
    /// 表构造器
    TableConstructor {
        fields: Vec<TableField>,
    },
    /// 二元运算
    BinaryOp {
        op: BinaryOperator,
        left: Box<Expression>,
        right: Box<Expression>,
    },
    /// 一元运算
    UnaryOp {
        op: UnaryOperator,
        operand: Box<Expression>,
    },
    /// 可变参数
    Vararg,
}

/// 二元运算符
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum BinaryOperator {
    Add,        // +
    Sub,        // -
    Mul,        // *
    Div,        // /
    Mod,        // %
    Pow,        // ^
    Concat,     // ..
    Equal,      // ==
    NotEqual,   // ~=
    Less,       // <
    LessEqual,  // <=
    Greater,    // >
    GreaterEqual, // >=
    And,        // and
    Or,         // or
}

impl BinaryOperator {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Add => "+",
            Self::Sub => "-",
            Self::Mul => "*",
            Self::Div => "/",
            Self::Mod => "%",
            Self::Pow => "^",
            Self::Concat => "..",
            Self::Equal => "==",
            Self::NotEqual => "~=",
            Self::Less => "<",
            Self::LessEqual => "<=",
            Self::Greater => ">",
            Self::GreaterEqual => ">=",
            Self::And => "and",
            Self::Or => "or",
        }
    }
}

/// 一元运算符
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum UnaryOperator {
    Neg,    // -
    Not,    // not
    Len,    // #
}

impl UnaryOperator {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Neg => "-",
            Self::Not => "not",
            Self::Len => "#",
        }
    }
}

/// 表字段
#[derive(Clone, Debug)]
pub enum TableField {
    /// 列表字段 [1] = value
    List(Expression),
    /// 命名字段 name = value
    Named(String, Expression),
    /// 索引字段 [expr] = value
    Indexed(Expression, Expression),
}

/// 函数调用
#[derive(Clone, Debug)]
pub struct FunctionCall {
    pub function: Box<Expression>,
    pub args: Vec<Expression>,
}

impl FunctionCall {
    pub fn new(function: Expression, args: Vec<Expression>) -> Self {
        Self {
            function: Box::new(function),
            args,
        }
    }
}

/// AST遍历器trait
pub trait AstVisitor {
    fn visit_block(&mut self, block: &mut Block) {
        for stmt in &mut block.statements {
            self.visit_statement(stmt);
        }
        if let Some(ret) = &mut block.return_statement {
            for expr in ret {
                self.visit_expression(expr);
            }
        }
    }

    fn visit_statement(&mut self, stmt: &mut Statement) {
        match stmt {
            Statement::Assignment { targets, values } => {
                for t in targets { self.visit_expression(t); }
                for v in values { self.visit_expression(v); }
            }
            Statement::LocalDeclaration { values, .. } => {
                if let Some(vals) = values {
                    for v in vals { self.visit_expression(v); }
                }
            }
            Statement::If { condition, then_block, else_if_blocks, else_block } => {
                self.visit_expression(condition);
                self.visit_block(then_block);
                for (cond, block) in else_if_blocks {
                    self.visit_expression(cond);
                    self.visit_block(block);
                }
                if let Some(block) = else_block {
                    self.visit_block(block);
                }
            }
            Statement::While { condition, body } => {
                self.visit_expression(condition);
                self.visit_block(body);
            }
            Statement::Repeat { body, condition } => {
                self.visit_block(body);
                self.visit_expression(condition);
            }
            Statement::ForNumeric { start, end, step, body, .. } => {
                self.visit_expression(start);
                self.visit_expression(end);
                if let Some(s) = step { self.visit_expression(s); }
                self.visit_block(body);
            }
            Statement::ForGeneric { iterators, body, .. } => {
                for it in iterators { self.visit_expression(it); }
                self.visit_block(body);
            }
            Statement::Do(block) => {
                self.visit_block(block);
            }
            Statement::Return(exprs) => {
                for e in exprs { self.visit_expression(e); }
            }
            Statement::FunctionCall(call) => {
                self.visit_expression(&mut call.function);
                for arg in &mut call.args {
                    self.visit_expression(arg);
                }
            }
            Statement::MethodCall { object, args, .. } => {
                self.visit_expression(object);
                for arg in args {
                    self.visit_expression(arg);
                }
            }
            Statement::FunctionDeclaration { body, .. } => {
                self.visit_block(body);
            }
            Statement::LocalFunctionDeclaration { body, .. } => {
                self.visit_block(body);
            }
            _ => {}
        }
    }

    fn visit_expression(&mut self, expr: &mut Expression) {
        match expr {
            Expression::TableAccess { table, key } => {
                self.visit_expression(table);
                self.visit_expression(key);
            }
            Expression::DotAccess { object, .. } => {
                self.visit_expression(object);
            }
            Expression::FunctionCall(call) => {
                self.visit_expression(&mut call.function);
                for arg in &mut call.args {
                    self.visit_expression(arg);
                }
            }
            Expression::MethodCall { object, args, .. } => {
                self.visit_expression(object);
                for arg in args { self.visit_expression(arg); }
            }
            Expression::Function { body, .. } => {
                self.visit_block(body);
            }
            Expression::TableConstructor { fields } => {
                for field in fields {
                    match field {
                        TableField::List(e) => self.visit_expression(e),
                        TableField::Named(_, e) => self.visit_expression(e),
                        TableField::Indexed(k, v) => {
                            self.visit_expression(k);
                            self.visit_expression(v);
                        }
                    }
                }
            }
            Expression::BinaryOp { left, right, .. } => {
                self.visit_expression(left);
                self.visit_expression(right);
            }
            Expression::UnaryOp { operand, .. } => {
                self.visit_expression(operand);
            }
            _ => {}
        }
    }
}

impl fmt::Display for Block {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        for stmt in &self.statements {
            writeln!(f, "{}", stmt)?;
        }
        if let Some(ret) = &self.return_statement {
            write!(f, "return ")?;
            for (i, e) in ret.iter().enumerate() {
                if i > 0 { write!(f, ", ")?; }
                write!(f, "{}", e)?;
            }
            writeln!(f)?;
        }
        Ok(())
    }
}

impl fmt::Display for Statement {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Statement::Empty => write!(f, ";"),
            Statement::Assignment { targets, values } => {
                for (i, t) in targets.iter().enumerate() {
                    if i > 0 { write!(f, ", ")?; }
                    write!(f, "{}", t)?;
                }
                write!(f, " = ")?;
                for (i, v) in values.iter().enumerate() {
                    if i > 0 { write!(f, ", ")?; }
                    write!(f, "{}", v)?;
                }
                Ok(())
            }
            Statement::LocalDeclaration { names, values } => {
                write!(f, "local ")?;
                for (i, n) in names.iter().enumerate() {
                    if i > 0 { write!(f, ", ")?; }
                    write!(f, "{}", n)?;
                }
                if let Some(vals) = values {
                    write!(f, " = ")?;
                    for (i, v) in vals.iter().enumerate() {
                        if i > 0 { write!(f, ", ")?; }
                        write!(f, "{}", v)?;
                    }
                }
                Ok(())
            }
            Statement::If { condition, then_block, else_if_blocks, else_block } => {
                writeln!(f, "if {} then", condition)?;
                write!(f, "{}", then_block)?;
                for (cond, block) in else_if_blocks {
                    writeln!(f, "elseif {} then", cond)?;
                    write!(f, "{}", block)?;
                }
                if let Some(block) = else_block {
                    writeln!(f, "else")?;
                    write!(f, "{}", block)?;
                }
                write!(f, "end")
            }
            Statement::While { condition, body } => {
                writeln!(f, "while {} do", condition)?;
                write!(f, "{}", body)?;
                write!(f, "end")
            }
            Statement::Repeat { body, condition } => {
                writeln!(f, "repeat")?;
                write!(f, "{}", body)?;
                write!(f, "until {}", condition)
            }
            Statement::ForNumeric { variable, start, end, step, body } => {
                write!(f, "for {} = {}, {}", variable, start, end)?;
                if let Some(s) = step { write!(f, ", {}", s)?; }
                writeln!(f, " do")?;
                write!(f, "{}", body)?;
                write!(f, "end")
            }
            Statement::ForGeneric { variables, iterators, body } => {
                write!(f, "for ")?;
                for (i, v) in variables.iter().enumerate() {
                    if i > 0 { write!(f, ", ")?; }
                    write!(f, "{}", v)?;
                }
                write!(f, " in ")?;
                for (i, it) in iterators.iter().enumerate() {
                    if i > 0 { write!(f, ", ")?; }
                    write!(f, "{}", it)?;
                }
                writeln!(f, " do")?;
                write!(f, "{}", body)?;
                write!(f, "end")
            }
            Statement::Do(block) => {
                writeln!(f, "do")?;
                write!(f, "{}", block)?;
                write!(f, "end")
            }
            Statement::Break => write!(f, "break"),
            Statement::Return(exprs) => {
                write!(f, "return")?;
                if !exprs.is_empty() {
                    write!(f, " ")?;
                    for (i, e) in exprs.iter().enumerate() {
                        if i > 0 { write!(f, ", ")?; }
                        write!(f, "{}", e)?;
                    }
                }
                Ok(())
            }
            Statement::FunctionCall(call) => write!(f, "{}", call),
            Statement::MethodCall { object, method, args } => {
                write!(f, "{}:{}(", object, method)?;
                for (i, a) in args.iter().enumerate() {
                    if i > 0 { write!(f, ", ")?; }
                    write!(f, "{}", a)?;
                }
                write!(f, ")")
            }
            Statement::FunctionDeclaration { name, parameters, is_variadic, body } => {
                write!(f, "function ")?;
                for (i, p) in name.parts.iter().enumerate() {
                    if i > 0 { write!(f, ".")?; }
                    write!(f, "{}", p)?;
                }
                if let Some(m) = &name.method {
                    write!(f, ":{}", m)?;
                }
                write!(f, "(")?;
                for (i, p) in parameters.iter().enumerate() {
                    if i > 0 { write!(f, ", ")?; }
                    write!(f, "{}", p)?;
                }
                if *is_variadic {
                    if !parameters.is_empty() { write!(f, ", ")?; }
                    write!(f, "...")?;
                }
                writeln!(f, ")")?;
                write!(f, "{}", body)?;
                write!(f, "end")
            }
            Statement::LocalFunctionDeclaration { name, parameters, is_variadic, body } => {
                write!(f, "local function {}(", name)?;
                for (i, p) in parameters.iter().enumerate() {
                    if i > 0 { write!(f, ", ")?; }
                    write!(f, "{}", p)?;
                }
                if *is_variadic {
                    if !parameters.is_empty() { write!(f, ", ")?; }
                    write!(f, "...")?;
                }
                writeln!(f, ")")?;
                write!(f, "{}", body)?;
                write!(f, "end")
            }
            Statement::Raw(code) => write!(f, "{}", code),
        }
    }
}

impl fmt::Display for Expression {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Expression::Nil => write!(f, "nil"),
            Expression::Boolean(b) => write!(f, "{}", b),
            Expression::Integer(n) => write!(f, "{}", n),
            Expression::Float(n) => write!(f, "{}", n),
            Expression::String(s) => write!(f, "\"{}\"", s.replace('\\', "\\\\").replace('"', "\\\"").replace('\n', "\\n")),
            Expression::LongString(s) => write!(f, "[[{}]]", s),
            Expression::Variable(name) => write!(f, "{}", name),
            Expression::TableAccess { table, key } => write!(f, "{}[{}]", table, key),
            Expression::DotAccess { object, field } => write!(f, "{}.{}", object, field),
            Expression::FunctionCall(call) => write!(f, "{}", call),
            Expression::MethodCall { object, method, args } => {
                write!(f, "{}:{}(", object, method)?;
                for (i, a) in args.iter().enumerate() {
                    if i > 0 { write!(f, ", ")?; }
                    write!(f, "{}", a)?;
                }
                write!(f, ")")
            }
            Expression::Function { parameters, is_variadic, body } => {
                write!(f, "function(")?;
                for (i, p) in parameters.iter().enumerate() {
                    if i > 0 { write!(f, ", ")?; }
                    write!(f, "{}", p)?;
                }
                if *is_variadic {
                    if !parameters.is_empty() { write!(f, ", ")?; }
                    write!(f, "...")?;
                }
                writeln!(f, ")")?;
                write!(f, "{}", body)?;
                write!(f, "end")
            }
            Expression::TableConstructor { fields } => {
                write!(f, "{{")?;
                for (i, field) in fields.iter().enumerate() {
                    if i > 0 { write!(f, ", ")?; }
                    match field {
                        TableField::List(e) => write!(f, "{}", e)?,
                        TableField::Named(name, value) => write!(f, "{} = {}", name, value)?,
                        TableField::Indexed(key, value) => write!(f, "[{}] = {}", key, value)?,
                    }
                }
                write!(f, "}}")
            }
            Expression::BinaryOp { op, left, right } => {
                write!(f, "({} {} {})", left, op.as_str(), right)
            }
            Expression::UnaryOp { op, operand } => {
                write!(f, "({} {})", op.as_str(), operand)
            }
            Expression::Vararg => write!(f, "..."),
        }
    }
}

impl fmt::Display for FunctionCall {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}(", self.function)?;
        for (i, arg) in self.args.iter().enumerate() {
            if i > 0 { write!(f, ", ")?; }
            write!(f, "{}", arg)?;
        }
        write!(f, ")")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_expression_display() {
        let expr = Expression::BinaryOp {
            op: BinaryOperator::Add,
            left: Box::new(Expression::Integer(1)),
            right: Box::new(Expression::Integer(2)),
        };
        assert_eq!(format!("{}", expr), "(1 + 2)");
    }

    #[test]
    fn test_function_name_simple() {
        let name = FunctionName::simple("foo");
        assert_eq!(name.parts, vec!["foo"]);
        assert!(name.method.is_none());
    }
}
