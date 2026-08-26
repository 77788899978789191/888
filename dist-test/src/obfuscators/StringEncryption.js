"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringEncryptionPlugin = void 0;
const helpers_1 = require("../utils/helpers");
class StringEncryptionPlugin {
    name = 'StringEncryption';
    description = 'Encrypts all string literals with multi-round XOR cipher and lazy runtime decryption';
    layers = [3]; // Data & Constant layer
    /** Number of XOR rounds (higher = stronger, slower) */
    rounds = 4;
    /** Key rotation interval */
    keyRotation = 16;
    transform(ctx) {
        // Phase 1: Collect and encrypt all string literals
        this.collectAndEncryptStrings(ctx);
        // Phase 2: Replace original strings with encrypted lookup calls
        this.replaceStringLiterals(ctx);
        // Phase 3: Inject runtime decryption stub at the top of the chunk
        this.injectDecryptionStub(ctx);
        return ctx.ast;
    }
    /**
     * Walk the AST and encrypt every string literal found.
     * Strings are added to the encrypted string pool.
     */
    collectAndEncryptStrings(ctx) {
        const stringsToEncrypt = [];
        (0, helpers_1.walk)(ctx.ast, (node) => {
            const n = node;
            if (n.type !== 'StringLiteral')
                return;
            // Skip very short strings (not worth encrypting)
            const value = String(n.value);
            if (value.length < 2)
                return;
            // Skip strings that look like they might be structurally important
            if (this.isStructuralString(value))
                return;
            const entry = this.encryptString(ctx, value, ctx.stringPool.length);
            ctx.stringPool.push(entry);
            stringsToEncrypt.push({ node: n, entry });
            ctx.stats.stringsEncrypted++;
        });
        // Store for replacement in next phase
        this.pendingReplacements = stringsToEncrypt;
    }
    pendingReplacements = [];
    /**
     * Encrypt a string using multi-round XOR with rotating keys.
     */
    encryptString(ctx, value, id) {
        const bytes = (0, helpers_1.stringToBytes)(value);
        // Generate a unique key for each string
        const key = [];
        const keyLen = Math.max(4, Math.min(16, value.length));
        for (let i = 0; i < keyLen; i++) {
            key.push(ctx.rng.int(1, 255));
        }
        // Multi-round XOR encryption with key rotation
        let encrypted = [...bytes];
        for (let round = 0; round < this.rounds; round++) {
            // Rotate the key for each round
            const rotatedKey = this.rotateKey(key, round * this.keyRotation);
            encrypted = (0, helpers_1.xorBytes)(encrypted, rotatedKey);
            // Additional confusion: byte substitution based on position
            encrypted = encrypted.map((byte, idx) => {
                const sub = (idx + round * 7) % 256;
                return ((byte ^ sub) + round * 31) & 0xFF;
            });
        }
        return { id, encrypted, key, original: value };
    }
    /**
     * Rotate a key array by n positions.
     */
    rotateKey(key, positions) {
        const len = key.length;
        const result = new Array(len);
        for (let i = 0; i < len; i++) {
            result[i] = key[(i + positions) % len];
        }
        return result;
    }
    /**
     * Replace original string literal nodes with encrypted lookup calls.
     */
    replaceStringLiterals(ctx) {
        // Generate a unique function name for the decryptor
        const decryptorName = '__gdr_' + ctx.rng.int(10000, 99999).toString(36);
        for (const { node, entry } of this.pendingReplacements) {
            // Replace the string literal with a call to the decryptor:
            // __gdr_XXXX(id) -> decrypted string
            node.type = 'CallExpression';
            node.base = (0, helpers_1.createIdentifier)(decryptorName);
            node.arguments = [(0, helpers_1.createNumericLiteral)(entry.id)];
            // Clean up old fields
            delete node.value;
            delete node.raw;
        }
        this.decryptorName = decryptorName;
    }
    decryptorName = '';
    /**
     * Inject the runtime decryption stub at the beginning of the chunk.
     * The stub:
     * 1. Stores encrypted strings in a table
     * 2. Lazily decrypts on first access
     * 3. Caches decrypted results
     */
    injectDecryptionStub(ctx) {
        if (ctx.stringPool.length === 0)
            return;
        const decryptorName = this.decryptorName || '__gdr';
        const poolName = '__gsp_' + ctx.rng.int(10000, 99999).toString(36);
        const cacheName = '__gsc_' + ctx.rng.int(10000, 99999).toString(36);
        const keysName = '__gsk_' + ctx.rng.int(10000, 99999).toString(36);
        // Build the encrypted string pool as Lua table constructor
        const poolEntries = ctx.stringPool.map(entry => {
            const bytes = entry.encrypted.join(',');
            return `[${entry.id}] = {${bytes}}`;
        });
        // Build the keys table
        const keyEntries = ctx.stringPool.map(entry => {
            const bytes = entry.key.join(',');
            return `[${entry.id}] = {${bytes}}`;
        });
        // Generate the decryption stub code as a single Lua statement
        // This is injected as a "raw" statement that the writer outputs verbatim
        const bxorName = '__gxb_' + ctx.rng.int(10000, 99999).toString(36);
        const stubCode = this.generateDecryptionStub(decryptorName, poolName, cacheName, keysName, bxorName, poolEntries, keyEntries, this.rounds);
        // Insert at the top of the AST body
        const rawNode = {
            type: 'GungnirRawStatement',
            code: stubCode,
        };
        ctx.ast.body.unshift(rawNode);
    }
    /**
     * Generate the Lua decryption stub code (Lua 5.1 compatible).
     *
     * Lua 5.1 has no bitwise operators (& | ~), so byte XOR is implemented
     * in pure arithmetic: each byte is decomposed into 8 bit slices and
     * reassembled. All intermediate values stay within [0, 255].
     */
    generateDecryptionStub(decryptorName, poolName, cacheName, keysName, bxorName, poolEntries, keyEntries, rounds) {
        return `
-- Gungnir String Decryption Stub (auto-generated, Lua 5.1)
local ${poolName} = {${poolEntries.join(', ')}}
local ${keysName} = {${keyEntries.join(', ')}}
local ${cacheName} = {}
local function ${bxorName}(a, b)
  local r, p = 0, 1
  for _ = 1, 8 do
    local ab, bb = a % 2, b % 2
    if ab ~= bb then r = r + p end
    a = (a - ab) / 2
    b = (b - bb) / 2
    p = p * 2
  end
  return r
end
local ${decryptorName} = function(id)
  local cached = ${cacheName}[id]
  if cached then return cached end
  local data = ${poolName}[id]
  local key = ${keysName}[id]
  if not data then return nil end
  local result = {}
  local keyLen = #key
  for i = 1, #data do
    local byte = data[i]
    -- Reverse the multi-round encryption.
    -- Lua % with a positive divisor always yields a non-negative result.
    for round = ${rounds - 1}, 0, -1 do
      local sub = (i - 1 + round * 7) % 256
      byte = (byte - round * 31) % 256
      byte = ${bxorName}(byte, sub)
      byte = ${bxorName}(byte, key[((i - 1 + round * ${this.keyRotation}) % keyLen) + 1])
    end
    result[i] = string.char(byte)
  end
  local str = table.concat(result)
  ${cacheName}[id] = str
  return str
end
`.trim();
    }
    /**
     * Check if a string is structural and should not be encrypted.
     */
    isStructuralString(value) {
        // Don't encrypt method names used with `:` syntax or common API patterns
        const structuralPatterns = [
            /^(len|gsub|gmatch|find|format|rep|lower|upper|sub|byte|char)$/,
            /^(Name|Parent|ClassName|Position|Rotation|Size|Color)$/,
            /^__index$|^__newindex$|^__call$|^__tostring$/,
        ];
        return structuralPatterns.some(p => p.test(value));
    }
}
exports.StringEncryptionPlugin = StringEncryptionPlugin;
