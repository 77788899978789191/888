/** fengari 无官方类型声明 — 测试用最小声明 */
declare module 'fengari' {
  export const lua: Record<string, unknown>;
  export const lauxlib: Record<string, unknown>;
  export const lualib: Record<string, unknown>;
  export const to_luastring: (s: string) => unknown;
  export const to_jsstring: (s: unknown) => string;
  const fengari: {
    lua: Record<string, unknown>;
    lauxlib: Record<string, unknown>;
    lualib: Record<string, unknown>;
    to_luastring: (s: string) => unknown;
    to_jsstring: (s: unknown) => string;
  };
  export default fengari;
}
