# Contributing

## Workflow
- Create small, focused PRs (prefer one feature area per PR).
- Do not mix UI polish, data changes, and algorithm changes in one PR.
- Keep commit messages explicit about scope.

## Project Areas
- `src/data/ncert/`: curriculum topic data (grade-wise).
- `src/graphData.ts`: dependency edges + startup mastery defaults.
- `src/graphEngine.ts`: graph algorithms (validation, readiness, roadmap, suggestions).
- `src/routes/`: page-level UI.

## Required Checks
Run before opening a PR:

```bash
npm run check
npm run build
```

This runs:
- type checks
- graph-engine tests
- graph data validation

## Data Rules
- Every topic must include `id`, `title`, `mathTopic`, `gradeBand`, `description`.
- Topic `id` values must be unique.
- Every edge must reference existing topics.
- `minMastery` must be in `[0, 1]`.
- No cycles and no self-loop dependencies.

## Code Style
- Keep logic and rendering separated where possible.
- Add short comments only for non-obvious logic.
- Prefer explicit names over abbreviations in algorithm code.
