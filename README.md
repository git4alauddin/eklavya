# Eklavya Project (Prerequisite Learning Graph)

Eklavya is a frontend demo for planning school-math learning paths using prerequisite dependencies.

It includes:
- Topic graph (NCERT Class 4–7 Math chapter-level topics)
- Hard vs soft prerequisite modeling
- Target planner with readiness and recommendations
- Math Learning Cards with mastery tracking

## Tech Stack

- React + TypeScript
- Vite
- React Router
- Vitest (tests)

## Run Locally

```bash
npm install
npm run dev
```

App runs on the Vite default local URL shown in terminal (usually `http://localhost:5173`).

## Scripts

- `npm run dev` - start development server
- `npm run typecheck` - TypeScript checks
- `npm run test` - run unit tests
- `npm run test:watch` - run tests in watch mode
- `npm run validate:data` - validate graph/data integrity
- `npm run check` - typecheck + tests + data validation
- `npm run build` - production build
- `npm run preview` - preview production build

## Project Structure

```txt
src/
  data/ncert/           # grade-wise topic data (Class 4,5,6,7)
  routes/               # pages: Hub, Planner, Graph, Topic Cards
  graphData.ts          # merged graph data + dependency edges
  graphEngine.ts        # core algorithms (validation, readiness, roadmap, suggestions)
  graphEngine.test.ts   # unit tests for graph engine
  types.ts              # shared types
  style.css             # app styles
scripts/
  validate-data.ts      # CLI data/graph validator
```

## Data and Graph Rules

- Every topic must have: `id`, `title`, `mathTopic`, `gradeBand`, `description`
- Topic IDs must be unique
- Every edge must point to existing topics
- `minMastery` must be between `0` and `1`
- No cycles and no self-loop dependencies

## Contribution Notes

Before opening PRs:

```bash
npm run check
npm run build
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for workflow and scope guidelines.
