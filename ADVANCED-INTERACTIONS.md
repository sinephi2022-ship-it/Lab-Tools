# 高级交互功能 (v2.9.0)

## 功能概览

集成了专业级的元素交互功能，包括双击编辑、右键上下文菜单、智能对齐和分布系统。

## 核心功能

### 1. 双击编辑 (Double-Click to Edit)

**功能描述**: 双击任何元素进入编辑模式

```javascript
canvas.addEventListener('dblclick', (e) => {
    // 自动触发 onElementDoubleClick 回调
    if (clickedElement) {
        clickedElement.editing = true;
        emit('onElementDoubleClick', clickedElement);
    }
});
```

**使用场景**:
- 便签快速编辑文本
- 计时器编辑名称和时间
- 文本框内容修改

**快速编辑流程**:
1. 双击元素
2. 出现编辑模式指示（虚线框）
3. 修改内容
4. Escape 键或点击其他地方退出

### 2. 右键上下文菜单

**菜单项包括**:

#### 当点击元素时:
```javascript
[
    { label: '编辑', action: 'edit' },
    { label: '复制', action: 'copy' },
    { label: '删除', action: 'delete' },
    { type: 'separator' },
    { label: '锁定', action: 'toggle-lock' },
    { label: '隐藏', action: 'toggle-visibility' },
    { type: 'separator' },
    { label: '克隆', action: 'clone' },
    { label: '对齐到顶部', action: 'align-top' },
    { label: '水平分布', action: 'distribute-h' }
]
```

#### 当点击空白处时:
```javascript
[
    { label: '粘贴', action: 'paste' },
    { type: 'separator' },
    { label: '全选', action: 'select-all' },
    { label: '取消选择', action: 'deselect' }
]
```

**右键菜单回调**:
```javascript
canvas.onContextMenu = (menu) => {
    // menu.x, menu.y - 菜单位置
    // menu.items - 菜单项数组
    showContextMenu(menu);
};
```

### 3. 元素对齐系统

**对齐方向**:

```javascript
// 水平对齐
canvas.alignSelectedElements('left');    // 左对齐
canvas.alignSelectedElements('right');   // 右对齐
canvas.alignSelectedElements('center-h'); // 水平居中

// 竖直对齐
canvas.alignSelectedElements('top');      // 顶部对齐
canvas.alignSelectedElements('bottom');   // 底部对齐
canvas.alignSelectedElements('center-v'); // 竖直居中
```

**对齐示意图**:

```
Before:          After (left align):
┌─┐              ┌─┐
│1│  ┌──┐        │1│
│ │  │2 │  →     │2│
│ │ ┌──┐         ┌──┐
   │3 │         │3 │
   └──┘         └──┘

Before:          After (horizontal center):
┌─┐              
│1│  ┌──┐            ┌─┐
│ │  │2 │  →     ┌──┐ ┌──┐
│ │ ┌──┐         │3 │
   │3 │         
   └──┘         
```

### 4. 元素分布系统

**均匀分布** - 相等间距排列多个元素

```javascript
// 水平分布（相等间距）
canvas.distributeSelectedElements('horizontal', spacing = 20);

// 竖直分布（相等间距）
canvas.distributeSelectedElements('vertical', spacing = 20);
```

**分布示意图**:

```
Before:          After (horizontal distribute, spacing=20px):
┌─┐              
│1│ ┌──┐         ┌─┐    ┌──┐    ┌──┐
   │2 │    →     │1│    │2 │    │3 │
     ┌──┐
     │3 │
     └──┘
     
     20px gap    20px gap    20px gap
```

**应用场景**:
- 表格单元格均匀排列
- 图表数据点等距分布
- UI 按钮组整洁排列

### 5. 元素克隆

**功能**:
```javascript
canvas.cloneSelectedElements();
```

**行为**:
- 克隆所有选中元素
- 新元素位移 (20px, 20px)
- 自动选中克隆的元素
- 保留原始元素的所有属性

### 6. 属性编辑系统

#### BaseElement 属性面板

```javascript
const panel = element.getPropertyPanel();
// 返回格式:
[
    { name: 'x', label: '位置 X', type: 'number', value: 100 },
    { name: 'y', label: '位置 Y', type: 'number', value: 200 },
    { name: 'width', label: '宽度', type: 'number', value: 250 },
    { name: 'height', label: '高度', type: 'number', value: 200 },
    { name: 'rotation', label: '旋转角度', type: 'number', value: 0 },
    { name: 'zIndex', label: '图层深度', type: 'number', value: 0 },
    { name: 'locked', label: '锁定', type: 'boolean', value: false },
    { name: 'visible', label: '可见', type: 'boolean', value: true }
]
```

#### 更新属性

```javascript
element.updateProperty('width', 300);
element.updateProperty('x', 150);
element.updateProperty('locked', true);
```

#### 多选属性面板

```javascript
const multiProps = canvas.getSelectedElementsProperties();
// 返回通用属性用于批量编辑
[
    { name: 'alignment', label: '对齐', type: 'enum', options: ['left', 'right', 'center-h', ...] },
    { name: 'distribution', label: '分布', type: 'enum', options: ['horizontal', 'vertical'] },
    { name: 'spacing', label: '间距', type: 'number', value: 20 }
]
```

## 交互快捷键

| 快捷键 | 功能 |
|--------|------|
| `双击` | 编辑元素 |
| `右键` | 打开上下文菜单 |
| `Ctrl+A` | 全选 |
| `Ctrl+C` | 复制（已选） |
| `Ctrl+V` | 粘贴 |
| `Ctrl+D` | 克隆（已选） |
| `Delete` | 删除（已选） |
| `Escape` | 取消选择 |

## API 参考

### Canvas 对象新增方法

```javascript
// 对齐
canvas.alignSelectedElements(direction: string)
  // direction: 'left' | 'right' | 'center-h' | 'top' | 'bottom' | 'center-v'

// 分布
canvas.distributeSelectedElements(direction: string, spacing: number)
  // direction: 'horizontal' | 'vertical'
  // spacing: 间距像素值，默认 20

// 克隆
canvas.cloneSelectedElements()

// 获取属性
canvas.getSelectedElementsProperties()
  // 返回属性面板配置数组

// 事件回调
canvas.onElementDoubleClick = (element) => { ... }
canvas.onContextMenu = (menu) => { ... }
```

### BaseElement 对象新增方法

```javascript
// 获取属性面板
element.getPropertyPanel(): Array<PropertyItem>

// 更新属性
element.updateProperty(name: string, value: any)

// 获取边界框
element.getBounds(): Bounds
  // 返回 { left, top, right, bottom, centerX, centerY, width, height }

// 克隆元素
element.clone(): BaseElement

// 对齐到另一个元素
element.alignTo(target: BaseElement, direction: string)

// 静态方法 - 批量分布
BaseElement.distributeElements(elements: Array, direction: string, spacing: number)
```

## 实现细节

### 双击事件处理

```javascript
onDoubleClick(e) {
    const world = this.screenToWorld(screenX, screenY);
    const element = this.getElementAtPoint(world.x, world.y);
    
    if (element) {
        element.editing = true;
        this.onElementDoubleClick?.(element);
        this.dirtyFlags.RENDER = true;
    }
}
```

### 右键菜单动态生成

```javascript
onContextMenu(e) {
    const element = this.getElementAtPoint(worldX, worldY);
    
    const menu = {
        x: e.clientX,
        y: e.clientY,
        items: element ? getElementMenuItems() : getCanvasMenuItems()
    };
    
    this.onContextMenu?.(menu);
}
```

### 对齐算法

```javascript
alignSelectedElements(direction) {
    const bounds = elements.map(el => el.getBounds());
    
    switch (direction) {
        case 'left':
            const leftmost = Math.min(...bounds.map(b => b.left));
            elements.forEach(el => el.x = leftmost);
            break;
        // ... 其他方向
    }
}
```

## 使用示例

### 完整的交互工作流

```javascript
// 1. 创建画布
const canvas = new CanvasEngine(document.getElementById('canvas'));

// 2. 设置菜单处理器
canvas.onContextMenu = (menu) => {
    showContextMenu(menu.x, menu.y, menu.items);
};

canvas.onElementDoubleClick = (element) => {
    showEditDialog(element);
};

// 3. 在应用中处理菜单动作
function handleContextMenuAction(action, element) {
    switch (action) {
        case 'edit':
            showEditDialog(element);
            break;
        case 'clone':
            canvas.cloneSelectedElements();
            break;
        case 'align-top':
            canvas.alignSelectedElements('top');
            break;
        case 'distribute-h':
            canvas.distributeSelectedElements('horizontal', 20);
            break;
        // ...
    }
}

// 4. 双击快速编辑
canvas.addEventListener('dblclick', () => {
    // 自动触发 onElementDoubleClick
});
```

### 属性编辑面板

```javascript
// 获取元素属性
const props = selectedElement.getPropertyPanel();

// 渲染属性面板
renderPropertyPanel(props);

// 用户编辑后更新
element.updateProperty('width', newValue);
```

## 性能考虑

- **对齐/分布**: O(n log n)，因为涉及排序
- **属性更新**: O(1)
- **多选操作**: O(n)，n = 选中元素数量
- **推荐限制**: 单次选中不超过 500 个元素

## 未来规划 (v3.0.0)

- [ ] 高级对齐网格（吸附）
- [ ] 组织元素（群组）
- [ ] 智能排列（自动布局）
- [ ] 样式预设面板
- [ ] 命名图层系统
- [ ] 元素搜索和过滤
- [ ] 快捷键自定义

---

**版本**: v2.9.0  
**最后更新**: 2025-12-15  
**状态**: ✅ 已部署到 GitHub Pages
