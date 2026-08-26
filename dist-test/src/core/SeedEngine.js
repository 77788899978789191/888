"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedEngine = void 0;
/**
 * Project: Gungnir-Absolute — 随机构建种子引擎（Build Seed Engine）
 *
 * 【子系统 1：随机构建种子引擎】
 *  - 每次混淆生成 2048 位（256 字节）随机种子：
 *    crypto 随机源 + process 时间戳 + 高精度计时 + 用户盐值，
 *    经 SHA-256 链式派生（node:crypto，真 SHA-256）。
 *  - 种子派生所有随机参数：操作码映射、指令布局、密钥、寄存器分配、
 *    解释器结构（通过派生流供各模块消费）。
 *  - 种子拆分为 16 个片段，分散存储在不同闭包中，运行时重组校验，
 *    失败则触发陷阱（由 PolymorphicRuntime 发射的 Lua 端实现）。
 *  - 碰撞概率：主种子 256 位随机 + 派生链，任意两次构建种子相同的
 *    概率 < 2^-128（256 位均匀随机源的一半位宽即达成）。
 *
 * 【子系统 11：构建指纹与防嫁接】
 *  - 256 位构建指纹 = SHA-256(种子 || 构建序号 || 内容哈希)。
 *  - 指纹拆 8 份嵌入 VM 初始化代码 8 个不同位置，运行时重组比对，
 *    不匹配进入陷阱循环；同时作为解密隐含 IV 参与密钥派生。
 *
 * 【子系统 94：唯一指纹水印】
 *  - 唯一 ID 以零宽字符水印嵌入产物头部（Watermark 插件配合）。
 */
const crypto = __importStar(require("crypto"));
class SeedEngine {
    /** 主种子 2048 位 = 256 字节 */
    masterSeed;
    /** 主种子的 SHA-256 摘要（派生根） */
    root;
    /** 256 位构建指纹（8×32 位） */
    fingerprint;
    /** 构建唯一 ID（水印用，16 hex） */
    buildId;
    /** 16 个种子片段（32 位无符号整数，运行时闭包重组） */
    fragments;
    /** 环境因子盐（子系统 40：tick/PlaceId/JobId 侧的用户盐） */
    salt;
    /** 构建时间戳（时间炸弹基准，子系统 74） */
    builtAt;
    constructor(userSalt = '') {
        // —— 熵源混合：256 位 crypto 随机 + 时间戳 + 高精度时钟 + 盐 ——
        const entropy = Buffer.concat([
            crypto.randomBytes(32),
            Buffer.from(String(Date.now()), 'utf-8'),
            Buffer.from(String(process.hrtime.bigint()), 'utf-8'),
            Buffer.from(String(userSalt), 'utf-8'),
        ]);
        // 链式 SHA-256 扩展到 256 字节（2048 位）
        const seed = Buffer.alloc(256);
        let block = crypto.createHash('sha256').update(entropy).digest();
        for (let i = 0; i < 8; i++) {
            block.copy(seed, i * 32);
            block = crypto.createHash('sha256').update(block).update(seed.subarray(0, i * 32 + 32)).digest();
        }
        this.masterSeed = seed;
        this.root = crypto.createHash('sha256').update(seed).digest();
        this.builtAt = Date.now();
        // —— 指纹：SHA-256(根 || 构建时刻 || 随机) → 8×32 位 ——
        const fpBuf = crypto.createHash('sha256')
            .update(this.root)
            .update(String(this.builtAt))
            .update(crypto.randomBytes(16))
            .digest();
        this.fingerprint = [];
        for (let i = 0; i < 8; i++) {
            this.fingerprint.push(fpBuf.readUInt32BE(i * 4));
        }
        this.buildId = crypto.createHash('sha256')
            .update(this.root).update(String(this.builtAt)).digest('hex').slice(0, 16).toUpperCase();
        // —— 种子拆 16 片段（每片段 32 位，运行时闭包重组校验） ——
        this.fragments = [];
        for (let i = 0; i < 16; i++) {
            this.fragments.push(seed.readUInt32LE(i * 16));
        }
        this.salt = userSalt;
    }
    /** 主种子的十六进制（前 64 字符，供报告展示） */
    seedHex() {
        return this.root.toString('hex');
    }
    /**
     * 派生流：以命名域（如 'opcode-map'、'layout'、'cipher-key'）派生
     * 确定性随机数序列。不同域互不干扰，同一域内确定性可复现。
     * 实现：SHA-256(根 || 域名 || 计数器) 流式输出。
     */
    derive(domain) {
        let counter = 0;
        let buf = Buffer.alloc(0);
        let pos = 0;
        const refill = () => {
            buf = crypto.createHash('sha256')
                .update(this.root)
                .update(Buffer.from(domain, 'utf-8'))
                .update(Buffer.from([counter & 0xFF, (counter >> 8) & 0xFF, (counter >> 16) & 0xFF, (counter >> 24) & 0xFF]))
                .digest();
            counter++;
            pos = 0;
        };
        refill();
        const nextU32 = () => {
            if (pos + 4 > buf.length)
                refill();
            const v = buf.readUInt32BE(pos);
            pos += 4;
            return v;
        };
        return {
            nextU32,
            int(min, max) {
                const range = max - min + 1;
                return min + (nextU32() % range);
            },
            bytes(n) {
                const out = [];
                for (let i = 0; i < n; i++) {
                    if (pos + 1 > buf.length)
                        refill();
                    out.push(buf[pos]);
                    pos += 1;
                }
                return out;
            },
            tag() {
                return nextU32().toString(36);
            },
        };
    }
    /**
     * 种子片段的 Lua 端重组参数：
     * 返回组合多项式系数，使 Lua 端 16 个闭包片段经
     * seed = (seed * A + frag_i) % M 重组后与 TS 端一致。
     */
    fragmentParams() {
        const stream = this.derive('frag-combine');
        const mult = stream.int(1_000_003, 2_000_000_017);
        const mod = 2 ** 31 - 1; // 2^31-1 素数，Lua double 精确
        // 计算期望值（与 Lua 端同公式）
        let acc = 0;
        for (const frag of this.fragments) {
            acc = (acc * mult + (frag % mod)) % mod;
        }
        return { mult, mod, expected: acc };
    }
    /**
     * 指纹 8 位置的 Lua 端校验参数：8 个位置的嵌入值与期望值。
     * Lua 端从 8 处读取（各自以不同算术形式嵌入）并重组比对。
     */
    fingerprintParams() {
        // 期望值 = 指纹 8 片段异或折叠 + 与种子根混合
        let acc = 0;
        for (const f of this.fingerprint)
            acc = (acc ^ f) >>> 0;
        const stream = this.derive('fp-verify');
        const mask = stream.nextU32();
        const expected = ((acc ^ mask) >>> 0) % (2 ** 31 - 1);
        return { expected, mask };
    }
}
exports.SeedEngine = SeedEngine;
