/**
 * Project: Gungnir - Watermark & Delivery (Layer 8: Engineering & Anti-Traceback)
 *
 * Implements:
 * - Item 83: Source terminal self-destruct — after successful
 *   obfuscation the original input file is securely wiped (overwrite
 *   with random bytes, then unlink) when --self-destruct is passed.
 * - Item 85: Polymorphic engine core — every build gets a unique
 *   fingerprint derived from seed + build timestamp + content hash.
 * - Item 87: Unique fingerprint tracking watermark — embedded as an
 *   invisible zero-width-whitespace comment that survives copy-paste,
 *   allowing leaked builds to be traced back to a specific build event.
 */
import {
  ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode,
} from '../core/types';
import * as crypto from 'crypto';

export class WatermarkPlugin implements ObfuscationPlugin {
  name = 'Watermark';
  description = 'Embeds invisible build-fingerprint watermark; handles source self-destruct on delivery';
  layers = [8];

  transform(ctx: ObfuscationContext): Chunk {
    if (!ctx.config.watermark) return ctx.ast;

    const fingerprint = this.computeFingerprint(ctx);

    // Encode fingerprint in zero-width whitespace (invisible in editors)
    const encoded = this.encodeZeroWidth(fingerprint);
    const watermarkComment = `--[[${encoded}]]`;

    // Embed as a leading comment — the writer emits raw statements,
    // so we use a GungnirRawStatement
    const rawNode: LuaNode = {
      type: 'GungnirRawStatement',
      code: watermarkComment,
    } as never;

    const body = ctx.ast.body as unknown as LuaNode[];
    body.unshift(rawNode);

    return ctx.ast;
  }

  /**
   * Compute a unique build fingerprint:
   * seed + timestamp + content hash → 16 hex chars
   */
  private computeFingerprint(ctx: ObfuscationContext): string {
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
  private encodeZeroWidth(hex: string): string {
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
  static decodeZeroWidth(encoded: string): string {
    const map: Record<string, number> = {
      '\u200B': 0, '\u200C': 1, '\u200D': 2, '\uFEFF': 3,
    };
    let hex = '';
    for (let i = 0; i + 1 < encoded.length; i += 2) {
      const hi = map[encoded[i]];
      const lo = map[encoded[i + 1]];
      if (hi === undefined || lo === undefined) continue;
      hex += (((hi << 2) | lo).toString(16)).toUpperCase();
    }
    return hex;
  }

  /**
   * Securely wipe and delete the input file (self-destruct).
   * Overwrite with random bytes before unlinking to defeat
   * filesystem-level recovery.
   */
  static secureDelete(filePath: string): boolean {
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
    } catch {
      return false;
    }
  }
}
