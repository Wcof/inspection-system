# collect — 材料清单

日期：2026-07-01
种子：「系统设置菜单新增算法管理页面，列表展示算法，进行算法的CRUD。算法分为上传的算法以及默认的大模型，添加算法的时候需要配置他的名字，如果是大模型需要配置他的user prompt。主要就是算法的CRUD」

## 来源 1 · URL 抓取
种子中无 URL。无抓取。

## 来源 2 · 对话上下文
仅种子需求一句话，无额外 PM 补充。

## 来源 3 · 项目深扫描

### 根级配置
- `.atomcode.md`（项目指令，技术栈/数据层/路由结构）
- `CONTEXT.md`（领域词汇表，AI 智能平台层 L94-105）
- `CLAUDE.md`（存在，未读，与 .atomcode.md 同源）
- `Update.md`（存在）

### docs/ 文档
- `docs/adr/0021-llm-enhancement-as-rule-fallback.md` — 大模型增强作为检测规则兜底（已确认）
- `docs/adr/0022-ai-knowledge-base-and-qa-pages.md` — AI 智库两页面（已确认）
- `docs/adr/0020-detection-combo-no-change-multi-rule-already-supports.md` — 检测项组合算法不改
- `docs/adr/GRILLING-QUEUE.md` — 问题队列，模块六进度
- `docs/plans/2026-06-23-7y-iteration-implementation.md` — 7月迭代实施计划（含 T21/T22/T23 AI 任务）
- `docs/prd/2026-06-23-7y-iteration-prd.md` — 7月迭代 PRD

### 近期 git commits（相关）
- `cb3874c` feat: AI 智库问答与知识库管理页面改为 iframe 嵌套 ← 关键
- `a38c81a` feat: 控制台「AI 智库」入口按钮
- `493da8b` feat: AI 智能平台模块 — 知识库管理页 + 问答页 + 菜单入口
- `b10b542` feat: 检测规则新增「大模型增强」开关 UI
- `418225a` feat: 结果定义统一为通用字段

### 代码 TODO/FIXME
无（grep 全 src 无匹配）

### 关键源文件
- `src/components/layout/AppLayout.vue` — 菜单结构（系统设置 L162-191）
- `src/router/index.ts` — 路由（系统设置 L233-245）
- `src/types/ai.ts` — AI 类型定义（KnowledgeFile/ChatSession/ChatMessage）
- `src/views/implementation/detection-item-config/model.ts` — 检测规则模型（RuleItem.llmEnabled）
- `src/views/implementation/detection-item-config/DetectionItemConfigList.vue` — CRUD 列表范式
- `src/views/implementation/KnowledgeBase.vue` — iframe 嵌套（非自研）
- `src/views/implementation/AIChat.vue` — iframe 嵌套（非自研）
- `src/mock/mockService.ts` — 122 方法，无 algorithm 相关；范式 get/save/delete + STORAGE_KEYS

## 来源 4 · 知识库搜索
未配置知识库路径，跳过。

## 关键发现
1. AI 智库两页面已 iframe 化（commit cb3874c），CONTEXT.md 标注滞后
2. 现有"大模型"是规则级开关 `llmEnabled`，非独立算法实体
3. MockService 无算法相关方法，需新增
4. 检测规则 algorithm 字段为自由字符串，无外键约束
5. 系统设置菜单与路由结构清晰，新增入口低风险
