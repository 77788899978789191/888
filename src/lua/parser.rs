//! Lua 5.1 Parser
//!
//! Lua 5.1 语法解析器，将Token流转换为AST。
//! 严格遵循Lua 5.1语法规范。

use super::ast::*;
use super::lexer::{Lexer, Token, TokenKind};

/// 解析错误
#[derive(Clone, Debug)]
pub struct ParseError {
    pub message: String,
    pub line: usize,
    pub column: usize,
}

impl std::fmt::Display for ParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Parse error at {}:{}: {}", self.line, self.column, self.message)
    }
}

/// 语法解析器
pub struct Parser {
    tokens: Vec<Token>,
    pos: usize,
}

impl Parser {
    /// 创建新的解析器
    pub fn new(tokens: Vec<Token>) -> Self {
        Self { tokens, pos: 0 }
    }

    /// 从源码创建解析器并解析
    pub fn parse_source(source: &str) -> Result<Block, ParseError> {
        let mut lexer = Lexer::new(source);
        let tokens = lexer.tokenize().map_err(|e| ParseError {
            message: e.message,
            line: e.line,
            column: e.column,
        })?;
        let mut parser = Parser::new(tokens);
        parser.parse_block()
    }

    /// 查看当前Token
    fn peek(&self) -> &TokenKind {
        &self.tokens[self.pos].kind
    }

    /// 查看当前Token的完整信息
    fn peek_token(&self) -> &Token {
        &self.tokens[self.pos]
    }

    /// 前进一个Token
    fn advance(&mut self) -> &Token {
        let token = &self.tokens[self.pos];
        if self.pos < self.tokens.len() - 1 {
            self.pos += 1;
        }
        token
    }

    /// 检查当前Token是否匹配
    fn check(&self, kind: &TokenKind) -> bool {
        std::mem::discriminant(&self.tokens[self.pos].kind) == std::mem::discriminant(kind)
    }

    /// 期望当前Token匹配，否则报错
    fn expect(&mut self, kind: &TokenKind) -> Result<&Token, ParseError> {
        if self.check(kind) {
            Ok(self.advance())
        } else {
            Err(ParseError {
                message: format!("Expected {:?}, found {:?}", kind, self.peek()),
                line: self.peek_token().line,
                column: self.peek_token().column,
            })
        }
    }

    /// 尝试匹配，如果匹配则前进
    fn try_match(&mut self, kind: &TokenKind) -> bool {
        if self.check(kind) {
            self.advance();
            true
        } else {
            false
        }
    }

    /// 解析块
    pub fn parse_block(&mut self) -> Result<Block, ParseError> {
        let mut statements = Vec::new();
        let mut return_statement = None;

        loop {
            match self.peek() {
                TokenKind::Eof | TokenKind::End | TokenKind::Else | TokenKind::Elseif | TokenKind::Until => {
                    break;
                }
                TokenKind::Return => {
                    self.advance();
                    let mut values = Vec::new();
                    if !self.check(&TokenKind::Eof) && !self.check(&TokenKind::End)
                        && !self.check(&TokenKind::Semicolon)
                    {
                        values.push(self.parse_expression()?);
                        while self.try_match(&TokenKind::Comma) {
                            values.push(self.parse_expression()?);
                        }
                    }
                    self.try_match(&TokenKind::Semicolon);
                    return_statement = Some(values);
                    break;
                }
                _ => {
                    let stmt = self.parse_statement()?;
                    statements.push(stmt);
                    self.try_match(&TokenKind::Semicolon);
                }
            }
        }

        Ok(Block { statements, return_statement })
    }

    /// 解析语句
    fn parse_statement(&mut self) -> Result<Statement, ParseError> {
        match self.peek() {
            TokenKind::If => self.parse_if(),
            TokenKind::While => self.parse_while(),
            TokenKind::Do => {
                self.advance();
                let block = self.parse_block()?;
                self.expect(&TokenKind::End)?;
                Ok(Statement::Do(block))
            }
            TokenKind::For => self.parse_for(),
            TokenKind::Repeat => self.parse_repeat(),
            TokenKind::Function => self.parse_function_declaration(),
            TokenKind::Local => self.parse_local(),
            TokenKind::Break => {
                self.advance();
                Ok(Statement::Break)
            }
            TokenKind::Semicolon => {
                self.advance();
                Ok(Statement::Empty)
            }
            _ => self.parse_assignment_or_call(),
        }
    }

    /// 解析if语句
    fn parse_if(&mut self) -> Result<Statement, ParseError> {
        self.expect(&TokenKind::If)?;
        let condition = self.parse_expression()?;
        self.expect(&TokenKind::Then)?;
        let then_block = self.parse_block()?;

        let mut else_if_blocks = Vec::new();
        let mut else_block = None;

        loop {
            match self.peek() {
                TokenKind::Elseif => {
                    self.advance();
                    let cond = self.parse_expression()?;
                    self.expect(&TokenKind::Then)?;
                    let block = self.parse_block()?;
                    else_if_blocks.push((cond, block));
                }
                TokenKind::Else => {
                    self.advance();
                    else_block = Some(self.parse_block()?);
                    break;
                }
                _ => break,
            }
        }

        self.expect(&TokenKind::End)?;

        Ok(Statement::If {
            condition,
            then_block,
            else_if_blocks,
            else_block,
        })
    }

    /// 解析while语句
    fn parse_while(&mut self) -> Result<Statement, ParseError> {
        self.expect(&TokenKind::While)?;
        let condition = self.parse_expression()?;
        self.expect(&TokenKind::Do)?;
        let body = self.parse_block()?;
        self.expect(&TokenKind::End)?;
        Ok(Statement::While { condition, body })
    }

    /// 解析repeat语句
    fn parse_repeat(&mut self) -> Result<Statement, ParseError> {
        self.expect(&TokenKind::Repeat)?;
        let body = self.parse_block()?;
        self.expect(&TokenKind::Until)?;
        let condition = self.parse_expression()?;
        Ok(Statement::Repeat { body, condition })
    }

    /// 解析for语句
    fn parse_for(&mut self) -> Result<Statement, ParseError> {
        self.expect(&TokenKind::For)?;

        // 解析第一个变量名
        let var_name = if let TokenKind::Name(name) = self.peek().clone() {
            self.advance();
            name
        } else {
            return Err(ParseError {
                message: "Expected variable name".to_string(),
                line: self.peek_token().line,
                column: self.peek_token().column,
            });
        };

        if self.try_match(&TokenKind::Assign) {
            // 数值for循环
            let start = self.parse_expression()?;
            self.expect(&TokenKind::Comma)?;
            let end = self.parse_expression()?;
            let step = if self.try_match(&TokenKind::Comma) {
                Some(self.parse_expression()?)
            } else {
                None
            };
            self.expect(&TokenKind::Do)?;
            let body = self.parse_block()?;
            self.expect(&TokenKind::End)?;
            Ok(Statement::ForNumeric {
                variable: var_name,
                start,
                end,
                step,
                body,
            })
        } else {
            // 通用for循环
            let mut variables = vec![var_name];
            while self.try_match(&TokenKind::Comma) {
                if let TokenKind::Name(name) = self.peek().clone() {
                    self.advance();
                    variables.push(name);
                } else {
                    return Err(ParseError {
                        message: "Expected variable name".to_string(),
                        line: self.peek_token().line,
                        column: self.peek_token().column,
                    });
                }
            }
            self.expect(&TokenKind::In)?;
            let mut iterators = vec![self.parse_expression()?];
            while self.try_match(&TokenKind::Comma) {
                iterators.push(self.parse_expression()?);
            }
            self.expect(&TokenKind::Do)?;
            let body = self.parse_block()?;
            self.expect(&TokenKind::End)?;
            Ok(Statement::ForGeneric {
                variables,
                iterators,
                body,
            })
        }
    }

    /// 解析函数声明
    fn parse_function_declaration(&mut self) -> Result<Statement, ParseError> {
        self.expect(&TokenKind::Function)?;

        // 解析函数名
        let mut parts = Vec::new();
        if let TokenKind::Name(name) = self.peek().clone() {
            self.advance();
            parts.push(name);
        } else {
            return Err(ParseError {
                message: "Expected function name".to_string(),
                line: self.peek_token().line,
                column: self.peek_token().column,
            });
        }

        while self.try_match(&TokenKind::Dot) {
            if let TokenKind::Name(name) = self.peek().clone() {
                self.advance();
                parts.push(name);
            } else {
                return Err(ParseError {
                    message: "Expected field name".to_string(),
                    line: self.peek_token().line,
                    column: self.peek_token().column,
                });
            }
        }

        let mut method = None;
        if self.try_match(&TokenKind::Colon) {
            if let TokenKind::Name(name) = self.peek().clone() {
                self.advance();
                method = Some(name);
            } else {
                return Err(ParseError {
                    message: "Expected method name".to_string(),
                    line: self.peek_token().line,
                    column: self.peek_token().column,
                });
            }
        }

        let (parameters, is_variadic, body) = self.parse_function_body()?;

        Ok(Statement::FunctionDeclaration {
            name: FunctionName { parts, method },
            parameters,
            is_variadic,
            body,
        })
    }

    /// 解析函数体
    fn parse_function_body(&mut self) -> Result<(Vec<String>, bool, Block), ParseError> {
        self.expect(&TokenKind::LeftParen)?;

        let mut parameters = Vec::new();
        let mut is_variadic = false;

        if !self.check(&TokenKind::RightParen) {
            loop {
                if self.check(&TokenKind::Dots) {
                    self.advance();
                    is_variadic = true;
                    break;
                }
                if let TokenKind::Name(name) = self.peek().clone() {
                    self.advance();
                    parameters.push(name);
                } else {
                    return Err(ParseError {
                        message: "Expected parameter name".to_string(),
                        line: self.peek_token().line,
                        column: self.peek_token().column,
                    });
                }
                if self.try_match(&TokenKind::Comma) {
                    continue;
                }
                break;
            }
        }

        self.expect(&TokenKind::RightParen)?;
        let body = self.parse_block()?;
        self.expect(&TokenKind::End)?;

        Ok((parameters, is_variadic, body))
    }

    /// 解析local语句
    fn parse_local(&mut self) -> Result<Statement, ParseError> {
        self.expect(&TokenKind::Local)?;

        if self.check(&TokenKind::Function) {
            // local function
            self.advance();
            let name = if let TokenKind::Name(name) = self.peek().clone() {
                self.advance();
                name
            } else {
                return Err(ParseError {
                    message: "Expected function name".to_string(),
                    line: self.peek_token().line,
                    column: self.peek_token().column,
                });
            };
            let (parameters, is_variadic, body) = self.parse_function_body()?;
            Ok(Statement::LocalFunctionDeclaration {
                name,
                parameters,
                is_variadic,
                body,
            })
        } else {
            // local variable declaration
            let mut names = Vec::new();
            if let TokenKind::Name(name) = self.peek().clone() {
                self.advance();
                names.push(name);
            } else {
                return Err(ParseError {
                    message: "Expected variable name".to_string(),
                    line: self.peek_token().line,
                    column: self.peek_token().column,
                });
            }
            while self.try_match(&TokenKind::Comma) {
                if let TokenKind::Name(name) = self.peek().clone() {
                    self.advance();
                    names.push(name);
                } else {
                    return Err(ParseError {
                        message: "Expected variable name".to_string(),
                        line: self.peek_token().line,
                        column: self.peek_token().column,
                    });
                }
            }

            let values = if self.try_match(&TokenKind::Assign) {
                let mut vals = vec![self.parse_expression()?];
                while self.try_match(&TokenKind::Comma) {
                    vals.push(self.parse_expression()?);
                }
                Some(vals)
            } else {
                None
            };

            Ok(Statement::LocalDeclaration { names, values })
        }
    }

    /// 解析赋值或函数调用
    fn parse_assignment_or_call(&mut self) -> Result<Statement, ParseError> {
        let first = self.parse_prefix_expression()?;

        // 检查是否是函数调用或方法调用
        let is_call = matches!(first, Expression::FunctionCall(_) | Expression::MethodCall { .. });

        if is_call {
            // 可能是函数调用语句
            // 但也可能是多个赋值的第一个目标
            if self.check(&TokenKind::Comma) || self.check(&TokenKind::Assign) {
                // 赋值语句
                let mut targets = vec![first];
                while self.try_match(&TokenKind::Comma) {
                    targets.push(self.parse_prefix_expression()?);
                }
                self.expect(&TokenKind::Assign)?;
                let mut values = vec![self.parse_expression()?];
                while self.try_match(&TokenKind::Comma) {
                    values.push(self.parse_expression()?);
                }
                Ok(Statement::Assignment { targets, values })
            } else {
                match first {
                    Expression::FunctionCall(call) => Ok(Statement::FunctionCall(call)),
                    Expression::MethodCall { object, method, args } => {
                        Ok(Statement::MethodCall { object, method, args })
                    }
                    _ => unreachable!(),
                }
            }
        } else {
            // 赋值语句
            let mut targets = vec![first];
            while self.try_match(&TokenKind::Comma) {
                targets.push(self.parse_prefix_expression()?);
            }
            self.expect(&TokenKind::Assign)?;
            let mut values = vec![self.parse_expression()?];
            while self.try_match(&TokenKind::Comma) {
                values.push(self.parse_expression()?);
            }
            Ok(Statement::Assignment { targets, values })
        }
    }

    /// 解析前缀表达式（变量、表访问、函数调用）
    fn parse_prefix_expression(&mut self) -> Result<Expression, ParseError> {
        let mut expr = if self.check(&TokenKind::LeftParen) {
            self.advance();
            let inner = self.parse_expression()?;
            self.expect(&TokenKind::RightParen)?;
            inner
        } else if let TokenKind::Name(name) = self.peek().clone() {
            self.advance();
            Expression::Variable(name)
        } else {
            return Err(ParseError {
                message: format!("Unexpected token {:?}", self.peek()),
                line: self.peek_token().line,
                column: self.peek_token().column,
            });
        };

        loop {
            match self.peek() {
                TokenKind::Dot => {
                    self.advance();
                    if let TokenKind::Name(field) = self.peek().clone() {
                        self.advance();
                        expr = Expression::DotAccess {
                            object: Box::new(expr),
                            field,
                        };
                    } else {
                        return Err(ParseError {
                            message: "Expected field name".to_string(),
                            line: self.peek_token().line,
                            column: self.peek_token().column,
                        });
                    }
                }
                TokenKind::LeftBracket => {
                    self.advance();
                    let key = self.parse_expression()?;
                    self.expect(&TokenKind::RightBracket)?;
                    expr = Expression::TableAccess {
                        table: Box::new(expr),
                        key: Box::new(key),
                    };
                }
                TokenKind::Colon => {
                    self.advance();
                    if let TokenKind::Name(method) = self.peek().clone() {
                        self.advance();
                        let args = self.parse_function_args()?;
                        expr = Expression::MethodCall {
                            object: Box::new(expr),
                            method,
                            args,
                        };
                    } else {
                        return Err(ParseError {
                            message: "Expected method name".to_string(),
                            line: self.peek_token().line,
                            column: self.peek_token().column,
                        });
                    }
                }
                TokenKind::LeftParen | TokenKind::LeftBrace | TokenKind::String(_) => {
                    let args = self.parse_function_args()?;
                    expr = Expression::FunctionCall(FunctionCall {
                        function: Box::new(expr),
                        args,
                    });
                }
                _ => break,
            }
        }

        Ok(expr)
    }

    /// 解析函数参数
    fn parse_function_args(&mut self) -> Result<Vec<Expression>, ParseError> {
        match self.peek() {
            TokenKind::LeftParen => {
                self.advance();
                let mut args = Vec::new();
                if !self.check(&TokenKind::RightParen) {
                    args.push(self.parse_expression()?);
                    while self.try_match(&TokenKind::Comma) {
                        args.push(self.parse_expression()?);
                    }
                }
                self.expect(&TokenKind::RightParen)?;
                Ok(args)
            }
            TokenKind::LeftBrace => {
                let table = self.parse_table_constructor()?;
                Ok(vec![table])
            }
            TokenKind::String(s) => {
                let s = s.clone();
                self.advance();
                Ok(vec![Expression::String(s)])
            }
            _ => Err(ParseError {
                message: "Expected function arguments".to_string(),
                line: self.peek_token().line,
                column: self.peek_token().column,
            }),
        }
    }

    /// 解析表构造器
    fn parse_table_constructor(&mut self) -> Result<Expression, ParseError> {
        self.expect(&TokenKind::LeftBrace)?;
        let mut fields = Vec::new();

        while !self.check(&TokenKind::RightBrace) {
            if self.try_match(&TokenKind::Semicolon) || self.try_match(&TokenKind::Comma) {
                continue;
            }

            if self.check(&TokenKind::LeftBracket) {
                // [expr] = expr
                self.advance();
                let key = self.parse_expression()?;
                self.expect(&TokenKind::RightBracket)?;
                self.expect(&TokenKind::Assign)?;
                let value = self.parse_expression()?;
                fields.push(TableField::Indexed(key, value));
            } else if let TokenKind::Name(_) = self.peek() {
                // 可能是 name = value 或列表项
                let save_pos = self.pos;
                self.advance(); // name
                if self.try_match(&TokenKind::Assign) {
                    // name = value
                    if let TokenKind::Name(name) = self.tokens[save_pos].kind.clone() {
                        let value = self.parse_expression()?;
                        fields.push(TableField::Named(name, value));
                    }
                } else {
                    // 列表项，回退
                    self.pos = save_pos;
                    let value = self.parse_expression()?;
                    fields.push(TableField::List(value));
                }
            } else {
                // 列表项
                let value = self.parse_expression()?;
                fields.push(TableField::List(value));
            }

            if !self.check(&TokenKind::RightBrace) {
                if !self.try_match(&TokenKind::Comma) && !self.try_match(&TokenKind::Semicolon) {
                    break;
                }
            }
        }

        self.expect(&TokenKind::RightBrace)?;
        Ok(Expression::TableConstructor { fields })
    }

    /// 解析表达式（优先级最低）
    pub fn parse_expression(&mut self) -> Result<Expression, ParseError> {
        self.parse_binary_expression(0)
    }

    /// 解析二元表达式（按优先级）
    fn parse_binary_expression(&mut self, min_precedence: u8) -> Result<Expression, ParseError> {
        let mut left = self.parse_unary_expression()?;

        loop {
            let (op, precedence) = match self.peek() {
                TokenKind::Or => (BinaryOperator::Or, 1),
                TokenKind::And => (BinaryOperator::And, 2),
                TokenKind::Less => (BinaryOperator::Less, 3),
                TokenKind::Greater => (BinaryOperator::Greater, 3),
                TokenKind::LessEqual => (BinaryOperator::LessEqual, 3),
                TokenKind::GreaterEqual => (BinaryOperator::GreaterEqual, 3),
                TokenKind::Equal => (BinaryOperator::Equal, 3),
                TokenKind::NotEqual => (BinaryOperator::NotEqual, 3),
                TokenKind::Concat => (BinaryOperator::Concat, 4),
                TokenKind::Plus => (BinaryOperator::Add, 5),
                TokenKind::Minus => (BinaryOperator::Sub, 5),
                TokenKind::Star => (BinaryOperator::Mul, 6),
                TokenKind::Slash => (BinaryOperator::Div, 6),
                TokenKind::Percent => (BinaryOperator::Mod, 6),
                TokenKind::Caret => (BinaryOperator::Pow, 7),
                _ => break,
            };

            if precedence < min_precedence {
                break;
            }

            self.advance();

            // .. 是右结合
            let next_min = if op == BinaryOperator::Concat || op == BinaryOperator::Pow {
                precedence
            } else {
                precedence + 1
            };

            let right = self.parse_binary_expression(next_min)?;
            left = Expression::BinaryOp {
                op,
                left: Box::new(left),
                right: Box::new(right),
            };
        }

        Ok(left)
    }

    /// 解析一元表达式
    fn parse_unary_expression(&mut self) -> Result<Expression, ParseError> {
        match self.peek() {
            TokenKind::Not => {
                self.advance();
                let operand = self.parse_unary_expression()?;
                Ok(Expression::UnaryOp {
                    op: UnaryOperator::Not,
                    operand: Box::new(operand),
                })
            }
            TokenKind::Minus => {
                self.advance();
                let operand = self.parse_unary_expression()?;
                Ok(Expression::UnaryOp {
                    op: UnaryOperator::Neg,
                    operand: Box::new(operand),
                })
            }
            TokenKind::Hash => {
                self.advance();
                let operand = self.parse_unary_expression()?;
                Ok(Expression::UnaryOp {
                    op: UnaryOperator::Len,
                    operand: Box::new(operand),
                })
            }
            _ => self.parse_primary_expression(),
        }
    }

    /// 解析基本表达式
    fn parse_primary_expression(&mut self) -> Result<Expression, ParseError> {
        match self.peek().clone() {
            TokenKind::Nil => {
                self.advance();
                Ok(Expression::Nil)
            }
            TokenKind::True => {
                self.advance();
                Ok(Expression::Boolean(true))
            }
            TokenKind::False => {
                self.advance();
                Ok(Expression::Boolean(false))
            }
            TokenKind::Int(n) => {
                self.advance();
                Ok(Expression::Integer(n))
            }
            TokenKind::Number(n) => {
                self.advance();
                Ok(Expression::Float(n))
            }
            TokenKind::String(s) => {
                self.advance();
                Ok(Expression::String(s))
            }
            TokenKind::Dots => {
                self.advance();
                Ok(Expression::Vararg)
            }
            TokenKind::Function => {
                self.advance();
                let (parameters, is_variadic, body) = self.parse_function_body()?;
                Ok(Expression::Function {
                    parameters,
                    is_variadic,
                    body,
                })
            }
            TokenKind::LeftBrace => self.parse_table_constructor(),
            TokenKind::LeftParen => {
                self.advance();
                let expr = self.parse_expression()?;
                self.expect(&TokenKind::RightParen)?;
                Ok(expr)
            }
            _ => self.parse_prefix_expression(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple() {
        let source = "local x = 10\nprint(x)";
        let block = Parser::parse_source(source).unwrap();
        assert_eq!(block.statements.len(), 2);
    }

    #[test]
    fn test_parse_if() {
        let source = "if x > 0 then\n  print('positive')\nelse\n  print('negative')\nend";
        let block = Parser::parse_source(source).unwrap();
        assert_eq!(block.statements.len(), 1);
        assert!(matches!(block.statements[0], Statement::If { .. }));
    }

    #[test]
    fn test_parse_while() {
        let source = "while x > 0 do\n  x = x - 1\nend";
        let block = Parser::parse_source(source).unwrap();
        assert!(matches!(block.statements[0], Statement::While { .. }));
    }

    #[test]
    fn test_parse_function() {
        let source = "function add(a, b)\n  return a + b\nend";
        let block = Parser::parse_source(source).unwrap();
        assert!(matches!(block.statements[0], Statement::FunctionDeclaration { .. }));
    }

    #[test]
    fn test_parse_table() {
        let source = "local t = {1, 2, 3, x = 10, [\"key\"] = \"value\"}";
        let block = Parser::parse_source(source).unwrap();
        assert!(matches!(block.statements[0], Statement::LocalDeclaration { .. }));
    }

    #[test]
    fn test_parse_for_numeric() {
        let source = "for i = 1, 10 do\n  print(i)\nend";
        let block = Parser::parse_source(source).unwrap();
        assert!(matches!(block.statements[0], Statement::ForNumeric { .. }));
    }

    #[test]
    fn test_parse_for_generic() {
        let source = "for k, v in pairs(t) do\n  print(k, v)\nend";
        let block = Parser::parse_source(source).unwrap();
        assert!(matches!(block.statements[0], Statement::ForGeneric { .. }));
    }

    #[test]
    fn test_parse_repeat() {
        let source = "repeat\n  x = x + 1\nuntil x > 10";
        let block = Parser::parse_source(source).unwrap();
        assert!(matches!(block.statements[0], Statement::Repeat { .. }));
    }

    #[test]
    fn test_parse_local_function() {
        let source = "local function foo()\n  return 1\nend";
        let block = Parser::parse_source(source).unwrap();
        assert!(matches!(block.statements[0], Statement::LocalFunctionDeclaration { .. }));
    }

    #[test]
    fn test_parse_method_call() {
        let source = "obj:method(arg1, arg2)";
        let block = Parser::parse_source(source).unwrap();
        assert!(matches!(block.statements[0], Statement::MethodCall { .. }));
    }
}
