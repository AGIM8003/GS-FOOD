/**
 * Execute a prompt_node via injected handler (router in prod, stub in tests).
 * @param {object} ctx
 * @param {(ctx: object) => Promise<{ output: string, meta?: object }>} executePromptNode
 */
export async function executePromptNodeV1(ctx, executePromptNode) {
  const out = await executePromptNode(ctx);
  if (!out || typeof out.output !== 'string') {
    throw new Error('prompt_executor_invalid_output');
  }
  return { output: out.output, meta: out.meta || {} };
}
