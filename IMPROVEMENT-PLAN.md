# LabMate Pro 系统改进计划 - 基于原项目学习

## 📊 对标分析

### 原项目优秀设计

#### 1. Chat 系统设计
```
✅ 完整的消息类型系统 (text, image, file, code, element)
✅ 反应系统 (Reactions/Emoji)
✅ 消息编辑/删除功能
✅ 文件分享机制 (base64 嵌入)
✅ 元素分享功能 (画布元素直接分享到聊天)
✅ 实时监听架构 (onSnapshot)
```

#### 2. Canvas 系统设计
```
✅ CanvasHistory 类 - 状态栈 Undo/Redo
✅ 动量/惯性拖拽 (panVelocity, applyMomentum)
✅ 框选系统 + 多选支持
✅ 回调事件系统 (onElementDoubleClick, onSelectionChange)
✅ 性能监控 (fps, frameCount)
✅ 完整的事件处理 (mouse, touch, keyboard)
```

#### 3. Element 系统设计
```
✅ 基础类继承 (LabElement 作为基类)
✅ 富元素实现 (Timer.update(), Protocol.toggleStep)
✅ 完整的 render() 方法
✅ 元数据灵活性 (metadata 对象)
✅ toJSON() 序列化支持
```

---

## 🔧 改进方向

### 优先级 1: Chat 系统强化

**当前状态 (Project-Rebuild)**:
- ✅ 基础消息发送
- ❌ 缺少消息编辑/删除
- ❌ 缺少反应系统
- ❌ 缺少文件分享
- ❌ 缺少元素分享到聊天

**改进内容**:
- [ ] 添加消息类型系统 (MIME type support)
- [ ] 实现消息反应 (Emoji reactions)
- [ ] 消息编辑/删除
- [ ] 文件上传/分享
- [ ] 元素快速分享

### 优先级 2: Canvas 系统完善

**当前状态 (Project-Rebuild)**:
- ✅ 基础 Pan/Zoom
- ✅ 多级脏标记 (v2.6.0)
- ✅ Undo/Redo (v2.6.0)
- ❌ 缺少动量/惯性
- ❌ 缺少性能监控 UI
- ❌ 缺少双击编辑
- ❌ 缺少框选优化

**改进内容**:
- [ ] 添加惯性拖拽
- [ ] 性能监控 HUD (FPS/内存)
- [ ] 双击快速编辑
- [ ] 框选优化 + Shift 多选
- [ ] 右键菜单

### 优先级 3: Element 系统升级

**当前状态 (Project-Rebuild)**:
- ✅ 基础元素类
- ✅ 5 种元素类型
- ❌ 缺少元素编辑对话框
- ❌ 缺少元素属性实时更新
- ❌ 缺少元素预设 (Presets)
- ❌ 缺少元素模板库

**改进内容**:
- [ ] 元素编辑界面 (Sidebar)
- [ ] 属性实时同步
- [ ] 元素预设系统
- [ ] 拖拽调整大小
- [ ] 元素对齐/分布工具

---

## 📈 实现计划

### Phase 1: Chat 系统升级 (v2.7.0)

```
v2.7.0 Chat Enhancement
├── 消息反应系统
│   ├── emoji picker
│   ├── 反应统计
│   └── 反应撤销
├── 消息编辑/删除
│   ├── 编辑历史
│   ├── 删除确认
│   └── 标记为已编辑
├── 文件分享
│   ├── 文件上传 UI
│   ├── 进度条
│   └── 文件预览
└── 元素分享
    ├── 快速分享按钮
    ├── 分享预览
    └── 从聊天恢复
```

### Phase 2: Canvas 优化 (v2.8.0)

```
v2.8.0 Canvas Enhancement
├── 惯性拖拽
│   ├── panVelocity 计算
│   ├── 动画帧管理
│   └── 摩擦力参数
├── 交互增强
│   ├── 双击编辑
│   ├── 右键菜单
│   ├── 框选优化
│   └── Shift 多选
├── 性能监控
│   ├── FPS 显示
│   ├── 渲染时间统计
│   └── 元素数量指示
└── 对齐工具
    ├── 网格对齐
    ├── 智能对齐
    └── 分布工具
```

### Phase 3: Element 系统完善 (v2.9.0)

```
v2.9.0 Element Enhancement
├── 编辑界面
│   ├── 属性面板
│   ├── 颜色选择
│   ├── 字体设置
│   └── 实时预览
├── 元素管理
│   ├── 元素库 (Library)
│   ├── 预设系统
│   ├── 模板导入/导出
│   └── 元素分组
└── 尺寸调整
    ├── 拖拽角点
    ├── 约束比例
    ├── 对齐辅助线
    └── 尺寸数值输入
```

---

## 💡 核心设计模式

### 1. 消息类型系统

```javascript
const MessageTypes = {
    TEXT: 'text',
    IMAGE: 'image',
    FILE: 'file',
    CODE: 'code',
    ELEMENT: 'element',
    SYSTEM: 'system'
};

// 每种类型有对应的处理器
const messageHandlers = {
    [MessageTypes.FILE]: renderFileMessage,
    [MessageTypes.ELEMENT]: renderElementMessage,
    // ...
};
```

### 2. 回调驱动事件系统

```javascript
// Canvas 中的事件回调
this.onElementDoubleClick = null;    // 双击编辑
this.onSelectionChange = null;       // 选择改变
this.onElementUpdate = null;         // 元素更新
this.onContextMenu = null;           // 右键菜单

// 使用
canvasEngine.onElementDoubleClick = (element) => {
    editElement(element);
};
```

### 3. 元数据灵活系统

```javascript
// 元素可以有任意元数据
element.metadata = {
    fontSize: 12,
    images: [],
    duration: 300,
    steps: [],
    // 自定义字段
};
```

---

## 🎯 质量目标

| 指标 | 当前 | 目标 |
|------|------|------|
| Chat 消息类型 | 1 (text only) | 5+ |
| Canvas 交互流畅度 | 80% | 95%+ |
| Element 编辑功能 | 基础 | 完整 |
| 代码重用率 | 70% | 85%+ |
| 文档完整度 | 60% | 90%+ |

---

## 📅 时间表

| 版本 | 功能 | 预计时间 |
|------|------|---------|
| v2.6.1 | ✅ 已完成 Bug 修复 | 完成 |
| v2.7.0 | Chat 升级 | 1-2 周 |
| v2.8.0 | Canvas 优化 | 1-2 周 |
| v2.9.0 | Element 完善 | 1-2 周 |
| v3.0.0 | 综合优化版 | 待定 |

---

## ✅ 立即行动项

1. [ ] 学习原项目代码结构
2. [ ] 提取可复用模式
3. [ ] 更新 chat.js (消息类型)
4. [ ] 更新 canvas.js (惯性拖拽)
5. [ ] 更新 elements.js (编辑界面)
6. [ ] 编写集成测试

---

**开始时间**: 2025-12-07  
**上次更新**: 本文档  
**状态**: 📋 计划中
