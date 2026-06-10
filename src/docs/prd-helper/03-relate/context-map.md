# 上下文总关联

## 完整链路总览

```
需求事实 → 页面/功能 → 业务规则 → 数据对象 → 验收标准
```

### 链路 1：双系统架构
```
fact_001 → page_006/page_001 → rule_007 → data_008/data_009 → acc_007
fact_002 → page_001/page_002/page_003/page_004/page_005 → rule_001/rule_002/rule_003 → data_001/data_003/data_005 → acc_001/acc_002/acc_003
```

### 链路 2：对象建模
```
fact_004 → page_016 → rule_005/rule_023 → data_006/data_025/data_008 → acc_005/acc_023
```

### 链路 3：巡检点管理
```
fact_005 → page_008 → rule_011/rule_012 → data_014 → acc_011/acc_012
```

### 链路 4：设备设施采集
```
fact_006 → page_009 → rule_013/rule_014 → data_016/data_018 → acc_013/acc_014
```

### 链路 5：检测对象
```
fact_007 → page_010 → rule_014/rule_015/rule_016 → data_019 → acc_014/acc_015/acc_016
fact_011 → page_010 → rule_015 → data_019 → acc_015
```

### 链路 6：调度配置
```
fact_008 → page_011 → rule_004/rule_017 → data_021 → acc_004/acc_017
fact_009 → page_012 → rule_018/rule_019 → data_022 → acc_018/acc_019
fact_015 → page_013 → rule_020 → data_023 → acc_020
```

### 链路 7：边巡边检
```
fact_014 → page_014 → rule_021 → data_024 → acc_021
```

### 链路 8：校准记录
```
fact_010 → page_008/page_015 → rule_022/rule_025 → data_015 → acc_022/acc_025
```

### 链路 9：机器人管理
```
fact_013 → page_007 → rule_009/rule_010 → data_012/data_013 → acc_009/acc_010
```

### 链路 10：全局能力
```
fact_012 → page_017 → rule_024 → — → acc_024
```

## 待确认问题影响范围

| 问题 | 影响的事实 | 影响的页面 | 影响的规则 | 影响的验收 |
|------|-----------|-----------|-----------|-----------|
| question_001（驾驶舱集成） | — | page_016, page_001, page_006 | rule_023 | acc_023 |
| question_002（后端 API） | 全部 | 全部 | 全部 | 全部 |
| question_003（权限体系） | fact_002 | page_001-page_015 | — | 全部 |
| question_004（校准坐标获取） | fact_010 | page_008 | rule_025 | acc_025 |
| question_005（热力图数据源） | fact_014 | page_014 | rule_021 | acc_021 |
| question_006（检测项优先级算法） | fact_007 | page_010 | rule_016 | acc_016 |
| question_007（区域与点位映射） | fact_005 | page_008 | rule_012 | acc_012 |

## 冲突点影响范围

| 冲突 | 已解决状态 | 影响的事实 | 影响的页面 |
|------|-----------|-----------|-----------|
| conflict_001（实时平台 vs 双系统） | partially_resolved | fact_001, fact_002 | page_001, page_006, page_016 |
| conflict_002（检测项配置一致性） | resolved | fact_007 | page_009, page_010 |
| conflict_003（调度规则布局） | resolved | fact_008 | page_011 |
| conflict_004（校准记录策略） | resolved | fact_010 | page_008, page_015 |
| conflict_005（巡检点字段不一致） | resolved | fact_005 | page_008 |

## AI 推断影响范围

| 推断 | 状态 | 影响的事实 | 影响的页面 |
|------|------|-----------|-----------|
| assumption_001（四菜单结构） | pending_confirmation | fact_001 | page_006-page_014 |
| assumption_002（数据迁移） | pending_confirmation | — | 全部（数据层） |
| assumption_003（机器人 mock） | pending_confirmation | fact_013 | page_007 |
| assumption_004（列表样式规范） | pending_confirmation | — | 全部（*List.vue） |
| assumption_005（检测项树层级） | pending_confirmation | fact_007 | page_010, page_009 |

## 链路断链标记

以下事实暂未找到完整链路：

- **无断链**：所有 15 条事实均已关联到页面/功能 → 规则 → 数据 → 验收
