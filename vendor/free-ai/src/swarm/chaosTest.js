/**
 * Chaos Testing Framework.
 *
 * Injects controlled failures (latency, errors, partial results)
 * into swarm node execution for resilience validation.
 */

let chaosEnabled = false;
let chaosConfig = {
  failure_rate: 0.0,
  latency_injection_ms: 0,
  partial_result_rate: 0.0,
  target_node_types: [],
  target_node_ids: [],
};

function enableChaos(config = {}) {
  chaosEnabled = true;
  chaosConfig = { ...chaosConfig, ...config };
  return chaosConfig;
}

function disableChaos() {
  chaosEnabled = false;
}

function isChaosEnabled() {
  return chaosEnabled;
}

function shouldInjectChaos(nodeType, nodeId) {
  if (!chaosEnabled) return { inject: false };

  const typeMatch = chaosConfig.target_node_types.length === 0 ||
    chaosConfig.target_node_types.includes(nodeType);
  const idMatch = chaosConfig.target_node_ids.length === 0 ||
    chaosConfig.target_node_ids.includes(nodeId);

  if (!typeMatch || !idMatch) return { inject: false };

  const effects = [];

  if (chaosConfig.failure_rate > 0 && Math.random() < chaosConfig.failure_rate) {
    effects.push({ type: 'failure', error: new Error('chaos_injected_failure') });
  }

  if (chaosConfig.latency_injection_ms > 0) {
    effects.push({ type: 'latency', delay_ms: chaosConfig.latency_injection_ms });
  }

  if (chaosConfig.partial_result_rate > 0 && Math.random() < chaosConfig.partial_result_rate) {
    effects.push({ type: 'partial_result', truncate_at: 0.5 });
  }

  return { inject: effects.length > 0, effects };
}

async function applyChaosEffects(effects) {
  for (const effect of effects) {
    if (effect.type === 'latency') {
      await new Promise((r) => setTimeout(r, effect.delay_ms));
    }
    if (effect.type === 'failure') {
      throw effect.error;
    }
  }
}

function getChaosConfig() {
  return { enabled: chaosEnabled, ...chaosConfig };
}

function __resetChaosForTests() {
  chaosEnabled = false;
  chaosConfig = {
    failure_rate: 0.0,
    latency_injection_ms: 0,
    partial_result_rate: 0.0,
    target_node_types: [],
    target_node_ids: [],
  };
}

export { enableChaos, disableChaos, isChaosEnabled, shouldInjectChaos, applyChaosEffects, getChaosConfig, __resetChaosForTests };
