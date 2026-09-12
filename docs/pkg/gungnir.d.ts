/* tslint:disable */
/* eslint-disable */
/**
* 混淆Lua代码（WASM接口）
* @param {string} code
* @param {string} config_json
* @returns {WasmResult}
*/
export function obfuscate(code: string, config_json: string): WasmResult;
/**
* 使用默认最大强度配置进行混淆
* @param {string} code
* @returns {WasmResult}
*/
export function obfuscateMaximum(code: string): WasmResult;
/**
* 获取库版本号
* @returns {string}
*/
export function getVersion(): string;
/**
* 获取总技术数量
* @returns {number}
*/
export function getTotalTechniques(): number;
/**
* 获取默认配置（JSON格式）
* @returns {string}
*/
export function getDefaultConfig(): string;
/**
* 获取最大强度配置（JSON格式）
* @returns {string}
*/
export function getMaximumConfig(): string;
/**
* WASM混淆结果
*/
export class WasmResult {
  free(): void;
/**
* 错误信息
*/
  readonly error: string;
/**
* 输出代码
*/
  readonly output: string;
/**
* 统计信息（JSON格式）
*/
  readonly statsJson: string;
/**
* 是否成功
*/
  readonly success: boolean;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_wasmresult_free: (a: number) => void;
  readonly getDefaultConfig: (a: number) => void;
  readonly getMaximumConfig: (a: number) => void;
  readonly getTotalTechniques: () => number;
  readonly getVersion: (a: number) => void;
  readonly obfuscate: (a: number, b: number, c: number, d: number) => number;
  readonly obfuscateMaximum: (a: number, b: number) => number;
  readonly wasmresult_error: (a: number, b: number) => void;
  readonly wasmresult_output: (a: number, b: number) => void;
  readonly wasmresult_statsJson: (a: number, b: number) => void;
  readonly wasmresult_success: (a: number) => number;
  readonly __wbindgen_export_0: (a: number, b: number) => number;
  readonly __wbindgen_export_1: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_export_2: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
