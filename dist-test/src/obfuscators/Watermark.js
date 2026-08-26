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
exports.WatermarkPlugin = void 0;
const crypto = __importStar(require("crypto"));
class WatermarkPlugin {
    name = 'Watermark';
    description = 'Embeds invisible build-fingerprint watermark; handles source self-destruct on delivery';
    layers = [8];
    transform(ctx) {
        if (!ctx.config.watermark)
            return ctx.ast;
        const fingerprint = this.computeFingerprint(ctx);
        // Encode fingerprint in zero-width whitespace (invisible in editors)
        const encoded = this.encodeZeroWidth(fingerprint);
        const watermarkComment = `--[[${encoded}]]`;
        // Embed as a leading comment — the writer emits raw statements,
        // so we use a GungnirRawStatement
        const rawNode = {
            type: 'GungnirRawStatement',
            code: watermarkComment,
        };
        const body = ctx.ast.body;
        body.unshift(rawNode);
        return ctx.ast;
    }
    /**
     * Compute a unique build fingerprint:
     * seed + timestamp + content hash → 16 hex chars
     */
    computeFingerprint(ctx) {
        const contentJson = JSON.stringify({
            s: ctx.config.seed,
            i: ctx.config.intensity,
            n: ctx.stats.nodesProcessed,
        });
        const hash = crypto.createHash('sha256')
            .update(contentJson + String(Date.now()))
            .digest('hex');
        return hash.slice(0, 16).toUpperCase();
    }
    /**
     * Encode a hex fingerprint as zero-width whitespace:
     * Each hex digit (4 bits) is split into two 2-bit chunks, each mapped
     * to one of 4 zero-width codepoints: U+200B, U+200C, U+200D, U+FEFF.
     */
    encodeZeroWidth(hex) {
        const ZW = ['\u200B', '\u200C', '\u200D', '\uFEFF'];
        let result = '';
        for (const ch of hex) {
            const digit = parseInt(ch, 16);
            // 4 bits = 2 chunks × 2 bits
            result += ZW[(digit >> 2) & 0x3] + ZW[digit & 0x3];
        }
        return result;
    }
    /**
     * Decode a zero-width watermark back to hex (for forensics tooling).
     */
    static decodeZeroWidth(encoded) {
        const map = {
            '\u200B': 0, '\u200C': 1, '\u200D': 2, '\uFEFF': 3,
        };
        let hex = '';
        for (let i = 0; i + 1 < encoded.length; i += 2) {
            const hi = map[encoded[i]];
            const lo = map[encoded[i + 1]];
            if (hi === undefined || lo === undefined)
                continue;
            hex += (((hi << 2) | lo).toString(16)).toUpperCase();
        }
        return hex;
    }
    /**
     * Securely wipe and delete the input file (self-destruct).
     * Overwrite with random bytes before unlinking to defeat
     * filesystem-level recovery.
     */
    static secureDelete(filePath) {
        try {
            const fs = require('fs');
            const stat = fs.statSync(filePath);
            const size = stat.size;
            // Overwrite with random bytes (single pass)
            const fd = fs.openSync(filePath, 'w');
            for (let written = 0; written < size; written += 65536) {
                const chunkSize = Math.min(65536, size - written);
                const noise = crypto.randomBytes(chunkSize);
                fs.writeSync(fd, noise);
            }
            fs.closeSync(fd);
            fs.unlinkSync(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.WatermarkPlugin = WatermarkPlugin;
