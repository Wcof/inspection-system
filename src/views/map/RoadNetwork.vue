<template>
  <div class="road-network">
    <!-- 顶部工具栏 -->
    <div class="rn-toolbar">
      <div class="rn-toolbar-left">
        <h2 class="rn-title">路网管理</h2>
        <a-select v-model:value="selectedMapId" placeholder="选择地图" style="width: 180px" size="small" @change="onMapChange">
          <a-select-option v-for="m in inspectionStore.inspectionMaps" :key="m.id" :value="m.id">{{ m.name }}</a-select-option>
        </a-select>
      </div>
      <div class="rn-toolbar-right">
        <a-button v-if="hasUnsavedChanges" size="small" @click="discardAllChanges">放弃修改</a-button>
        <a-button v-if="hasUnsavedChanges" size="small" type="primary" @click="saveAll"><SaveOutlined /> 保存</a-button>
        <a-button size="small" @click="runTopologyCheck" :loading="checkingTopology"><BugOutlined /> 检查</a-button>
        <a-button size="small" @click="pathSimVisible = true"><BranchesOutlined /> 模拟</a-button>
      </div>
    </div>

    <!-- 主体三栏布局 -->
    <div class="rn-body">
      <!-- 左侧资源树 -->
      <div class="rn-sidebar" :class="{ collapsed: sidebarCollapsed }">
        <div class="panel-collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
          <MenuFoldOutlined v-if="!sidebarCollapsed" />
          <MenuUnfoldOutlined v-else />
        </div>
        <template v-if="!sidebarCollapsed">
          <div class="rn-sidebar-search">
            <a-input-search v-model:value="searchText" placeholder="搜索路段/点位/区域" size="small" allow-clear />
          </div>
          <a-tabs v-model:activeKey="sidebarTab" size="small" class="rn-sidebar-tabs">
            <a-tab-pane key="segment" tab="路段">
              <div class="sidebar-list">
                <div v-for="seg in filteredSegments" :key="seg.id"
                  class="sidebar-item" :class="{ active: selectedEntity?.type === 'segment' && selectedEntity?.id === seg.id }"
                  @click="selectEntity('segment', seg.id)">
                  <div class="sidebar-item-name">{{ seg.name }}</div>
                  <div class="sidebar-item-meta">
                    <a-tag :color="segmentStatusColor(seg.status)" size="small">{{ segmentStatusLabel(seg.status) }}</a-tag>
                    <span class="meta-text">{{ Math.round(seg.length) }}m</span>
                  </div>
                </div>
                <a-empty v-if="filteredSegments.length === 0" :image-style="{ height: '32px' }" description="暂无路段" />
              </div>
            </a-tab-pane>
            <a-tab-pane key="navpoint" tab="点位">
              <div class="sidebar-list">
                <div v-for="p in filteredNavPoints" :key="p.id"
                  class="sidebar-item" :class="{ active: selectedEntity?.type === 'navpoint' && selectedEntity?.id === p.id }"
                  @click="selectEntity('navpoint', p.id)">
                  <div class="sidebar-item-name">{{ p.name }}</div>
                  <div class="sidebar-item-meta">
                    <span class="meta-text">{{ p.code }}</span>
                    <a-tag size="small" :color="navPointTypeColor(p.navType)">{{ navPointTypeLabel(p.navType) }}</a-tag>
                  </div>
                </div>
                <a-empty v-if="filteredNavPoints.length === 0" :image-style="{ height: '32px' }" description="暂无点位" />
              </div>
            </a-tab-pane>
            <a-tab-pane key="nogozone" tab="区域">
              <div class="sidebar-list">
                <div v-for="z in filteredNoGoZones" :key="z.id"
                  class="sidebar-item" :class="{ active: selectedEntity?.type === 'nogozone' && selectedEntity?.id === z.id }"
                  @click="selectEntity('nogozone', z.id)">
                  <div class="sidebar-item-name">{{ z.name }}</div>
                  <div class="sidebar-item-meta">
                    <a-tag :color="z.zoneType === 'forbidden' ? noGoLevelColor(z.level) : 'green'" size="small">
                      {{ z.zoneType === 'forbidden' ? noGoLevelLabel(z.level) : '正常通行' }}
                    </a-tag>
                  </div>
                </div>
                <a-empty v-if="filteredNoGoZones.length === 0" :image-style="{ height: '32px' }" description="暂无区域" />
              </div>
            </a-tab-pane>
          </a-tabs>
        </template>
      </div>

      <!-- 中间GIS地图编辑区 -->
      <div class="rn-map-area">
        <div class="rn-map-toolbar">
          <a-space>
            <a-button-group size="small">
              <a-button @click="zoomIn"><ZoomInOutlined /></a-button>
              <a-button @click="zoomOut"><ZoomOutOutlined /></a-button>
              <a-button @click="resetView">重置</a-button>
            </a-button-group>
            <a-divider type="vertical" />
            <a-button size="small" :type="drawMode === 'segment' ? 'primary' : 'default'" @click="toggleDrawMode('segment')">
              <EditOutlined /> {{ drawMode === 'segment' ? '绘制中...' : '绘制路段' }}
            </a-button>
            <a-button size="small" type="default" @click="openCreateNavPointModal">
              <AimOutlined /> 新建点位
            </a-button>
            <a-button size="small" :type="drawMode === 'polygon' ? 'primary' : 'default'" @click="toggleDrawMode('polygon')">
              <StopOutlined /> {{ drawMode === 'polygon' ? '绘制中...' : '绘制区域' }}
            </a-button>
            <a-button v-if="drawMode === 'segment'" size="small" type="primary" @click="finishSegmentDrawing">完成绘制</a-button>
            <a-button v-if="drawMode" size="small" danger @click="clearDrawing">取消绘制</a-button>
            <a-divider type="vertical" />
            <a-button size="small" :type="deleteMode ? 'primary' : 'default'" :danger="deleteMode" @click="toggleDeleteMode">
              <DeleteOutlined /> {{ deleteMode ? '删除中...' : '删除' }}
            </a-button>
          </a-space>
          <div class="rn-layer-toggles">
            <a-checkbox v-model:checked="showSegments">路段</a-checkbox>
            <a-checkbox v-model:checked="showNoGoZones">区域</a-checkbox>
            <a-checkbox v-model:checked="showAllNodes">点位</a-checkbox>
            <a-checkbox v-model:checked="showWaypointNodes">途经点</a-checkbox>
            <a-checkbox v-model:checked="showJunctionNodes">路口</a-checkbox>
            <a-checkbox v-model:checked="showNavInspection">巡检点</a-checkbox>
            <a-checkbox v-model:checked="showNavParking">停车点</a-checkbox>
            <a-checkbox v-model:checked="showNavCharging">充电点</a-checkbox>
          </div>
        </div>

        <div class="rn-map-container" :class="{ 'delete-mode': deleteMode }" ref="mapContainerRef" @contextmenu.prevent="onRightClick" @dblclick.prevent="onDoubleClick">
          <svg class="rn-map-svg" :viewBox="viewBox" @click="onMapClick" @mousedown="onMapMouseDown" @mousemove="onMapMouseMove" @mouseup="onMapMouseUp">
            <!-- 背景 -->
            <image v-if="currentMapImageUrl" :href="currentMapImageUrl" x="0" y="0" :width="mapWidth" :height="mapHeight" preserveAspectRatio="xMidYMid slice" />
            <rect v-else x="0" y="0" :width="mapWidth" :height="mapHeight" fill="#f0f2f5" />
            <g opacity="0.15">
              <line v-for="i in 20" :key="'gx'+i" :x1="i * 50" y1="0" :x2="i * 50" :y2="mapHeight" stroke="#999" stroke-width="0.5" />
              <line v-for="i in 16" :key="'gy'+i" x1="0" :y1="i * 50" :x2="mapWidth" :y2="i * 50" stroke="#999" stroke-width="0.5" />
            </g>

            <!-- 绘制区域 -->
            <g v-if="showNoGoZones">
              <g v-for="zone in mapNoGoZones" :key="zone.id"
                :class="{ 'entity-dimmed': selectedEntity && !(selectedEntity.type === 'nogozone' && selectedEntity.id === zone.id) }">
                <polygon
                  :points="zone.polygonPoints.map(p => `${p.x},${p.y}`).join(' ')"
                  :fill="noGoZoneFill(zone)" fill-opacity="0.25" :stroke="noGoZoneStroke(zone)" stroke-width="1.5"
                  :class="{ 'entity-highlight': selectedEntity?.type === 'nogozone' && selectedEntity?.id === zone.id }"
                  @click.stop="selectEntity('nogozone', zone.id)" class="clickable" />
                <text :x="zonePolygonCenter(zone).x" :y="zonePolygonCenter(zone).y"
                  text-anchor="middle" class="zone-label">{{ zone.name }}</text>
              </g>
            </g>

            <!-- 绘制中的区域 polygon -->
            <g v-if="drawMode === 'polygon' && polygonDrawingPoints.length > 0">
              <polyline
                :points="[...polygonDrawingPoints, mousePos].map(p => `${p.x},${p.y}`).join(' ')"
                fill="rgba(255,77,79,0.1)" stroke="#ff4d4f" stroke-width="1.5" stroke-dasharray="6 4" />
              <circle v-for="(pt, idx) in polygonDrawingPoints" :key="'pdp'+idx"
                :cx="pt.x" :cy="pt.y" r="4" fill="#ff4d4f" stroke="#fff" stroke-width="1" />
            </g>

            <!-- 路段边 -->
            <g v-if="showSegments">
              <g v-for="edge in mapEdges" :key="edge.id"
                :class="{ 'entity-dimmed': selectedEntity && !(selectedEntity.type === 'segment' && selectedEntity.id === edge.segmentId) }">
                <path
                  :d="getEdgePath(edge)"
                  fill="none"
                  :stroke="getEdgeColor(edge)" stroke-width="3"
                  :stroke-dasharray="!edge.bidirectional ? '8 4' : 'none'"
                  :class="{ 'edge-highlight': isPathEdge(edge.id), 'delete-target': deleteMode }"
                  @click.stop="onEdgeClick(edge)" style="cursor: pointer;" />
                <text v-if="getEdgeSegment(edge)"
                  :x="(getNodePos(edge.fromNodeId).x + getNodePos(edge.toNodeId).x) / 2"
                  :y="(getNodePos(edge.fromNodeId).y + getNodePos(edge.toNodeId).y) / 2 - 8"
                  text-anchor="middle" class="edge-label">{{ getEdgeSegment(edge)?.name }}</text>
                <polygon v-if="!edge.bidirectional"
                  :points="getArrowPoints(edge)"
                  :fill="getEdgeColor(edge)" opacity="0.8" />
              </g>
            </g>

            <!-- 绘制中的临时线 -->
            <line v-if="drawMode === 'segment' && drawingNodes.length > 0"
              :x1="getLastDrawNodePos().x" :y1="getLastDrawNodePos().y"
              :x2="mousePos.x" :y2="mousePos.y"
              stroke="#1677ff" stroke-width="2" stroke-dasharray="6 4" />

            <!-- 路口标记 -->
            <g v-for="j in mapJunctions" :key="'jg'+j.id"
              :class="{ 'entity-dimmed': selectedEntity && !(selectedEntity.type === 'junction' && selectedEntity.id === j.id) }"
              @click.stop="selectEntity('junction', j.id)" class="clickable">
              <rect :x="getJunctionPos(j).x - 12" :y="getJunctionPos(j).y - 12" width="24" height="24" rx="4"
                :fill="selectedEntity?.type === 'junction' && selectedEntity?.id === j.id ? '#1677ff' : '#faad14'"
                stroke="#fff" stroke-width="2" />
              <text :x="getJunctionPos(j).x" :y="getJunctionPos(j).y + 4" text-anchor="middle" class="junction-icon">J</text>
            </g>

            <!-- 节点 -->
            <g>
              <g v-for="node in mapNodes" :key="node.id"
                :class="{ 'entity-dimmed': selectedEntity && !(selectedEntity.type === 'node' && selectedEntity.id === node.id) }"
                @click.stop="onNodeClick(node)" class="clickable">
                <circle :cx="node.position.x" :cy="node.position.y" :r="getNodeRadius(node)"
                  :fill="getNodeColor(node)" :stroke="getNodeStroke(node)" stroke-width="2"
                  :class="{ 'node-selected': selectedEntity?.type === 'node' && selectedEntity?.id === node.id }" />
                <text v-if="node.nodeType !== 'waypoint'" :x="node.position.x" :y="node.position.y + 3.5" text-anchor="middle" class="nav-icon">{{ nodeTypeIcon(node.nodeType) }}</text>
                <text v-if="node.name && !navNodeIds.has(node.id)" :x="node.position.x" :y="node.position.y - 10" text-anchor="middle" class="node-label">{{ node.name }}</text>
              </g>
            </g>

            <!-- 点位 -->
            <g>
              <g v-for="p in mapNavPoints" :key="'np'+p.id"
                :class="{ 'entity-dimmed': selectedEntity && !(selectedEntity.type === 'navpoint' && selectedEntity.id === p.id) }"
                @click.stop="selectEntity('navpoint', p.id)" class="clickable">
                <circle :cx="p.position.x" :cy="p.position.y" r="8"
                  :fill="selectedEntity?.type === 'navpoint' && selectedEntity?.id === p.id ? '#1677ff' : navPointColor(p.navType)"
                  stroke="#fff" stroke-width="2" />
                <text :x="p.position.x" :y="p.position.y + 3.5" text-anchor="middle" class="nav-icon">{{ navPointIcon(p.navType) }}</text>
                <text :x="p.position.x" :y="p.position.y - 14" text-anchor="middle" class="node-label">{{ p.name }}</text>
              </g>
            </g>

            <!-- 路径模拟结果 -->
            <g v-if="simulationPath">
              <line v-for="(seg, idx) in simulationPath" :key="'sp'+idx"
                :x1="seg.x1" :y1="seg.y1" :x2="seg.x2" :y2="seg.y2"
                stroke="#ff4d4f" stroke-width="4" stroke-linecap="round" opacity="0.8" />
            </g>
          </svg>

          <!-- 绘制提示 -->
          <div v-if="drawMode" class="draw-overlay-hint">
            {{ drawHint }}
          </div>
          <!-- 点位放置模式提示 -->
          <div v-if="navPointPlacementMode" class="draw-overlay-hint placement-hint">
            <AimOutlined /> 点击地图放置点位，按 Esc 取消
          </div>
          <!-- 删除模式提示 -->
          <div v-if="deleteMode" class="draw-overlay-hint delete-hint">
            <DeleteOutlined /> 点击节点或路段进行删除，再次点击「删除中...」退出
          </div>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="rn-property-panel" :class="{ collapsed: propertyCollapsed }">
        <div class="panel-collapse-btn right" @click="propertyCollapsed = !propertyCollapsed">
          <MenuUnfoldOutlined v-if="!propertyCollapsed" />
          <MenuFoldOutlined v-else />
        </div>
        <template v-if="!propertyCollapsed && selectedEntity">
          <div class="prop-header">
            <span class="prop-title">{{ propertyTitle }}</span>
            <a-space size="small">
              <a-button v-if="!propertyEditing" size="small" type="link" @click="enterPropertyEdit">编辑</a-button>
              <template v-else>
                <a-button size="small" type="primary" @click="savePropertyEdit">保存</a-button>
                <a-button size="small" @click="cancelPropertyEdit">取消</a-button>
              </template>
              <a-button size="small" danger @click="deleteSelectedEntity">删除</a-button>
            </a-space>
          </div>

          <!-- 路段属性 -->
          <template v-if="selectedEntity.type === 'segment' && editingSegment">
            <a-form layout="vertical" size="small" class="prop-form" :class="{ 'form-readonly': !propertyEditing }">
              <a-divider orientation="left">基础信息</a-divider>
              <a-form-item label="路段名称" required><a-input v-model:value="editingSegment.name" /></a-form-item>
              <a-form-item label="路段编码" required><a-input v-model:value="editingSegment.code" /></a-form-item>
              <a-form-item label="所属区域"><a-input v-model:value="editingSegment.area" /></a-form-item>
              <a-form-item label="路段类型">
                <a-select v-model:value="editingSegment.segmentType">
                  <a-select-option value="trunk">主干路</a-select-option>
                  <a-select-option value="branch">次干路</a-select-option>
                  <a-select-option value="patrol">巡检通道</a-select-option>
                  <a-select-option value="service">服务通道</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="状态">
                <a-select v-model:value="editingSegment.status">
                  <a-select-option value="active">启用</a-select-option>
                  <a-select-option value="inactive">停用</a-select-option>
                  <a-select-option value="construction">施工中</a-select-option>
                  <a-select-option value="blocked">禁行</a-select-option>
                  <a-select-option value="maintenance">维护中</a-select-option>
                </a-select>
              </a-form-item>
              <a-divider orientation="left">通行属性</a-divider>
              <a-form-item label="通行方向">
                <a-radio-group v-model:value="editingSegment.bidirectional">
                  <a-radio :value="true">双向通行</a-radio>
                  <a-radio :value="false">单向通行</a-radio>
                </a-radio-group>
              </a-form-item>
              <a-row :gutter="8">
                <a-col :span="12"><a-form-item label="限速(km/h)"><a-input-number v-model:value="editingSegment.speedLimit" :min="0" style="width:100%" /></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="路宽(m)"><a-input-number v-model:value="editingSegment.width" :min="0" style="width:100%" /></a-form-item></a-col>
              </a-row>
              <a-row :gutter="8">
                <a-col :span="12"><a-form-item label="限高(m)"><a-input-number v-model:value="editingSegment.heightLimit" :min="0" style="width:100%" /></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="最大载重(t)"><a-input-number v-model:value="editingSegment.maxLoad" :min="0" style="width:100%" /></a-form-item></a-col>
              </a-row>
              <a-form-item label="允许操作">
                <a-space direction="vertical">
                  <a-checkbox v-model:checked="editingSegment.allowReverse">允许倒车</a-checkbox>
                  <a-checkbox v-model:checked="editingSegment.allowUTurn">允许掉头</a-checkbox>
                  <a-checkbox v-model:checked="editingSegment.allowSpin">允许原地旋转</a-checkbox>
                </a-space>
              </a-form-item>
              <a-divider orientation="left">几何信息</a-divider>
              <a-form-item label="长度"> {{ Math.round(editingSegment.length) }} m（自动计算）</a-form-item>
              <a-form-item label="节点数"> {{ editingSegment.nodeIds.length }} 个</a-form-item>
              <a-form-item label="颜色"><a-input v-model:value="editingSegment.color" placeholder="#1677ff" /></a-form-item>
            </a-form>
          </template>

          <!-- 路口属性 -->
          <template v-if="selectedEntity.type === 'junction' && editingJunction">
            <a-form layout="vertical" size="small" class="prop-form" :class="{ 'form-readonly': !propertyEditing }">
              <a-divider orientation="left">基础信息</a-divider>
              <a-form-item label="路口名称" required><a-input v-model:value="editingJunction.name" /></a-form-item>
              <a-form-item label="路口编码" required><a-input v-model:value="editingJunction.code" /></a-form-item>
              <a-form-item label="路口类型">
                <a-select v-model:value="editingJunction.junctionType">
                  <a-select-option value="normal">其他</a-select-option>
                  <a-select-option value="t_junction">T字形</a-select-option>
                  <a-select-option value="cross">十字形</a-select-option>
                </a-select>
              </a-form-item>
              <a-divider orientation="left">通行规则</a-divider>
              <a-space direction="vertical">
                <a-checkbox v-model:checked="editingJunction.allowStraight">允许直行</a-checkbox>
                <a-checkbox v-model:checked="editingJunction.allowLeftTurn">允许左转</a-checkbox>
                <a-checkbox v-model:checked="editingJunction.allowRightTurn">允许右转</a-checkbox>
                <a-checkbox v-model:checked="editingJunction.allowUTurn">允许掉头</a-checkbox>
              </a-space>
              <a-divider orientation="left">优先级与冲突</a-divider>
              <a-form-item label="优先级">
                <a-select v-model:value="editingJunction.priority">
                  <a-select-option value="main_road">主路优先</a-select-option>
                  <a-select-option value="side_road">支路让行</a-select-option>
                  <a-select-option value="robot_priority">机器人优先</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="冲突控制">
                <a-select v-model:value="editingJunction.conflictMode">
                  <a-select-option value="mutex">互斥通行</a-select-option>
                  <a-select-option value="reservation">预约通行</a-select-option>
                  <a-select-option value="time_window">时间窗通行</a-select-option>
                </a-select>
              </a-form-item>

              <a-form-item label="关联路段" style="margin-top:8px">{{ editingJunction.connectedSegmentIds.length }} 条</a-form-item>
            </a-form>
          </template>

          <!-- 点位属性 -->
          <template v-if="selectedEntity.type === 'navpoint' && editingNavPoint">
            <a-form layout="vertical" size="small" class="prop-form" :class="{ 'form-readonly': !propertyEditing }">
              <a-divider orientation="left">基础信息</a-divider>
              <a-form-item label="点位名称" required><a-input v-model:value="editingNavPoint.name" /></a-form-item>
              <a-form-item label="点位编码" required><a-input v-model:value="editingNavPoint.code" /></a-form-item>
              <a-form-item label="所属区域"><a-input v-model:value="editingNavPoint.area" /></a-form-item>
              <a-form-item label="点位类型">
                <a-select v-model:value="editingNavPoint.navType">
                  <a-select-option value="inspection">巡检点</a-select-option>
                  <a-select-option value="parking">停车点</a-select-option>
                  <a-select-option value="charging">充电点</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="描述"><a-textarea v-model:value="editingNavPoint.description" :rows="2" placeholder="点位描述信息" /></a-form-item>
              <a-row :gutter="8">
                <a-col :span="12"><a-form-item label="工作区域"><a-input v-model:value="editingNavPoint.workAreaName" placeholder="如：A区" /></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="朝向角(°)"><a-input-number v-model:value="editingNavPoint.yaw" :min="0" :max="360" style="width:100%" /></a-form-item></a-col>
              </a-row>

              <!-- 充电点专属属性 -->
              <template v-if="editingNavPoint.navType === 'charging'">
                <a-divider orientation="left">充电属性</a-divider>
                <a-form-item label="充电方式">
                  <a-select v-model:value="editingNavPoint.chargingMethod">
                    <a-select-option value="auto">自动对接</a-select-option>
                    <a-select-option value="manual">手动连接</a-select-option>
                    <a-select-option value="wireless">无线充电</a-select-option>
                  </a-select>
                </a-form-item>
                <a-row :gutter="8">
                  <a-col :span="12"><a-form-item label="充电功率(kW)"><a-input-number v-model:value="editingNavPoint.chargingPower" :min="0" style="width:100%" /></a-form-item></a-col>
                  <a-col :span="12"><a-form-item label="预计时长(min)"><a-input-number v-model:value="editingNavPoint.estimatedChargingTime" :min="0" style="width:100%" /></a-form-item></a-col>
                </a-row>
              </template>

              <!-- 停车点专属属性 -->
              <template v-if="editingNavPoint.navType === 'parking'">
                <a-divider orientation="left">停车属性</a-divider>
                <a-row :gutter="8">
                  <a-col :span="12"><a-form-item label="停车优先级"><a-input-number v-model:value="editingNavPoint.parkingPriority" :min="1" :max="10" style="width:100%" /></a-form-item></a-col>
                  <a-col :span="12"><a-form-item label="允许等待(秒)"><a-input-number v-model:value="editingNavPoint.maxWaitingTime" :min="0" style="width:100%" /></a-form-item></a-col>
                </a-row>
                <a-divider orientation="left">停车约束</a-divider>
                <a-space direction="vertical">
                  <a-checkbox v-model:checked="editingNavPoint.reverseRequired">需要倒车</a-checkbox>
                  <a-checkbox v-model:checked="editingNavPoint.turnAroundRequired">需要掉头</a-checkbox>
                  <a-checkbox v-model:checked="editingNavPoint.narrowRoad">窄路</a-checkbox>
                  <a-checkbox v-model:checked="editingNavPoint.slope">有坡道</a-checkbox>
                </a-space>
              </template>

              <a-form-item label="备注"><a-textarea v-model:value="editingNavPoint.remark" :rows="2" /></a-form-item>
            </a-form>
          </template>

          <!-- 区域属性 -->
          <template v-if="selectedEntity.type === 'nogozone' && editingNoGoZone">
            <a-form layout="vertical" size="small" class="prop-form" :class="{ 'form-readonly': !propertyEditing }">
              <a-divider orientation="left">基础信息</a-divider>
              <a-form-item label="区域名称" required><a-input v-model:value="editingNoGoZone.name" /></a-form-item>
              <a-form-item label="区域编码" required><a-input v-model:value="editingNoGoZone.code" /></a-form-item>
              <a-form-item label="区域类型">
                <a-select v-model:value="editingNoGoZone.zoneType">
                  <a-select-option value="normal">正常通行</a-select-option>
                  <a-select-option value="forbidden">禁止通行</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="描述"><a-textarea v-model:value="editingNoGoZone.description" :rows="2" placeholder="区域描述信息" /></a-form-item>
              <template v-if="editingNoGoZone.zoneType === 'forbidden'">
                <a-form-item label="禁行等级">
                  <a-select v-model:value="editingNoGoZone.level">
                    <a-select-option value="permanent">永久禁行</a-select-option>
                    <a-select-option value="temporary">临时禁行</a-select-option>
                    <a-select-option value="high_risk">高风险区域</a-select-option>
                    <a-select-option value="maintenance">维修区域</a-select-option>
                  </a-select>
                </a-form-item>
                <a-divider orientation="left">时间范围</a-divider>
                <a-form-item label="开始时间"><a-input v-model:value="editingNoGoZone.startTime" placeholder="YYYY-MM-DD HH:mm" /></a-form-item>
                <a-form-item label="结束时间"><a-input v-model:value="editingNoGoZone.endTime" placeholder="YYYY-MM-DD HH:mm" /></a-form-item>
                <a-form-item label="禁行原因"><a-textarea v-model:value="editingNoGoZone.reason" :rows="2" /></a-form-item>
              </template>
              <a-divider orientation="left">管理信息</a-divider>
              <a-row :gutter="8">
                <a-col :span="12"><a-form-item label="进入限制"><a-input-number v-model:value="editingNoGoZone.entryLimit" :min="0" style="width:100%" placeholder="人数" /></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="容量限制"><a-input-number v-model:value="editingNoGoZone.capacityLimit" :min="0" style="width:100%" placeholder="人数" /></a-form-item></a-col>
              </a-row>
              <a-form-item label="责任人"><a-input v-model:value="editingNoGoZone.responsiblePerson" placeholder="责任人姓名" /></a-form-item>
              <a-form-item label="联系电话"><a-input v-model:value="editingNoGoZone.contactPhone" placeholder="联系电话" /></a-form-item>
              <a-form-item label="顶点数">{{ editingNoGoZone.polygonPoints.length }} 个</a-form-item>
            </a-form>
          </template>

          <!-- 节点属性 -->
          <template v-if="selectedEntity.type === 'node' && editingNode">
            <a-form layout="vertical" size="small" class="prop-form" :class="{ 'form-readonly': !propertyEditing }">
              <a-form-item label="节点ID"><a-input :value="editingNode.id" disabled /></a-form-item>
              <a-form-item label="名称"><a-input v-model:value="editingNode.name" placeholder="输入节点名称" /></a-form-item>
              <a-form-item label="类型">
                <a-select v-model:value="editingNode.nodeType" @change="onNodeTypeChange">
                  <a-select-option value="waypoint">途经点</a-select-option>
                  <a-select-option value="junction">路口节点</a-select-option>
                  <a-select-option value="inspection">巡检点</a-select-option>
                  <a-select-option value="parking">停车点</a-select-option>
                  <a-select-option value="charging">充电点</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="坐标">
                <a-row :gutter="8">
                  <a-col :span="12"><a-input-number v-model:value="editingNode.position.x" :precision="1" style="width:100%" addon-before="X" /></a-col>
                  <a-col :span="12"><a-input-number v-model:value="editingNode.position.y" :precision="1" style="width:100%" addon-before="Y" /></a-col>
                </a-row>
              </a-form-item>
              <a-form-item label="连接边数">{{ editingNode.edgeIds.length }} 条</a-form-item>

              <!-- 业务节点属性（巡检点/停车点/充电点） -->
              <template v-if="editingNode.nodeType === 'inspection' || editingNode.nodeType === 'parking' || editingNode.nodeType === 'charging'">
                <a-divider orientation="left">业务属性</a-divider>
                <a-form-item label="所属区域"><a-input v-model:value="editingNode.area" placeholder="如：储罐区" /></a-form-item>
                <a-form-item label="关联设施"><a-input v-model:value="editingNode.relatedFacilityId" placeholder="设施ID" /></a-form-item>
                <a-form-item label="关联设备"><a-input v-model:value="editingNode.relatedDeviceId" placeholder="设备ID" /></a-form-item>
                <a-form-item label="备注"><a-textarea v-model:value="editingNode.remark" :rows="3" /></a-form-item>
              </template>

              <!-- 路口节点属性 -->
              <template v-if="editingNode.nodeType === 'junction' && editingNodeJunction">
                <a-divider orientation="left">路口属性</a-divider>
                <a-form-item label="路口编码" required><a-input v-model:value="editingNodeJunction.code" /></a-form-item>
                <a-form-item label="路口类型">
                  <a-select v-model:value="editingNodeJunction.junctionType">
                    <a-select-option value="normal">其他</a-select-option>
                    <a-select-option value="t_junction">T字形</a-select-option>
                    <a-select-option value="cross">十字形</a-select-option>
                  </a-select>
                </a-form-item>
                <a-divider orientation="left">通行规则</a-divider>
                <a-space direction="vertical">
                  <a-checkbox v-model:checked="editingNodeJunction.allowStraight">允许直行</a-checkbox>
                  <a-checkbox v-model:checked="editingNodeJunction.allowLeftTurn">允许左转</a-checkbox>
                  <a-checkbox v-model:checked="editingNodeJunction.allowRightTurn">允许右转</a-checkbox>
                  <a-checkbox v-model:checked="editingNodeJunction.allowUTurn">允许掉头</a-checkbox>
                </a-space>
                <a-divider orientation="left">优先级与冲突</a-divider>
                <a-form-item label="优先级">
                  <a-select v-model:value="editingNodeJunction.priority">
                    <a-select-option value="main_road">主路优先</a-select-option>
                    <a-select-option value="side_road">支路让行</a-select-option>
                    <a-select-option value="robot_priority">机器人优先</a-select-option>
                  </a-select>
                </a-form-item>
                <a-form-item label="冲突控制">
                  <a-select v-model:value="editingNodeJunction.conflictMode">
                    <a-select-option value="mutex">互斥通行</a-select-option>
                    <a-select-option value="reservation">预约通行</a-select-option>
                    <a-select-option value="time_window">时间窗通行</a-select-option>
                  </a-select>
                </a-form-item>
                <a-form-item label="关联路段">{{ editingNodeJunction.connectedSegmentIds.length }} 条</a-form-item>
              </template>
            </a-form>
          </template>
        </template>

        <template v-else-if="!propertyCollapsed">
          <div class="prop-empty">
            <a-empty :image-style="{ height: '48px' }">
              <template #description>
                <span style="color: #999">点击地图元素或左侧列表<br/>查看和编辑属性</span>
              </template>
            </a-empty>
          </div>
        </template>
      </div>
    </div>

    <!-- 底部状态栏 -->
    <div class="rn-statusbar">
      <span>路段: <b>{{ mapSegments.length }}</b></span>
      <span>节点: <b>{{ mapNodes.length }}</b></span>
      <span>路口: <b>{{ mapJunctions.length }}</b></span>
      <span>点位: <b>{{ mapNavPoints.length }}</b></span>
      <span>区域: <b>{{ mapNoGoZones.length }}</b></span>
      <span v-if="lastTopologyCheck" :class="{ 'status-error': lastTopologyCheck.totalCritical > 0 }">
        拓扑错误: <b>{{ lastTopologyCheck.totalCritical }}</b>
      </span>
      <span class="status-coord" v-if="selectedMapId">X: {{ Math.round(mousePos.x) }} Y: {{ Math.round(mousePos.y) }}</span>
    </div>

    <!-- 路径模拟弹窗 -->
    <a-modal v-model:open="pathSimVisible" title="路径模拟" @ok="runPathSimulation" @cancel="pathSimVisible = false" width="420px">
      <a-form layout="vertical" size="small">
        <a-form-item label="起点">
          <a-select v-model:value="simStartId" placeholder="选择起点" allow-clear show-search :filter-option="filterNodeOption" style="width:100%">
            <a-select-option v-for="n in allNavNodes" :key="n.id" :value="n.id">{{ n.label }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="终点">
          <a-select v-model:value="simEndId" placeholder="选择终点" allow-clear show-search :filter-option="filterNodeOption" style="width:100%">
            <a-select-option v-for="n in allNavNodes" :key="n.id" :value="n.id">{{ n.label }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="算法">
          <a-radio-group v-model:value="simAlgorithm">
            <a-radio value="shortest">最短路径</a-radio>
            <a-radio value="fastest">最快路径</a-radio>
            <a-radio value="safest">最安全路径</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
      <a-alert v-if="simResult" :type="simResult.found ? 'success' : 'error'"
        :message="simResult.found ? `找到路径: ${Math.round(simResult.totalDistance)}m, 预计 ${Math.round(simResult.estimatedTime)}s` : '无法找到可达路径'"
        show-icon style="margin-top: 8px" />
    </a-modal>

    <!-- 拓扑检查结果弹窗 -->
    <a-modal v-model:open="topologyVisible" title="拓扑检查结果" width="600px" :footer="null">
      <template v-if="lastTopologyCheck">
        <a-row :gutter="16" style="margin-bottom: 16px">
          <a-col :span="8"><a-statistic title="严重问题" :value="lastTopologyCheck.totalCritical" :value-style="{ color: '#ff4d4f' }" /></a-col>
          <a-col :span="8"><a-statistic title="警告问题" :value="lastTopologyCheck.totalWarning" :value-style="{ color: '#faad14' }" /></a-col>
          <a-col :span="8"><a-statistic title="提示问题" :value="lastTopologyCheck.totalInfo" :value-style="{ color: '#1677ff' }" /></a-col>
        </a-row>
        <a-list :data-source="lastTopologyCheck.issues" size="small" :pagination="{ pageSize: 10 }">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta>
                <template #title>
                  <a-space>
                    <a-tag :color="item.severity === 'critical' ? 'red' : item.severity === 'warning' ? 'orange' : 'blue'" size="small">
                      {{ item.severity === 'critical' ? '严重' : item.severity === 'warning' ? '警告' : '提示' }}
                    </a-tag>
                    <span>{{ item.message }}</span>
                  </a-space>
                </template>
                <template #description>
                  <a-space>
                    <span>{{ topologyTypeLabel(item.type) }}</span>
                    <a-button v-if="item.relatedEntityId" type="link" size="small" @click="locateTopologyIssue(item)">
                      <AimOutlined /> 定位
                    </a-button>
                  </a-space>
                </template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
      </template>
    </a-modal>

    <!-- 新建点位弹窗 -->
    <a-modal v-model:open="navPointModalVisible" title="新建点位" @ok="createNavPoint" @cancel="navPointModalVisible = false" width="520px">
      <a-form layout="vertical">
        <a-form-item label="点位类型">
          <a-select v-model:value="newNavPointForm.navType" style="width: 100%">
            <a-select-option value="inspection">巡检点</a-select-option>
            <a-select-option value="charging">充电点</a-select-option>
            <a-select-option value="parking">停车点</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="点位名称" required><a-input v-model:value="newNavPointForm.name" placeholder="如：北门巡检点" /></a-form-item>
        <a-form-item label="所属区域"><a-input v-model:value="newNavPointForm.area" placeholder="如：储罐区" /></a-form-item>

        <!-- 充电点专属 -->
        <template v-if="newNavPointForm.navType === 'charging'">
          <a-divider orientation="left">充电属性</a-divider>
          <a-form-item label="充电方式">
            <a-select v-model:value="newNavPointForm.chargingMethod" placeholder="选择充电方式">
              <a-select-option value="auto">自动对接</a-select-option>
              <a-select-option value="manual">手动连接</a-select-option>
              <a-select-option value="wireless">无线充电</a-select-option>
            </a-select>
          </a-form-item>
          <a-row :gutter="12">
            <a-col :span="12"><a-form-item label="充电功率(kW)"><a-input-number v-model:value="newNavPointForm.chargingPower" :min="0" style="width:100%" /></a-form-item></a-col>
            <a-col :span="12"><a-form-item label="预计时长(min)"><a-input-number v-model:value="newNavPointForm.estimatedChargingTime" :min="0" style="width:100%" /></a-form-item></a-col>
          </a-row>
        </template>

        <!-- 停车点专属 -->
        <template v-if="newNavPointForm.navType === 'parking'">
          <a-divider orientation="left">停车属性</a-divider>
          <a-row :gutter="12">
            <a-col :span="12"><a-form-item label="停车优先级"><a-input-number v-model:value="newNavPointForm.parkingPriority" :min="1" :max="10" style="width:100%" /></a-form-item></a-col>
            <a-col :span="12"><a-form-item label="允许等待时间(秒)"><a-input-number v-model:value="newNavPointForm.maxWaitingTime" :min="0" style="width:100%" /></a-form-item></a-col>
          </a-row>
        </template>
      </a-form>
    </a-modal>

    <!-- 区域属性填写弹窗 -->
    <a-modal v-model:open="noGoZoneModalVisible" title="新建绘制区域" @ok="confirmCreateNoGoZone" @cancel="noGoZoneModalVisible = false">
      <a-form layout="vertical">
        <a-form-item label="区域名称" required><a-input v-model:value="newNoGoZoneForm.name" placeholder="如：巡检区域A" /></a-form-item>
        <a-form-item label="区域类型">
          <a-select v-model:value="newNoGoZoneForm.zoneType">
            <a-select-option value="normal">正常通行</a-select-option>
            <a-select-option value="forbidden">禁止通行</a-select-option>
          </a-select>
        </a-form-item>
        <template v-if="newNoGoZoneForm.zoneType === 'forbidden'">
          <a-form-item label="禁行等级">
            <a-select v-model:value="newNoGoZoneForm.level">
              <a-select-option value="permanent">永久禁行</a-select-option>
              <a-select-option value="temporary">临时禁行</a-select-option>
              <a-select-option value="high_risk">高风险区域</a-select-option>
              <a-select-option value="maintenance">维修区域</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="禁行原因"><a-textarea v-model:value="newNoGoZoneForm.reason" :rows="2" /></a-form-item>
        </template>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, reactive, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useRoute } from 'vue-router'
import {
  EditOutlined, ZoomInOutlined, ZoomOutOutlined,
  BugOutlined, BranchesOutlined, SaveOutlined,
  AimOutlined, StopOutlined, DeleteOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined
} from '@ant-design/icons-vue'
import { useInspectionStore } from '@/stores/inspection'
import { MockService } from '@/mock/mockService'
import type {
  RoadNode, RoadEdge, RoadSegment, Junction, NavigationPoint,
  NoGoZone, ZoneType, TopologyCheckResult, TopologyIssue,
  RoadNodeType, RoadSegmentStatus, NavigationPointType, NoGoZoneLevel,
  TopologyIssueType, PathAlgorithm, PathResult
} from '@/types/road-network'

const route = useRoute()
const inspectionStore = useInspectionStore()

// ─── 地图状态 ───
const selectedMapId = ref('')
const searchText = ref('')
const mapContainerRef = ref<HTMLElement | null>(null)
const mapWidth = 800
const mapHeight = 600
const viewBox = ref(`0 0 ${mapWidth} ${mapHeight}`)
const scale = ref(1)
const panX = ref(0)
const panY = ref(0)
const isPanning = ref(false)
const panStart = reactive({ x: 0, y: 0 })
const mousePos = reactive({ x: 0, y: 0 })

// ─── 数据（统一拓扑模型） ───
const nodes = ref<RoadNode[]>([])
const edges = ref<RoadEdge[]>([])
const segments = ref<RoadSegment[]>([])
const junctions = ref<Junction[]>([])
const navPoints = ref<NavigationPoint[]>([])
const noGoZones = ref<NoGoZone[]>([])
const lastTopologyCheck = ref<TopologyCheckResult | null>(null)

// ─── 侧栏 ───
const sidebarTab = ref('segment')

// ─── 图层 ───
const showSegments = ref(true)
const showNoGoZones = ref(true)

// 节点图层（扁平化）
const showAllNodes = ref(true)
const showWaypointNodes = ref(true)
const showJunctionNodes = ref(true)
const showJunctionNormal = ref(true)
const showJunctionT = ref(true)
const showJunctionCross = ref(true)
const showNavInspection = ref(true)
const showNavParking = ref(true)
const showNavCharging = ref(true)

// ─── 面板折叠 ───
const sidebarCollapsed = ref(false)
const propertyCollapsed = ref(false)

// ─── 选中实体 ───
const selectedEntity = ref<{ type: string; id: string } | null>(null)
const editingSegment = ref<RoadSegment | null>(null)
const editingJunction = ref<Junction | null>(null)
const editingNavPoint = ref<NavigationPoint | null>(null)
const editingNoGoZone = ref<NoGoZone | null>(null)
const editingNode = ref<RoadNode | null>(null)
const editingNodeJunction = ref<Junction | null>(null)

// ─── 绘制模式 ───
const drawMode = ref<'segment' | 'polygon' | null>(null)
const drawingNodes = ref<string[]>([])
const polygonDrawingPoints = ref<{ x: number; y: number }[]>([])
const deleteMode = ref(false)
const hasUnsavedChanges = ref(false)
const propertyEditing = ref(false)
// editMode 已移除：工具栏直接可用，属性面板由 propertyEditing 三态控制

// ─── 点位放置模式 ───
const navPointPlacementMode = ref(false)
const navPointPlacementPosition = ref<{ x: number; y: number } | null>(null)

// ─── 弹窗 ───
const navPointModalVisible = ref(false)
const noGoZoneModalVisible = ref(false)
const pathSimVisible = ref(false)
const topologyVisible = ref(false)

// ─── 新建表单 ───
const newNavPointForm = reactive({
  name: '', navType: 'inspection' as string, area: '',
  stayDurationSec: 30, photoStrategy: 'auto', isRequiredInspection: true,
  chargingMethod: 'auto', chargingPower: 5, estimatedChargingTime: 60,
  parkingPriority: 5, maxWaitingTime: 300
})
const newNoGoZoneForm = reactive({ name: '', zoneType: 'normal' as ZoneType, level: 'permanent' as const, reason: '' })

// ─── 路径模拟 ───
const simStartId = ref<string | null>(null)
const simEndId = ref<string | null>(null)
const simAlgorithm = ref<PathAlgorithm>('shortest')
const simResult = ref<PathResult | null>(null)
const simulationPath = ref<{ x1: number; y1: number; x2: number; y2: number }[] | null>(null)

// ─── 拓扑检查 ───
const checkingTopology = ref(false)

// ─── 计算属性 ───
const currentMap = computed(() => inspectionStore.inspectionMaps.find(m => m.id === selectedMapId.value))
const currentMapImageUrl = computed(() => currentMap.value?.imageUrl || '')

const mapNodes = computed(() => {
  return nodes.value.filter(n => {
    if (n.mapId !== selectedMapId.value) return false
    if (n.nodeType === 'waypoint') return showWaypointNodes.value
    if (n.nodeType === 'junction') return showJunctionNodes.value
    if (n.nodeType === 'inspection') return showNavInspection.value
    if (n.nodeType === 'parking') return showNavParking.value
    if (n.nodeType === 'charging') return showNavCharging.value
    return true
  })
})
const mapEdges = computed(() => {
  const nodeIds = new Set(mapNodes.value.map(n => n.id))
  return edges.value.filter(e => nodeIds.has(e.fromNodeId) && nodeIds.has(e.toNodeId))
})
const mapSegments = computed(() => segments.value.filter(s => s.mapId === selectedMapId.value))
const mapJunctions = computed(() => {
  if (!showJunctionNodes.value) return []
  return junctions.value.filter(j => {
    if (j.mapId !== selectedMapId.value) return false
    const jt = j.junctionType || 'normal'
    if (jt === 't_junction') return showJunctionT.value
    if (jt === 'cross') return showJunctionCross.value
    return showJunctionNormal.value
  })
})
const mapNavPoints = computed(() => {
  return navPoints.value.filter(p => {
    if (p.mapId !== selectedMapId.value) return false
    if (p.navType === 'inspection') return showNavInspection.value
    if (p.navType === 'parking') return showNavParking.value
    if (p.navType === 'charging') return showNavCharging.value
    return true
  })
})
const mapNoGoZones = computed(() => noGoZones.value.filter(z => z.mapId === selectedMapId.value))

const filteredSegments = computed(() => {
  let list = selectedMapId.value ? segments.value.filter(s => s.mapId === selectedMapId.value) : segments.value
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(s => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
  }
  return list
})
const filteredNavPoints = computed(() => {
  let list = selectedMapId.value ? navPoints.value.filter(p => p.mapId === selectedMapId.value) : navPoints.value
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
  }
  return list
})
const filteredNoGoZones = computed(() => {
  let list = selectedMapId.value ? noGoZones.value.filter(z => z.mapId === selectedMapId.value) : noGoZones.value
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(z => z.name.toLowerCase().includes(q) || z.code.toLowerCase().includes(q))
  }
  return list
})

/** 有点位绑定的节点 ID 集合（用于隐藏重叠的节点标签） */
const navNodeIds = computed(() => new Set(mapNavPoints.value.map(p => p.nodeId)))

const allNavNodes = computed(() => {
  const nodeItems = mapNodes.value.filter(n => n.name).map(n => ({ id: n.id, label: n.name || n.id }))
  const navItems = mapNavPoints.value.map(p => ({ id: p.nodeId, label: `${p.name} (${navPointTypeLabel(p.navType)})` }))
  return [...nodeItems, ...navItems]
})

const propertyTitle = computed(() => {
  if (!selectedEntity.value) return ''
  if (selectedEntity.value.type === 'node' && editingNode.value) return nodeTypeLabel(editingNode.value.nodeType) + '属性'
  const map: Record<string, string> = { segment: '路段属性', junction: '路口属性', navpoint: '点位属性', nogozone: '区域属性', node: '节点属性' }
  return map[selectedEntity.value.type] || '属性'
})

const drawHint = computed(() => {
  if (drawMode.value === 'segment') return '左键点击空白添加新节点，点击已有节点连接（可折返），点击「完成绘制」或右键/双击结束'
  if (drawMode.value === 'polygon') return '左键点击添加顶点，双击完成多边形'
  return ''
})

// ─── 图形辅助 ───
function getNodePos(nodeId: string) {
  const node = nodes.value.find(n => n.id === nodeId)
  return node ? node.position : { x: 0, y: 0 }
}

function getJunctionPos(j: Junction) {
  return getNodePos(j.nodeId)
}

function getNodeRadius(node: RoadNode) {
  if (node.nodeType === 'junction') return 8
  if (node.nodeType === 'inspection' || node.nodeType === 'parking' || node.nodeType === 'charging') return 7
  return 5
}

function getNodeColor(node: RoadNode) {
  if (selectedEntity.value?.type === 'node' && selectedEntity.value?.id === node.id) return '#1677ff'
  if (node.nodeType === 'junction') return '#faad14'
  if (node.nodeType === 'inspection') return '#1677ff'
  if (node.nodeType === 'parking') return '#52c41a'
  if (node.nodeType === 'charging') return '#7cb305'
  return '#8c8c8c'
}

function nodeTypeLabel(t: RoadNodeType) {
  const map: Record<string, string> = { waypoint: '途经点', junction: '路口节点', inspection: '巡检点', parking: '停车点', charging: '充电点' }
  return map[t] || t
}

function nodeTypeIcon(t: RoadNodeType) {
  const map: Record<string, string> = { junction: 'J', inspection: '巡', parking: '停', charging: '充' }
  return map[t] || ''
}

function getNodeStroke(node: RoadNode) {
  if (selectedEntity.value?.type === 'node' && selectedEntity.value?.id === node.id) return '#0958d9'
  return '#fff'
}

function getEdgeColor(edge: RoadEdge) {
  if (isPathEdge(edge.id)) return '#ff4d4f'
  const seg = edge.segmentId ? segments.value.find(s => s.id === edge.segmentId) : null
  return seg?.color || '#1677ff'
}

function hasReverseEdge(edge: RoadEdge): boolean {
  return edges.value.some(e => e.id !== edge.id && e.fromNodeId === edge.toNodeId && e.toNodeId === edge.fromNodeId)
}

function getEdgePath(edge: RoadEdge): string {
  const p1 = getNodePos(edge.fromNodeId)
  const p2 = getNodePos(edge.toNodeId)
  if (!hasReverseEdge(edge)) {
    return `M${p1.x},${p1.y} L${p2.x},${p2.y}`
  }
  const mx = (p1.x + p2.x) / 2
  const my = (p1.y + p2.y) / 2
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const len = Math.hypot(dx, dy) || 1
  const offset = Math.min(20, len * 0.25)
  const dir = edge.fromNodeId < edge.toNodeId ? 1 : -1
  const cx = mx + (-dy / len) * offset * dir
  const cy = my + (dx / len) * offset * dir
  return `M${p1.x},${p1.y} Q${cx},${cy} ${p2.x},${p2.y}`
}

function getEdgeSegment(edge: RoadEdge) {
  return edge.segmentId ? segments.value.find(s => s.id === edge.segmentId) : null
}

function isPathEdge(edgeId: string) {
  return simResult.value?.pathEdgeIds.includes(edgeId) || false
}

function getLastDrawNodePos() {
  const lastId = drawingNodes.value[drawingNodes.value.length - 1]
  return getNodePos(lastId)
}

function getArrowPoints(edge: RoadEdge) {
  const p1 = getNodePos(edge.fromNodeId)
  const p2 = getNodePos(edge.toNodeId)
  const mx = (p1.x + p2.x) / 2
  const my = (p1.y + p2.y) / 2
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
  const size = 6
  return [
    `${mx + Math.cos(angle) * size},${my + Math.sin(angle) * size}`,
    `${mx + Math.cos(angle + 2.5) * size * 0.6},${my + Math.sin(angle + 2.5) * size * 0.6}`,
    `${mx + Math.cos(angle - 2.5) * size * 0.6},${my + Math.sin(angle - 2.5) * size * 0.6}`
  ].join(' ')
}

function zonePolygonCenter(zone: NoGoZone) {
  if (!zone.polygonPoints.length) return { x: 0, y: 0 }
  return {
    x: zone.polygonPoints.reduce((s, p) => s + p.x, 0) / zone.polygonPoints.length,
    y: zone.polygonPoints.reduce((s, p) => s + p.y, 0) / zone.polygonPoints.length
  }
}

function noGoZoneFill(zone: NoGoZone) {
  if (zone.zoneType !== 'forbidden') return '#52c41a'
  const map: Record<string, string> = { permanent: '#ff4d4f', temporary: '#faad14', high_risk: '#ff7a45', maintenance: '#1677ff' }
  return map[zone.level] || '#d9d9d9'
}

function noGoZoneStroke(zone: NoGoZone) {
  if (zone.zoneType !== 'forbidden') return '#389e0d'
  const map: Record<string, string> = { permanent: '#cf1322', temporary: '#d48806', high_risk: '#d4380d', maintenance: '#0958d9' }
  return map[zone.level] || '#8c8c8c'
}

// ─── 标签/颜色辅助 ───
function segmentStatusColor(s: RoadSegmentStatus) {
  const map: Record<string, string> = { active: 'green', inactive: 'default', construction: 'orange', blocked: 'red', maintenance: 'blue' }
  return map[s] || 'default'
}
function segmentStatusLabel(s: RoadSegmentStatus) {
  const map: Record<string, string> = { active: '启用', inactive: '停用', construction: '施工中', blocked: '禁行', maintenance: '维护中' }
  return map[s] || s
}
function navPointTypeLabel(t: NavigationPointType) {
  const map: Record<string, string> = { inspection: '巡检点', parking: '停车点', charging: '充电点' }
  return map[t] || t
}
function navPointTypeColor(t: NavigationPointType) {
  const map: Record<string, string> = { inspection: 'blue', parking: 'green', charging: 'lime' }
  return map[t] || 'default'
}
function navPointColor(t: NavigationPointType) {
  const map: Record<string, string> = { inspection: '#1677ff', parking: '#52c41a', charging: '#7cb305' }
  return map[t] || '#8c8c8c'
}
function navPointIcon(t: NavigationPointType) {
  const map: Record<string, string> = { inspection: '巡', parking: '停', charging: '充' }
  return map[t] || 'N'
}
function noGoLevelLabel(l: NoGoZoneLevel) {
  const map: Record<string, string> = { permanent: '永久禁行', temporary: '临时禁行', high_risk: '高风险', maintenance: '维修区域' }
  return map[l] || l
}
function noGoLevelColor(l: NoGoZoneLevel) {
  const map: Record<string, string> = { permanent: 'red', temporary: 'orange', high_risk: 'volcano', maintenance: 'blue' }
  return map[l] || 'default'
}
function topologyTypeLabel(t: TopologyIssueType) {
  const map: Record<string, string> = {
    isolated_node: '孤立节点', isolated_edge: '孤立边', dead_end: '死胡同',
    disconnected_component: '断路', overlapping_edge: '重叠边',
    self_intersecting: '自交', width_insufficient: '宽度不足', radius_insufficient: '转弯半径不足',
    charging_unreachable: '充电点不可达'
  }
  return map[t] || t
}

function locateTopologyIssue(issue: TopologyIssue) {
  if (!issue.relatedEntityId) return
  const typeMap: Record<string, string> = { node: 'node', edge: 'segment', segment: 'segment', junction: 'junction' }
  const entityType = typeMap[issue.relatedEntityType || 'node'] || 'node'
  selectEntity(entityType, issue.relatedEntityId)
  // 平移到实体位置
  let pos: { x: number; y: number } | null = null
  if (entityType === 'node') {
    const node = nodes.value.find(n => n.id === issue.relatedEntityId)
    if (node) pos = node.position
  } else if (entityType === 'junction') {
    const junc = junctions.value.find(j => j.id === issue.relatedEntityId)
    if (junc) pos = getNodePos(junc.nodeId)
  }
  if (pos) {
    panX.value = pos.x - mapWidth / scale.value / 2
    panY.value = pos.y - mapHeight / scale.value / 2
    updateViewBox()
  }
  topologyVisible.value = false
}

// ─── 属性面板三态 ───
function enterPropertyEdit() {
  propertyEditing.value = true
}

function savePropertyEdit() {
  if (selectedEntity.value) saveSelectedEntity()
  propertyEditing.value = false
  hasUnsavedChanges.value = true
  message.success('属性已修改，点击「保存」提交到系统')
}

function cancelPropertyEdit() {
  // 重新加载选中实体的原始数据
  if (selectedEntity.value) {
    selectEntity(selectedEntity.value.type, selectedEntity.value.id)
  }
  propertyEditing.value = false
}

function discardAllChanges() {
  clearDrawing()
  deleteMode.value = false
  selectedEntity.value = null
  editingSegment.value = null
  editingJunction.value = null
  editingNavPoint.value = null
  editingNoGoZone.value = null
  editingNode.value = null
  editingNodeJunction.value = null
  loadData()
  hasUnsavedChanges.value = false
  message.info('已放弃所有修改')
}

// ─── 选择实体 ───
function selectEntity(type: string, id: string) {
  // 再次点击已选中的实体则取消选中
  if (selectedEntity.value?.type === type && selectedEntity.value?.id === id) {
    selectedEntity.value = null
    editingSegment.value = null
    editingJunction.value = null
    editingNavPoint.value = null
    editingNoGoZone.value = null
    editingNode.value = null
    editingNodeJunction.value = null
    return
  }
  selectedEntity.value = { type, id }
  editingSegment.value = type === 'segment' ? { ...segments.value.find(s => s.id === id)! } : null
  editingJunction.value = type === 'junction' ? { ...junctions.value.find(j => j.id === id)! } : null
  editingNavPoint.value = type === 'navpoint' ? { ...navPoints.value.find(p => p.id === id)! } : null
  editingNoGoZone.value = type === 'nogozone' ? { ...noGoZones.value.find(z => z.id === id)! } : null
  editingNode.value = type === 'node' ? { ...nodes.value.find(n => n.id === id)! } : null
  // 选中路口节点时，自动关联路口数据
  if (type === 'node' && editingNode.value?.nodeType === 'junction') {
    const found = junctions.value.find(j => j.nodeId === id)
    editingNodeJunction.value = found ? { ...found } : null
  } else {
    editingNodeJunction.value = null
  }
  // 列表联动：选中时地图定位到该实体
  centerOnEntity(type, id)
}

// ─── 列表联动：地图定位 ───
function centerOnEntity(type: string, id: string) {
  let x = 0, y = 0, found = false
  if (type === 'node' || type === 'junction') {
    const node = nodes.value.find(n => n.id === id)
    if (node) { x = node.position.x; y = node.position.y; found = true }
  } else if (type === 'navpoint') {
    const np = navPoints.value.find(p => p.id === id)
    if (np) {
      const node = nodes.value.find(n => n.id === np.nodeId)
      if (node) { x = node.position.x; y = node.position.y; found = true }
    }
  } else if (type === 'segment') {
    const seg = segments.value.find(s => s.id === id)
    if (seg && seg.edgeIds.length > 0) {
      const edge = edges.value.find(e => e.id === seg.edgeIds[0])
      if (edge) {
        const from = nodes.value.find(n => n.id === edge.fromNodeId)
        const to = nodes.value.find(n => n.id === edge.toNodeId)
        if (from && to) { x = (from.position.x + to.position.x) / 2; y = (from.position.y + to.position.y) / 2; found = true }
      }
    }
  } else if (type === 'nogozone') {
    const zone = noGoZones.value.find(z => z.id === id)
    if (zone && zone.polygonPoints.length > 0) {
      const pts = zone.polygonPoints
      x = pts.reduce((s, p) => s + p.x, 0) / pts.length
      y = pts.reduce((s, p) => s + p.y, 0) / pts.length
      found = true
    }
  }
  if (found) {
    panX.value = mapWidth / 2 - x * scale.value
    panY.value = mapHeight / 2 - y * scale.value
  }
}

// ─── 节点类型切换 ───
function onNodeTypeChange(newType: RoadNodeType) {
  if (!editingNode.value) return
  if (newType === 'junction') {
    // 切换到路口：自动创建路口实体（如果不存在）
    let junc = junctions.value.find(j => j.nodeId === editingNode.value!.id)
    if (!junc) {
      const jId = `junc-${Date.now()}`
      const jCode = `J${String(junctions.value.length + 1).padStart(3, '0')}`
      junc = {
        id: jId, name: editingNode.value!.name || jCode, code: jCode,
        mapId: selectedMapId.value, nodeId: editingNode.value!.id,
        connectedSegmentIds: [], junctionType: 'normal',
        priority: 'main_road', conflictMode: 'mutex',
        allowLeftTurn: true, allowRightTurn: true, allowStraight: true, allowUTurn: false,
        createdAt: new Date(), updatedAt: new Date()
      }
      junctions.value.push(junc)
    }
    editingNodeJunction.value = { ...junc }
  } else {
    // 切换到非路口：清除路口关联
    editingNodeJunction.value = null
  }
}

// ─── 保存/删除实体（仅更新本地，不持久化） ───
function saveSelectedEntity() {
  if (!selectedEntity.value) return
  const now = new Date()
  const { type, id } = selectedEntity.value

  if (type === 'segment' && editingSegment.value) {
    editingSegment.value.edgeIds.forEach(eid => {
      const edge = edges.value.find(e => e.id === eid)
      if (edge) {
        edge.bidirectional = editingSegment.value!.bidirectional
        edge.speedLimit = editingSegment.value!.speedLimit
        edge.width = editingSegment.value!.width
      }
    })
    editingSegment.value.updatedAt = now
    const idx = segments.value.findIndex(s => s.id === id)
    if (idx >= 0) segments.value[idx] = { ...editingSegment.value }
    message.success('路段属性已更新（未持久化）')
  } else if (type === 'junction' && editingJunction.value) {
    editingJunction.value.updatedAt = now
    const idx = junctions.value.findIndex(j => j.id === id)
    if (idx >= 0) junctions.value[idx] = { ...editingJunction.value }
    message.success('路口属性已更新（未持久化）')
  } else if (type === 'navpoint' && editingNavPoint.value) {
    editingNavPoint.value.updatedAt = now
    const idx = navPoints.value.findIndex(p => p.id === id)
    if (idx >= 0) navPoints.value[idx] = { ...editingNavPoint.value }
    message.success('点位属性已更新（未持久化）')
  } else if (type === 'nogozone' && editingNoGoZone.value) {
    editingNoGoZone.value.updatedAt = now
    const idx = noGoZones.value.findIndex(z => z.id === id)
    if (idx >= 0) noGoZones.value[idx] = { ...editingNoGoZone.value }
    message.success('区域属性已更新（未持久化）')
  } else if (type === 'node' && editingNode.value) {
    editingNode.value.updatedAt = now
    const idx = nodes.value.findIndex(n => n.id === id)
    if (idx >= 0) nodes.value[idx] = { ...editingNode.value }
    // 保存路口数据
    if (editingNode.value.nodeType === 'junction' && editingNodeJunction.value) {
      editingNodeJunction.value.name = editingNode.value.name || editingNodeJunction.value.name
      editingNodeJunction.value.updatedAt = now
      const jIdx = junctions.value.findIndex(j => j.id === editingNodeJunction.value!.id)
      if (jIdx >= 0) junctions.value[jIdx] = { ...editingNodeJunction.value }
    }
    message.success('节点属性已更新（未持久化）')
  }
  hasUnsavedChanges.value = true
}

function deleteSelectedEntity() {
  if (!selectedEntity.value) return
  const { type, id } = selectedEntity.value
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除该${propertyTitle.value}吗？保存后才会持久化。`,
    onOk() {
      deleteEntityLocally(type, id)
      message.success('已删除（未持久化）')
    }
  })
}

/** 本地删除实体（不持久化） */
function deleteEntityLocally(type: string, id: string) {
  if (type === 'segment') {
    const seg = segments.value.find(s => s.id === id)
    if (seg) {
      // 删除关联边
      const edgeIdsToRemove = new Set(seg.edgeIds)
      edges.value = edges.value.filter(e => !edgeIdsToRemove.has(e.id))
      // 清理节点的 edgeIds
      nodes.value.forEach(n => {
        n.edgeIds = n.edgeIds.filter(eid => !edgeIdsToRemove.has(eid))
      })
      segments.value = segments.value.filter(s => s.id !== id)
    }
  } else if (type === 'junction') {
    junctions.value = junctions.value.filter(j => j.id !== id)
  } else if (type === 'navpoint') {
    navPoints.value = navPoints.value.filter(p => p.id !== id)
  } else if (type === 'nogozone') {
    noGoZones.value = noGoZones.value.filter(z => z.id !== id)
  } else if (type === 'node') {
    const node = nodes.value.find(n => n.id === id)
    if (node) {
      // 删除关联边
      const edgeIdsToRemove = new Set(node.edgeIds)
      edges.value = edges.value.filter(e => !edgeIdsToRemove.has(e.id))
      // 从其他节点的 edgeIds 中清理
      nodes.value.forEach(n => {
        if (n.id !== id) n.edgeIds = n.edgeIds.filter(eid => !edgeIdsToRemove.has(eid))
      })
      // 删除关联路段中的引用
      segments.value.forEach(s => {
        s.nodeIds = s.nodeIds.filter(nid => nid !== id)
        s.edgeIds = s.edgeIds.filter(eid => !edgeIdsToRemove.has(eid))
      })
      nodes.value = nodes.value.filter(n => n.id !== id)
    }
  }
  if (selectedEntity.value?.id === id) selectedEntity.value = null
  hasUnsavedChanges.value = true
}

// ─── 编辑模式切换 ───
function openCreateNavPointModal() {
  if (!selectedMapId.value) { message.warning('请先选择地图'); return }
  // 进入放置模式，等待用户在地图上点击
  navPointPlacementMode.value = true
  navPointPlacementPosition.value = null
  clearDrawing()
  deleteMode.value = false
  selectedEntity.value = null
  message.info('请在地图上点击放置点位')
}

// ─── 删除模式 ───
function toggleDeleteMode() {
  deleteMode.value = !deleteMode.value
  if (deleteMode.value) {
    drawMode.value = null
    drawingNodes.value = []
    polygonDrawingPoints.value = []
    selectedEntity.value = null
  }
}

function onEdgeClick(edge: RoadEdge) {
  if (deleteMode.value) {
    // 找到关联的路段并从中移除此边
    segments.value.forEach(s => {
      s.edgeIds = s.edgeIds.filter(eid => eid !== edge.id)
    })
    // 清理节点的 edgeIds
    const fromNode = nodes.value.find(n => n.id === edge.fromNodeId)
    const toNode = nodes.value.find(n => n.id === edge.toNodeId)
    if (fromNode) fromNode.edgeIds = fromNode.edgeIds.filter(eid => eid !== edge.id)
    if (toNode) toNode.edgeIds = toNode.edgeIds.filter(eid => eid !== edge.id)
    edges.value = edges.value.filter(e => e.id !== edge.id)
    hasUnsavedChanges.value = true
    message.success('路段已删除（未持久化）')
  }
}

// ─── 批量保存（持久化到 localStorage） ───
function saveAll() {
  if (!selectedMapId.value) { message.warning('请先选择地图'); return }
  // 先保存当前正在编辑的实体到本地 refs
  if (selectedEntity.value) saveSelectedEntity()

  // 持久化所有数据
  nodes.value.forEach(n => MockService.saveRoadNode(n))
  edges.value.forEach(e => MockService.saveRoadEdge(e))
  segments.value.forEach(s => MockService.saveRoadSegment(s))
  junctions.value.forEach(j => MockService.saveJunction(j))
  navPoints.value.forEach(p => MockService.saveNavigationPoint(p))
  noGoZones.value.forEach(z => MockService.saveNoGoZone(z))

  // 清理 localStorage 中已被删除的条目
  const nodeIds = new Set(nodes.value.map(n => n.id))
  const edgeIds = new Set(edges.value.map(e => e.id))
  const segIds = new Set(segments.value.map(s => s.id))
  const juncIds = new Set(junctions.value.map(j => j.id))
  const navIds = new Set(navPoints.value.map(p => p.id))
  const zoneIds = new Set(noGoZones.value.map(z => z.id))

  MockService.getRoadNodes().forEach(n => { if (!nodeIds.has(n.id)) MockService.deleteRoadNode(n.id) })
  MockService.getRoadEdges().forEach(e => { if (!edgeIds.has(e.id)) MockService.deleteRoadEdge(e.id) })
  MockService.getRoadSegments().forEach(s => { if (!segIds.has(s.id)) MockService.deleteRoadSegment(s.id) })
  MockService.getJunctions().forEach(j => { if (!juncIds.has(j.id)) MockService.deleteJunction(j.id) })
  MockService.getNavigationPoints().forEach(p => { if (!navIds.has(p.id)) MockService.deleteNavigationPoint(p.id) })
  MockService.getNoGoZones().forEach(z => { if (!zoneIds.has(z.id)) MockService.deleteNoGoZone(z.id) })

  hasUnsavedChanges.value = false
  message.success('路网已保存')
}

// ─── 新建点位 ───
function createNavPoint() {
  if (!newNavPointForm.name.trim()) { message.error('请输入点位名称'); return }
  if (!navPointPlacementPosition.value) { message.error('未获取到放置位置'); return }
  const now = new Date()
  const id = `nav-${Date.now()}`
  const pos = navPointPlacementPosition.value
  // 自动创建一个拓扑节点并绑定
  const nodeId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const newNode: RoadNode = {
    id: nodeId, nodeType: 'waypoint', position: { x: pos.x, y: pos.y },
    edgeIds: [], mapId: selectedMapId.value,
    createdAt: now, updatedAt: now
  }
  nodes.value.push(newNode)

  const p: NavigationPoint = {
    id, name: newNavPointForm.name.trim(), code: `P${String(navPoints.value.length + 1).padStart(3, '0')}`,
    mapId: selectedMapId.value, area: newNavPointForm.area, navType: newNavPointForm.navType as NavigationPointType,
    position: { x: pos.x, y: pos.y },
    nodeId,
    // 类型专属字段
    ...(newNavPointForm.navType === 'inspection' ? {
      stayDurationSec: newNavPointForm.stayDurationSec,
      photoStrategy: newNavPointForm.photoStrategy,
      isRequiredInspection: newNavPointForm.isRequiredInspection
    } : {}),
    ...(newNavPointForm.navType === 'charging' ? {
      chargingMethod: newNavPointForm.chargingMethod,
      chargingPower: newNavPointForm.chargingPower,
      estimatedChargingTime: newNavPointForm.estimatedChargingTime
    } : {}),
    ...(newNavPointForm.navType === 'parking' ? {
      parkingPriority: newNavPointForm.parkingPriority,
      maxWaitingTime: newNavPointForm.maxWaitingTime
    } : {}),
    createdAt: now, updatedAt: now
  }
  navPoints.value.push(p)
  navPointModalVisible.value = false
  navPointPlacementPosition.value = null
  hasUnsavedChanges.value = true
  message.success('点位已创建（未持久化）')
  selectEntity('navpoint', id)
}

// ─── 绘制模式 ───
function toggleDrawMode(mode: 'segment' | 'polygon') {
  if (drawMode.value === mode) {
    clearDrawing()
  } else {
    drawMode.value = mode
    drawingNodes.value = []
    polygonDrawingPoints.value = []
    selectedEntity.value = null
  }
}

function clearDrawing() {
  drawMode.value = null
  drawingNodes.value = []
  polygonDrawingPoints.value = []
  navPointPlacementMode.value = false
}

// ─── 核心绘制：路段（自动创建 Node + Edge + Segment） ───
function addDrawNode(x: number, y: number) {
  const nodeId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const newNode: RoadNode = {
    id: nodeId, nodeType: 'waypoint', position: { x, y },
    edgeIds: [], mapId: selectedMapId.value,
    createdAt: new Date(), updatedAt: new Date()
  }

  if (drawingNodes.value.length === 0) {
    // 第一个节点：创建节点 + 路段
    nodes.value.push(newNode)
    drawingNodes.value.push(nodeId)

    const segId = `seg-${Date.now()}`
    const segCode = `S${String(segments.value.length + 1).padStart(4, '0')}`
    const newSeg: RoadSegment = {
      id: segId, name: `路段 ${segCode}`, code: segCode,
      mapId: selectedMapId.value, area: '', segmentType: 'trunk', status: 'active',
      nodeIds: [nodeId], edgeIds: [], length: 0, width: 3,
      startPoint: { x, y }, endPoint: { x, y },
      bidirectional: true, speedLimit: 30,
      allowReverse: false, allowUTurn: false, allowSpin: false,
      color: '#1677ff', createdAt: new Date(), updatedAt: new Date()
    }
    segments.value.push(newSeg)
  } else {
    // 后续节点：创建节点 + 边，更新路段
    const lastId = drawingNodes.value[drawingNodes.value.length - 1]
    const lastPos = getNodePos(lastId)
    const distance = Math.hypot(x - lastPos.x, y - lastPos.y)

    // 获取当前正在绘制的路段（最后一个）
    const currentSeg = segments.value[segments.value.length - 1]

    const edgeId = `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const newEdge: RoadEdge = {
      id: edgeId, fromNodeId: lastId, toNodeId: nodeId,
      segmentId: currentSeg.id, distance, bidirectional: currentSeg.bidirectional,
      speedLimit: currentSeg.speedLimit, width: currentSeg.width,
      mapId: selectedMapId.value, createdAt: new Date(), updatedAt: new Date()
    }

    // 更新节点的 edgeIds
    newNode.edgeIds.push(edgeId)
    const lastNode = nodes.value.find(n => n.id === lastId)
    if (lastNode) {
      lastNode.edgeIds.push(edgeId)
    }

    nodes.value.push(newNode)
    edges.value.push(newEdge)
    drawingNodes.value.push(nodeId)

    // 更新路段
    currentSeg.nodeIds.push(nodeId)
    currentSeg.edgeIds.push(edgeId)
    currentSeg.endPoint = { x, y }
    currentSeg.length += distance
    currentSeg.updatedAt = new Date()

    // 自动路口检测
    autoDetectJunction(lastId)
  }
  hasUnsavedChanges.value = true
}

function finishSegmentDrawing() {
  if (drawingNodes.value.length < 2) {
    message.warning('路段至少需要 2 个节点')
    clearDrawing()
    return
  }
  const seg = segments.value[segments.value.length - 1]
  message.success(`路段 "${seg.name}" 绘制完成，${seg.nodeIds.length} 个节点，${Math.round(seg.length)}m`)
  clearDrawing()
}

// ─── 自动路口检测 ───
function autoDetectJunction(nodeId: string) {
  const node = nodes.value.find(n => n.id === nodeId)
  if (!node) return
  // 如果节点有 3 条及以上连接边，且不是已标记的路口/业务类型
  if (node.edgeIds.length >= 3 && node.nodeType === 'waypoint') {
    // 检查是否已存在路口
    const existing = junctions.value.find(j => j.nodeId === nodeId)
    if (existing) {
      // 更新关联路段
      const segIds = new Set<string>()
      node.edgeIds.forEach(eid => {
        const edge = edges.value.find(e => e.id === eid)
        if (edge?.segmentId) segIds.add(edge.segmentId)
      })
      existing.connectedSegmentIds = [...segIds]
      return
    }
    node.nodeType = 'junction'

    const segIds = new Set<string>()
    node.edgeIds.forEach(eid => {
      const edge = edges.value.find(e => e.id === eid)
      if (edge?.segmentId) segIds.add(edge.segmentId)
    })

    const jId = `junc-${Date.now()}`
    const jCode = `J${String(junctions.value.length + 1).padStart(3, '0')}`
    const j: Junction = {
      id: jId, name: jCode, code: jCode, mapId: selectedMapId.value,
      nodeId, connectedSegmentIds: [...segIds], junctionType: 'normal',
      priority: 'main_road', conflictMode: 'mutex',
      allowLeftTurn: true, allowRightTurn: true, allowStraight: true, allowUTurn: false,
      createdAt: new Date(), updatedAt: new Date()
    }
    junctions.value.push(j)
    message.info(`自动创建路口 ${jCode}`)
  }
}

// ─── Polygon 区域绘制 ───
function addPolygonPoint(x: number, y: number) {
  polygonDrawingPoints.value.push({ x, y })
}

function finishPolygonDrawing() {
  if (polygonDrawingPoints.value.length < 3) {
    message.warning('区域至少需要 3 个顶点')
    clearDrawing()
    return
  }
  // 打开属性填写弹窗
  Object.assign(newNoGoZoneForm, { name: `区域 ${noGoZones.value.length + 1}`, zoneType: 'normal', level: 'permanent', reason: '' })
  noGoZoneModalVisible.value = true
}

function confirmCreateNoGoZone() {
  if (!newNoGoZoneForm.name.trim()) { message.error('请输入区域名称'); return }
  const now = new Date()
  const id = `nogo-${Date.now()}`
  const zone: NoGoZone = {
    id, name: newNoGoZoneForm.name.trim(), code: `NG${String(noGoZones.value.length + 1).padStart(3, '0')}`,
    mapId: selectedMapId.value, zoneType: newNoGoZoneForm.zoneType,
    level: newNoGoZoneForm.zoneType === 'forbidden' ? newNoGoZoneForm.level : 'permanent',
    polygonPoints: [...polygonDrawingPoints.value],
    reason: newNoGoZoneForm.zoneType === 'forbidden' ? newNoGoZoneForm.reason : '',
    createdAt: now, updatedAt: now
  }
  noGoZones.value.push(zone)
  noGoZoneModalVisible.value = false
  clearDrawing()
  hasUnsavedChanges.value = true
  message.success(`区域 "${zone.name}" 已创建（未持久化）`)
  selectEntity('nogozone', id)
}

// ─── 地图事件 ───
function onMapClick(e: MouseEvent) {
  if (!selectedMapId.value) return

  // 点位放置模式优先处理（不受 isPanning 影响）
  if (navPointPlacementMode.value) {
    const svg = e.currentTarget as SVGSVGElement
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * mapWidth / scale.value + panX.value
    const y = ((e.clientY - rect.top) / rect.height) * mapHeight / scale.value + panY.value
    navPointPlacementPosition.value = { x, y }
    navPointPlacementMode.value = false
    Object.assign(newNavPointForm, { name: '', navType: 'inspection', area: '' })
    navPointModalVisible.value = true
    return
  }

  if (isPanning.value) return
  const svg = e.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * mapWidth / scale.value + panX.value
  const y = ((e.clientY - rect.top) / rect.height) * mapHeight / scale.value + panY.value

  // 绘制模式下才允许绘制
  if (drawMode.value === 'segment') addDrawNode(x, y)
  else if (drawMode.value === 'polygon') addPolygonPoint(x, y)
}

function onDoubleClick() {
  if (drawMode.value === 'segment') finishSegmentDrawing()
  else if (drawMode.value === 'polygon') finishPolygonDrawing()
}

function onNodeClick(node: RoadNode) {
  if (deleteMode.value) {
    deleteEntityLocally('node', node.id)
    message.success('节点已删除（未持久化）')
    return
  }
  if (drawMode.value === 'segment') {
    const lastId = drawingNodes.value[drawingNodes.value.length - 1]
    // 避免重复点击同一个节点
    if (lastId === node.id) return

    // 第一个点：直接以已有节点作为起点
    if (!lastId) {
      const segId = `seg-${Date.now()}`
      const segCode = `S${String(segments.value.length + 1).padStart(4, '0')}`
      const newSeg: RoadSegment = {
        id: segId, name: `路段 ${segCode}`, code: segCode,
        mapId: selectedMapId.value, area: '', segmentType: 'trunk', status: 'active',
        nodeIds: [node.id], edgeIds: [], length: 0, width: 3,
        startPoint: { x: node.position.x, y: node.position.y },
        endPoint: { x: node.position.x, y: node.position.y },
        bidirectional: true, speedLimit: 30,
        allowReverse: false, allowUTurn: false, allowSpin: false,
        color: '#1677ff', createdAt: new Date(), updatedAt: new Date()
      }
      segments.value.push(newSeg)
      drawingNodes.value.push(node.id)
      hasUnsavedChanges.value = true
      return
    }

    // 后续点：创建边连接到已有节点
    const lastPos = getNodePos(lastId)
    const distance = Math.hypot(node.position.x - lastPos.x, node.position.y - lastPos.y)
    const currentSeg = segments.value[segments.value.length - 1]
    if (!currentSeg) return

    const edgeId = `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const newEdge: RoadEdge = {
      id: edgeId, fromNodeId: lastId, toNodeId: node.id,
      segmentId: currentSeg.id, distance, bidirectional: currentSeg.bidirectional,
      speedLimit: currentSeg.speedLimit, width: currentSeg.width,
      mapId: selectedMapId.value, createdAt: new Date(), updatedAt: new Date()
    }
    edges.value.push(newEdge)

    // 更新两端节点的 edgeIds
    const lastNode = nodes.value.find(n => n.id === lastId)
    if (lastNode) lastNode.edgeIds.push(edgeId)
    node.edgeIds.push(edgeId)

    // 更新路段
    currentSeg.nodeIds.push(node.id)
    currentSeg.edgeIds.push(edgeId)
    currentSeg.endPoint = { x: node.position.x, y: node.position.y }
    currentSeg.length += distance
    currentSeg.updatedAt = new Date()

    drawingNodes.value.push(node.id)
    hasUnsavedChanges.value = true

    // 自动路口检测
    autoDetectJunction(lastId)
    autoDetectJunction(node.id)
    return
  }
  selectEntity('node', node.id)
}

function onMapMouseDown(e: MouseEvent) {
  if (e.button === 1 || (e.button === 0 && !drawMode.value)) {
    isPanning.value = true; panStart.x = e.clientX; panStart.y = e.clientY
  }
}

function onMapMouseMove(e: MouseEvent) {
  const svg = (e.currentTarget as SVGSVGElement) || mapContainerRef.value?.querySelector('svg')
  if (!svg) return
  const rect = svg.getBoundingClientRect()
  mousePos.x = ((e.clientX - rect.left) / rect.width) * mapWidth / scale.value + panX.value
  mousePos.y = ((e.clientY - rect.top) / rect.height) * mapHeight / scale.value + panY.value
  if (isPanning.value) {
    const dx = (e.clientX - panStart.x) / rect.width * mapWidth / scale.value
    const dy = (e.clientY - panStart.y) / rect.height * mapHeight / scale.value
    panX.value -= dx; panY.value -= dy; panStart.x = e.clientX; panStart.y = e.clientY
    updateViewBox()
  }
}

function onMapMouseUp() { isPanning.value = false }

function onRightClick() {
  if (drawMode.value === 'segment') finishSegmentDrawing()
}

function onMapChange() {
  selectedEntity.value = null; drawMode.value = null; drawingNodes.value = []
  polygonDrawingPoints.value = []; simulationPath.value = null; simResult.value = null
  deleteMode.value = false; navPointPlacementMode.value = false; navPointPlacementPosition.value = null
}

// ─── 地图控制 ───
function zoomIn() { scale.value = Math.min(scale.value * 1.2, 5); updateViewBox() }
function zoomOut() { scale.value = Math.max(scale.value / 1.2, 0.3); updateViewBox() }
function resetView() { scale.value = 1; panX.value = 0; panY.value = 0; updateViewBox() }
function updateViewBox() {
  const w = mapWidth / scale.value; const h = mapHeight / scale.value
  viewBox.value = `${panX.value} ${panY.value} ${w} ${h}`
}

function filterNodeOption(input: string, option: any) {
  const item = allNavNodes.value.find(n => n.id === option.value)
  return (item?.label || '').toLowerCase().includes(input.toLowerCase())
}

// ─── Dijkstra 路径规划 ───
function runPathSimulation() {
  if (!simStartId.value || !simEndId.value) { message.warning('请选择起点和终点'); return }
  simResult.value = null; simulationPath.value = null

  const result = dijkstra(simStartId.value, simEndId.value, simAlgorithm.value)
  simResult.value = result

  if (result.found) {
    // 构建可视化路径
    const segs: { x1: number; y1: number; x2: number; y2: number }[] = []
    for (let i = 0; i < result.pathNodeIds.length - 1; i++) {
      const p1 = getNodePos(result.pathNodeIds[i])
      const p2 = getNodePos(result.pathNodeIds[i + 1])
      segs.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y })
    }
    simulationPath.value = segs
    message.success(`路径找到: ${Math.round(result.totalDistance)}m`)
  } else {
    message.error('无法找到可达路径')
  }
}

function dijkstra(startId: string, endId: string, algorithm: PathAlgorithm): PathResult {
  // 构建带权邻接表
  const adjMap = new Map<string, { edgeId: string; neighborId: string; weight: number }[]>()

  mapEdges.value.forEach(edge => {
    const weight = calcEdgeWeight(edge, algorithm)
    if (weight === Infinity) return

    // 正向
    if (!adjMap.has(edge.fromNodeId)) adjMap.set(edge.fromNodeId, [])
    adjMap.get(edge.fromNodeId)!.push({ edgeId: edge.id, neighborId: edge.toNodeId, weight })

    // 反向（如果双向）
    if (edge.bidirectional) {
      if (!adjMap.has(edge.toNodeId)) adjMap.set(edge.toNodeId, [])
      adjMap.get(edge.toNodeId)!.push({ edgeId: edge.id, neighborId: edge.fromNodeId, weight })
    }
  })

  // Dijkstra
  const dist = new Map<string, number>()
  const prev = new Map<string, { nodeId: string; edgeId: string }>()
  const visited = new Set<string>()
  const pq: { nodeId: string; dist: number }[] = [{ nodeId: startId, dist: 0 }]
  dist.set(startId, 0)

  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist)
    const { nodeId: current } = pq.shift()!
    if (visited.has(current)) continue
    visited.add(current)

    if (current === endId) break

    const neighbors = adjMap.get(current) || []
    for (const { edgeId, neighborId, weight } of neighbors) {
      if (visited.has(neighborId)) continue
      const newDist = (dist.get(current) || Infinity) + weight
      if (newDist < (dist.get(neighborId) || Infinity)) {
        dist.set(neighborId, newDist)
        prev.set(neighborId, { nodeId: current, edgeId })
        pq.push({ nodeId: neighborId, dist: newDist })
      }
    }
  }

  // 回溯路径
  if (!prev.has(endId) && startId !== endId) {
    return { found: false, pathNodeIds: [], pathEdgeIds: [], totalDistance: 0, estimatedTime: 0, algorithm }
  }

  const pathNodeIds: string[] = []
  const pathEdgeIds: string[] = []
  let cursor: string | undefined = endId
  while (cursor) {
    pathNodeIds.unshift(cursor)
    const p = prev.get(cursor)
    if (p) {
      pathEdgeIds.unshift(p.edgeId)
      cursor = p.nodeId
    } else {
      break
    }
  }

  const totalDistance = dist.get(endId) || 0
  // 估算时间：基于限速
  let estimatedTime = 0
  for (const eid of pathEdgeIds) {
    const edge = edges.value.find(e => e.id === eid)
    if (edge) {
      const speed = edge.speedLimit || 30 // km/h
      estimatedTime += (edge.distance / 1000) / speed * 3600 // 秒
    }
  }

  return { found: true, pathNodeIds, pathEdgeIds, totalDistance, estimatedTime, algorithm }
}

function calcEdgeWeight(edge: RoadEdge, algorithm: PathAlgorithm): number {
  // 检查禁止通行区域
  for (const zone of mapNoGoZones.value) {
    if (zone.zoneType === 'forbidden' && (zone.level === 'permanent' || zone.level === 'high_risk')) {
      const p1 = getNodePos(edge.fromNodeId)
      const p2 = getNodePos(edge.toNodeId)
      if (lineIntersectsPolygon(p1, p2, zone.polygonPoints)) {
        return Infinity
      }
    }
  }

  switch (algorithm) {
    case 'shortest':
      return edge.distance
    case 'fastest':
      // 时间 = 距离 / 速度
      return edge.distance / (edge.speedLimit || 30)
    case 'safest':
      // 安全权重：距离 * 宽度惩罚 * 限速惩罚
      const widthPenalty = edge.width < 2 ? 3 : edge.width < 3 ? 1.5 : 1
      const speedPenalty = edge.speedLimit > 20 ? 1.5 : 1
      return edge.distance * widthPenalty * speedPenalty
    default:
      return edge.distance
  }
}

function lineIntersectsPolygon(p1: { x: number; y: number }, p2: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
  // 简化检查：线段中点是否在多边形内
  const mx = (p1.x + p2.x) / 2
  const my = (p1.y + p2.y) / 2
  return pointInPolygon(mx, my, polygon)
}

function pointInPolygon(x: number, y: number, polygon: { x: number; y: number }[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y
    const xj = polygon[j].x, yj = polygon[j].y
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

// ─── 拓扑检查 ───
function runTopologyCheck() {
  if (!selectedMapId.value) { message.warning('请先选择地图'); return }
  checkingTopology.value = true

  setTimeout(() => {
    const issues: TopologyIssue[] = []

    // 1. 孤立节点
    mapNodes.value.forEach(n => {
      if (n.edgeIds.length === 0) {
        issues.push({ id: `iso-node-${n.id}`, type: 'isolated_node', severity: 'warning', message: `节点 ${n.name || n.id} 未连接任何边`, relatedEntityId: n.id, relatedEntityType: 'node' })
      }
    })

    // 2. 死胡同（点位绑定的叶子节点不算死胡同）
    const navNodeIds = new Set(mapNavPoints.value.map(p => p.nodeId))
    mapNodes.value.forEach(n => {
      if (n.edgeIds.length === 1 && !navNodeIds.has(n.id)) {
        issues.push({ id: `dead-${n.id}`, type: 'dead_end', severity: 'info', message: `节点 ${n.name || n.id} 是死胡同`, relatedEntityId: n.id, relatedEntityType: 'node' })
      }
    })

    // 3. 断路检测（连通分量分析）
    const visited = new Set<string>()
    const components: string[][] = []
    mapNodes.value.forEach(n => {
      if (visited.has(n.id)) return
      const component: string[] = []
      const queue = [n.id]
      visited.add(n.id)
      while (queue.length > 0) {
        const current = queue.shift()!
        component.push(current)
        const node = nodes.value.find(nn => nn.id === current)
        if (node) {
          node.edgeIds.forEach(eid => {
            const edge = edges.value.find(e => e.id === eid)
            if (edge) {
              const neighborId = edge.fromNodeId === current ? edge.toNodeId : edge.fromNodeId
              if (!visited.has(neighborId) && mapNodes.value.some(nn => nn.id === neighborId)) {
                visited.add(neighborId)
                queue.push(neighborId)
              }
            }
          })
        }
      }
      components.push(component)
    })
    if (components.length > 1) {
      issues.push({ id: 'disconnected', type: 'disconnected_component', severity: 'critical', message: `路网存在 ${components.length} 个不连通的子图`, relatedEntityType: 'node' })
    }

    // 4. 重叠边检测
    const edgeKeySet = new Set<string>()
    mapEdges.value.forEach(e => {
      const key = [e.fromNodeId, e.toNodeId].sort().join('-')
      if (edgeKeySet.has(key)) {
        issues.push({ id: `overlap-${e.id}`, type: 'overlapping_edge', severity: 'warning', message: `边 ${e.id} 与其他边重叠`, relatedEntityId: e.id, relatedEntityType: 'edge' })
      }
      edgeKeySet.add(key)
    })

    // 5. 充电点不可达检测
    const chargingPoints = mapNavPoints.value.filter(p => p.navType === 'charging')
    if (components.length > 0 && chargingPoints.length > 0) {
      const mainComponent = components.reduce((a, b) => a.length > b.length ? a : b)
      const mainSet = new Set(mainComponent)
      chargingPoints.forEach(cp => {
        if (!mainSet.has(cp.nodeId)) {
          issues.push({
            id: `charge-unreach-${cp.id}`, type: 'charging_unreachable', severity: 'critical',
            message: `充电点 "${cp.name}" 无法从主网络到达`,
            relatedEntityId: cp.id, relatedEntityType: 'node'
          })
        }
      })
    }

    const critical = issues.filter(i => i.severity === 'critical').length
    const warning = issues.filter(i => i.severity === 'warning').length
    const info = issues.filter(i => i.severity === 'info').length
    lastTopologyCheck.value = {
      id: `topo-${Date.now()}`, mapId: selectedMapId.value, checkTime: new Date(),
      issues, totalCritical: critical, totalWarning: warning, totalInfo: info
    }
    MockService.saveTopologyCheck(lastTopologyCheck.value)
    checkingTopology.value = false
    topologyVisible.value = true
    if (critical > 0) message.error(`发现 ${critical} 个严重问题`)
    else if (warning > 0) message.warning(`发现 ${warning} 个警告`)
    else message.success('拓扑检查通过')
  }, 500)
}

// ─── 数据加载 ───
function loadData() {
  inspectionStore.initialize()
  nodes.value = MockService.getRoadNodes()
  edges.value = MockService.getRoadEdges()
  segments.value = MockService.getRoadSegments()
  junctions.value = MockService.getJunctions()
  navPoints.value = MockService.getNavigationPoints()
  noGoZones.value = MockService.getNoGoZones()
  const checks = MockService.getTopologyChecks()
  if (checks.length > 0) lastTopologyCheck.value = checks[checks.length - 1]

  const queryMapId = typeof route.query.mapId === 'string' ? route.query.mapId : ''
  if (queryMapId && inspectionStore.inspectionMaps.some(m => m.id === queryMapId)) {
    selectedMapId.value = queryMapId
  } else if (!selectedMapId.value && inspectionStore.inspectionMaps.length > 0) {
    selectedMapId.value = inspectionStore.inspectionMaps[0].id
  }
}

// ─── 离开页面前提醒未保存 ───
function beforeUnloadHandler(e: BeforeUnloadEvent) {
  if (hasUnsavedChanges.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (navPointPlacementMode.value) {
      navPointPlacementMode.value = false
      navPointPlacementPosition.value = null
      message.info('已取消点位放置')
    }
  }
  if (e.key === 'Delete' && selectedEntity.value && !deleteMode.value) {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除该${propertyTitle.value}吗？`,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        deleteEntityLocally(selectedEntity.value!.type, selectedEntity.value!.id)
        selectedEntity.value = null
        hasUnsavedChanges.value = true
        message.success('已删除')
      }
    })
  }
}

onMounted(() => {
  loadData()
  window.addEventListener('beforeunload', beforeUnloadHandler)
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnloadHandler)
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<style scoped lang="scss">
.road-network {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f7fa;
}

.rn-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  .rn-toolbar-left, .rn-toolbar-right { display: flex; align-items: center; gap: 8px; }
  .rn-title { margin: 0; font-size: 16px; font-weight: 600; color: #1d2129; white-space: nowrap; }
}

.rn-body { display: flex; flex: 1; min-height: 0; overflow: hidden; }

.rn-mode-bar {
  display: flex; align-items: center; gap: 16px;
  padding: 6px 16px; background: #fafafa; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
  .mode-hint { font-size: 12px; color: #86909c; }
}

.layer-popover-content {
  display: flex; flex-direction: column; gap: 8px;
}

.nav-type-selector {
  :deep(.ant-radio-button-wrapper) { min-width: 72px; text-align: center; }
}

.rn-sidebar {
  width: 20%; min-width: 220px; max-width: 300px;
  background: #fff; border-right: 1px solid #f0f0f0;
  display: flex; flex-direction: column; overflow: hidden;
  position: relative;
  transition: width 0.3s ease, min-width 0.3s ease;
  .panel-collapse-btn {
    position: absolute; right: 0; top: 50%; transform: translateY(-50%);
    width: 20px; height: 48px; background: #fff;
    border: 1px solid #e8e8e8; border-right: none;
    border-radius: 4px 0 0 4px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; z-index: 10; font-size: 12px; color: #86909c;
    transition: background 0.2s;
    &:hover { background: #f0f5ff; color: #1677ff; }
  }
  .rn-sidebar-search { padding: 8px 8px 4px; flex-shrink: 0; }
  .rn-sidebar-tabs { height: 100%; display: flex; flex-direction: column;
    :deep(.ant-tabs-content) { flex: 1; overflow: hidden; }
    :deep(.ant-tabs-tabpane) { height: 100%; overflow-y: auto; }
  }
  .sidebar-list { padding: 4px 8px; }
  .sidebar-item {
    padding: 8px 10px; border-radius: 6px; cursor: pointer; transition: background 0.15s; margin-bottom: 2px;
    &:hover { background: #f0f5ff; }
    &.active { background: #e6f4ff; border-left: 3px solid #1677ff; }
    .sidebar-item-name { font-size: 13px; font-weight: 500; color: #1d2129; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sidebar-item-meta { display: flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 12px; .meta-text { color: #86909c; } }
  }
  &.collapsed {
    width: 36px; min-width: 36px; max-width: 36px;
    .panel-collapse-btn { right: 0; }
  }
}

.rn-map-area {
  flex: 1; display: flex; flex-direction: column; min-width: 0; background: #fff;
  .rn-map-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
    .rn-layer-toggles { display: flex; gap: 12px; align-items: flex-start;
      .layer-tree { position: relative; }
      .layer-tree-header { display: flex; align-items: center; gap: 4px; cursor: pointer; }
      .layer-tree-arrow { font-size: 10px; color: #86909c; margin-left: 2px; }
      .layer-tree-body { position: absolute; top: 100%; left: 0; background: #fff; border: 1px solid #e8e8e8; border-radius: 6px; padding: 8px 12px; z-index: 100; box-shadow: 0 4px 12px rgba(0,0,0,0.1); min-width: 180px; display: flex; flex-direction: column; gap: 6px; }
      .layer-tree-group { margin-top: 2px; }
      .layer-tree-group-header { display: flex; align-items: center; gap: 4px; cursor: pointer; }
      .layer-tree-items { padding-left: 20px; display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
    }
  }
  .rn-map-container {
    position: relative; flex: 1; overflow: hidden; background: #f0f2f5; cursor: crosshair;
    .rn-map-svg { width: 100%; height: 100%; }
    .draw-overlay-hint { position: absolute; top: 8px; left: 50%; transform: translateX(-50%); background: rgba(22, 119, 255, 0.9); color: #fff; padding: 4px 16px; border-radius: 4px; font-size: 12px; pointer-events: none; }
  }
}

.rn-property-panel {
  width: 25%; min-width: 260px; max-width: 360px;
  background: #fff; border-left: 1px solid #f0f0f0;
  display: flex; flex-direction: column; overflow-y: auto;
  position: relative;
  transition: width 0.3s ease, min-width 0.3s ease;
  .panel-collapse-btn {
    position: absolute; left: 0; top: 50%; transform: translateY(-50%);
    width: 20px; height: 48px; background: #fff;
    border: 1px solid #e8e8e8; border-left: none;
    border-radius: 0 4px 4px 0;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; z-index: 10; font-size: 12px; color: #86909c;
    transition: background 0.2s;
    &:hover { background: #f0f5ff; color: #1677ff; }
  }
  .prop-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
    .prop-title { font-size: 14px; font-weight: 600; color: #1d2129; }
  }
  .prop-form { padding: 8px 12px; flex: 1; overflow-y: auto; }
  .form-readonly {
    pointer-events: none;
    opacity: 0.65;
    :deep(.ant-input),
    :deep(.ant-select-selector),
    :deep(.ant-input-number),
    :deep(.ant-input-textarea textarea),
    :deep(.ant-btn) {
      background: #f5f5f5 !important;
      border-color: #d9d9d9 !important;
      color: #00000040 !important;
      cursor: not-allowed !important;
    }
  }
  .prop-empty { display: flex; align-items: center; justify-content: center; height: 100%; }
  &.collapsed {
    width: 36px; min-width: 36px; max-width: 36px;
    overflow: hidden;
  }
}

.rn-statusbar {
  display: flex; align-items: center; gap: 20px; padding: 4px 16px;
  background: #fff; border-top: 1px solid #f0f0f0; font-size: 12px; color: #86909c; flex-shrink: 0;
  b { color: #1d2129; }
  .status-error b { color: #ff4d4f; }
  .status-coord { font-family: monospace; }
}

.clickable { cursor: pointer; }
.clickable:hover { filter: brightness(1.1); }
.edge-highlight { stroke: #ff4d4f !important; stroke-width: 4 !important; }
.node-selected { filter: drop-shadow(0 0 4px rgba(22, 119, 255, 0.6)); }
.entity-highlight { filter: drop-shadow(0 0 4px rgba(22, 119, 255, 0.6)); stroke-width: 2.5 !important; }
.entity-dimmed { opacity: 0.2; transition: opacity 0.2s; }
.entity-dimmed text { opacity: 0.2; }
.node-label { font-size: 10px; fill: #333; pointer-events: none; font-weight: 500; }
.edge-label { font-size: 9px; fill: #666; pointer-events: none; }
.zone-label { font-size: 11px; fill: #333; pointer-events: none; font-weight: 600; }
.junction-icon { font-size: 11px; fill: #fff; pointer-events: none; font-weight: 700; }
.nav-icon { font-size: 9px; fill: #fff; pointer-events: none; font-weight: 700; }

:deep(.ant-tabs-nav) { margin-bottom: 4px; }
:deep(.ant-form-item) { margin-bottom: 12px; }
:deep(.ant-divider) { margin: 12px 0 8px; }
:deep(.ant-statistic-title) { font-size: 12px; }

.delete-hint { background: rgba(255, 77, 79, 0.9) !important; }
.placement-hint { background: rgba(82, 196, 26, 0.9) !important; }
.delete-target { cursor: not-allowed !important; }
.delete-target:hover { stroke: #ff4d4f !important; stroke-width: 5 !important; filter: drop-shadow(0 0 4px rgba(255, 77, 79, 0.8)); }
</style>
