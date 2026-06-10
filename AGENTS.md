# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

- **Install**: `npm install`
- **Dev server**: `npm run dev`
- **Build (default base `/`)**: `npm run build` (runs `vue-tsc && vite build`)
- **Build (v2 path prefix)**: `npm run build:v2` (produces `/inspection-system/v2/` base)
- **Preview build**: `npm run preview`
- **Type check only**: `npx vue-tsc --noEmit`
- **No test framework configured** — there is no `test` script.

The `dashboard/` subdirectory is a separate static app with its own build (`cd dashboard && npm run build`).

## Architecture

### What This Is

A **production safety inspection robot management system** (安全生产巡检任务管理系统) — a Vue 3 SPA for managing autonomous inspection robots in industrial environments. The system has two interfaces toggled via a header radio button:

- **管理端 (Management)** — dispatch center, task management, exception handling, report statistics
- **实施端 (Implementation)** — map management, robot configuration, inspection point collection, device/facility setup, detection rule configuration

### Tech Stack

- Vue 3 + TypeScript (Composition API with `<script setup>`)
- Pinia for state management
- Ant Design Vue 4 for UI components (auto-imported via `unplugin-vue-components`)
- Vue Router 4 with hash-based history (`createWebHashHistory`)
- Vite 6 bundler
- Sass for custom styles
- Path alias: `@` → `./src`

### Data Layer — No Backend

All data lives in `localStorage` via `MockService` (a static class in `src/mock/mockService.ts`). There is no REST API. The service uses a `storage` utility wrapper around `localStorage` with typed `STORAGE_KEYS`.

Pattern: Pinia stores call `MockService.getXxx()` to read and `MockService.saveXxx()` to write, then re-fetch the full collection into reactive refs. ID generation uses `Date.now()` prefixed strings (e.g., `point-1681234567890`).

Data migration is handled by `src/mock/migrations.ts` (currently `migrateToV2`).

### Two Project Roots

1. **Root (`/`)** — the main Vue 3 + Vite SPA
2. **`dashboard/`** — a standalone vanilla JS + MapLibre GL dashboard (real-time robot monitoring command center). Separate `package.json`, no build tooling — just static HTML/CSS/JS copied to `dist/`.

### Key Directories (main app)

```
src/
├── types/          # TypeScript interfaces & enums (barrel-exported via index.ts)
│   ├── common.ts   # Shared types
│   ├── robot.ts    # Robot, RobotStatus
│   ├── inspection.ts # Core domain: InspectionPoint, InspectionDevice, InspectionTask, InspectionPlan, etc.
│   ├── exception.ts  # Exception types
│   └── path.ts       # InspectionPath
├── stores/         # Pinia stores (inspection.ts, robot.ts)
├── mock/           # MockService + initialData + migrations
├── components/     # Shared layout (AppLayout.vue)
├── views/          # Page components organized by domain
│   ├── inspection/   # Inspection points, plans, tasks, devices
│   ├── management/   # Dispatch center, tasks, exceptions, reports
│   ├── implementation/ # Config: detection items, dispatch rules, metrics, calibration
│   ├── map/          # Map editor, point management, area management
│   └── robot/        # Robot CRUD
├── router/         # Route definitions
└── utils/          # Storage utility
```

### Domain Model (Core Entities)

- **InspectionPoint** — a physical location on a map where inspections happen. Has `parkingPoints` (where the robot stops) and each parking point has `collectionPoses` (camera angles/methods).
- **InspectionDevice** — a facility/equipment at an inspection point. Has `assetComponents`, `connectionObjects`, `objectDetectionConfigs`, and `checkItems`.
- **InspectionTask** — a scheduled or one-time execution. References a robot, route, and inspection points. Has snapshots and results.
- **InspectionPlan** — a recurring schedule (weekly/monthly/once) that generates task instances.
- **InspectionMap / Waypoint / WaypointEdge** — the map graph: waypoints connected by edges, belonging to maps.
- **InspectionRoute** — an ordered sequence of waypoints and inspection points.
- **StandardComponent** — reusable component templates in the standard library.

### Route Structure

Routes are nested under two top-level paths: `/management/*` and `/implementation/*`. The `AppLayout` component's sidebar menu switches based on the current system. The default route `/` redirects to `/management/dispatch/center`.

### CI/CD

GitHub Actions (`.github/workflows/deploy-pages.yml`) deploys to GitHub Pages. The build step produces two versions: v1 at root and v2 at `/inspection-system/v2/`, then merges them into a single `dist/` artifact.

## PRD Helper Skill

This project uses PRD Helper for product context collection. See `docs/prd-helper/` for collected materials. The slash commands `/prd-start`, `/prd-stop`, `/prd-pause`, `/prd-resume`, `/prd-status`, `/prd-remove` are available.

<!-- PRD-HELPER:START -->
# PRD Helper Skill - Codex Instructions

## 项目说明

本项目使用 PRD Helper Skill Kit 处理产品上下文。

## 规则来源

完整规则、工作流程、采集命令和检查要求统一见 `support/adapters/canonical-rules.md`。

## 参考文件

- `support/adapters/canonical-rules.md` — 完整规则
- `SKILL.md` — 流程编排
- `modules/*/guide.md` — 各模块行为约束
- `checks/guide.md` — 检查系统说明
<!-- PRD-HELPER:END -->
