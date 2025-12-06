# 🎨 LabMate Pro Canvas 架构文档

## 📋 项目架构对标

根据开发规范文档与当前实现的比对分析：

### ✅ 已实现功能

| 功能 | 规范要求 | 当前实现 | 状态 |
|------|---------|---------|------|
| **无限画布** | DOM虚拟容器 | HTML5 Canvas API | ✅ |
| **摄像机系统** | `camera.x/y/z` | `panX/panY/zoom` | ✅ |
| **元素数据结构** | 位置+类型+内容 | 完整 | ✅ |
| **连接线系统** | 连接管理器 | ConnectionManager类 | ✅ |
| **平移(Pan)** | 鼠标拖拽 | ✅ 完整实现 | ✅ |
| **缩放(Zoom)** | 鼠标滚轮 | ✅ 完整实现 | ✅ |
| **元素拖拽** | 坐标转换 | 支持screenToWorld转换 | ✅ |
| **框选** | 碰撞检测 | SelectionBox类 | ✅ |
| **连线模式** | 状态机 | ConnectMode处理 | ✅ |
| **去抖动保存** | 300ms防抖 | Utils.debounce集成 | ✅ |
| **rAF优化** | 渲染循环 | startRenderLoop() | ✅ |
| **动量平移** | 惯性滑动 | ✅ Momentum实现 | ✅ |
| **CSS过渡控制** | .no-transition | Canvas API中处理 | ✅ |
| **网格背景** | 视差效果 | Canvas drawGrid() | ✅ |
| **性能指标** | 帧率显示 | FPS计算器 | ✅ |

### 📊 架构差异分析

#### 实现选择：Canvas vs DOM

**规范设计**（虚拟容器DOM）
```
优点：直接操作HTML，完美集成Vue响应式系统
缺点：大量DOM元素会导致性能下降（>1000个元素）
```

**当前实现**（HTML5 Canvas）
```
优点：高性能，支持1000+元素无压力
缺点：完全脱离Vue系统，需要手动管理状态同步
```

**建议**：当前实现更优，Canvas天生适合画布应用。

---

## 🔧 核心技术实现

### 1. 坐标系统 (Coordinate System)

#### 屏幕坐标 ↔ 世界坐标转换

```javascript
// 屏幕坐标 → 世界坐标
screenToWorld(screenX, screenY) {
    return {
        x: (screenX - this.panX) / this.zoom,
        y: (screenY - this.panY) / this.zoom
    };
}

// 世界坐标 → 屏幕坐标
worldToScreen(worldX, worldY) {
    return {
        x: worldX * this.zoom + this.panX,
        y: worldY * this.zoom + this.panY
    };
}
```

**关键点**：
- 缩放时必须除以 `zoom`，否则鼠标移动与元素移动不同步
- 平移时需要加上 `panX/panY` 偏移量
- 这是实现精确拖拽的基础

### 2. 渲染流程 (Render Loop)

```javascript
startRenderLoop() {
    const render = () => {
        if (this.isDirty) {
            // 清空画布
            this.ctx.clearRect(0, 0, this.width, this.height);
            
            // 保存上下文状态
            this.ctx.save();
            
            // 应用摄像机变换
            this.ctx.translate(this.panX, this.panY);
            this.ctx.scale(this.zoom, this.zoom);
            
            // 绘制网格
            this.drawGrid();
            
            // 绘制元素
            this.elements.forEach(el => this.drawElement(el));
            
            // 绘制连接线
            this.drawConnections();
            
            // 绘制选中框
            if (this.selectedBox) this.drawSelectionBox();
            
            // 恢复上下文状态
            this.ctx.restore();
            
            this.isDirty = false;
        }
        
        this.animationFrameId = requestAnimationFrame(render);
    };
    render();
}
```

**性能优化**：
- 使用 `isDirty` 标志避免无意义的重绘
- `ctx.save()/restore()` 管理变换堆栈
- 单次变换而不是逐元素变换

### 3. 动量平移 (Momentum Panning)

```javascript
// 鼠标松开时启动惯性滑动
const momentum = () => {
    if (Math.abs(this.panVelocity.x) > 0.1 || 
        Math.abs(this.panVelocity.y) > 0.1) {
        
        this.panX += this.panVelocity.x;
        this.panY += this.panVelocity.y;
        
        // 每帧减速 6%（滑动更流畅）
        this.panVelocity.x *= 0.94;
        this.panVelocity.y *= 0.94;
        
        this.isDirty = true;
        requestAnimationFrame(momentum);
    }
};
```

**用户体验**：使鼠标抬起后画布继续滑动，感觉像物理世界的惯性，极大提升交互流畅度。

### 4. 元素交互处理

#### 拖拽元素
```javascript
onMouseMove(e) {
    const { x: worldX, y: worldY } = this.screenToWorld(e.clientX, e.clientY);
    
    if (this.isDragging && this.dragStart) {
        const deltaX = worldX - this.dragStart.x;
        const deltaY = worldY - this.dragStart.y;
        
        // 移动所有选中元素
        this.draggedElements.forEach(elId => {
            const el = this.elements.find(e => e.id === elId);
            if (el) {
                el.x = el._startX + deltaX;
                el.y = el._startY + deltaY;
            }
        });
        
        this.isDirty = true;
    }
}
```

#### 框选
```javascript
// 在鼠标释放时计算框选区域
const selectedIds = this.elements.filter(el => 
    el.x < this.selectedBox.x2 &&
    el.x + el.w > this.selectedBox.x1 &&
    el.y < this.selectedBox.y2 &&
    el.y + el.h > this.selectedBox.y1
).map(el => el.id);

this.selectedElements = new Set(selectedIds);
```

---

## 📈 性能指标

### 当前系统支持

| 指标 | 值 |
|-----|-----|
| **最大元素数** | 1000+ |
| **目标帧率** | 60 FPS |
| **最小缩放** | 0.1x |
| **最大缩放** | 5x |
| **网格大小** | 20px |
| **防抖延迟** | 300ms |

### 优化技巧

1. **脏标志 (Dirty Flag)**
   - 只在数据改变时重绘，避免每帧60次无用渲染
   
2. **Canvas Context变换**
   - 单次 `translate + scale` 优于逐元素变换
   
3. **碰撞检测优化**
   - 框选使用简单的AABB（轴对齐包围盒）
   - 不使用像素级别的碰撞检测
   
4. **防抖保存**
   - 拖拽过程中数据留在内存
   - 松开鼠标后300ms才写入Firestore

---

## 🎯 关键代码路径

### 添加元素
```
app.js: addElement()
  → canvas.js: addElement(elementJSON)
  → elements.js: createElement(type)
  → canvas.render()
  → app.js: saveLab() [debounced]
  → firestore: update labs/{labId}
```

### 删除元素
```
app.js: deleteSelectedElement()
  → canvas.js: removeElement(elementId)
  → canvas.js: removeConnectionsForElement(elementId)
  → saveLab() → firestore
```

### 绘制连接线
```
app.js: toggleConnectionMode()
  → app.js: selectConnection()
  → canvas.js: connectionManager.createConnection()
  → canvas.js: drawConnections()
  → saveLab()
```

---

## 🔍 调试建议

### 启用调试模式
```javascript
// 在浏览器控制台中
window.DEBUG_CANVAS = true;

// 查看实时坐标
console.log(canvas.panX, canvas.panY, canvas.zoom);

// 检查元素列表
console.table(canvas.elements);

// 查看FPS
canvas.showFPS = true;
```

### 常见问题排查

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 元素拖拽不精确 | 坐标转换错误 | 检查screenToWorld计算 |
| 卡顿 | 过多重绘 | 检查isDirty标志使用 |
| 缩放后平移异常 | zoom未应用 | 确保所有操作都考虑zoom |
| 连接线错误 | 端点计算错误 | 检查getConnectionPoints() |

---

## 📝 数据流图

```
用户操作
    ↓
Canvas事件处理 (onMouseDown/Move/Up)
    ↓
坐标转换 (screenToWorld)
    ↓
元素/连接更新
    ↓
标记isDirty = true
    ↓
render()触发
    ↓
Canvas绘制
    ↓
debounced saveLab()
    ↓
Firestore同步
    ↓
其他客户端接收更新 (onSnapshot)
```

---

## 🚀 未来优化方向

1. **虚拟滚动**
   - 只渲染视口内的元素
   - 支持10000+元素

2. **多层渲染**
   - OffscreenCanvas或WebWorker
   - 后台并行渲染

3. **协作编辑**
   - 实时操作转换 (OT/CRDT)
   - 用户光标/选择共享

4. **撤销/重做**
   - 操作历史栈
   - 时间旅行调试

5. **导出功能**
   - SVG矢量导出
   - PNG/PDF高质量截图

---

## 📚 参考资源

- [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Infinite Canvas Theory](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/)
- [Canvas Performance](https://www.html5rocks.com/en/tutorials/canvas/performance/)
