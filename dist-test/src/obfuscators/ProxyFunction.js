"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyFunctionPlugin = void 0;
const helpers_1 = require("../utils/helpers");
class ProxyFunctionPlugin {
    name = 'ProxyFunction';
    description = 'Wraps local functions in variadic proxy layers that break decompiler function-boundary reconstruction';
    layers = [2, 4];
    transform(ctx) {
        const intensity = ctx.config.intensity;
        const proxyRate = Math.min(0.2 + intensity * 0.07, 0.85);
        // Collect local function declarations
        const candidates = [];
        (0, helpers_1.walk)(ctx.ast, (node) => {
            const n = node;
            if (n.type !== 'LocalFunctionStatement')
                return;
            const ident = n.identifier;
            if (!ident || !ident.name)
                return;
            const name = ident.name;
            // Hot-path exemption: skip functions matching hot patterns
            if (this.isHotPath(ctx, name))
                return;
            if (ctx.rng.next() < proxyRate) {
                candidates.push({ node: n, name });
            }
        });
        for (const candidate of candidates) {
            this.wrapWithProxy(ctx, candidate.node, candidate.name);
            ctx.stats.functionsProxied++;
        }
        return ctx.ast;
    }
    /**
     * Wrap a local function with a proxy layer.
     */
    wrapWithProxy(ctx, node, name) {
        // Generate unique real-function name
        const realName = '_fx' + ctx.rng.int(100000, 999999).toString(36) + '_' + name.length.toString(36);
        // 1. Rename the original function declaration to the real name
        const ident = node.identifier;
        const originalName = ident.name;
        ident.name = realName;
        // 2. Create the proxy: local function originalName(...) return realName(...) end
        const proxyNode = {
            type: 'LocalFunctionStatement',
            identifier: (0, helpers_1.createIdentifier)(originalName),
            isLocal: true,
            parameters: [{
                    type: 'VarargLiteral',
                    value: '...',
                }],
            body: [{
                    type: 'ReturnStatement',
                    arguments: [{
                            type: 'CallExpression',
                            base: (0, helpers_1.createIdentifier)(realName),
                            arguments: [{
                                    type: 'VarargLiteral',
                                    value: '...',
                                }],
                        }],
                }],
        };
        // 3. Insert the proxy right after the real function in the parent body.
        // Since we don't track parents in this walk, we locate the containing
        // body array by searching for the node.
        const parentBody = this.findContainingBody(ctx, node);
        if (parentBody) {
            const idx = parentBody.indexOf(node);
            if (idx >= 0) {
                parentBody.splice(idx + 1, 0, proxyNode);
            }
        }
    }
    /**
     * Find the statement-list array containing a node.
     */
    findContainingBody(ctx, target) {
        let result = null;
        const search = (node) => {
            if (result)
                return;
            const n = node;
            if (!n || typeof n !== 'object')
                return;
            for (const key of Object.keys(n)) {
                if (key === 'type' || key === 'loc' || key === 'range')
                    continue;
                const value = n[key];
                if (Array.isArray(value)) {
                    if (value.includes(target)) {
                        result = value;
                        return;
                    }
                    for (const item of value) {
                        if (item && typeof item === 'object' && 'type' in item) {
                            search(item);
                        }
                    }
                }
                else if (value && typeof value === 'object' && 'type' in value) {
                    search(value);
                }
            }
        };
        search(ctx.ast);
        return result;
    }
    isHotPath(ctx, name) {
        if (!ctx.config.hotPathExemption)
            return false;
        return ctx.config.hotPathPatterns.some(pattern => name.includes(pattern));
    }
}
exports.ProxyFunctionPlugin = ProxyFunctionPlugin;
