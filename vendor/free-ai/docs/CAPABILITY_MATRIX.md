# FREE AI — capability matrix

**Status:** Human-facing contract. Not loaded by the engine at runtime.

Declarative rows live in `src/capabilities/capabilityMatrix.js`. Task contexts map to capability IDs via `src/capabilities/taskToCapabilityMap.js`. Provider adapters remain responsible for honoring capability flags on each model record after catalog normalization.
