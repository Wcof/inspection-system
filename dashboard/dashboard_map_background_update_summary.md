# Dashboard 地图底图与点位贴合调整说明

## 本次调整概览
本次围绕“使用上传的地图作为背景并让业务点位贴图”完成了地图底座与业务坐标体系改造，核心目标是让巡检点、机器人、充电站、告警点及巡检路径在视觉上与 `地图.png` 一致。

## 具体调整内容
1. 新增地图图片底图能力
- 将 `地图.png` 作为 MapLibre 的 `image` source 接入。
- 新增 `site-background-layer`（raster），作为地图主视觉底层。
- 保留原有矢量业务层（机器人、巡检点、告警、路径）叠加显示。

2. 统一场站坐标系
- 新增场站四角地理锚点：`SITE_IMAGE_COORDS`。
- 新增可复用坐标映射函数：`siteCoord(x, y)`，按图片相对坐标（0~1）映射经纬度。
- 新增默认视角中心：`SITE_CENTER`。

3. 地图视角改为贴图模式
- 默认视角改为俯视：`pitch = 0`、`bearing = 0`。
- 禁止旋转：`dragRotate = false`。
- 聚焦机器人/巡检点/充电站/告警时统一使用俯视角，避免倾斜导致的“贴图错位感”。

4. 增加场站浏览边界
- 新增 `SITE_VIEW_BOUNDS`。
- 地图加载后执行 `setMaxBounds` 与 `fitBounds`，将浏览和初始化视野限制在场站范围内。

5. 重新标定业务点位坐标（贴合图片）
- 巡检点：`INSPECTION_POINT_COORDS` 全量重排。
- 机器人：`DATA.robots[*].coords` 全量重排。
- 充电站：`DATA.docks[*].coords` 全量重排。
- 告警：`DATA.alerts[*].coords` 与巡检点对应重排。

6. 同步巡检任务路径与时间轴节点
- `T-01` / `T-02` 的 `robotCoords`、`targetCoords`、`path`、`futurePath`、`targetLine` 已重排。
- 两个任务的 `timeline.nodes[*].coords` 已同步重排。
- 路径骨架线（backbone）坐标改为基于 `siteCoord` 计算。

## 变更文件
- `app.js`

## 验证结果
- `node --check app.js`：通过
- `npm run build:pages`：通过

## 影响说明
- 本次改动仅涉及前端静态地图展示与 mock 坐标，不影响后端服务。
- 原有地图交互逻辑（点击机器人/巡检点/充电站/告警、路径显示开关、弹窗联动）保持可用。

