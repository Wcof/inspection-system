# 管理端界面与地图路网交互改动 — 实施方案

> 基于《管理端界面与地图路网交互改动》设计文档，逐条制定代码级修改方案。
> 涉及文件共 5 个核心文件 + 若干新增文件，总计约 6000 行变更。

---

## 修改总览

| 设计章节 | 涉及文件 | 改动量 | 优先级 |
|---|---|---|---|
| 一、顶部抬头去除 | AppLayout.vue | 小 | P2 |
| 二、菜单改竖装 | AppLayout.vue, router/index.ts | 中 | P2 |
| 三、Delete 键支持 | AreaManage.vue, RoadNetwork.vue, PointManage.vue | 小 | P1 |
| 四、菜单排序与可见范围 | AppLayout.vue, router/index.ts | 小 | P2 |
| 五、区域交互改动 | AreaManage.vue | 大 | P0 |
| 六、路网交互改动 | RoadNetwork.vue | 大 | P0 |
| 七、速查表（验证） | — | — | — |

---

## 一、顶部抬头与首页/控制台切换去除

### 当前状态

AppLayout.vue 顶部有 `a-layout-header`，包含标题和端切换 radio（管理端/实施端）。

### 修改方案

1. **去掉顶部 header 中的端切换 radio**（管理端/实施端）
2. **将"控制台"作为左侧菜单第一项**，点击跳转到 `/management/dispatch/center`
3. **保留顶部 header**，但只显示系统标题和用户信息（不显示切换）

### 具体代码改动

**文件**：`src/components/layout/AppLayout.vue`

```
- 删除：<a-radio-group> 管理端/实施端切换
+ 保留：<h1> 系统标题
+ 保留：用户头像/退出（如果有）
```

**文件**：`src/router/index.ts`

```
- 确认 /management/dispatch/center 路由已存在
+ 无需新增路由，只是菜单项调整
```

---

## 二、菜单改为传统竖装菜单

### 当前状态

AppLayout.vue 使用 Ant Design 的 `a-menu` + `a-sub-menu`，已经是竖装菜单形式。
但菜单项顺序和分组可能与设计文档不一致。

### 修改方案

1. **按设计文档重新排列菜单项**：控制台 → 首页 → 地图与路网 → 设施设备管理 → 安全与检测 → 规划与执行 → 异常中心 → 报表统计 → 系统设置
2. **"地图与路网"下设子菜单**：地图 → 路网 → 区域 → 点位

### 具体代码改动

**文件**：`src/components/layout/AppLayout.vue`

重新组织 `<a-sub-menu>` 的顺序和嵌套：

```vue
<!-- 1. 控制台 -->
<a-menu-item key="dispatch-center">
  <router-link to="/management/dispatch/center">控制台</router-link>
</a-menu-item>

<!-- 2. 首页 -->
<a-menu-item key="home">
  <router-link to="/">首页</router-link>
</a-menu-item>

<!-- 3. 地图与路网 -->
<a-sub-menu key="map-and-network">
  <template #title>地图与路网</template>
  <a-menu-item key="map-list">地图</a-menu-item>
  <a-menu-item key="road-network">路网</a-menu-item>
  <a-menu-item key="area-manage">区域</a-menu-item>
  <a-menu-item key="point-manage">点位</a-menu-item>
</a-sub-menu>

<!-- 4~9 按设计文档顺序排 ... -->
```

**文件**：`src/router/index.ts`

确保路由路径与菜单 key 对应，必要时调整路由结构。

---

## 三、Delete 键支持

### 当前状态

- AreaManage.vue：无 Delete 键监听
- RoadNetwork.vue：无 Delete 键监听（删除通过"删除模式"按钮）
- PointManage.vue：无 Delete 键监听

### 修改方案

在三个页面的 `onMounted` 中注册 `keydown` 监听，Delete 键触发删除当前选中实体。

### 具体代码改动

**文件**：`src/views/map/AreaManage.vue`

```typescript
// 新增
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Delete' && selectedRegionId.value) {
    const region = regions.value.find(r => r.id === selectedRegionId.value)
    if (region) deleteRegionFromList(region)
  }
}

onMounted(() => {
  // ...existing
  window.addEventListener('keydown', onKeyDown)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
})
```

**文件**：`src/views/map/RoadNetwork.vue`

```typescript
// 修改 onKeyDown 函数，增加 Delete 键处理
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    // ...existing escape logic
  }
  if (e.key === 'Delete' && selectedEntity.value) {
    // 弹出确认弹窗后删除
    Modal.confirm({
      title: '确认删除',
      content: `确定删除该${propertyTitle.value}吗？`,
      onOk: () => {
        deleteEntityLocally(selectedEntity.value!.type, selectedEntity.value!.id)
        selectedEntity.value = null
        hasUnsavedChanges.value = true
      }
    })
  }
}
```

**文件**：`src/views/map/PointManage.vue`

同 AreaManage.vue 模式，选中点位后 Delete 键触发删除确认。

---

## 四、地图与路网菜单内部排序与可见范围

### 当前状态

路由中地图相关路径为 `/implementation/map/*`，子菜单包括：地图列表、区域管理、点位管理、路网管理。

### 修改方案

1. **菜单排序**：地图 → 路网 → 区域 → 点位
2. **可见范围规则**在路由层面不做限制（同一页面通过参数控制可见图层）

**文件**：`src/components/layout/AppLayout.vue`

调整 `<a-sub-menu key="implementation-map">` 内的 `<a-menu-item>` 顺序。

**文件**：`src/views/map/RoadNetwork.vue`

路网页面默认显示所有图层（路段+点位+区域），无需改动。

**文件**：`src/views/map/AreaManage.vue`

区域管理页面只显示区域+点位图层。当前已是如此，无需改动。

---

## 五、区域交互改动（AreaManage.vue 重构）

> 这是改动量最大的部分。核心变化：去掉"编辑模式"概念，改为工具栏直接选择操作。

### 5.1 页面结构重组

#### 当前布局

```
列表模式（无 mapId）   →  全屏表格
编辑模式（有 mapId）   →  左列表 + 中地图 + 右属性
```

#### 目标布局

```
始终为：左列表 + 中地图 + 右属性（三栏布局）
列表模式不再单独成页，通过左上角地图下拉切换
```

#### 具体改动

1. **删除 `isListMode` 分支**——去掉列表模式的全屏表格
2. **左上角加地图选择下拉**——替代从列表页跳转进来的方式
3. **属性面板常驻**——无选中时显示空状态提示，不隐藏

### 5.2 工具栏重构

#### 当前工具栏

```
非编辑：[编辑]
编辑中：[新增区域] [保存] [取消]  +  "绘制中… 右键完成"
```

#### 目标工具栏

```
[✏️ 绘制区域] | [↩ 撤销] [↪ 重做] | [💾 保存]
```

绘制区域时变为：

```
[✏️ 绘制区域(激活)] [↩ 撤销] [✅ 完成绘制] [❌ 取消] | [💾 保存]
```

#### 具体改动

**删除的变量/函数**：
- `editMode` ref
- `enterEditMode()` / `cancelEdit()` / `saveAll()` 中的编辑模式切换逻辑
- `regionsSnapshot` 快照变量

**新增的变量/函数**：
- `activeTool` ref：`'select' | 'drawRegion'`
- `undoStack` / `redoStack`：操作历史栈

**修改的函数**：
- `startPolygon()` → 改为直接进入绘制状态，不需要先点编辑
- `finishPolygon()` → 去掉右键完成逻辑，改为工具栏按钮 + 点击起点闭合
- `appendPoint()` → 每次落点后推入 undoStack
- 新增 `undo()` / `redo()` 函数

### 5.3 绘制过程增强

#### 当前问题

- 没有跟随线（鼠标到最后落点的虚线）
- 没有闭合预览（已有3+点时的半透明填充）
- 没有靠近起点高亮提示
- 没有逐点撤销

#### 具体改动

**SVG 新增元素**：

```vue
<!-- 跟随线：最后一个落点到鼠标位置 -->
<line v-if="drawing && draftPoints.length > 0"
  :x1="draftPoints[draftPoints.length-1].x"
  :y1="draftPoints[draftPoints.length-1].y"
  :x2="currentMousePos.x" :y2="currentMousePos.y"
  stroke="#faad14" stroke-width="2" stroke-dasharray="6 4" />

<!-- 闭合预览：3+点时半透明填充 -->
<polygon v-if="drawing && draftPoints.length >= 3"
  :points="draftPolygon" fill="rgba(250,173,20,0.1)"
  stroke="#faad14" stroke-width="1" stroke-dasharray="4 4" />

<!-- 起点高亮：鼠标靠近起点时 -->
<circle v-if="drawing && draftPoints.length >= 3 && nearStartPoint"
  :cx="draftPoints[0].x" :cy="draftPoints[0].y" r="10"
  fill="rgba(250,173,20,0.5)" stroke="#faad14" stroke-width="2" />
```

**新增函数**：
- `handleMouseMove()` → 实时更新 `currentMousePos` + 判断 `nearStartPoint`
- `undoLastPoint()` → 从 `draftPoints` 弹出最后一个点

**修改 `appendPoint()`**：
- 检测是否靠近起点（距离 < 15px），如果是则自动调用 `finishPolygon()` 闭合

### 5.4 选中实体后显示手柄

#### 当前问题

- 区域不可移动（只能通过整体拖拽，且与选中冲突）
- 区域不可变形（不能拖动顶点）

#### 具体改动

**选中区域后 SVG 新增**：

```vue
<!-- 中心移动手柄 -->
<g v-if="selectedRegionId === region.id" @mousedown.stop="startMove(region.id, $event)">
  <circle :cx="getPolygonCenter(region.points).x"
    :cy="getPolygonCenter(region.points).y" r="8"
    fill="#1677ff" stroke="#fff" stroke-width="2" cursor="move" />
  <text :cx="..." :cy="..." fill="#fff" font-size="10">✋</text>
</g>

<!-- 顶点手柄 -->
<template v-if="selectedRegionId === region.id">
  <circle v-for="(pt, idx) in parsePoints(region.points)" :key="'vh'+idx"
    :cx="pt.x" :cy="pt.y" r="5"
    fill="#fff" stroke="#1677ff" stroke-width="2" cursor="move"
    @mousedown.stop="startVertexDrag(region.id, idx, $event)" />
</template>
```

**新增变量/函数**：
- `dragMode` ref：`null | 'move' | 'vertex'`
- `dragTarget` ref：`{ regionId, vertexIndex? }`
- `startMove()` / `startVertexDrag()` / `handleDrag()` / `stopDrag()`

**删除**：
- `startPolygonDrag()` / `handlePolygonDrag()` / `stopPolygonDrag()`（旧的整区域拖拽逻辑）

### 5.5 属性面板三态

#### 当前状态

属性面板根据 `editMode` 全局变量控制只读/可编辑。

#### 目标状态

属性面板有自己的独立编辑状态：`propEditMode` ref。

#### 具体改动

**新增变量**：
- `propEditMode` ref：`false`（默认查看态）

**修改模板**：

```vue
<!-- 属性面板头部按钮 -->
<template v-if="!propEditMode">
  <a-button size="small" @click="propEditMode = true">编辑</a-button>
  <a-button size="small" danger @click="deleteRegion">删除</a-button>
</template>
<template v-else>
  <a-button size="small" type="primary" @click="saveProp">保存</a-button>
  <a-button size="small" @click="cancelProp">取消</a-button>
</template>

<!-- 表单禁用控制 -->
<a-form :disabled="!propEditMode">
```

**新增函数**：
- `saveProp()` → 持久化当前属性修改 → `propEditMode = false`
- `cancelProp()` → 恢复原值 → `propEditMode = false`

**选中实体切换时**：
- `selectEditableRegion()` 中自动将 `propEditMode` 置为 `false`

### 5.6 删除交互改动

#### 当前状态

列表模式有"删除"链接按钮，编辑模式无单独删除入口。

#### 目标状态

- 属性面板查看态有「删除」按钮
- Delete 键触发删除
- 均需确认弹窗

#### 具体改动

删除列表模式中的行内删除按钮（因为列表模式整体要去掉），改为属性面板中提供删除入口。

---

## 六、路网交互改动（RoadNetwork.vue 重构）

> 改动量与 AreaManage.vue 相当，且更复杂（三种实体）。

### 6.1 去掉全局"编辑模式"开关

#### 当前变量

```typescript
const editMode = ref(false)
const drawMode = ref<'segment' | 'polygon' | null>(null)
const deleteMode = ref(false)
const navPointPlacementMode = ref(false)
```

4 个布尔值组合 = 16 种状态，容易冲突。

#### 目标变量

```typescript
type ActiveTool = 'select' | 'drawSegment' | 'placeNavPoint' | 'drawPolygon'
const activeTool = ref<ActiveTool>('select')
const navPointSubType = ref<'inspection' | 'parking' | 'charging'>('inspection')
```

单一互斥状态，清晰无冲突。

#### 具体改动

**删除的变量**：
- `editMode`
- `deleteMode`
- `navPointPlacementMode`

**替换为**：
- `activeTool`

**修改工具栏模板**：

```vue
<a-button-group size="small">
  <a-button :type="activeTool === 'select' ? 'primary' : 'default'" @click="activeTool = 'select'">
    🔍 选择
  </a-button>
  <a-button :type="activeTool === 'drawSegment' ? 'primary' : 'default'" @click="activeTool = 'drawSegment'">
    ✏️ 绘制路段
  </a-button>
  <a-button :type="activeTool === 'placeNavPoint' ? 'primary' : 'default'" @click="activeTool = 'placeNavPoint'">
    📍 放置点位
  </a-button>
  <a-button :type="activeTool === 'drawPolygon' ? 'primary' : 'default'" @click="activeTool = 'drawPolygon'">
    🛡️ 绘制区域
  </a-button>
</a-button-group>

<!-- 点位类型下拉（仅在放置点位时显示） -->
<a-select v-if="activeTool === 'placeNavPoint'" v-model:value="navPointSubType" size="small" style="width:100px">
  <a-select-option value="inspection">巡检点</a-select-option>
  <a-select-option value="parking">停车点</a-select-option>
  <a-select-option value="charging">充电点</a-select-option>
</a-select>

<!-- 绘制中辅助按钮 -->
<a-button v-if="activeTool === 'drawSegment' && drawingNodes.length > 0" size="small" type="primary" @click="finishSegmentDrawing">
  ✅ 完成绘制
</a-button>
<a-button v-if="activeTool !== 'select'" size="small" @click="activeTool = 'select'">
  ❌ 取消
</a-button>
```

**修改所有使用 `editMode` 的条件判断**：

```
- v-if="editMode" → 根据 activeTool 判断
- if (!editMode.value) return → if (activeTool.value === 'select') return
- enterEditMode() → 删除
- cancelEditMode() → activeTool.value = 'select' + loadData()
- saveAndExitEditMode() → saveAll() + activeTool.value = 'select'
```

**修改地图点击事件**：

```typescript
function onMapClick(e: MouseEvent) {
  if (!selectedMapId.value) return

  const { x, y } = svgToMapCoord(e)

  switch (activeTool.value) {
    case 'select':
      // 不在地图空白处做任何事（实体点击由各自的 @click.stop 处理）
      break
    case 'drawSegment':
      addDrawNode(x, y)
      break
    case 'placeNavPoint':
      placeNavPointAt(x, y)
      break
    case 'drawPolygon':
      addPolygonPoint(x, y)
      break
  }
}
```

### 6.2 三类实体绘制流程简化

#### 路段绘制

**改动点**：
1. 去掉右键完成 → 保留双击完成 + 工具栏「完成绘制」按钮 + 点击起点闭合
2. 分步提示（见设计文档 6.2 的提示文字表）
3. 绘制完成后自动选中该路段

**修改 `finishSegmentDrawing()`**：

```typescript
function finishSegmentDrawing() {
  if (drawingNodes.value.length < 2) {
    message.warning('路段至少需要 2 个节点')
    activeTool.value = 'select'
    clearDrawing()
    return
  }
  const seg = segments.value[segments.value.length - 1]
  message.success(`路段 "${seg.name}" 绘制完成`)
  
  // 自动选中该路段
  selectEntity('segment', seg.id)
  
  activeTool.value = 'select'
  clearDrawing()
}
```

**修改 `drawHint`**：

```typescript
const drawHint = computed(() => {
  if (activeTool.value === 'drawSegment') {
    if (drawingNodes.value.length === 0) return '在地图上点击放置起点'
    if (nearStartPoint.value) return '点击起点闭合路段，或点「完成绘制」结束'
    return '继续点击添加路径点，点击已有节点可连接'
  }
  if (activeTool.value === 'drawPolygon') {
    if (polygonDrawingPoints.value.length === 0) return '在地图上点击放置第一个顶点'
    if (nearStartPoint.value) return '点击起点闭合区域'
    return '继续点击添加顶点'
  }
  if (activeTool.value === 'placeNavPoint') return '点击地图放置点位，按 Esc 退出'
  return ''
})
```

#### 点位放置

**改动点**：
1. 去掉弹窗 → 放置后右侧属性面板自动切换
2. 支持连续放置
3. 工具栏加点位类型下拉

**修改 `onMapClick` 中的点位放置分支**：

```typescript
case 'placeNavPoint':
  placeNavPointAt(x, y)
  break
```

**新增 `placeNavPointAt()`**：

```typescript
function placeNavPointAt(x: number, y: number) {
  const now = new Date()
  const id = `nav-${Date.now()}`
  const nodeId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  
  // 创建拓扑节点
  const newNode: RoadNode = {
    id: nodeId, nodeType: navPointSubType.value === 'inspection' ? 'inspection' : navPointSubType.value,
    position: { x, y }, edgeIds: [], mapId: selectedMapId.value,
    createdAt: now, updatedAt: now
  }
  nodes.value.push(newNode)
  
  // 创建导航点
  const p: NavigationPoint = {
    id, name: `${navPointTypeLabel(navPointSubType.value)} ${navPoints.value.length + 1}`,
    code: `P${String(navPoints.value.length + 1).padStart(3, '0')}`,
    mapId: selectedMapId.value, navType: navPointSubType.value,
    position: { x, y }, nodeId,
    createdAt: now, updatedAt: now
  }
  navPoints.value.push(p)
  hasUnsavedChanges.value = true
  
  // 自动选中 + 属性面板显示
  selectEntity('navpoint', id)
  
  // 不退出放置模式——支持连续放置
}
```

**删除**：
- `navPointModalVisible` ref
- `newNavPointForm` reactive
- `createNavPoint()` 弹窗确认函数
- `openCreateNavPointModal()` 函数

#### 区域绘制

同 AreaManage.vue 的改动方向：
1. 去掉弹窗 → 创建后右侧属性面板自动切换
2. 去掉右键/双击完成 → 点击起点闭合 + 工具栏按钮

**修改 `finishPolygonDrawing()`**：

```typescript
function finishPolygonDrawing() {
  if (polygonDrawingPoints.value.length < 3) {
    message.warning('区域至少需要 3 个顶点')
    clearDrawing()
    return
  }
  const now = new Date()
  const id = `nogo-${Date.now()}`
  const zone: NoGoZone = {
    id, name: `区域 ${noGoZones.value.length + 1}`,
    code: `NG${String(noGoZones.value.length + 1).padStart(3, '0')}`,
    mapId: selectedMapId.value, zoneType: 'normal',
    level: 'permanent', polygonPoints: [...polygonDrawingPoints.value],
    createdAt: now, updatedAt: now
  }
  noGoZones.value.push(zone)
  clearDrawing()
  hasUnsavedChanges.value = true
  
  // 自动选中 + 属性面板显示
  selectEntity('nogozone', id)
  activeTool.value = 'select'
}
```

**删除**：
- `noGoZoneModalVisible` ref
- `newNoGoZoneForm` reactive
- `confirmCreateNoGoZone()` 函数

### 6.3 删除交互改动

**删除"删除模式"**：

```typescript
// 删除
- const deleteMode = ref(false)
- function toggleDeleteMode() { ... }
- onEdgeClick 中的 deleteMode 判断
- onNodeClick 中的 deleteMode 判断
- 模板中的删除模式按钮和提示
```

**改为属性面板删除 + Delete 键**：

属性面板查看态加「删除」按钮（见 6.5 属性面板改动）。
Delete 键处理见第三章。

### 6.4 属性面板三态

#### 当前状态

属性面板通过 `form-readonly` CSS 类 + `editMode` 全局变量控制只读。

#### 目标状态

属性面板有独立的 `propEditMode` ref。

#### 具体改动

**新增变量**：

```typescript
const propEditMode = ref(false)
const propSnapshot = ref<any>(null) // 编辑前快照
```

**修改属性面板模板**：

```vue
<!-- 属性面板头部 -->
<div class="prop-header">
  <span class="prop-title">{{ propertyTitle }}</span>
  <a-space v-if="!propEditMode">
    <a-button size="small" @click="enterPropEdit">编辑</a-button>
    <a-button size="small" danger @click="deleteSelectedEntity">删除</a-button>
  </a-space>
  <a-space v-else>
    <a-button size="small" type="primary" @click="savePropEdit">保存</a-button>
    <a-button size="small" @click="cancelPropEdit">取消</a-button>
  </a-space>
</div>

<!-- 表单禁用 -->
<a-form :disabled="!propEditMode">
```

**新增函数**：

```typescript
function enterPropEdit() {
  // 保存快照用于取消
  if (selectedEntity.value?.type === 'segment' && editingSegment.value) {
    propSnapshot.value = JSON.parse(JSON.stringify(editingSegment.value))
  }
  // ... 其他实体类型同理
  propEditMode.value = true
}

function savePropEdit() {
  saveSelectedEntity()
  propEditMode.value = false
}

function cancelPropEdit() {
  // 从快照恢复
  if (selectedEntity.value?.type === 'segment' && propSnapshot.value) {
    editingSegment.value = propSnapshot.value
  }
  // ... 其他实体类型同理
  propEditMode.value = false
}
```

**选中实体切换时**：

```typescript
function selectEntity(type: string, id: string) {
  propEditMode.value = false  // 切换实体时回到查看态
  // ...existing logic
}
```

**删除 CSS**：

```scss
// 删除
- .form-readonly { pointer-events: none; opacity: 0.65; ... }
```

改由 `:disabled="!propEditMode"` 原生控制。

### 6.5 图层控制扁平化

#### 当前状态

三层嵌套复选框树：点位 → 路口(T字形/十字形/其他) → 巡检点/停车点/充电点

#### 目标状态

一行图标按钮：`[路段] [路口] [巡检点] [停车点] [充电点] [区域] | [途经点]`

#### 具体改动

**替换模板**：

```vue
<!-- 旧的：三层嵌套复选框 -->
<!-- 新的：扁平图标按钮 -->
<div class="rn-layer-toggles">
  <a-button-group size="small">
    <a-button :type="showSegments ? 'primary' : 'default'" @click="showSegments = !showSegments">路段</a-button>
    <a-button :type="showJunctionNodes ? 'primary' : 'default'" @click="showJunctionNodes = !showJunctionNodes">路口</a-button>
    <a-button :type="showNavInspection ? 'primary' : 'default'" @click="showNavInspection = !showNavInspection">巡检点</a-button>
    <a-button :type="showNavParking ? 'primary' : 'default'" @click="showNavParking = !showNavParking">停车点</a-button>
    <a-button :type="showNavCharging ? 'primary' : 'default'" @click="showNavCharging = !showNavCharging">充电点</a-button>
    <a-button :type="showNoGoZones ? 'primary' : 'default'" @click="showNoGoZones = !showNoGoZones">区域</a-button>
  </a-button-group>
  <a-button size="small" :type="showWaypointNodes ? 'primary' : 'default'" @click="showWaypointNodes = !showWaypointNodes">途经点</a-button>
</div>
```

**删除的变量**：
- `nodeTreeExpanded`
- `junctionTreeExpanded`
- `showJunctionNormal` / `showJunctionT` / `showJunctionCross`
- `showAllNodes`（及其联动函数）

**简化的变量**：
- `showWaypointNodes` 默认改为 `false`（途经点默认隐藏）

### 6.6 左侧列表与地图联动

#### 当前状态

点击列表项 → 选中实体 → 右侧显示属性。地图不移动。

#### 具体改动

**修改 `selectEntity()`**：

```typescript
function selectEntity(type: string, id: string) {
  // ...existing 逻辑
  
  // 新增：地图自动居中
  let pos: { x: number; y: number } | null = null
  if (type === 'node' || type === 'navpoint') {
    const node = type === 'navpoint'
      ? navPoints.value.find(p => p.id === id)
      : nodes.value.find(n => n.id === id)
    if (node) pos = node.position
  } else if (type === 'junction') {
    const j = junctions.value.find(j => j.id === id)
    if (j) pos = getNodePos(j.nodeId)
  } else if (type === 'segment') {
    const seg = segments.value.find(s => s.id === id)
    if (seg) {
      // 居中到路段中点
      const startNode = nodes.value.find(n => n.id === seg.nodeIds[0])
      const endNode = nodes.value.find(n => n.id === seg.nodeIds[seg.nodeIds.length - 1])
      if (startNode && endNode) pos = {
        x: (startNode.position.x + endNode.position.x) / 2,
        y: (startNode.position.y + endNode.position.y) / 2
      }
    }
  } else if (type === 'nogozone') {
    const zone = noGoZones.value.find(z => z.id === id)
    if (zone && zone.polygonPoints.length) pos = zonePolygonCenter(zone)
  }
  
  if (pos) {
    panX.value = pos.x - mapWidth / scale.value / 2
    panY.value = pos.y - mapHeight / scale.value / 2
    scale.value = Math.max(scale.value, 1.5) // 适当放大
    updateViewBox()
  }
}
```

**列表项悬停高亮**：

新增 `hoveredEntity` ref，列表项 `@mouseenter` 设置，`@mouseleave` 清除。地图渲染时对 hoveredEntity 加高亮效果。

**列表项信息增强**：

修改左侧列表模板，增加第二行上下文信息（长度/状态/所属区域等）。

### 6.7 撤销与重做

#### 新增变量

```typescript
interface HistoryEntry {
  type: 'addNode' | 'addEdge' | 'addSegment' | 'addNavPoint' | 'addNoGoZone' | 'moveNode' | 'moveZone' | 'deleteEntity'
  data: any // 足够恢复的数据
}

const undoStack = ref<HistoryEntry[]>([])
const redoStack = ref<HistoryEntry[]>([])
```

#### 新增函数

```typescript
function pushUndo(entry: HistoryEntry) {
  undoStack.value.push(entry)
  redoStack.value = [] // 新操作清空 redo
  if (undoStack.value.length > 50) undoStack.value.shift()
}

function undo() {
  const entry = undoStack.value.pop()
  if (!entry) return
  redoStack.value.push(entry)
  // 根据 entry.type 恢复
  switch (entry.type) {
    case 'addNode': nodes.value.pop(); break
    case 'addNavPoint': navPoints.value.pop(); break
    // ... 其他类型
  }
  hasUnsavedChanges.value = true
}

function redo() {
  const entry = redoStack.value.pop()
  if (!entry) return
  undoStack.value.push(entry)
  // 根据 entry.type 重做
  // ...
}
```

#### 键盘绑定

```typescript
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo() }
  if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) { e.preventDefault(); redo() }
  if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) { e.preventDefault(); redo() }
  // ...existing Delete/Esc logic
}
```

### 6.8 滚轮缩放

#### 当前状态

只有 + / - / 重置 三个按钮，没有滚轮缩放。

#### 具体改动

```typescript
function onWheel(e: WheelEvent) {
  e.preventDefault()
  if (e.deltaY < 0) zoomIn()
  else zoomOut()
}

onMounted(() => {
  // ...existing
  mapContainerRef.value?.addEventListener('wheel', onWheel, { passive: false })
})
onBeforeUnmount(() => {
  mapContainerRef.value?.removeEventListener('wheel', onWheel)
})
```

### 6.9 路口自动检测增强

#### 当前状态

静默创建路口，只弹 `message.info`。

#### 目标状态

地图上弹出小浮窗，用户可选路口类型或取消。

#### 具体改动

**新增变量**：

```typescript
const junctionDetectPopup = ref<{ nodeId: string; x: number; y: number } | null>(null)
```

**修改 `autoDetectJunction()`**：

```typescript
function autoDetectJunction(nodeId: string) {
  const node = nodes.value.find(n => n.id === nodeId)
  if (!node || node.edgeIds.length < 3 || node.nodeType !== 'waypoint') return
  
  const existing = junctions.value.find(j => j.nodeId === nodeId)
  if (existing) { /* 更新关联路段 */ return }
  
  // 弹出确认浮窗而非静默创建
  junctionDetectPopup.value = { nodeId, x: node.position.x, y: node.position.y }
}
```

**新增模板**：

```vue
<!-- 路口检测浮窗 -->
<div v-if="junctionDetectPopup" class="junction-detect-popup"
  :style="{ left: mapXToScreen(junctionDetectPopup.x) + 'px', top: mapYToScreen(junctionDetectPopup.y) + 'px' }">
  <div class="popup-title">🔍 检测到路口</div>
  <a-select v-model:value="newJunctionType" size="small" style="width:100%">
    <a-select-option value="normal">其他</a-select-option>
    <a-select-option value="t_junction">T字形</a-select-option>
    <a-select-option value="cross">十字形</a-select-option>
  </a-select>
  <div class="popup-actions">
    <a-button size="small" type="primary" @click="confirmJunctionDetect">确认</a-button>
    <a-button size="small" @click="cancelJunctionDetect">这不是路口</a-button>
  </div>
</div>
```

---

## 七、点位管理页面改动（PointManage.vue）

### 7.1 交互方式与区域管理一致

PointManage.vue 当前也是列表模式+编辑模式分离，需要与 AreaManage.vue 做同样改造：

1. 去掉列表模式/编辑模式切换 → 始终三栏布局
2. 工具栏改为 `[- 放置点位] [✋ 移动] [↩ 撤销] [💾 保存]`
3. 属性面板三态（查看/编辑/保存）
4. 选中点位后显示 ✋ 移动手柄
5. Delete 键删除

### 7.2 列表操作对齐

列表中操作列统一为：`[查看位置] [编辑] [删除]`

- "编辑" → 直接进入点位编辑页面（不走中间态）
- "删除" → 确认弹窗后删除

---

## 实施顺序建议

按依赖关系和风险排序：

| 阶段 | 内容 | 预计工时 |
|---|---|---|
| **Phase 1** | 三、Delete 键支持（三个页面加 keydown 监听） | 0.5天 |
| **Phase 2** | 五、AreaManage.vue 重构（工具栏+绘制+手柄+属性三态） | 3天 |
| **Phase 3** | 六、RoadNetwork.vue 重构（工具栏+绘制+属性三态+图层扁平化+列表联动） | 4天 |
| **Phase 4** | 七、PointManage.vue 对齐区域管理交互 | 2天 |
| **Phase 5** | 一+二+四、菜单和布局调整 | 1天 |
| **Phase 6** | 6.7 撤销/重做（两个地图页面） | 1.5天 |
| **Phase 6** | 6.9 路口检测弹窗 | 0.5天 |
| **合计** | | ~12.5天 |

每个 Phase 完成后跑 `vue-tsc --noEmit` + `vitest run` 确保无回归。
