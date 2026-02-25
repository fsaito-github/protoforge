# ProtoForge

ProtoForge (incremental) is a Creative Apps project for Agents League: turn Figma design + PO requirements into an Azure-ready PoC, with Spec Kit-compatible artifacts.

## Quick start

```powershell
# (optional) clone Spec Kit reference templates
cd ..
git clone https://github.com/github/spec-kit .\context\spec-kit

cd protoforge
npm run init

# pass a Figma URL (recommended on Windows: use env var)
$env:FIGMA_URL = "https://www.figma.com/file/<fileKey>/<name>?node-id=123%3A456"

npm run forge       # continuous pipeline (defaults to interactive interview)

# re-run without interview prompts (reuses existing spec/constitution)
npm run forge:skip
```

## Commands

- `npm run capture <path-to-figma-json>`: stub normalizer -> `specs/001-poc-feature/design-spec.json`
- `npm run architect`: writes `plan.md`, `research.md`, `data-model.md`
- `npm run generate`: writes `tasks.md` and materializes a static PoC under `pocs/001-poc-feature/`
- `npm run review`: writes `review.md`
- `npm run deploy`: writes `deploy.md` (Azure prereqs + next steps)
- `npm test`: runs smoke tests

## Outputs (Spec Kit compatible)

- `base/memory/constitution.md`
- `specs/001-poc-feature/spec.md`
- `specs/001-poc-feature/plan.md`
- `specs/001-poc-feature/tasks.md`
- `specs/001-poc-feature/review.md`
- `specs/001-poc-feature/deploy.md`
