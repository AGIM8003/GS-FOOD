# FREE AI — provider discovery registry

**Status:** Human-facing contract. Not loaded by the engine at runtime.

The **metadata** registry is built from `providers.json` by `buildProviderDiscoveryRegistry()` in `src/providers/providerDiscoveryRegistry.js` (re-exported from `src/providers/registry.js`). It describes adapter kind, transport, catalog refresh support, and auth env keys. Runtime routing still uses `ProviderRegistry` in the same folder.
