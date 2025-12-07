# Canvas 性能监控面板 (v2.8.0)

## 功能概览

Canvas 引擎现已集成实时性能监控面板，显示关键性能指标，帮助快速诊断和优化性能问题。

## 性能指标详解

### 1. **FPS (Frames Per Second)**
- **含义**: 每秒帧率
- **目标**: ≥ 50 FPS（流畅体验）
- **颜色编码**:
  - 🟢 **绿色** (50+ FPS): 性能优秀
  - 🟡 **黄色** (30-49 FPS): 性能中等
  - 🔴 **红色** (<30 FPS): 性能不佳

### 2. **Elements**
- **含义**: 当前画布上的元素总数
- **监测目的**: 检测元素积累过多导致的性能下降
- **参考值**: 1000+ 元素应保持 40+ FPS

### 3. **Selected**
- **含义**: 当前选中的元素数量
- **颜色**: 有选中时显示黄色，无选中时显示灰色
- **用途**: 快速检查多选状态

### 4. **Zoom**
- **含义**: 当前画布缩放百分比
- **范围**: 10% - 500%
- **性能影响**: 极端缩放比例可能影响渲染性能

### 5. **Cam (Camera Position)**
- **含义**: 摄像机当前世界坐标
- **格式**: (X, Y)
- **用途**: 调试坐标系统和元素位置

### 6. **Render**
- **含义**: 单帧渲染耗时（毫秒）
- **目标**: < 16.67ms（对应 60 FPS）
- **分布**: 
  - 清空画布 + 变换: ~1-2ms
  - 网格渲染: 0.2-1.5ms（缓存命中时）
  - 元素渲染: 2-8ms（取决于元素数量和复杂度）

### 7. **Grid Cache**
- **✓ (勾)**: 网格缓存命中，使用缓存的网格线
- **✗ (叉)**: 网格缓存未命中，需要重新计算
- **性能影响**: 
  - 缓存命中: 网格渲染时间 ≤ 1.5ms
  - 缓存未命中: 网格渲染时间 ≥ 5ms

## 实现细节

### 新增的性能追踪对象

```javascript
this.performanceMetrics = {
    frameCount: 0,           // 当前秒内的帧数
    fps: 0,                  // 计算出的 FPS
    lastSecond: Date.now(),  // 上一次 FPS 更新的时间
    renderTime: 0,           // 上一帧的渲染耗时 (ms)
    elementRenderTime: 0,    // 元素渲染耗时 (ms)
    gridRenderTime: 0        // 网格渲染耗时 (ms)
};
```

### 渲染流程中的计时

```javascript
render() {
    const renderStartTime = performance.now();
    
    // ... 渲染逻辑 ...
    
    // 记录元素渲染时间
    const elementStartTime = performance.now();
    this.elements.forEach(element => {
        if (element.render) {
            element.render(this.ctx, this.selectedElements.has(element.id));
        }
    });
    this.performanceMetrics.elementRenderTime = performance.now() - elementStartTime;
    
    // ... 继续渲染 ...
    
    // 记录总渲染时间
    this.performanceMetrics.renderTime = performance.now() - renderStartTime;
}
```

## 性能优化建议

### 当 FPS 低于 50 时:

1. **检查元素数量**
   - 如果 Elements > 2000，考虑使用空间分割（四叉树）
   - 移除不可见区域的元素

2. **检查 Render 耗时**
   - 如果 Render > 20ms，优化元素渲染代码
   - 考虑降低渲染质量（简化形状、减少阴影等）

3. **检查 Grid Cache 状态**
   - 如果持续显示 ✗，说明缩放频繁变化
   - 尝试稳定缩放，让缓存命中

4. **元素数量 vs Render 时间对应表**
   ```
   100-500 元素    → Render 2-5ms     (FPS 60)
   500-1000 元素   → Render 5-10ms    (FPS 50-60)
   1000-2000 元素  → Render 10-15ms   (FPS 40-60)
   2000+ 元素      → Render 15-30ms   (FPS 20-40)
   ```

## 面板外观

性能监控面板位于画布左上角，显示内容如下：

```
┌────────────────────────────┐
│ FPS: 58                     │ ← 绿色表示优秀
│ Elements: 156               │
│ Selected: 3                 │ ← 黄色表示有选中元素
│ Zoom: 120%                  │
│ Cam: (245, -180)            │
│ Render: 8.34ms              │ ← 蓝色
│ Grid Cache: ✓               │ ← 绿色表示命中
└────────────────────────────┘
```

## 已知优化效果

### v2.8.0 改进

- ✅ 实时 FPS 计数（秒级更新）
- ✅ 逐帧渲染时间追踪
- ✅ 网格缓存命中状态可视化
- ✅ 性能指标颜色编码（速速识别问题）

### 与 v2.6.0 的对比

| 指标 | v2.6.0 | v2.8.0 |
|------|--------|--------|
| 网格渲染时间 | 5-6ms | 1.5ms (缓存命中) |
| FPS (100 元素) | 55-60 | 55-60 |
| FPS (1000 元素) | 40-50 | 40-50 |
| 可见性 | 无性能监控 | 完整性能面板 |

## 未来计划

### v2.9.0 改进（待实现）

- [ ] 性能数据导出为 CSV/JSON
- [ ] 历史性能趋势图表
- [ ] 性能警告（如 FPS 跌破阈值自动告警）
- [ ] 逐元素渲染时间统计
- [ ] 内存使用情况监控

## 调试建议

### 如何快速诊断性能问题

1. **打开浏览器开发者工具** (F12)
2. **查看 Console 标签**，确认没有报错
3. **观察性能监控面板**:
   - 如果 FPS 红色，检查元素数和渲染时间
   - 如果 Grid Cache 显示 ✗，尝试停止缩放
   - 如果 Render 时间 > 20ms，检查浏览器标签页数和其他进程

### 开启浏览器性能分析

```javascript
// 在浏览器 Console 中执行
performance.mark('render-start');
// ... 执行操作 ...
performance.mark('render-end');
performance.measure('render', 'render-start', 'render-end');
console.table(performance.getEntriesByType('measure'));
```

## 相关文件

- `canvas.js` - 性能监控实现（lines 80-95, 691-760, 806-870）
- `index.html` - v2.8.0 版本配置
- `CANVAS-OPTIMIZATION.md` - Canvas 优化背景
- `CANVAS-OPTIMIZATION-SUMMARY.md` - 详细优化说明

---

**版本**: v2.8.0  
**最后更新**: 2025-12-15  
**状态**: ✅ 已部署到 GitHub Pages
