# PRD Helper 初始化配置（Setup）

| 配置项（Key） | 值（Value） |
| --- | --- |
| 文档目录（docs_root） | docs/prd-helper |
| 启用 Agent（enabled_agents） | claude-code |
| 采集策略（capture_policy） | explicit |
| 工作流（workflow） | 采集 Collect -> 精炼 Refine -> 关联 Relate -> 生成 Generate |

## 指令（Commands）

- `/prd-start`：开启显式主动采集（active capture）
- `/prd-pause`：暂停主动采集
- `/prd-resume`：恢复主动采集
- `/prd-stop`：停止主动采集并生成采集摘要
- `/prd-status`：查看采集状态
- `/prd-remove`：从当前项目卸载 PRD Helper
