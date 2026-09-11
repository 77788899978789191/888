//! Lua 5.1 Module
//!
//! Lua 5.1 解析、AST和代码生成模块。

pub mod ast;
pub mod lexer;
pub mod parser;
pub mod writer;

pub use ast::*;
pub use lexer::{Lexer, LexerError, Token, TokenKind};
pub use parser::{ParseError, Parser};
pub use writer::{LuaWriter, NumberFormat, WriterConfig, write_lua, write_lua_minified};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_full_roundtrip() {
        let source = r#"-- Test script
local function factorial(n)
  if n <= 1 then
    return 1
  end
  return n * factorial(n - 1)
end

local x = 10
local y = factorial(x)
print("Factorial of", x, "is", y)

for i = 1, 5 do
  print(i, i * i)
end

local t = {a = 1, b = 2, c = 3}
for k, v in pairs(t) do
  print(k, v)
end
"#;
        let block = Parser::parse_source(source).unwrap();
        let output = write_lua(&block);
        assert!(output.contains("function factorial"));
        assert!(output.contains("return"));
        assert!(output.contains("for i = 1, 5"));
    }

    #[test]
    fn test_minified_roundtrip() {
        let source = "local x = 10\nlocal y = 20\nprint(x + y)";
        let block = Parser::parse_source(source).unwrap();
        let output = write_lua_minified(&block);
        assert!(!output.contains('\n'));
        assert!(output.contains("local"));
    }

    #[test]
    fn test_lexer_parser_integration() {
        let source = "if true then print('yes') else print('no') end";
        let mut lexer = Lexer::new(source);
        let tokens = lexer.tokenize().unwrap();
        assert!(tokens.len() > 5);

        let mut parser = Parser::new(tokens);
        let block = parser.parse_block().unwrap();
        assert_eq!(block.statements.len(), 1);
    }
}
