"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentifierRenamingPlugin = void 0;
const helpers_1 = require("../utils/helpers");
/** Identifiers that must never be renamed (Lua keywords and builtins) */
const LUA_KEYWORDS = new Set([
    'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for',
    'function', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat',
    'return', 'then', 'true', 'until', 'while', 'goto', 'continue',
]);
const ROBLOX_GLOBALS = new Set([
    'game', 'workspace', 'script', 'Instance', 'Vector3', 'CFrame',
    'Color3', 'UDim2', 'UDim', 'task', 'wait', 'spawn', 'delay',
    'print', 'warn', 'error', 'assert', 'pcall', 'xpcall', 'select',
    'type', 'typeof', 'tostring', 'tonumber', 'pairs', 'ipairs',
    'next', 'unpack', 'rawget', 'rawset', 'setmetatable', 'getmetatable',
    'string', 'table', 'math', 'os', 'coroutine', 'debug', 'bit',
    '_G', '_VERSION', 'self',
]);
class IdentifierRenamingPlugin {
    name = 'IdentifierRenaming';
    description = 'Renames all local identifiers to non-human-readable obfuscated names';
    layers = [4]; // Scope & Symbol Tearing layer
    /** Reserved names already used to avoid collisions */
    usedNames = new Set();
    transform(ctx) {
        // Phase 1: Collect all local variable declarations
        const renames = new Map();
        (0, helpers_1.walk)(ctx.ast, (node) => {
            const n = node;
            ctx.stats.nodesProcessed++;
            if (n.type === 'LocalStatement') {
                const variables = n.variables;
                for (const variable of variables) {
                    if (this.canRename(variable.name)) {
                        const newName = this.generateObfuscatedName(ctx);
                        renames.set(variable.name, newName);
                        this.usedNames.add(newName);
                        ctx.stats.identifiersRenamed++;
                    }
                }
            }
            if (n.type === 'FunctionDeclaration' || n.type === 'LocalFunctionStatement') {
                const identifier = n.identifier;
                if (identifier && this.canRename(identifier.name)) {
                    const newName = this.generateObfuscatedName(ctx);
                    renames.set(identifier.name, newName);
                    this.usedNames.add(newName);
                    ctx.stats.identifiersRenamed++;
                }
            }
            // Function parameters
            if (n.type === 'FunctionDeclaration' || n.type === 'FunctionExpression' || n.type === 'LocalFunctionStatement') {
                const params = n.parameters;
                if (Array.isArray(params)) {
                    for (const param of params) {
                        if (param && 'name' in param && this.canRename(param.name)) {
                            const newName = this.generateObfuscatedName(ctx);
                            renames.set(param.name, newName);
                            this.usedNames.add(newName);
                            ctx.stats.identifiersRenamed++;
                        }
                    }
                }
            }
            // For loop variables
            if (n.type === 'ForNumericStatement') {
                const variable = n.variable;
                if (variable && this.canRename(variable.name)) {
                    const newName = this.generateObfuscatedName(ctx);
                    renames.set(variable.name, newName);
                    this.usedNames.add(newName);
                    ctx.stats.identifiersRenamed++;
                }
            }
            if (n.type === 'ForGenericStatement') {
                const variables = n.variables;
                if (Array.isArray(variables)) {
                    for (const variable of variables) {
                        if (variable && this.canRename(variable.name)) {
                            const newName = this.generateObfuscatedName(ctx);
                            renames.set(variable.name, newName);
                            this.usedNames.add(newName);
                            ctx.stats.identifiersRenamed++;
                        }
                    }
                }
            }
        });
        // Phase 2: Apply renames throughout the AST
        if (renames.size > 0) {
            (0, helpers_1.walk)(ctx.ast, (node) => {
                const n = node;
                if (n.type === 'Identifier') {
                    const name = String(n.name);
                    const newName = renames.get(name);
                    if (newName) {
                        n.name = newName;
                    }
                }
            });
        }
        return ctx.ast;
    }
    /**
     * Check if an identifier can be safely renamed.
     */
    canRename(name) {
        if (LUA_KEYWORDS.has(name))
            return false;
        if (ROBLOX_GLOBALS.has(name))
            return false;
        if (name.startsWith('_G'))
            return false;
        if (name === 'self')
            return false;
        return true;
    }
    /**
     * Generate an obfuscated identifier name.
     * Uses patterns that are valid Lua identifiers but maximally confusing:
     * - l1IiI1l, O0oO0o, _llL1_, etc.
     */
    generateObfuscatedName(ctx) {
        // Character sets that are visually similar (all valid Lua identifier chars)
        const confusableSets = [
            ['l', '1', 'I'],
            ['O', '0', 'o'],
            ['_', 'l'],
            ['S', '5', 's'],
            ['B', '8', 'b'],
            ['Z', '2', 'z'],
            ['G', '6', 'g'],
            ['q', '9', 'p'],
            ['i', 'j'],
            ['u', 'v'],
            ['n', 'm'],
        ];
        let name = '';
        const length = ctx.rng.int(5, 10);
        // First character must be a letter or underscore (Lua requirement)
        const firstChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
        name += firstChars[ctx.rng.int(0, firstChars.length - 1)];
        // Remaining characters use confusable sets
        for (let i = 1; i < length; i++) {
            const set = ctx.rng.pick(confusableSets);
            name += ctx.rng.pick(set);
        }
        // Ensure uniqueness
        if (this.usedNames.has(name)) {
            return this.generateObfuscatedName(ctx); // Retry
        }
        return name;
    }
}
exports.IdentifierRenamingPlugin = IdentifierRenamingPlugin;
