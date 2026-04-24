# FREE AI — model acceptance gates

**Status:** Human-facing contract. Not loaded by the engine at runtime.

Synthetic acceptance is implemented in `src/eval/modelAcceptanceRunner.js`. Gate families include contract, latency, structured output, tool calling, and quota safety placeholders. Live comparative benchmarks are a host responsibility; this engine records structured results when hosts run extended suites.
