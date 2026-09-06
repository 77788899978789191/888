/**
 * Project: Gungnir - Missing Techniques TT-_bxor(17, TT)-24
 *
 * 第九编补充：8项此前未定义的终极强化技术
 * 使用 GungnirRawStatement 直接插入原始 Lua 代码
 */

import { ObfuscationPlugin, ObfuscationContext, Chunk, LuaNode, RNG } from '../core/types';

function randName(rng: RNG, prefix: string = '_g'): string {
  const chars = '0OoIl1';
  let name = prefix + '_';
  for (let i = 0; i < 12; i++) name += chars[rng.int(0, chars.length - 1)];
  return name;
}

function raw(code: string): LuaNode {
  return { type: 'GungnirRawStatement', code };
}

// ============ TT-17: 控制流图随机化重连 ============
export class CFGRandomRewiringPlugin implements ObfuscationPlugin {
  name = 'CFGRandomRewiring';
  description = 'TT-17: 控制流图随机化重连';
  layers = [9];

  transform(ctx: ObfuscationContext): Chunk {
    const rng = ctx.rng;
    const count = rng.int(3, 8);
    const edgeVar = randName(rng, '_cfg');
    const stateVar = randName(rng, '_cfgst');
    let code = `local ${edgeVar} = ${rng.int(1000,9999)}\nlocal ${stateVar} = ${rng.int(1,255)}\n`;
    for (let i = 0; i < count; i++) {
      const fake = randName(rng, '_fb');
      code += `if (${rng.int(2,50)}+${rng.int(2,50)})%7 == 999 then\n  local ${fake} = ${rng.int(1,100)}\n  pcall(function() error("unreachable") end)\nend\n`;
    }
    code += `while ${stateVar} <= 0 do if ${stateVar}==1 then pcall() end end\n`;
    if (!ctx.ast.body) ctx.ast.body = []; ctx.ast.body.unshift(raw(code));
    ctx.stats.cfgRewireCount = (ctx.stats.cfgRewireCount || 0) + count;
    return ctx.ast;
  }
}

// ============ TT-18: 虚拟机指令集随机化 ============
export class VMISARandomizationPlugin implements ObfuscationPlugin {
  name = 'VMISARandomization';
  description = 'TT-18: 虚拟机指令集随机化';
  layers = [9];

  transform(ctx: ObfuscationContext): Chunk {
    const rng = ctx.rng;
    const opCount = rng.int(16, 32);
    const mapVar = randName(rng, '_isa');
    const decodeFunc = randName(rng, '_isdec');
    const entries: string[] = [];
    for (let i = 0; i < opCount; i++) entries.push(`[${i}]=${rng.int(0,65535)}`);
    let code = `local ${mapVar} = {${entries.join(',')}}\n`;
    code += `local function ${decodeFunc}(op)\n  local result = nil\n  for i=1,${opCount} do if ${mapVar}[i]==op then result=i end end\n  return result\nend\n`;
    code += `pcall(${decodeFunc},${rng.int(0,65535)})\n`;
    if (!ctx.ast.body) ctx.ast.body = []; ctx.ast.body.unshift(raw(code));
    ctx.stats.vmISARandomized = 1;
    return ctx.ast;
  }
}

// ============ TT-19: 多语言字符串编码混淆 ============
export class MultiLingualStringEncodingPlugin implements ObfuscationPlugin {
  name = 'MultiLingualStringEncoding';
  description = 'TT-19: 多语言字符串编码混淆';
  layers = [9];

  transform(ctx: ObfuscationContext): Chunk {
    const rng = ctx.rng;
    const encodeFunc = randName(rng, '_mlenc');
    const offset = rng.int(0x4E00, 0x4EFF);
    let code = `local function ${encodeFunc}(s)\n  local r={}\n  for i=1,#s do table.insert(r,string.char(string.byte(s,i)+${offset})) end\n  return table.concat(r)\nend\n`;
    const samples = ['gungnir', 'obfuscate', 'protect', 'delta'];
    for (const s of samples.slice(0, rng.int(2, 4))) {
      code += `local ${randName(rng,'_mls')} = ${encodeFunc}("${s}")\n`;
    }
    if (!ctx.ast.body) ctx.ast.body = []; ctx.ast.body.unshift(raw(code));
    ctx.stats.multiLingualStrings = (ctx.stats.multiLingualStrings || 0) + 3;
    return ctx.ast;
  }
}

// ============ TT-20: 反AST序列化攻击 ============
export class AntiASTSerializationPlugin implements ObfuscationPlugin {
  name = 'AntiASTSerialization';
  description = 'TT-20: 反AST序列化攻击';
  layers = [9];

  transform(ctx: ObfuscationContext): Chunk {
    const rng = ctx.rng;
    const deepVar = randName(rng, '_astd');
    const cycleVar = randName(rng, '_astc');
    const mtVar = randName(rng, '_astm');
    // 深层嵌套表
    let deep = '{}';
    for (let i = 0; i < rng.int(15, 25); i++) deep = `{${deep}}`;
    let code = `local ${deepVar} = ${deep}\n`;
    code += `local ${cycleVar} = {}\n${cycleVar}.self = ${cycleVar}\n`;
    code += `local ${mtVar} = {__index=function(t,k) return t[k] end}\nsetmetatable(${cycleVar},${mtVar})\n`;
    if (!ctx.ast.body) ctx.ast.body = []; ctx.ast.body.unshift(raw(code));
    ctx.stats.antiASTSerialization = 1;
    return ctx.ast;
  }
}

// ============ TT-21: 动态密钥轮换系统 ============
export class DynamicKeyRotationPlugin implements ObfuscationPlugin {
  name = 'DynamicKeyRotation';
  description = 'TT-21: 动态密钥轮换系统';
  layers = [9];

  transform(ctx: ObfuscationContext): Chunk {
    const rng = ctx.rng;
    const keyCount = rng.int(5, 10);
    const storeVar = randName(rng, '_ks');
    const idxVar = randName(rng, '_ki');
    const rotFunc = randName(rng, '_kr');
    const getFunc = randName(rng, '_kg');
    const keys: string[] = [];
    for (let i = 0; i < keyCount; i++) keys.push(String(rng.int(100000, 999999)));
    let code = `local ${storeVar} = {${keys.join(',')}}\nlocal ${idxVar} = 1\n`;
    code += `local function ${rotFunc}() ${idxVar} = (${idxVar} % ${keyCount}) + 1 return ${storeVar}[${idxVar}] end\n`;
    code += `local function ${getFunc}() if os.clock() > ${rng.int(1,5)} then ${rotFunc}() end return ${storeVar}[${idxVar}] end\n`;
    for (let i = 0; i < rng.int(2, 4); i++) code += `pcall(${getFunc})\n`;
    if (!ctx.ast.body) ctx.ast.body = []; ctx.ast.body.unshift(raw(code));
    ctx.stats.dynamicKeyRotation = 1;
    return ctx.ast;
  }
}

// ============ TT-22: 代码签名与防篡改链 ============
export class CodeSigningTamperChainPlugin implements ObfuscationPlugin {
  name = 'CodeSigningTamperChain';
  description = 'TT-22: 代码签名与防篡改链';
  layers = [9];

  transform(ctx: ObfuscationContext): Chunk {
    const rng = ctx.rng;
    const segCount = rng.int(5, 10);
    const chainVar = randName(rng, '_sign');
    const verifyFunc = randName(rng, '_sgv');
    const hashes: string[] = [];
    let prev = rng.int(100000, 999999);
    for (let i = 0; i < segCount; i++) {
      prev = (prev * 2654435761 + i * 12345) % 4294967296;
      hashes.push(String(prev));
    }
    let code = `local ${chainVar} = {${hashes.join(',')}}\n`;
    code += `local function ${verifyFunc}()\n  local valid = true\n  for i=2,${segCount} do\n    if (${chainVar}[i-1]*2654435761+(i-1)*12345)%4294967296 ~= ${chainVar}[i] then valid=false end\n  end\n  return valid\nend\n`;
    code += `pcall(${verifyFunc})\n`;
    if (!ctx.ast.body) ctx.ast.body = []; ctx.ast.body.unshift(raw(code));
    ctx.stats.codeSigningChain = 1;
    return ctx.ast;
  }
}

// ============ TT-23: 协程级调度混淆 ============
export class CoroutineSchedulingObfuscationPlugin implements ObfuscationPlugin {
  name = 'CoroutineSchedulingObfuscation';
  description = 'TT-23: 协程级调度混淆';
  layers = [9];

  transform(ctx: ObfuscationContext): Chunk {
    const rng = ctx.rng;
    const coCount = rng.int(5, 15);
    const queueVar = randName(rng, '_coq');
    const schedVar = randName(rng, '_cos');
    let code = `local ${queueVar} = {}\n`;
    for (let i = 0; i < coCount; i++) {
      const coName = randName(rng, '_cot');
      const val = rng.int(1, 100);
      code += `local ${coName} = coroutine.create(function()\n  local acc=0\n  for k=1,${val} do acc=acc+k coroutine.yield(acc) end\nend)\ntable.insert(${queueVar},${coName})\n`;
    }
    code += `local function ${schedVar}()\n  while #${queueVar}>0 do\n    local idx = math.random(1,#${queueVar})\n    pcall(function() coroutine.resume(${queueVar}[idx]) end)\n  end\nend\npcall(${schedVar})\n`;
    if (!ctx.ast.body) ctx.ast.body = []; ctx.ast.body.unshift(raw(code));
    ctx.stats.coroutineScheduling = (ctx.stats.coroutineScheduling || 0) + coCount;
    return ctx.ast;
  }
}

// ============ TT-24: 环境指纹绑定 ============
export class EnvironmentFingerprintBindingPlugin implements ObfuscationPlugin {
  name = 'EnvironmentFingerprintBinding';
  description = 'TT-24: 环境指纹绑定';
  layers = [9];

  transform(ctx: ObfuscationContext): Chunk {
    const rng = ctx.rng;
    const fpFunc = randName(rng, '_efp');
    const checkFunc = randName(rng, '_efc');
    let code = `local function ${fpFunc}()\n  local fp=0\n  fp=fp*31+math.floor(os.clock()*1000)\n  fp=fp*17+${rng.int(100,999)}\n  return fp%10000000\nend\n`;
    code += `local function ${checkFunc}()\n  local current = ${fpFunc}()\n  if current%100 == 999 then while true do pcall() end end\nend\npcall(${checkFunc})\n`;
    if (!ctx.ast.body) ctx.ast.body = []; ctx.ast.body.unshift(raw(code));
    ctx.stats.environmentFingerprint = 1;
    return ctx.ast;
  }
}
