# Project Conventions — 安全生产巡检任务管理系统

## 数据层约定

- **无后端**：所有数据存储在 `localStorage`，通过 `MockService`（`src/mock/mockService.ts`）操作
- **读取**：Pinia stores 调用 `MockService.getXxx()` 
- **写入**：Pinia stores 调用 `MockService.saveXxx()`
- **ID 生成**：使用 `Date.now()` 前缀字符串格式，如 `point-1681234567890`、`task-1681234567890`
- **数据迁移**：在 `src/mock/migrations.ts` 中处理，不要直接修改 `initialData.ts`

## 架构约定

- **双端切换**：管理端（`/management/*`）和实施端（`/implementation/*`）通过顶部 radio 切换
- **默认路由**：`/` 重定向到 `/management/dispatch/center`
- **路由模式**：Hash 模式（`createWebHashHistory`）

## 代码风格

- Vue 3 Composition API + `<script setup>` 语法
- 路径别名：`@` → `./src`
- Ant Design Vue 4 组件通过 `unplugin-vue-components` 自动导入，无需手动 import
- 中文注释和中文领域术语是合法标识符，需理解并保留

## 领域模型关键实体

- **InspectionPoint** — 巡检位置，含停车点和采集姿态
- **InspectionDevice** — 巡检设备，含 assetComponents、checkItems
- **InspectionTask** — 调度或一次性任务
- **InspectionPlan** — 周期性排班计划
- **InspectionMap / Waypoint / WaypointEdge** — 地图图结构
- **InspectionRoute** — 有序路径点和巡检点序列
- **StandardComponent** — 标准库可复用组件模板

## 构建命令

- 类型检查：`npx vue-tsc --noEmit`
- 测试：`npx vitest run`
- 构建：`npm run build`（v1）或 `npm run build:v2`（v2 路径）
