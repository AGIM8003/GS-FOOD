# Example overlay — secrets via `envFrom`

This overlay **does not** contain secret values. Create the Secret in the cluster (or use External Secrets / Sealed Secrets):

```bash
kubectl create namespace free-ai --dry-run=client -o yaml | kubectl apply -f -
kubectl -n free-ai create secret generic free-ai-engine-secrets \
  --from-literal=ADMIN_API_KEY='REPLACE' \
  --from-literal=FREEAI_INFER_API_KEY='REPLACE_OPTIONAL' \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -k deploy/kustomize/overlays/staging-secret-env
```

Recommended keys (match [ENTERPRISE_DEPLOY.md](../../../docs/ENTERPRISE_DEPLOY.md)):

- `ADMIN_API_KEY`
- `FREEAI_INFER_API_KEY` (if infer token required)
- Provider keys (`OPENROUTER_API_KEY`, etc.) as needed by `providers.json`

For **Cosign** verification on the container image, see [docs/HELM_GITOPS.md](../../../docs/HELM_GITOPS.md) and [docs/examples/github-actions/cosign-helm-example.yml](../../../docs/examples/github-actions/cosign-helm-example.yml).
