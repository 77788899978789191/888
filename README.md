# Gungnir - Ultimate Lua 5.1 Obfuscator

个人专用 Lua 5.1 混淆器。Rust 核心引擎 + WASM 网页版 + CLI 命令行。

## 技术规格

- **开发语言**: Rust (严格模式)
- **目标平台**: Lua 5.1 (Delta Executor / Gloop Engine)
- **技术数量**: 162 项混淆技术
- **网页版**: Rust + WASM (GitHub Pages)
- **CLI**: 原生 Rust 二进制

## 快速开始

### 编译 CLI

```bash
cargo build --release
```

### CLI 用法

```bash
# 基础用法
./target/release/gungnir-cli input.lua -o output.lua

# 完整参数
./target/release/gungnir-cli \
  input.lua \
  --output obfuscated.lua \
  --intensity 10 \
  --seed 42 \
  --salt my-salt \
  --verbose
```

| 参数 | 说明 | 默认 |
|------|------|------|
| `INPUT` | 输入 Lua 文件（位置参数，必填） | — |
| `-o, --output` | 输出文件路径 | `output.lua` |
| `-i, --intensity` | 混淆强度 (1-10) | `10` |
| `-s, --seed` | 随机种子 | 随机生成 |
| `--salt` | 用户盐值 | 空 |
| `-c, --config` | 配置文件路径 | — |
| `--stats` | 输出统计报告 | 关闭 |
| `-v, --verbose` | 详细日志 | 关闭 |

### 编译 WASM 网页版

```bash
# 安装 wasm-pack
cargo install wasm-pack

# 编译 WASM
wasm-pack build --target web --out-dir web/pkg -- --features wasm

# 本地测试
cd web && python3 -m http.server 8080
```

## 项目结构

```
gungnir/
├── Cargo.toml              # Rust 项目配置
├── src/
│   ├── lib.rs              # 统一导出
│   ├── core/               # 核心模块
│   │   ├── seed.rs         # 2048位随机构建种子
│   │   ├── config.rs       # 配置管理
│   │   ├── stats.rs        # 混淆统计
│   │   └── orchestrator.rs # 全局调度器
│   ├── lua/                # Lua 解析/生成
│   │   ├── lexer.rs        # 词法分析器
│   │   ├── ast.rs          # AST 定义
│   │   ├── parser.rs       # 递归下降解析器
│   │   └── writer.rs       # 代码生成器
│   ├── vm/                 # 虚拟机 (22项技术)
│   ├── obfuscators/        # 控制流混淆 (20项)
│   ├── data/               # 数据混淆 (18项)
│   ├── scope/              # 作用域混淆 (11项)
│   ├── anti/               # 反自动化 (8项)
│   ├── runtime/            # 运行时反制 (12项)
│   ├── platform/           # 平台专属 (8项)
│   ├── delivery/           # 交付工程 (9项)
│   ├── quantum/            # 量子混淆 (12项)
│   ├── advanced/           # 前沿突破 (42项)
│   └── wasm/               # WASM 绑定
├── cli/
│   └── main.rs             # CLI 入口
├── web/
│   └── index.html          # WASM 网页版
├── docs/                   # GitHub Pages 部署目录
└── .github/workflows/
    └── deploy.yml          # CI/CD 自动部署
```

## 混淆技术分类

| 分类 | 数量 | 核心技术 |
|------|------|---------|
| 多态虚拟机引擎 | 22 | 双重解释器、动态操作码映射、VM代码生成 |
| 炼狱级控制流混淆 | 20 | 扁平化、不透明谓词、间接跳转、协程风暴 |
| 量子级数据混淆 | 18 | AES加密、MBA表达式、S-Box、元表代理链 |
| 多维作用域混淆 | 11 | 标识符重命名、闭包嵌套、环境劫持 |
| 反自动化分析 | 8 | 反符号执行、反污点追踪、AI级谓词 |
| 硬核运行时反制 | 12 | 反调试、时序检测、时间炸弹、自变异 |
| 平台专属 (Delta) | 8 | Gloop兼容、Remote加密、调度器扰乱 |
| 交付与工程 | 9 | 流水线、水印、质量报告、强度分级 |
| 量子混淆 | 12 | 量子门运算、不可区分性、后量子密码 |
| 前沿突破 | 42 | NAU神经单元、Henon映射、拟态多变体 |
| **总计** | **162** | |

## 测试

```bash
# 运行全部测试
cargo test

# 运行特定模块测试
cargo test vm
cargo test control_flow
```

## 网页版

访问: https://77788899978789191.github.io/888/

- 左侧: Lua 源码输入
- 中间: 混淆配置 (强度滑块)
- 右侧: 混淆输出
- 底部: 执行日志

## License

MIT
