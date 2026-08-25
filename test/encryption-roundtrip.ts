/**
 * Test: String encryption/decryption roundtrip verification
 * Simulates the Lua decryption stub logic in TypeScript to verify
 * the encryption algorithm is correctly reversible.
 */

// Simulate the encryption from StringEncryptionPlugin
function encryptString(value: string, key: number[], rounds: number, keyRotation: number): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < value.length; i++) {
    bytes.push(value.charCodeAt(i) & 0xFF);
  }

  let encrypted = [...bytes];
  for (let round = 0; round < rounds; round++) {
    // Rotate the key for each round
    const rotatedKey = rotateKey(key, round * keyRotation);
    // XOR
    encrypted = encrypted.map((byte, i) => byte ^ rotatedKey[i % rotatedKey.length]);
    // Substitution
    encrypted = encrypted.map((byte, idx) => {
      const sub = (idx + round * 7) % 256;
      return ((byte ^ sub) + round * 31) & 0xFF;
    });
  }
  return encrypted;
}

function rotateKey(key: number[], positions: number): number[] {
  const len = key.length;
  const result: number[] = new Array(len);
  for (let i = 0; i < len; i++) {
    result[i] = key[(i + positions) % len];
  }
  return result;
}

// Simulate the Lua decryption stub logic
function decryptString(encrypted: number[], key: number[], rounds: number, keyRotation: number): string {
  const keyLen = key.length;
  const result: string[] = [];

  for (let i = 1; i <= encrypted.length; i++) { // Lua 1-based indexing
    let byte = encrypted[i - 1]; // Convert to 0-based for the data array

    // Reverse the multi-round encryption
    for (let round = rounds - 1; round >= 0; round--) {
      const sub = (i - 1 + round * 7) % 256;
      // Lua: byte = ((byte - round * 31) & 0xFF) ~ sub
      byte = ((((byte - round * 31) % 256) + 256) % 256) ^ sub;
      // Lua: byte = byte ~ key[((i - 1 + round * keyRotation) % keyLen) + 1]
      const keyIdx = ((i - 1 + round * keyRotation) % keyLen);
      byte = byte ^ key[keyIdx];
    }

    result.push(String.fromCharCode(byte));
  }

  return result.join('');
}

// Test roundtrip
const testStrings = [
  'Hello, World!',
  'JohnDoe',
  'Critical hit!',
  'Normal hit',
  'Weak hit',
  'Step: ',
  'Done: ',
  'A longer string with spaces and symbols! @#$%^&*()',
  '',
];

const rounds = 4;
const keyRotation = 16;

let allPassed = true;

for (const testStr of testStrings) {
  if (testStr.length === 0) continue; // Skip empty strings

  // Generate a random key
  const key: number[] = [];
  for (let i = 0; i < Math.max(4, Math.min(16, testStr.length)); i++) {
    key.push(Math.floor(Math.random() * 255) + 1);
  }

  // Encrypt
  const encrypted = encryptString(testStr, key, rounds, keyRotation);

  // Decrypt
  const decrypted = decryptString(encrypted, key, rounds, keyRotation);

  if (decrypted === testStr) {
    console.log(`PASS: "${testStr}" -> [${encrypted.slice(0, 5).join(',')}...] -> "${decrypted}"`);
  } else {
    console.error(`FAIL: "${testStr}" -> "${decrypted}"`);
    allPassed = false;
  }
}

if (allPassed) {
  console.log('\nAll encryption/decryption roundtrip tests passed!');
} else {
  console.error('\nSome tests failed!');
  process.exit(1);
}
