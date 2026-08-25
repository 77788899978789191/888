# Project: Gungnir

个人专用 Lua 5.1 混淆框架。TypeScript 责任链引擎 + Web 界面。

## 快速开始

```bash
npm install
npm run build
```

### CLI 用法

```bash
# 基础用法
node dist/cli.js --input test/sample.lua --output out.lua

# 完整参数
node dist/cli.js \
  --input script.lua \
  --output obfuscated.lua \
  --intensity 7 \
  --seed 42 \
  --target roblox \
  --anti-debug-mode silent
```

| 参数 | 说明 | 默认 |
|------|------|------|
| `-i, --input` | 输入 Lua 文件（必填） | — |
| `-o, --output` | 输出文件（必填） | — |
| `--intensity <n>` | 混淆强度 1-10 | 5 |
| `--seed <n>` | 随机种子（可复现输出） | 时间戳 |
| `--target <env>` | `roblox` 或 `generic` | roblox |
| `--anti-debug-mode <mode>` | `silent` 或 `corrupt` | silent |
| `--no-polymorphic` | 关闭流水线乱序（固定模块顺序） | 开启 |
| `--no-watermark` | 关闭零宽水印 | 开启 |
| `--hot-path <patterns>` | 热路径豁免函数名模式（逗号分隔） | 空 |
| `--self-destruct` | 混淆成功后安全擦除源文件 | 关闭 |

### Web 界面

```bash
# 直接用浏览器打开（完全离线，luaparse 已内联）
docs/index.html
```

Web 引擎是 CLI 的浏览器子集（4 个模块：标识符重命名 / 字符串加密 / 常量混淆 / 表达式分解），输出前自动做 Lua 5.1 自检重解析。

## 混淆模块（12 个，CLI 全量）

| 层 | 模块 | 功能 |
|----|------|------|
| 4 | IdentifierRenaming | 标识符混淆 |
| 4 | GlobalHiding | 全局引用提升为局部别名 |
| 4 | ProxyFunction | 函数变参代理层 |
| 3 | StringEncryption | 字符串多轮 XOR 加密 + 惰性解密桩 |
| 3 | ConstantObfuscation | 常量等价变换（6 种） |
| 3 | ExpressionDecomposition | 表达式树深度分解 |
| 2 | OpaquePredicate | 不透明谓词（6 种策略） |
| 2 | ControlFlowFlattening | 控制流扁平化 |
| 5 | DeadCodeInjection | 永真/永假谓词守卫的死代码 |
| 6 | AntiDebug | 反调试运行时框架 |
| 7 | RobloxHardening | 环境指纹检测 |
| 8 | Watermark | 零宽指纹水印 |

## 输出保证

- **Lua 5.1 严格兼容**：无位运算符（`&` `|` `~`）、无 `table.unpack`、无 `goto`；XOR 用纯算术位切片实现
- **语义精确保持**：常量/表达式变换全部整数域精确（浮点值只接受精确变换，其余跳过）
- **多态引擎**：相同 seed 可复现，不同 seed 模块顺序与变换全部不同
- **错误恢复**：单模块崩溃被隔离（quarantined），流水线不中断

## 测试

```bash
npm run build

# 语法验证（Lua 5.1 严格解析）
npx ts-node --compilerOptions '{"module":"commonjs","noUnusedLocals":false}' test/verify.ts

# 加密往返
npx ts-node --compilerOptions '{"module":"commonjs","noUnusedLocals":false}' test/encryption-roundtrip.ts

# 常量变换正确性（严格相等）
npx ts-node --compilerOptions '{"module":"commonjs","noUnusedLocals":false}' test/constants-correctness.ts

# 表达式分解正确性
npx ts-node --compilerOptions '{"module":"commonjs","noUnusedLocals":false}' test/expression-decomposition.ts

# bxor / VM 操作码映射 / 水印
npx ts-node --compilerOptions '{"module":"commonjs","noUnusedLocals":false}' test/resolver-vm-watermark.ts
```

## 项目结构

```
gungnir/
├── package.json / tsconfig.json
├── src/
│   ├── cli.ts                 # CLI 入口
│   ├── core/
│   │   ├── types.ts           # 类型 + 配置
│   │   └── Orchestrator.ts    # 责任链调度 + LuaWriter
│   ├── obfuscators/           # 12 个混淆模块
│   ├── vm/BytecodeGen.ts      # VM 字节码生成（82 操作码重映射）
│   └── utils/helpers.ts       # RNG / AST 工具
├── test/                      # 测试 + fixture
└── docs/index.html             # 深色 Web 界面（离线可用）
```
