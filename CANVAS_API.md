# 🎨 Canvas API 使用指南

## 快速开始

### 初始化Canvas

```javascript
// app.js中已封装，调用initCanvas()
const initCanvas = () => {
    if (!canvasContainer.value || canvas.value) return;
    
    canvas.value = new window.LabCanvas(canvasContainer.value);
    
    // 加载已有元素
    if (currentLab.value?.elements) {
        canvas.value.elements = currentLab.value.elements.map(el => 
            window.createElement(el.type, el.id, el)
        );
    }
};
```

---

## Canvas API 完整参考

### 属性 (Properties)

```javascript
canvas.panX              // 水平平移偏移（像素）
canvas.panY              // 垂直平移偏移（像素）
canvas.zoom              // 缩放比例（1 = 100%）
canvas.elements          // 元素数组
canvas.selectedElements  // 选中元素ID集合 (Set)
canvas.connectionManager // 连接线管理器
canvas.showGrid          // 是否显示网格
canvas.gridSize          // 网格单元格大小（像素）
canvas.isDirty           // 是否需要重绘标志
```

### 方法 (Methods)

#### 坐标转换

```javascript
// 屏幕坐标 → 世界坐标
const worldCoord = canvas.screenToWorld(clientX, clientY);
// { x: number, y: number }

// 世界坐标 → 屏幕坐标
const screenCoord = canvas.worldToScreen(worldX, worldY);
// { x: number, y: number }
```

#### 元素管理

```javascript
// 添加元素
canvas.addElement(element);
// element: { type, x, y, w, h, content, color, ... }

// 获取元素
const element = canvas.getElement(elementId);

// 更新元素
canvas.updateElement(elementId, updates);
// updates: 部分属性更新

// 删除元素
canvas.removeElement(elementId);

// 获取所有元素
const allElements = canvas.getElements();
```

#### 选择管理

```javascript
// 选中元素
canvas.selectElement(elementId);

// 取消选中
canvas.deselectElement(elementId);

// 清空选择
canvas.clearSelection();

// 获取选中元素
const selected = Array.from(canvas.selectedElements);

// 检查是否选中
const isSelected = canvas.selectedElements.has(elementId);
```

#### 视图控制

```javascript
// 缩放到合适视图
canvas.zoomToFit();

// 设置特定缩放
canvas.setZoom(zoomLevel);

// 平移到指定位置
canvas.panTo(x, y);

// 重置视图
canvas.resetView();
```

#### 导出

```javascript
// 导出当前视图为PNG
canvas.exportImage(filename);

// 获取所有元素数据
const data = canvas.export();
// { elements: [...], connections: [...], view: { panX, panY, zoom } }

// 导入数据
canvas.import(data);
```

#### 连接线

```javascript
// 创建连接
canvas.connectionManager.createConnection(fromElId, toElId, label);

// 获取连接
const connection = canvas.connectionManager.getConnection(connId);

// 删除连接
canvas.connectionManager.removeConnection(connId);

// 获取元素的所有连接
const connections = canvas.connectionManager.getElementConnections(elId);
```

---

## 事件系统

### 事件回调

```javascript
// 双击元素时
canvas.onElementDoubleClick = (element) => {
    console.log('Edited:', element);
};

// 选择改变时
canvas.onSelectionChange = (selectedIds) => {
    console.log('Selected:', selectedIds);
};

// 元素更新时
canvas.onElementUpdate = (element) => {
    console.log('Updated:', element);
};

// 连接创建时
canvas.onConnectionCreate = (connection) => {
    console.log('Connected:', connection);
};
```

---

## 实际使用示例

### 示例1：添加便签

```javascript
const addStickyNote = () => {
    const noteEl = {
        type: 'note',
        x: 100,
        y: 100,
        w: 200,
        h: 150,
        content: '新建便签',
        color: '#fef08a'  // 黄色
    };
    
    canvas.value.addElement(noteEl);
    // 数据会自动保存到Firestore（防抖300ms）
};
```

### 示例2：选中多个元素并框选

```javascript
// 点击canvas时自动进行框选
// 框选结果会更新canvas.selectedElements

// 获取选中元素的信息
canvas.selectedElements.forEach(id => {
    const el = canvas.getElement(id);
    console.log(el.type, el.content);
});
```

### 示例3：创建连接线

```javascript
// 开启连接模式
canvas.connectionManager.setConnectMode(true);

// 点击第一个元素 → 自动记录源元素
// 点击第二个元素 → 自动创建连接

canvas.connectionManager.createConnection(
    elementAId,
    elementBId,
    'connects to'  // 可选标签
);
```

### 示例4：导出当前工作

```javascript
// 导出为PNG
canvas.value.exportImage('my-lab-diagram.png');

// 导出为JSON（用于加载）
const labData = canvas.value.export();
localStorage.setItem('lab-backup', JSON.stringify(labData));

// 从JSON恢复
canvas.value.import(JSON.parse(localStorage.getItem('lab-backup')));
```

---

## 常见操作

### 放大到最佳视角

```javascript
canvas.value.zoomToFit();
```

### 清空所有元素

```javascript
canvas.value.elements = [];
canvas.value.clearSelection();
canvas.value.isDirty = true;
```

### 获取元素总数

```javascript
const count = canvas.value.elements.length;
```

### 删除所有连接线

```javascript
if (canvas.value.connectionManager) {
    canvas.value.connectionManager.connections = [];
    canvas.value.isDirty = true;
}
```

### 启用/禁用网格

```javascript
canvas.value.showGrid = true;  // 显示
canvas.value.showGrid = false; // 隐藏
canvas.value.isDirty = true;
```

---

## 调试技巧

### 打印当前状态

```javascript
console.log('Canvas State:', {
    zoom: canvas.zoom,
    pan: { x: canvas.panX, y: canvas.panY },
    elements: canvas.elements.length,
    selected: canvas.selectedElements.size,
    fps: canvas.fps
});
```

### 实时监控元素

```javascript
// 在浏览器控制台中
setInterval(() => {
    console.table(canvas.elements.map(e => ({
        id: e.id,
        type: e.type,
        x: e.x.toFixed(0),
        y: e.y.toFixed(0),
        selected: canvas.selectedElements.has(e.id)
    })));
}, 1000);
```

### 测试坐标转换

```javascript
// 验证坐标转换正确性
const testX = 100, testY = 150;
const world = canvas.screenToWorld(testX, testY);
const screen = canvas.worldToScreen(world.x, world.y);
console.assert(Math.abs(screen.x - testX) < 1, '坐标转换错误!');
```

---

## 性能监控

### 检查FPS

```javascript
// Canvas内置FPS计算（如果启用）
console.log(`FPS: ${canvas.fps}`);
```

### 检查脏标志

```javascript
// 如果总是true，说明可能有频繁更新
setInterval(() => {
    console.log(`isDirty: ${canvas.isDirty}`);
}, 1000);
```

### 性能分析

```javascript
// 使用Performance API
performance.mark('canvas-start');
canvas.addElement({ /* ... */ });
performance.mark('canvas-end');
performance.measure('canvas-add', 'canvas-start', 'canvas-end');

const measure = performance.getEntriesByName('canvas-add')[0];
console.log(`耗时: ${measure.duration.toFixed(2)}ms`);
```

---

## 集成示例：完整工作流

```javascript
// 1. 初始化Canvas
const initCanvas = async () => {
    canvas.value = new window.LabCanvas(canvasContainer.value);
    
    // 2. 加载lab数据
    const labDoc = await db.collection('labs').doc(labId).get();
    canvas.value.import(labDoc.data());
    
    // 3. 监听用户交互
    canvas.value.onElementUpdate = async (element) => {
        // 自动保存
        await saveLab();
    };
    
    // 4. 监听其他用户更新（实时协作）
    db.collection('labs').doc(labId).onSnapshot((doc) => {
        if (doc.data().updatedAt > lastUpdateTime) {
            canvas.value.import(doc.data());
            lastUpdateTime = doc.data().updatedAt;
        }
    });
};
```

---

## API变更日志

### v1.0.0 (当前)
- ✅ 基础Canvas系统
- ✅ Pan & Zoom
- ✅ 元素管理
- ✅ 连接线系统
- ✅ 动量平移

### v1.1.0 (计划中)
- 🔜 虚拟滚动（10000+元素）
- 🔜 撤销/重做
- 🔜 时间旅行调试
- 🔜 性能分析工具

