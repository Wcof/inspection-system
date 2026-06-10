# PRD Helper Config

- docs_root: docs/prd-helper
- enabled_agents: claude-code
- capture_policy: explicit
- commands:
- `/prd-start`：开启 PRD Helper 主动采集
- `/prd-stop`：停止 PRD Helper 主动采集并生成摘要
- `/prd-status`：查看 PRD Helper 采集状态
- `/prd-scan`：扫描所有 AI 工具的项目 session 并批量采集
- `/prd-import`：导入第三方文件夹数据作为被动材料
- `/prd-refine`：直接精炼采集材料（不强制要求先完成采集）
- `/prd-relate`：直接建立关联关系（不强制要求先完成精炼）
- `/prd-generate`：直接生成 PRD 文档（不强制要求先完成关联）
- `/prd-discuss`：开启需求研讨模式 — 追问矛盾、模糊术语和未决问题
- `/prd-remove`：卸载 PRD Helper 并清理 Agent 配置
