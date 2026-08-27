"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControlFlowFlatteningPlugin = void 0;
const helpers_1 = require("../utils/helpers");
const ScopeHoist_1 = require("../utils/ScopeHoist");
class ControlFlowFlatteningPlugin {
    name = 'ControlFlowFlattening';
    description = 'Flattens structured control flow into dispatch-loop state machines with scrambled case ordering and scope-safe local hoisting';
    layers = [2];
    /** Counter for generating unique state IDs */
    stateCounter = 0;
    /** 本插件已生成的 fresh 名（跨块去重，防同名碰撞） */
    usedFreshNames = new Set();
    transform(ctx) {
        const intensity = ctx.config.intensity;
        // Only flatten blocks at sufficient complexity for the given intensity
        const minBlockSize = Math.max(2, 8 - intensity);
        const flattenRate = Math.min(intensity / 10, 0.6);
        // Find candidate functions/blocks to flatten
        const candidates = [];
        (0, helpers_1.walk)(ctx.ast, (node) => {
            const n = node;
            // Flatten function bodies
            if (n.type === 'FunctionDeclaration' || n.type === 'FunctionExpression') {
                if (Array.isArray(n.body) && n.body.length >= minBlockSize) {
                    if (ctx.rng.next() < flattenRate) {
                        candidates.push({
                            body: n.body,
                            parent: n,
                            bodyKey: 'body',
                        });
                    }
                }
            }
            // Flatten if statement bodies (else branches)
            if (n.type === 'IfStatement') {
                const ifNode = n;
                for (const clause of ifNode.clauses) {
                    if (clause.body.length >= minBlockSize && ctx.rng.next() < flattenRate) {
                        candidates.push({
                            body: clause.body,
                            parent: clause,
                            bodyKey: 'body',
                        });
                    }
                }
            }
        });
        // Apply flattening to each candidate
        for (const candidate of candidates) {
            try {
                this.flattenBlock(ctx, candidate.body, candidate.parent, candidate.bodyKey);
                ctx.stats.blocksFlattened++;
            }
            catch (err) {
                // Error recovery — skip blocks that fail to flatten
                if (ctx.config.verbose) {
                    console.warn(`CFF: Failed to flatten block: ${err}`);
                }
            }
        }
        return ctx.ast;
    }
    /**
     * Flatten a sequence of statements into a dispatch-loop state machine.
     *
     * Original:
     *   local a = 1; stmt1(a); local b = 2; stmt2(b)
     *
     * Becomes (scope-safe):
     *   do
     *     local fa, fb                      -- hoisted locals
     *     local __state = START
     *     while true do
     *       if __state == 3 then fa = 1; __state = 7
     *       elseif __state == 7 then stmt1(fa); __state = 1
     *       elseif __state == 1 then fb = 2; stmt2(fb); break
     *       end
     *     end
     *   end
     */
    flattenBlock(ctx, body, parent, bodyKey) {
        if (body.length < 2)
            return;
        // 顶层 break 会绑到分发循环而非原循环 → 放弃该块
        for (const stmt of body) {
            if (String(stmt.type) === 'BreakStatement')
                return;
        }
        // 纯计算切块数（不改动 AST）：少于 2 块则放弃（避免先改名后放弃的半成品状态）
        if (this.countBlocks(body) < 2)
            return;
        // raw 文本引用了将提升的顶层 local 名 → 无法触及改名 → 放弃该块
        // （必须在任何 AST 变异之前判定）
        if (!(0, ScopeHoist_1.topLevelLocalsSafeToHoist)(body))
            return;
        // —— 此刻起必然产出：执行提升 + 改名（安全，不再有回退路径）——
        const hoisted = (0, ScopeHoist_1.hoistTopLevelLocals)(ctx, body, this.usedFreshNames, '_hf');
        const { decl, newBody } = hoisted;
        // Phase 1: Split the hoisted body into basic blocks
        const blocks = [];
        let currentBlock = [];
        for (const stmt of newBody) {
            const n = stmt;
            currentBlock.push(stmt);
            // Control flow statements end a basic block
            if (['IfStatement', 'WhileStatement', 'ForNumericStatement', 'ReturnStatement', 'BreakStatement'].includes(String(n.type))) {
                blocks.push({
                    id: this.nextStateId(ctx),
                    body: [...currentBlock],
                    nextBlockId: null,
                });
                currentBlock = [];
            }
        }
        if (currentBlock.length > 0) {
            blocks.push({
                id: this.nextStateId(ctx),
                body: [...currentBlock],
                nextBlockId: null,
            });
        }
        if (blocks.length < 2)
            return;
        // Phase 2: Link blocks in sequence (but scramble the IDs)
        const scrambledBlocks = ctx.rng.shuffle(blocks);
        // Link: each block points to the next in original order
        for (let i = 0; i < blocks.length; i++) {
            const next = i + 1 < blocks.length ? blocks[i + 1] : null;
            blocks[i].nextBlockId = next ? next.id : null;
        }
        // Phase 3: Generate the dispatch loop AST
        const dispatchLoop = this.generateDispatchLoop(ctx, blocks, scrambledBlocks);
        // Phase 4: Replace the original body with the dispatch loop
        const doBody = decl ? [decl, dispatchLoop.stateDecl] : [dispatchLoop.stateDecl];
        parent[bodyKey] = [{
                type: 'DoStatement',
                body: [...doBody, dispatchLoop.whileLoop],
            }];
    }
    /** 纯计算：按切块规则统计块数（不修改 AST） */
    countBlocks(body) {
        let count = 0;
        let open = false;
        for (const stmt of body) {
            const t = String(stmt.type);
            open = true;
            if (['IfStatement', 'WhileStatement', 'ForNumericStatement', 'ReturnStatement', 'BreakStatement'].includes(t)) {
                count++;
                open = false;
            }
        }
        if (open)
            count++;
        return count;
    }
    /**
     * Generate the while(true) dispatch loop AST.
     */
    generateDispatchLoop(ctx, blocks, scrambledBlocks) {
        const stateVar = this.generateStateVarName(ctx);
        const initialState = blocks[0].id;
        // Build the if-elseif chain for the dispatch
        const clauses = [];
        for (const block of scrambledBlocks) {
            const condCheck = {
                type: 'BinaryExpression',
                operator: '==',
                left: (0, helpers_1.createIdentifier)(stateVar),
                right: (0, helpers_1.createNumericLiteral)(block.id),
            };
            const blockBody = [...block.body];
            // Check if the last statement is a return — if so, no transition needed
            const lastStmt = blockBody[blockBody.length - 1];
            const endsWithReturn = lastStmt?.type === 'ReturnStatement';
            const endsWithBreak = lastStmt?.type === 'BreakStatement';
            if (endsWithReturn || endsWithBreak) {
                // Block already terminates control flow — no transition needed
            }
            else if (block.nextBlockId !== null) {
                blockBody.push({
                    type: 'AssignmentStatement',
                    variables: [(0, helpers_1.createIdentifier)(stateVar)],
                    init: [(0, helpers_1.createNumericLiteral)(block.nextBlockId)],
                });
            }
            else {
                // Last block — break out of the loop
                blockBody.push({ type: 'BreakStatement' });
            }
            clauses.push({ condition: condCheck, body: blockBody });
        }
        // Build: while true do ... end
        const whileLoop = {
            type: 'WhileStatement',
            condition: { type: 'BooleanLiteral', value: true },
            body: [{
                    type: 'IfStatement',
                    clauses,
                    else_: [{
                            type: 'BreakStatement',
                        }],
                }],
        };
        // local stateVar = initialState
        const stateDecl = {
            type: 'LocalStatement',
            variables: [(0, helpers_1.createIdentifier)(stateVar)],
            init: [(0, helpers_1.createNumericLiteral)(initialState)],
        };
        return { stateDecl, whileLoop };
    }
    nextStateId(ctx) {
        // Generate random-looking state IDs to obscure execution order
        this.stateCounter++;
        return ctx.rng.int(1000, 9999) + this.stateCounter;
    }
    generateStateVarName(ctx) {
        // 状态变量名与全 chunk 标识符 + 本插件 fresh 名去重（防遮蔽用户变量）
        const used = (0, helpers_1.collectIdentifierNames)(ctx.ast);
        for (const u of this.usedFreshNames)
            used.add(u);
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        let name = '_' + chars[ctx.rng.int(0, 25)];
        for (let i = 0; i < 5; i++) {
            name += chars[ctx.rng.int(0, 25)];
        }
        while (used.has(name)) {
            name = '_' + chars[ctx.rng.int(0, 25)];
            for (let i = 0; i < 5; i++) {
                name += chars[ctx.rng.int(0, 25)];
            }
        }
        return name;
    }
}
exports.ControlFlowFlatteningPlugin = ControlFlowFlatteningPlugin;
