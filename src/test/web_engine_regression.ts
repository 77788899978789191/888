'use strict';
/**
 * Regression test: web engine (web/index.html inline script) must never
 * leak JS `undefined` into emitted Lua, and output must parse as Lua 5.1.
 *
 * Run: node test/web_engine_regression.js
 */
import * as fs from 'fs';
import * as path from 'path';

// Type declarations for global objects
declare const global: any;
declare const process: any;

const html: string = fs.readFileSync(path.join(__dirname, '..', '..', 'docs', 'index.html'), 'utf-8');
const scripts: string[] = html.split(/<script>|<\/script>/);
let engine: string = '';
for (const s of scripts) {
  if (s.includes('GUNGNIR WEB ENGINE')) {
    engine = s;
    break;
  }
}
if (!engine) {
  console.log('FAIL: engine script not found');
  process.exit(1);
}

// --- Minimal DOM stubs (engine's UI wiring runs on load) ---
interface StubElement {
  id: string;
  value: string;
  textContent: string;
  innerHTML: string;
  disabled: boolean;
  classList: {
    add: () => void;
    remove: () => void;
    toggle: () => void;
  };
  addEventListener: () => void;
  appendChild: () => void;
  scrollTop: number;
  scrollHeight: number;
  dataset: Record<string, string>;
  getContext: () => {
    fillRect: () => void;
    fillText: () => void;
    set fillStyle(v: string);
    set font(v: string);
  };
  width: number;
  height: number;
}

const elements: Record<string, StubElement> = {};

function makeEl(id: string = ''): StubElement {
  return {
    id,
    value: '',
    textContent: '',
    innerHTML: '',
    disabled: false,
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {}
    },
    addEventListener: () => {},
    appendChild: () => {},
    scrollTop: 0,
    scrollHeight: 0,
    dataset: {},
    // canvas stub for the matrix-rain initializer
    getContext: () => ({
      fillRect: () => {},
      fillText: () => {},
      set fillStyle(v: string) {},
      set font(v: string) {}
    }),
    width: 0,
    height: 0
  };
}

global.document = {
  getElementById: (id: string): StubElement => elements[id] || (elements[id] = makeEl(id)),
  createElement: (): StubElement => makeEl(),
  querySelectorAll: (): any[] => []
};

global.window = {
  addEventListener: () => {},
  innerWidth: 1920,
  innerHeight: 1080
};

global.performance = {
  now: (): number => Date.now()
};

global.setTimeout = (fn: () => void): void => fn();

global.FileReader = function (): void {};
global.Blob = function (): void {};
global.URL = {
  createObjectURL: (): string => '',
  revokeObjectURL: (): void => {}
};

global.luaparse = require(path.join(__dirname, '..', '..', 'node_modules', 'luaparse'));

const luaSrc: string = [
  'local x = 10',
  'local y = x * 3 + 7',
  'if y > 20 then y = y - 5 end',
  'local s = "hello"',
  'print(s, y, x ^ 2, x % 3)',
  'for i = 1, 5 do y = y + i end',
  'print(y)'
].join('\n');

const test: string = `
  var __allPass = true;
  for (var seed = 1; seed <= 100; seed++) {
    document.getElementById('seedInput').value = String(seed);
    document.getElementById('intensitySlider').value = String(1 + (seed % 6));
    try {
      pipeline(${JSON.stringify(luaSrc)});
    } catch (e) { console.log('SEED', seed, 'ERROR:', e.message); __allPass = false; continue; }
    var out = document.getElementById('outputArea').textContent;
    if (out.indexOf('undefined') !== -1) {
      console.log('SEED', seed, 'FAIL: undefined leaked');
      __allPass = false;
    }
    try { luaparse.parse(out, { luaVersion: '5.1' }); }
    catch (e) { console.log('SEED', seed, 'FAIL parse:', e.message); __allPass = false; }
  }
  console.log(__allPass
    ? 'ALL 100 SEEDS PASS (web engine): no undefined leak, all valid Lua 5.1'
    : 'FAILURES DETECTED');
  if (!__allPass) process.exit(1);
  else process.exit(0);
`;

eval(engine + '\n' + test);
