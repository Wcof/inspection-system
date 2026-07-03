# PMContext — 系统设置 · 算法管理页

> 由 `/pm-need --auto` 生成。日期：2026-07-01。
> 种子需求：「系统设置菜单新增算法管理页面，列表展示算法，进行算法的CRUD。算法分为上传的算法以及默认的大模型，添加算法的时候需要配置他的名字，如果是大模型需要配置他的user prompt。主要就是算法的CRUD」

---

## 0. 需求一句话

在「系统设置」菜单下新增「算法管理」页面，对**算法**做 CRUD。算法分两类——**上传的算法**与**默认的大模型**；新增算法时必填**名称**，当类型为大模型时额外必填 **user prompt**。

---

## 1. 事实（有来源）

| # | 事实 | 来源 |
|---|------|------|
| F1 | 系统设置菜单位于 `AppLayout.vue`，当前子项：设备管理 / 调度规则配置 / 资源基础配置 / 巡检对象类型配置 / 通知配置 / 边巡边检 / 第三方系统模拟 | `src/components/layout/AppLayout.vue` L162-191 |
| F2 | 路由系统设置挂在 `/management/system` 下，目前仅有 `third-party-simulator` 一个子路由 | `src/router/index.ts` L233-245 |
| F3 | 现有"大模型"概念是**检测规则级开关** `RuleItem.llmEnabled?: boolean`，并非独立可管理的算法实体 | `src/views/implementation/detection-item-config/model.ts` L7-15 |
| F4 | `mockService.ts` 无任何算法相关方法（get/save/delete 均无 algorithm） | `src/mock/mockService.ts` 全文符号列表（122 方法，无 algorithm） |
| F5 | MockService 数据访问范式：`static getXxx(): T[]` / `static saveXxx(item): void`（upsert by id）/ `static deleteXxx(id): void` + `STORAGE_KEYS` 常量 + localStorage | `mockService.ts` L815-864 |
| F6 | ID 生成范式：`Date.now()` 前缀字符串，如 `point-1681234567890`、`dic-${Date.now()}`、`session-${Date.now()}` | `.atomcode.md`「数据层」+ mockService L839 |
| F7 | CRUD 列表页范式（自研）：`a-page-header` 标题+副标题+新增按钮 → `a-card` 内查询表单 → `a-table` 行内操作（详情/编辑/启用停用/删除）+ `Modal.confirm` 删除确认 + `message.success` 提示 | `DetectionItemConfigList.vue` L1-72 |
| F8 | 表单页范式：独立路由 `/create` 与 `/edit/:id`，复用同一 Form 组件；或弹窗形式新增/编辑 | `detection-item-config` 路由 L459-488 |
| F9 | **AI 智库两页面（知识库管理 + AI 问答）当前实现为 iframe 嵌套 `https://ai.geekaeon.com/newAI/`**（commit `cb3874c`），与 CONTEXT.md 标注的"已落地（自研 CRUD）"不一致 | `KnowledgeBase.vue` / `AIChat.vue` 全文 + git log |
| F10 | mockService 仍保留 `getKnowledgeFiles / saveKnowledgeFile / deleteKnowledgeFile / getAIChatSessions / saveAIChatSession / deleteAIChatSession` 自研数据方法（iframe 化前的残留） | `mockService.ts` L815-850 |
| F11 | 检测规则的 `algorithm` 字段是**自由字符串**（如 `'OCR+表盘定位'`），无外键约束到算法实体 | `model.ts` L11, L211 |
| F12 | Ant Design Vue 4 通过 `unplugin-vue-components` 自动导入，组件直接用 `<a-xxx>` 无需 import | `.atomcode.md` 技术栈 |
| F13 | 路径别名 `@` → `./src`；hash 路由 `createWebHashHistory` | `.atomcode.md` + `router/index.ts` L580 |
| F14 | 近期 commit 显示项目处于"7月迭代"收尾阶段，模块六（AI 智能平台）已交付：大模型增强开关、AI 智库两页面、控制台入口 | git log `493da8b` `b10b542` `a38c81a` `cb3874c` |

---

## 2. 推断（[假设] · 附置信度 1-10）

### 维度 1 · 用户场景

| ID | 推断 | 置信度 | 依据 |
|----|------|--------|------|
| A1 | **主要使用者是系统管理员/实施工程师**，在部署或运维阶段配置可用的识别算法清单，供后续检测规则引用 | 8 | 系统设置菜单定位 + 现有"巡检对象类型配置/调度规则配置"同为实施态配置页 |
| A2 | 算法管理是**配置态**页（增删改查算法清单），不直接参与巡检执行；执行时由检测规则引用某个算法 | 8 | 与"巡检对象类型配置"同层级，属基础数据维护 |
| A3 | "上传的算法"指**用户自训练/自部署的视觉模型文件**（如 ONNX/权重文件），需上传文件 | 7 | 领域语义"上传"对照"默认"——默认即系统预置的大模型，上传即用户自带 |
| A4 | "默认的大模型"指**系统预置的多模态大模型**（如接入 `ai.geekaeon.com` 的能力），无需上传文件，只需配 prompt | 7 | F9 显示已接入 `ai.geekaeon.com/newAI`；"默认"暗示开箱可用 |

### 维度 2 · 边界条件

| ID | 推断 | 置信度 | 依据 |
|----|------|--------|------|
| A5 | 算法**必填字段**：名称、类型（上传算法/大模型）；**条件必填**：大模型→user prompt；上传算法→上传文件 | 8 | 种子需求"配置名字，大模型配 user prompt" + CRUD 语义 |
| A6 | 算法实体应有**启用/停用状态**，停用的算法不出现在检测规则的可选算法列表中 | 6 | F7 范式中检测规则列表有"启用/停用"切换，算法作为被引用方应同样支持 |
| A7 | 删除算法应做**引用检查**——被检测规则引用中的算法不可删除，或需二次确认 | 6 | F11 检测规则 algorithm 字段为字符串引用，硬删会留下悬空引用 |
| A8 | 算法名称**允许重复**或**全局唯一**未明确 → [待确认 A-Q1] | 3 | 种子未提及 |

### 维度 3 · 优先级

| ID | 推断 | 置信度 | 依据 |
|----|------|--------|------|
| A9 | **P0 核心**：列表展示 + 新增 + 编辑 + 删除（种子明确"主要就是算法的CRUD"） | 9 | 种子原文 |
| A10 | **P1 增强**：启用/停用、查询过滤（按类型/名称）、引用计数展示 | 6 | F7 范式标配 |
| A11 | **P2 延后**：上传文件的真实上传/解析、算法试运行、版本管理 | 4 | 原型阶段 mock 数据，无真实算法执行 |

### 维度 4 · 冲突检测

| ID | 推断 | 置信度 | 依据 |
|----|------|--------|------|
| A12 | **[冲突]** "默认的大模型"与现有"大模型增强"（`RuleItem.llmEnabled`）概念边界需厘清：大模型增强是规则级开关，算法管理页的"大模型"是可配置实体。两者关系：规则开启 `llmEnabled` 时，兜底调用算法管理中某个"大模型"类型的算法实体（需选具体哪个大模型） | 7 | F3 + A4。**建议方案**：算法管理页落地后，检测规则的"大模型增强"开关旁可补一个"兜底大模型"下拉（选算法实体）。但此改造**不在本需求范围**，仅记为关联点 |
| A13 | **[冲突]** CONTEXT.md L99-101 标注知识库/问答页"已落地（自研 CRUD）"，但 F9 显示已 iframe 化。算法管理页是否也走 iframe？ | 5 | F9 + git log。**倾向推断**：算法管理是结构化 CRUD（名称/类型/prompt），iframe 不适合，应走自研 + mock |

### 维度 5 · 术语澄清

| ID | 推断 | 置信度 | 依据 |
|----|------|--------|------|
| A14 | **"算法"（Algorithm）** = 可被检测规则引用的识别能力实体，含两类：上传算法 / 大模型 | 8 | 种子原文 |
| A15 | **"上传的算法"** = 用户自训练/自部署的视觉模型，需上传模型文件 | 7 | A3 |
| A16 | **"默认的大模型"** = 系统预置的多模态大模型，配置 user prompt 即可调用 | 7 | A4 |
| A17 | **"user prompt"** = 调用大模型时的**用户提示词/指令模板**（如"请识别图中是否存在渗漏，输出 JSON：{has_leak, confidence}"），每次识别时作为 system/user message 注入 | 7 | LLM 领域通用语义 + ADR 0021 大模型兜底场景 |

### 维度 6 · 现状平替与摩擦力

| ID | 推断 | 置信度 | 依据 |
|----|------|--------|------|
| A18 | **现状平替**：当前检测规则的 `algorithm` 是自由字符串（F11），用户手填算法名。算法管理页上线后，理想态是检测规则的 algorithm 改为**下拉选择算法实体**，但此改造**不在本需求范围** | 7 | F11 + A12 |
| A19 | **摩擦力低**：算法管理是纯新增页，不改现有任何页面，零回归风险 | 8 | F4 无算法相关方法 + F3 大模型增强是独立开关 |

### 维度 7 · 技术与资源约束

| ID | 推断 | 置信度 | 依据 |
|----|------|--------|------|
| A20 | 技术栈：Vue 3 `<script setup>` + TS + Ant Design Vue 4 自动导入 + Pinia（可选）+ MockService localStorage | 9 | F5 F12 + .atomcode.md |
| A21 | 数据层：新增 `types/ai.ts` 中 `Algorithm` 接口；MockService 新增 `getAlgorithms/saveAlgorithm/deleteAlgorithm` + `STORAGE_KEYS.ALGORITHMS`；`initialData.ts` 灌入 mock 算法 | 8 | F5 F6 + 现有 ai.ts 已存在 |
| A22 | 上传算法的"文件上传"在原型阶段用 **mock 文件名/大小** 即可（沿用 KnowledgeFile 的 size/description 字段范式），不真实上传 | 7 | 原型定位 + F10 知识库文件已是 mock |
| A23 | 路由建议：`/management/system/algorithm/list` + `/management/system/algorithm/form/:id?`，或单页内弹窗 CRUD | 7 | F2 现有 system 路由结构 + F8 范式 |

### 维度 8 · 价值验证度量

| ID | 推断 | 置信度 | 依据 |
|----|------|--------|------|
| A24 | **核心价值**：算法从"散落在检测规则里的自由字符串"升格为"可管理实体"，为后续检测规则下拉引用算法、大模型兜底选具体模型铺路 | 7 | F11 + A12 + A18 |
| A25 | **验证度量（原型阶段）**：① 算法列表可展示两类算法；② 可完成新增/编辑/删除闭环；③ 大模型类型必填 user prompt 校验生效；④ mock 数据持久化到 localStorage 刷新不丢 | 8 | CRUD 验收通用标准 |

---

## 3. 信息缺口（[待确认] · 需 PM 补充）

| ID | 缺口 | 需 PM 提供什么 | 影响 |
|----|------|----------------|------|
| Q1 | 算法名称是否全局唯一？ | 是/否；若唯一，重复时校验提示文案 | 表单校验逻辑 |
| Q2 | "上传的算法"除名称外还需配什么？ | 是否需要：模型文件上传（mock 文件名）/ 算法版本 / 输入输出规格 / 适用检测类型 | 表单字段集合 |
| Q3 | "默认的大模型"是否预置多条？预置哪些？ | 预置大模型清单（如"通用视觉大模型""渗漏识别大模型"）及各自默认 user prompt | initialData 灌入内容 |
| Q4 | user prompt 是否支持模板变量？ | 如 `{{target}}` `{{scene}}` 等占位符，还是纯静态文本 | prompt 字段是否需编辑器/变量插入 |
| Q5 | 大模型除 user prompt 外是否还需配 system prompt / 温度 / 模型版本？ | 字段清单 | 表单字段集合 |
| Q6 | 算法删除是否做引用检查？ | 被 detection rule 引用中：禁止删除 / 二次确认 / 软删除 | 删除逻辑复杂度 |
| Q7 | 算法管理页与现有"大模型增强"开关是否要打通？ | 本期是否同步改造检测规则表单，让 `llmEnabled` 开关旁加"兜底大模型"下拉选算法实体 | 是否含关联改造 |
| Q8 | 列表是否需按类型分 Tab 或分组展示？ | 上传算法/大模型分两个 Tab，还是同一表格用类型列区分 | 列表页布局 |
| Q9 | 菜单项命名与图标？ | "算法管理" / "算法配置" / "识别算法" ？图标用 `algorithm` 还是其他 | 菜单文案 |
| Q10 | 算法是否有"试运行"入口？ | 列表行是否需"试运行"按钮（上传样本图测试识别） | 是否含试运行页 |

---

## 4. 推荐方案（基于推断的默认决策）

> 零确认模式下，以下未确认项按推荐默认值落地，PM 事后可改 PMContext 重生成。

| 缺口 | 推荐默认 | 理由 |
|------|----------|------|
| Q1 名称唯一性 | **全局唯一**，重复提示"算法名称已存在" | 实体管理默认唯一，避免引用歧义 |
| Q2 上传算法字段 | 名称 + 类型 + 算法版本（选填）+ 模型文件（mock：文件名+大小）+ 描述 + 启用状态 | 最小可用集，文件走 mock |
| Q3 预置大模型 | 预置 2 条：①"通用视觉大模型"（prompt：请识别图中目标并输出结构化结果）②"渗漏识别大模型"（prompt：请判断画面中是否存在液体渗漏，输出 {has_leak, confidence, area}） | 覆盖典型场景 |
| Q4 prompt 模板变量 | **纯静态文本**，不做变量插值（原型阶段） | 简化，避免过度设计 |
| Q5 大模型额外字段 | 仅 user prompt（必填）+ 描述（选填），不配 system prompt/温度 | 种子只提 user prompt |
| Q6 删除引用检查 | **软校验**：删除时检查是否有 detection rule 的 `algorithm` 字段等于该算法名，有则弹 Modal 提示"被 N 条规则引用，确认删除？"，确认后硬删（规则侧留悬空字符串，后续治理） | 平衡安全与实现成本 |
| Q7 与大模型增强打通 | **本期不打通**，仅记为关联点（A12）。算法管理页先独立落地 | 不扩大范围 |
| Q8 列表布局 | **同一表格 + 类型列**，顶部查询区可按类型过滤 | 单页简洁 |
| Q9 菜单命名 | **"算法管理"**，图标沿用 `a-icon type="algorithm"`（若无则 `bulb`） | 直白对应需求 |
| Q10 试运行 | **本期不做**，P2 延后 | 原型阶段无真实算法 |

---

## 5. 范围边界

### In Scope（本期）
- 系统设置菜单新增"算法管理"入口 + 路由
- 算法列表页（查询 + 表格 + 行内操作）
- 算法新增/编辑表单（名称、类型、条件必填 user prompt / 上传文件 mock）
- 算法删除（含引用软校验提示）
- 算法启用/停用
- `Algorithm` 类型定义 + MockService 算法 CRUD + initialData 预置
- localStorage 持久化

### Out of Scope（本期不做）
- 检测规则表单 algorithm 字段改为下拉引用算法实体（A18 关联改造）
- 检测规则"大模型增强"开关旁加"兜底大模型"下拉（A12/Q7）
- 真实模型文件上传与解析
- 算法试运行页
- 算法版本管理与发布流程
- user prompt 模板变量插值
- system prompt / 温度 / 模型版本等大模型高级参数

---

## 6. 验收标准

1. 系统设置菜单可见"算法管理"入口，点击进入列表页
2. 列表页展示预置算法（≥2 条大模型 + 若干上传算法），含名称/类型/状态/更新时间/操作列
3. 新增大模型：名称+user prompt 必填校验生效，保存后列表刷新，刷新浏览器数据不丢
4. 新增上传算法：名称必填，模型文件走 mock（文件名+大小），保存成功
5. 编辑算法：回填字段，改 user prompt 后保存生效
6. 删除未被引用算法：直接删除
7. 删除被引用算法：弹 Modal 提示被 N 条规则引用，确认后删除
8. 启用/停用切换：停用算法在列表状态列显示"停用"标签
9. 查询过滤：按名称模糊查询 + 按类型过滤均生效
10. `npx vue-tsc --noEmit` 通过

---

## 7. 关联工件

- 现有"大模型增强"开关：`src/views/implementation/detection-item-config/model.ts` `RuleItem.llmEnabled`
- AI 智库 iframe 化：`src/views/implementation/KnowledgeBase.vue` / `AIChat.vue`
- 系统设置菜单：`src/components/layout/AppLayout.vue` L162-191
- 系统设置路由：`src/router/index.ts` L233-245
- MockService 范式：`src/mock/mockService.ts`
- AI 类型文件：`src/types/ai.ts`
- CRUD 列表范式：`src/views/implementation/detection-item-config/DetectionItemConfigList.vue`
