//! Lua 5.1 Lexer
//!
//! Lua 5.1 词法分析器，将源码转换为Token流。
//! 严格遵循Lua 5.1语法规范，确保Delta Executor兼容。

use std::fmt;

/// Token类型
#[derive(Clone, Debug, PartialEq)]
pub enum TokenKind {
    // 关键字
    And,
    Break,
    Do,
    Else,
    Elseif,
    End,
    False,
    For,
    Function,
    If,
    In,
    Local,
    Nil,
    Not,
    Or,
    Repeat,
    Return,
    Then,
    True,
    Until,
    While,

    // 字面量
    Number(f64),
    Int(i64),
    String(String),
    Name(String),

    // 操作符
    Plus,       // +
    Minus,      // -
    Star,       // *
    Slash,      // /
    Percent,    // %
    Caret,      // ^
    Hash,       // #
    Equal,      // ==
    NotEqual,   // ~=
    LessEqual,  // <=
    GreaterEqual, // >=
    Less,       // <
    Greater,    // >
    Assign,     // =
    LeftParen,  // (
    RightParen, // )
    LeftBrace,  // {
    RightBrace, // }
    LeftBracket, // [
    RightBracket, // ]
    Colon,      // :
    Semicolon,  // ;
    Comma,      // ,
    Dot,        // .
    Concat,     // ..
    Dots,       // ...

    // 特殊
    Eof,
}

/// Token
#[derive(Clone, Debug)]
pub struct Token {
    pub kind: TokenKind,
    pub line: usize,
    pub column: usize,
    pub lexeme: String,
}

impl Token {
    pub fn new(kind: TokenKind, line: usize, column: usize, lexeme: String) -> Self {
        Self { kind, line, column, lexeme }
    }
}

impl fmt::Display for Token {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}:{} {:?} '{}'", self.line, self.column, self.kind, self.lexeme)
    }
}

/// 词法分析错误
#[derive(Clone, Debug)]
pub struct LexerError {
    pub message: String,
    pub line: usize,
    pub column: usize,
}

impl fmt::Display for LexerError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Lexer error at {}:{}: {}", self.line, self.column, self.message)
    }
}

/// Lua 5.1 关键字集合
fn is_keyword(word: &str) -> Option<TokenKind> {
    match word {
        "and" => Some(TokenKind::And),
        "break" => Some(TokenKind::Break),
        "do" => Some(TokenKind::Do),
        "else" => Some(TokenKind::Else),
        "elseif" => Some(TokenKind::Elseif),
        "end" => Some(TokenKind::End),
        "false" => Some(TokenKind::False),
        "for" => Some(TokenKind::For),
        "function" => Some(TokenKind::Function),
        "if" => Some(TokenKind::If),
        "in" => Some(TokenKind::In),
        "local" => Some(TokenKind::Local),
        "nil" => Some(TokenKind::Nil),
        "not" => Some(TokenKind::Not),
        "or" => Some(TokenKind::Or),
        "repeat" => Some(TokenKind::Repeat),
        "return" => Some(TokenKind::Return),
        "then" => Some(TokenKind::Then),
        "true" => Some(TokenKind::True),
        "until" => Some(TokenKind::Until),
        "while" => Some(TokenKind::While),
        _ => None,
    }
}

/// 词法分析器
pub struct Lexer {
    source: Vec<char>,
    pos: usize,
    line: usize,
    column: usize,
    tokens: Vec<Token>,
}

impl Lexer {
    /// 创建新的词法分析器
    pub fn new(source: &str) -> Self {
        Self {
            source: source.chars().collect(),
            pos: 0,
            line: 1,
            column: 1,
            tokens: Vec::new(),
        }
    }

    /// 查看当前字符
    fn peek(&self) -> Option<char> {
        self.source.get(self.pos).copied()
    }

    /// 查看下一个字符
    fn peek_next(&self) -> Option<char> {
        self.source.get(self.pos + 1).copied()
    }

    /// 前进一个字符
    fn advance(&mut self) -> Option<char> {
        let c = self.source.get(self.pos).copied();
        if let Some(ch) = c {
            self.pos += 1;
            if ch == '\n' {
                self.line += 1;
                self.column = 1;
            } else {
                self.column += 1;
            }
        }
        c
    }

    /// 跳过空白字符
    fn skip_whitespace(&mut self) {
        while let Some(c) = self.peek() {
            if c.is_whitespace() {
                self.advance();
            } else {
                break;
            }
        }
    }

    /// 跳过注释
    fn skip_comment(&mut self) -> Result<(), LexerError> {
        // 已经消费了 '--'
        // 检查是否是长注释 --[[ ... ]]
        if self.peek() == Some('[') && (self.peek_next() == Some('[') || self.peek_next() == Some('=')) {
            self.skip_long_string()?;
            return Ok(());
        }

        // 单行注释
        while let Some(c) = self.peek() {
            if c == '\n' {
                break;
            }
            self.advance();
        }
        Ok(())
    }

    /// 跳过长字符串/长注释
    fn skip_long_string(&mut self) -> Result<(), LexerError> {
        // 已经消费了 '['，现在读取等号数量
        let mut level = 0;
        while self.peek() == Some('=') {
            level += 1;
            self.advance();
        }

        if self.peek() != Some('[') {
            return Err(LexerError {
                message: "Invalid long string delimiter".to_string(),
                line: self.line,
                column: self.column,
            });
        }
        self.advance(); // 消费第二个 '['

        // 查找结束符 ]]...]]
        let closing = format!("]{}]", "=".repeat(level));
        let closing_chars: Vec<char> = closing.chars().collect();

        loop {
            match self.peek() {
                None => {
                    return Err(LexerError {
                        message: "Unterminated long string".to_string(),
                        line: self.line,
                        column: self.column,
                    });
                }
                Some(']') => {
                    // 检查是否匹配结束符
                    let mut matched = true;
                    for (i, expected) in closing_chars.iter().enumerate() {
                        if self.source.get(self.pos + i) != Some(expected) {
                            matched = false;
                            break;
                        }
                    }
                    if matched {
                        for _ in 0..closing_chars.len() {
                            self.advance();
                        }
                        return Ok(());
                    }
                    self.advance();
                }
                Some(_) => {
                    self.advance();
                }
            }
        }
    }

    /// 读取长字符串
    fn read_long_string(&mut self) -> Result<String, LexerError> {
        // 已经消费了 '['，现在读取等号数量
        let mut level = 0;
        while self.peek() == Some('=') {
            level += 1;
            self.advance();
        }

        if self.peek() != Some('[') {
            return Err(LexerError {
                message: "Invalid long string delimiter".to_string(),
                line: self.line,
                column: self.column,
            });
        }
        self.advance(); // 消费第二个 '['

        // 跳过开头的换行
        if self.peek() == Some('\n') {
            self.advance();
        } else if self.peek() == Some('\r') && self.peek_next() == Some('\n') {
            self.advance();
            self.advance();
        }

        let closing = format!("]{}]", "=".repeat(level));
        let closing_chars: Vec<char> = closing.chars().collect();
        let mut result = String::new();

        loop {
            match self.peek() {
                None => {
                    return Err(LexerError {
                        message: "Unterminated long string".to_string(),
                        line: self.line,
                        column: self.column,
                    });
                }
                Some(']') => {
                    let mut matched = true;
                    for (i, expected) in closing_chars.iter().enumerate() {
                        if self.source.get(self.pos + i) != Some(expected) {
                            matched = false;
                            break;
                        }
                    }
                    if matched {
                        for _ in 0..closing_chars.len() {
                            self.advance();
                        }
                        return Ok(result);
                    }
                    if let Some(c) = self.advance() { result.push(c); }
                }
                Some(c) => {
                    result.push(c);
                    self.advance();
                }
            }
        }
    }

    /// 读取字符串
    fn read_string(&mut self, quote: char) -> Result<String, LexerError> {
        self.advance(); // 消费开头引号
        let mut result = String::new();

        loop {
            match self.peek() {
                None => {
                    return Err(LexerError {
                        message: "Unterminated string".to_string(),
                        line: self.line,
                        column: self.column,
                    });
                }
                Some(c) if c == quote => {
                    self.advance();
                    return Ok(result);
                }
                Some('\\') => {
                    self.advance();
                    match self.peek() {
                        Some('n') => { result.push('\n'); self.advance(); }
                        Some('t') => { result.push('\t'); self.advance(); }
                        Some('r') => { result.push('\r'); self.advance(); }
                        Some('\\') => { result.push('\\'); self.advance(); }
                        Some('"') => { result.push('"'); self.advance(); }
                        Some('\'') => { result.push('\''); self.advance(); }
                        Some('a') => { result.push('\x07'); self.advance(); }
                        Some('b') => { result.push('\x08'); self.advance(); }
                        Some('f') => { result.push('\x0c'); self.advance(); }
                        Some('v') => { result.push('\x0b'); self.advance(); }
                        Some('z') => {
                            // \z 跳过后续空白
                            self.advance();
                            while let Some(c) = self.peek() {
                                if c.is_whitespace() {
                                    self.advance();
                                } else {
                                    break;
                                }
                            }
                        }
                        Some('\n') => { result.push('\n'); self.advance(); }
                        Some('\r') => {
                            self.advance();
                            if self.peek() == Some('\n') {
                                self.advance();
                            }
                            result.push('\n');
                        }
                        Some(c) if c.is_ascii_digit() => {
                            // 十进制转义 \ddd
                            let mut num = 0;
                            for _ in 0..3 {
                                if let Some(d) = self.peek() {
                                    if d.is_ascii_digit() {
                                        num = num * 10 + (d as u8 - b'0') as u32;
                                        self.advance();
                                    } else {
                                        break;
                                    }
                                }
                            }
                            result.push(num as u8 as char);
                        }
                        Some('x') => {
                            // 十六进制转义 \xhh
                            self.advance();
                            let mut hex = String::new();
                            for _ in 0..2 {
                                if let Some(c) = self.peek() {
                                    if c.is_ascii_hexdigit() {
                                        hex.push(c);
                                        self.advance();
                                    } else {
                                        break;
                                    }
                                }
                            }
                            let val = u32::from_str_radix(&hex, 16).unwrap_or(0);
                            result.push(val as u8 as char);
                        }
                        Some(c) => {
                            result.push(c);
                            self.advance();
                        }
                        None => {
                            return Err(LexerError {
                                message: "Unterminated string escape".to_string(),
                                line: self.line,
                                column: self.column,
                            });
                        }
                    }
                }
                Some(c) => {
                    result.push(c);
                    self.advance();
                }
            }
        }
    }

    /// 解析十六进制浮点数
    fn parse_hex_float(&self, lexeme: &str) -> f64 {
        // 简化实现：将十六进制浮点数转换为f64
        let lexeme = lexeme.trim_start_matches("0x").trim_start_matches("0X");
        let parts: Vec<&str> = lexeme.split(|c| c == 'p' || c == 'P').collect();
        let mantissa_str = parts[0];
        let exponent: i32 = if parts.len() > 1 {
            parts[1].parse().unwrap_or(0)
        } else {
            0
        };

        let mantissa_parts: Vec<&str> = mantissa_str.split('.').collect();
        let int_part = u64::from_str_radix(mantissa_parts[0], 16).unwrap_or(0) as f64;
        let frac_part = if mantissa_parts.len() > 1 {
            let mut frac = 0.0;
            let mut divisor = 16.0;
            for c in mantissa_parts[1].chars() {
                let digit = c.to_digit(16).unwrap_or(0) as f64;
                frac += digit / divisor;
                divisor *= 16.0;
            }
            frac
        } else {
            0.0
        };

        (int_part + frac_part) * 2.0f64.powi(exponent)
    }

    /// 读取数字
    fn read_number(&mut self) -> Result<TokenKind, LexerError> {
        let start = self.pos;
        let start_line = self.line;
        let start_col = self.column;
        let mut is_hex = false;
        let mut is_float = false;

        // 检查十六进制
        if self.peek() == Some('0') && (self.peek_next() == Some('x') || self.peek_next() == Some('X')) {
            is_hex = true;
            self.advance(); // 0
            self.advance(); // x
            while let Some(c) = self.peek() {
                if c.is_ascii_hexdigit() || c == '.' {
                    if c == '.' { is_float = true; }
                    self.advance();
                } else {
                    break;
                }
            }
            // 十六进制指数 p/P
            if self.peek() == Some('p') || self.peek() == Some('P') {
                is_float = true;
                self.advance();
                if self.peek() == Some('+') || self.peek() == Some('-') {
                    self.advance();
                }
                while let Some(c) = self.peek() {
                    if c.is_ascii_digit() {
                        self.advance();
                    } else {
                        break;
                    }
                }
            }
        } else {
            // 十进制
            while let Some(c) = self.peek() {
                if c.is_ascii_digit() {
                    self.advance();
                } else {
                    break;
                }
            }
            if self.peek() == Some('.') {
                is_float = true;
                self.advance();
                while let Some(c) = self.peek() {
                    if c.is_ascii_digit() {
                        self.advance();
                    } else {
                        break;
                    }
                }
            }
            // 指数 e/E
            if self.peek() == Some('e') || self.peek() == Some('E') {
                is_float = true;
                self.advance();
                if self.peek() == Some('+') || self.peek() == Some('-') {
                    self.advance();
                }
                while let Some(c) = self.peek() {
                    if c.is_ascii_digit() {
                        self.advance();
                    } else {
                        break;
                    }
                }
            }
        }

        let lexeme: String = self.source[start..self.pos].iter().collect();

        if is_float {
            let val = if is_hex {
                // 手动解析十六进制浮点数
                self.parse_hex_float(&lexeme)
            } else {
                lexeme.parse::<f64>().unwrap_or(0.0)
            };
            Ok(TokenKind::Number(val))
        } else {
            let val = if is_hex {
                i64::from_str_radix(lexeme.trim_start_matches("0x").trim_start_matches("0X"), 16).unwrap_or(0)
            } else {
                lexeme.parse::<i64>().unwrap_or(0)
            };
            Ok(TokenKind::Int(val))
        }
    }

    /// 读取标识符
    fn read_name(&mut self) -> TokenKind {
        let start = self.pos;
        while let Some(c) = self.peek() {
            if c.is_alphanumeric() || c == '_' {
                self.advance();
            } else {
                break;
            }
        }
        let name: String = self.source[start..self.pos].iter().collect();
        if let Some(kw) = is_keyword(&name) {
            kw
        } else {
            TokenKind::Name(name)
        }
    }

    /// 执行词法分析
    pub fn tokenize(&mut self) -> Result<Vec<Token>, LexerError> {
        loop {
            self.skip_whitespace();

            let start_line = self.line;
            let start_col = self.column;
            let start_pos = self.pos;

            let c = match self.peek() {
                Some(c) => c,
                None => {
                    self.tokens.push(Token::new(TokenKind::Eof, self.line, self.column, String::new()));
                    break;
                }
            };

            let kind = match c {
                // 注释
                '-' if self.peek_next() == Some('-') => {
                    self.advance(); // -
                    self.advance(); // -
                    self.skip_comment()?;
                    continue;
                }

                // 字符串
                '"' => {
                    let s = self.read_string('"')?;
                    TokenKind::String(s)
                }
                '\'' => {
                    let s = self.read_string('\'')?;
                    TokenKind::String(s)
                }

                // 长字符串
                '[' if self.peek_next() == Some('[') || self.peek_next() == Some('=') => {
                    self.advance(); // [
                    let s = self.read_long_string()?;
                    TokenKind::String(s)
                }

                // 数字
                c if c.is_ascii_digit() => {
                    self.read_number()?
                }

                // 标识符/关键字
                c if c.is_alphabetic() || c == '_' => {
                    self.read_name()
                }

                // 操作符
                '+' => { self.advance(); TokenKind::Plus }
                '-' => { self.advance(); TokenKind::Minus }
                '*' => { self.advance(); TokenKind::Star }
                '/' => { self.advance(); TokenKind::Slash }
                '%' => { self.advance(); TokenKind::Percent }
                '^' => { self.advance(); TokenKind::Caret }
                '#' => { self.advance(); TokenKind::Hash }
                '=' if self.peek_next() == Some('=') => { self.advance(); self.advance(); TokenKind::Equal }
                '=' => { self.advance(); TokenKind::Assign }
                '~' if self.peek_next() == Some('=') => { self.advance(); self.advance(); TokenKind::NotEqual }
                '<' if self.peek_next() == Some('=') => { self.advance(); self.advance(); TokenKind::LessEqual }
                '<' => { self.advance(); TokenKind::Less }
                '>' if self.peek_next() == Some('=') => { self.advance(); self.advance(); TokenKind::GreaterEqual }
                '>' => { self.advance(); TokenKind::Greater }
                '(' => { self.advance(); TokenKind::LeftParen }
                ')' => { self.advance(); TokenKind::RightParen }
                '{' => { self.advance(); TokenKind::LeftBrace }
                '}' => { self.advance(); TokenKind::RightBrace }
                '[' => { self.advance(); TokenKind::LeftBracket }
                ']' => { self.advance(); TokenKind::RightBracket }
                ':' => { self.advance(); TokenKind::Colon }
                ';' => { self.advance(); TokenKind::Semicolon }
                ',' => { self.advance(); TokenKind::Comma }
                '.' if self.peek_next() == Some('.') && self.source.get(self.pos + 2) == Some(&'.') => {
                    self.advance(); self.advance(); self.advance(); TokenKind::Dots
                }
                '.' if self.peek_next() == Some('.') => {
                    self.advance(); self.advance(); TokenKind::Concat
                }
                '.' => { self.advance(); TokenKind::Dot }

                _ => {
                    return Err(LexerError {
                        message: format!("Unexpected character '{}'", c),
                        line: start_line,
                        column: start_col,
                    });
                }
            };

            let lexeme: String = self.source[start_pos..self.pos].iter().collect();
            self.tokens.push(Token::new(kind, start_line, start_col, lexeme));
        }

        Ok(self.tokens.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_keywords() {
        let mut lexer = Lexer::new("if then else end function local return");
        let tokens = lexer.tokenize().unwrap();
        assert_eq!(tokens[0].kind, TokenKind::If);
        assert_eq!(tokens[1].kind, TokenKind::Then);
        assert_eq!(tokens[2].kind, TokenKind::Else);
        assert_eq!(tokens[3].kind, TokenKind::End);
        assert_eq!(tokens[4].kind, TokenKind::Function);
        assert_eq!(tokens[5].kind, TokenKind::Local);
        assert_eq!(tokens[6].kind, TokenKind::Return);
    }

    #[test]
    fn test_numbers() {
        let mut lexer = Lexer::new("123 3.14 0xFF 0x1p3");
        let tokens = lexer.tokenize().unwrap();
        assert_eq!(tokens[0].kind, TokenKind::Int(123));
        assert!(matches!(tokens[1].kind, TokenKind::Number(v) if (v - 3.14).abs() < 0.001));
        assert_eq!(tokens[2].kind, TokenKind::Int(255));
    }

    #[test]
    fn test_strings() {
        let mut lexer = Lexer::new("\"hello\" 'world' [[long string]]");
        let tokens = lexer.tokenize().unwrap();
        assert_eq!(tokens[0].kind, TokenKind::String("hello".to_string()));
        assert_eq!(tokens[1].kind, TokenKind::String("world".to_string()));
        assert_eq!(tokens[2].kind, TokenKind::String("long string".to_string()));
    }

    #[test]
    fn test_operators() {
        let mut lexer = Lexer::new("+ - * / % ^ # == ~= <= >= < > = ( ) { } [ ] : ; , .. ...");
        let tokens = lexer.tokenize().unwrap();
        assert_eq!(tokens[0].kind, TokenKind::Plus);
        assert_eq!(tokens[1].kind, TokenKind::Minus);
        assert_eq!(tokens[7].kind, TokenKind::Equal);
        assert_eq!(tokens[8].kind, TokenKind::NotEqual);
        assert_eq!(tokens[23].kind, TokenKind::Concat);
        assert_eq!(tokens[24].kind, TokenKind::Dots);
    }

    #[test]
    fn test_comments() {
        let mut lexer = Lexer::new("-- this is a comment\nlocal x = 1\n--[[ multi\nline\ncomment ]]\nprint(x)");
        let tokens = lexer.tokenize().unwrap();
        assert_eq!(tokens[0].kind, TokenKind::Local);
        assert_eq!(tokens[1].kind, TokenKind::Name("x".to_string()));
    }

    #[test]
    fn test_string_escapes() {
        let mut lexer = Lexer::new("\"\\n\\t\\r\\\\\\\"\\100\\x41\"");
        let tokens = lexer.tokenize().unwrap();
        if let TokenKind::String(s) = &tokens[0].kind {
            assert_eq!(s, "\n\t\r\\\"dA");
        } else {
            panic!("Expected string token");
        }
    }

    #[test]
    fn test_identifiers() {
        let mut lexer = Lexer::new("foo bar_baz _private var123");
        let tokens = lexer.tokenize().unwrap();
        assert_eq!(tokens[0].kind, TokenKind::Name("foo".to_string()));
        assert_eq!(tokens[1].kind, TokenKind::Name("bar_baz".to_string()));
        assert_eq!(tokens[2].kind, TokenKind::Name("_private".to_string()));
        assert_eq!(tokens[3].kind, TokenKind::Name("var123".to_string()));
    }
}
