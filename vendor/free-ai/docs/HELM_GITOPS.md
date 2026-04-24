# FREE AI — Helm, Kustomize, and signed OCI releases

**Status:** Human-facing reference. Container packaging is **optional**; many hosts run the engine as a systemd-managed Node process on loopback (see [ENTERPRISE_DEPLOY.md](ENTERPRISE_DEPLOY.md)).

## Layout in this repository

| Path | Purpose |
|------|---------|
| `deploy/helm/free-ai/` | Minimal Helm chart (Deployment + Service). Values carry image, env, bind policy reminders. |
| `deploy/kustomize/base/` | Plain Kustomize base you can overlay per environment (pins, secrets via external secrets operator, etc.). |

Neither path is required for the engine to run; they exist so organizations with **GitOps** (Argo CD, Flux) can adopt a standard packaging shape.

**Probes:** The Helm chart and Kustomize base configure **`livenessProbe`** → `GET /health/live` and **`readinessProbe`** → `GET /health/ready` on the HTTP port. Tune `values.yaml` under `probes.*` if the engine needs a longer cold start.

## Helm install (sketch)

```bash
helm upgrade --install free-ai ./deploy/helm/free-ai \
  --namespace free-ai --create-namespace \
  --set image.repository=YOUR_REGISTRY/free-ai-engine \
  --set image.tag=YOUR_DIGEST_OR_SEMVER
```

Inject secrets with `values.yaml` references to your platform (Kubernetes Secrets, External Secrets, Sealed Secrets) — **do not** commit real keys.

## Kustomize (sketch)

```bash
kubectl apply -k deploy/kustomize/overlays/production
```

Create `deploy/kustomize/overlays/production` in your fork with environment-specific patches (replicas, resource limits, `FREEAI_REQUIRE_ADMIN_KEY`, etc.).

**In-repo example:** [deploy/kustomize/overlays/staging-secret-env/](deploy/kustomize/overlays/staging-secret-env/) merges the base chart with `envFrom` → `Secret` `free-ai-engine-secrets` (you create the Secret out-of-band).

**Cosign example workflow (copy to your org):** [docs/examples/github-actions/cosign-helm-example.yml](examples/github-actions/cosign-helm-example.yml).

## Signed artifacts (recommended for production)

1. Build and push a **digest-pinned** OCI image (immutable tag policy).
2. Sign the image with [Sigstore Cosign](https://docs.sigstore.dev/cosign/overview/) (`cosign sign`).
3. For Helm OCI charts, sign the chart package (`cosign sign-blob` on the `.tgz` or use your registry’s chart signing integration).
4. Enforce verification in cluster (Kyverno / admission policy: `cosign verify`).

### GitHub Actions (optional)

The workflow `.github/workflows/helm-chart-package.yml` packages the chart on **manual** `workflow_dispatch` and uploads the tarball as a build artifact. Wire registry push + Cosign in your org’s pipeline when container scope is confirmed.
