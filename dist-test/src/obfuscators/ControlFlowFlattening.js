"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControlFlowFlatteningPlugin = void 0;
const helpers_1 = require("../utils/helpers");
class ControlFlowFlatteningPlugin {
    name = 'ControlFlowFlattening';
    description = 'Flattens structured control flow into dispatch-loop state machines with scrambled case ordering';
    layers = [2];
    /** Counter for generating unique state IDs */
    stateCounter = 0;
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
     *   stmt1; stmt2; stmt3
     *
     * Becomes:
     *   local __state = START
     *   while true do
     *     if __state == 3 then stmt1; __state = 7
     *     elseif __state == 7 then stmt2; __state = 1
     *     elseif __state == 1 then stmt3; break
     *     end
     *   end
     */
    flattenBlock(ctx, body, parent, bodyKey) {
        if (body.length < 2)
            return;
        // Phase 1: Split the body into basic blocks
        const blocks = [];
        let currentBlock = [];
        for (const stmt of body) {
            const n = stmt;
            currentBlock.push(stmt);
            // Control flow statements end a basic block
            if (['IfStatement', 'WhileStatement', 'ForNumericStatement', 'ReturnStatement', 'BreakStatement'].includes(String(n.type))) {
                blocks.push({
                    id: this.nextStateId(ctx),
                    body: [...currentBlock],
                    nextBlockId: null,
                    condition: null,
                    trueBlockId: null,
                    falseBlockId: null,
                });
                currentBlock = [];
            }
        }
        // Don't forget the last block
        if (currentBlock.length > 0) {
            blocks.push({
                id: this.nextStateId(ctx),
                body: [...currentBlock],
                nextBlockId: null,
                condition: null,
                trueBlockId: null,
                falseBlockId: null,
            });
        }
        if (blocks.length < 2)
            return;
        // Phase 2: Link blocks in sequence (but scramble the IDs)
        // Assign random IDs to make the execution order non-obvious
        const scrambledBlocks = ctx.rng.shuffle(blocks);
        const blockById = new Map();
        for (let i = 0; i < scrambledBlocks.length; i++) {
            blockById.set(scrambledBlocks[i].id, scrambledBlocks[i]);
        }
        // Link: each block points to the next in original order
        for (let i = 0; i < blocks.length; i++) {
            const next = i + 1 < blocks.length ? blocks[i + 1] : null;
            blocks[i].nextBlockId = next ? next.id : null;
        }
        // Phase 3: Generate the dispatch loop AST
        const dispatchLoop = this.generateDispatchLoop(ctx, blocks, scrambledBlocks);
        // Phase 4: Replace the original body with the dispatch loop
        parent[bodyKey] = [dispatchLoop];
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
        // Prepend: local stateVar = initialState
        const localDecl = {
            type: 'LocalStatement',
            variables: [(0, helpers_1.createIdentifier)(stateVar)],
            init: [(0, helpers_1.createNumericLiteral)(initialState)],
        };
        // Return a "block" that includes both the local declaration and the while loop
        // For simplicity, we wrap in a do...end block
        return {
            type: 'DoStatement',
            body: [localDecl, whileLoop],
        };
    }
    nextStateId(ctx) {
        // Generate random-looking state IDs to obscure execution order
        this.stateCounter++;
        return ctx.rng.int(1000, 9999) + this.stateCounter;
    }
    generateStateVarName(ctx) {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        let name = '';
        for (let i = 0; i < 6; i++) {
            name += chars[ctx.rng.int(0, chars.length - 1)];
        }
        return '_' + name;
    }
}
exports.ControlFlowFlatteningPlugin = ControlFlowFlatteningPlugin;
