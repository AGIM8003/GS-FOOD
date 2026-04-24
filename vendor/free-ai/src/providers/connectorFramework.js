import { emitMetric } from '../observability/metrics.js';

export class ConnectorFramework {
    /**
     * Resolves OAuth tokens for agents cleanly. If missing, it triggers the Yellow Dot logic.
     * @param {string} provider JIRA, GitHub, etc.
     * @param {string} agentId Formatted ID of the demanding Swarm element
     */
    static resolveToken(provider, agentId) {
        // Assume context missing for demonstration to activate Yellow Dot State
        console.log(`[CONNECTOR-FW] Agent ${agentId} requesting token for provider: ${provider}`);
        
        const token = process.env[`FREEAI_${provider.toUpperCase()}_TOKEN`];
        
        if (!token) {
            console.warn(`[CONNECTOR-FW] Missing token for ${provider}. Emitting STATE_YELLOW back to UI.`);
            // Emit the Yellow Dot status natively
            emitMetric('agent_state_change', {
                agent_id: agentId,
                status: 'YELLOW',
                reason: `Missing auth token for ${provider}. Awaiting operator injection.`
            });
            return null;
        }

        emitMetric('agent_state_change', {
            agent_id: agentId,
            status: 'GREEN'
        });
        
        return token;
    }
}
