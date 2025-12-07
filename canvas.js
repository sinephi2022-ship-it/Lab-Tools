/**
 * LabMate Pro - Canvas Engine (High Performance Core)
 * 高性能 Canvas 渲染引擎 - 支持无限画布、60FPS流畅渲染
 * 
 * 核心功能:
 * - 摄像机系统 (平移/缩放)
 * - 坐标转换 (屏幕坐标 ↔ 世界坐标)
 * - 元素管理 (增删改查)
 * - 事件处理 (鼠标/触摸/键盘)
 * - 渲染循环 (60FPS + 脏标记优化)
 * - 框选系统
 * - 惯性拖拽
 * 
 * @author Sine chen
 * @version 2.0.0
 * @date 2025-12-07
 */

class CanvasEngine {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        
        // 摄像机参数
        this.camera = {
            x: 0,                    // 摄像机X位置
            y: 0,                    // 摄像机Y位置
            zoom: 1,                 // 缩放倍率 (0.1 - 5.0)
            minZoom: 0.1,
            maxZoom: 5.0
        };
        
        // 元素管理
        this.elements = new Map();          // 所有元素 <id, element>
        this.selectedElements = new Set();  // 已选中元素 ID
        this.hoveredElement = null;         // 鼠标悬停元素
        
        // 状态标记
        this.isDragging = false;            // 是否正在拖拽元素
        this.isPanning = false;             // 是否正在平移画布
        this.isSelecting = false;           // 是否正在框选
        this.isDirty = true;                // 是否需要重绘
        
        // 鼠标状态
        this.mouse = {
            x: 0, y: 0,                     // 屏幕坐标
            worldX: 0, worldY: 0,           // 世界坐标
            downX: 0, downY: 0,             // 按下时的坐标
            button: -1                       // 按下的按钮 (0=左键, 1=中键, 2=右键)
        };
        
        // 拖拽状态
        this.dragStart = { x: 0, y: 0 };
        this.dragOffset = new Map();        // 每个元素的拖拽偏移
        
        // 框选状态
        this.selectionBox = {
            active: false,
            startX: 0,
            startY: 0,
            endX: 0,
            endY: 0
        };
        
        // 惯性拖拽
        this.velocity = { x: 0, y: 0 };
        this.lastPanX = 0;
        this.lastPanY = 0;
        this.lastPanTime = 0;
        
        // 性能优化
        this.renderRequest = null;
        this.lastRenderTime = 0;
        this.fps = 60;
        
        // 网格设置
        this.grid = {
            enabled: true,
            size: 20,
            color: '#e5e7eb'
        };
        
        // 初始化
        this.resize();
        this.initEvents();
        this.startRenderLoop();
        
        console.log('✅ Canvas Engine 初始化成功');
    }
    
    // ========================================
    // 坐标转换
    // ========================================
    
    /**
     * 屏幕坐标 → 世界坐标
     */
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.canvas.width / 2) / this.camera.zoom + this.camera.x,
            y: (screenY - this.canvas.height / 2) / this.camera.zoom + this.camera.y
        };
    }
    
    /**
     * 世界坐标 → 屏幕坐标
     */
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.camera.x) * this.camera.zoom + this.canvas.width / 2,
            y: (worldY - this.camera.y) * this.camera.zoom + this.canvas.height / 2
        };
    }
    
    // ========================================
    // 摄像机控制
    // ========================================
    
    /**
     * 平移摄像机
     */
    pan(dx, dy) {
        this.camera.x += dx / this.camera.zoom;
        this.camera.y += dy / this.camera.zoom;
        this.isDirty = true;
    }
    
    /**
     * 缩放摄像机
     */
    zoom(delta, centerX, centerY) {
        const oldZoom = this.camera.zoom;
        const zoomFactor = delta > 0 ? 1.1 : 0.9;
        const newZoom = Math.max(
            this.camera.minZoom,
            Math.min(this.camera.maxZoom, oldZoom * zoomFactor)
        );
        
        if (newZoom === oldZoom) return;
        
        // 缩放前的世界坐标
        const worldPos = this.screenToWorld(centerX, centerY);
        
        // 应用新缩放
        this.camera.zoom = newZoom;
        
        // 缩放后的世界坐标
        const newWorldPos = this.screenToWorld(centerX, centerY);
        
        // 调整摄像机位置,使缩放中心保持不变
        this.camera.x += worldPos.x - newWorldPos.x;
        this.camera.y += worldPos.y - newWorldPos.y;
        
        this.isDirty = true;
    }
    
    /**
     * 重置摄像机
     */
    resetCamera() {
        this.camera.x = 0;
        this.camera.y = 0;
        this.camera.zoom = 1;
        this.isDirty = true;
    }
    
    /**
     * 适应所有元素到视图
     */
    fitToView() {
        if (this.elements.size === 0) {
            this.resetCamera();
            return;
        }
        
        // 计算所有元素的边界
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        this.elements.forEach(el => {
            minX = Math.min(minX, el.x);
            minY = Math.min(minY, el.y);
            maxX = Math.max(maxX, el.x + el.width);
            maxY = Math.max(maxY, el.y + el.height);
        });
        
        // 计算中心点
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        // 计算缩放比例
        const boundsWidth = maxX - minX;
        const boundsHeight = maxY - minY;
        const padding = 100;
        
        const zoomX = (this.canvas.width - padding * 2) / boundsWidth;
        const zoomY = (this.canvas.height - padding * 2) / boundsHeight;
        const zoom = Math.min(zoomX, zoomY, this.camera.maxZoom);
        
        // 应用摄像机位置
        this.camera.x = centerX;
        this.camera.y = centerY;
        this.camera.zoom = Math.max(this.camera.minZoom, zoom);
        this.isDirty = true;
    }
    
    // ========================================
    // 元素管理
    // ========================================
    
    /**
     * 添加元素
     */
    addElement(element) {
        this.elements.set(element.id, element);
        this.isDirty = true;
        return element;
    }
    
    /**
     * 删除元素
     */
    removeElement(id) {
        this.elements.delete(id);
        this.selectedElements.delete(id);
        this.isDirty = true;
    }
    
    /**
     * 获取元素
     */
    getElement(id) {
        return this.elements.get(id);
    }
    
    /**
     * 清空所有元素
     */
    clearElements() {
        this.elements.clear();
        this.selectedElements.clear();
        this.isDirty = true;
    }
    
    /**
     * 检测点击的元素 (从上到下)
     */
    getElementAtPoint(worldX, worldY) {
        // 反向遍历 (后绘制的元素在上层)
        const elementsArray = Array.from(this.elements.values()).reverse();
        
        for (const element of elementsArray) {
            if (this.isPointInElement(worldX, worldY, element)) {
                return element;
            }
        }
        
        return null;
    }
    
    /**
     * 判断点是否在元素内
     */
    isPointInElement(worldX, worldY, element) {
        return worldX >= element.x &&
               worldX <= element.x + element.width &&
               worldY >= element.y &&
               worldY <= element.y + element.height;
    }
    
    /**
     * 获取框选范围内的所有元素
     */
    getElementsInBox(box) {
        const minX = Math.min(box.startX, box.endX);
        const maxX = Math.max(box.startX, box.endX);
        const minY = Math.min(box.startY, box.endY);
        const maxY = Math.max(box.startY, box.endY);
        
        const selected = [];
        
        this.elements.forEach(element => {
            // 检查元素是否与框选区域相交
            if (element.x + element.width >= minX &&
                element.x <= maxX &&
                element.y + element.height >= minY &&
                element.y <= maxY) {
                selected.push(element);
            }
        });
        
        return selected;
    }
    
    // ========================================
    // 事件处理
    // ========================================
    
    initEvents() {
        // 鼠标事件
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.onWheel.bind(this));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // 触摸事件 (移动端支持)
        this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
        
        // 键盘事件
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        
        // 窗口大小调整
        window.addEventListener('resize', this.resize.bind(this));
    }
    
    /**
     * 鼠标按下
     */
    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
        this.mouse.button = e.button;
        
        const world = this.screenToWorld(this.mouse.x, this.mouse.y);
        this.mouse.worldX = world.x;
        this.mouse.worldY = world.y;
        this.mouse.downX = this.mouse.worldX;
        this.mouse.downY = this.mouse.worldY;
        
        // 右键或中键 = 平移画布
        if (e.button === 1 || e.button === 2) {
            this.isPanning = true;
            this.canvas.style.cursor = 'grabbing';
            return;
        }
        
        // 左键
        if (e.button === 0) {
            const clickedElement = this.getElementAtPoint(world.x, world.y);
            
            if (clickedElement) {
                // 点击了元素
                if (!this.selectedElements.has(clickedElement.id)) {
                    // 如果没按 Ctrl,清空之前的选择
                    if (!e.ctrlKey && !e.metaKey) {
                        this.selectedElements.clear();
                    }
                    this.selectedElements.add(clickedElement.id);
                }
                
                // 准备拖拽
                this.isDragging = true;
                this.dragStart = { x: world.x, y: world.y };
                
                // 记录每个选中元素的初始位置
                this.dragOffset.clear();
                this.selectedElements.forEach(id => {
                    const el = this.elements.get(id);
                    if (el) {
                        this.dragOffset.set(id, {
                            x: el.x - world.x,
                            y: el.y - world.y
                        });
                    }
                });
                
                this.canvas.style.cursor = 'move';
            } else {
                // 点击了空白处 - 开始框选
                if (!e.ctrlKey && !e.metaKey) {
                    this.selectedElements.clear();
                }
                
                this.isSelecting = true;
                this.selectionBox = {
                    active: true,
                    startX: world.x,
                    startY: world.y,
                    endX: world.x,
                    endY: world.y
                };
                
                this.canvas.style.cursor = 'crosshair';
            }
            
            this.isDirty = true;
        }
    }
    
    /**
     * 鼠标移动
     */
    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const newX = e.clientX - rect.left;
        const newY = e.clientY - rect.top;
        
        const dx = newX - this.mouse.x;
        const dy = newY - this.mouse.y;
        
        this.mouse.x = newX;
        this.mouse.y = newY;
        
        const world = this.screenToWorld(this.mouse.x, this.mouse.y);
        this.mouse.worldX = world.x;
        this.mouse.worldY = world.y;
        
        // 平移画布
        if (this.isPanning) {
            this.pan(-dx, -dy);
            
            // 记录速度 (用于惯性)
            const now = Date.now();
            const dt = now - this.lastPanTime;
            if (dt > 0) {
                this.velocity.x = -dx / dt;
                this.velocity.y = -dy / dt;
            }
            this.lastPanTime = now;
            
            return;
        }
        
        // 拖拽元素
        if (this.isDragging) {
            this.selectedElements.forEach(id => {
                const element = this.elements.get(id);
                const offset = this.dragOffset.get(id);
                if (element && offset) {
                    element.x = world.x + offset.x;
                    element.y = world.y + offset.y;
                }
            });
            this.isDirty = true;
            return;
        }
        
        // 框选
        if (this.isSelecting) {
            this.selectionBox.endX = world.x;
            this.selectionBox.endY = world.y;
            this.isDirty = true;
            return;
        }
        
        // 检测悬停
        const hoveredElement = this.getElementAtPoint(world.x, world.y);
        if (hoveredElement !== this.hoveredElement) {
            this.hoveredElement = hoveredElement;
            this.canvas.style.cursor = hoveredElement ? 'pointer' : 'default';
            this.isDirty = true;
        }
    }
    
    /**
     * 鼠标松开
     */
    onMouseUp(e) {
        // 结束框选
        if (this.isSelecting) {
            const selectedElements = this.getElementsInBox(this.selectionBox);
            selectedElements.forEach(el => this.selectedElements.add(el.id));
            this.selectionBox.active = false;
            this.isSelecting = false;
            this.isDirty = true;
        }
        
        // 结束拖拽
        if (this.isDragging) {
            this.isDragging = false;
            this.dragOffset.clear();
            
            // 触发元素移动事件 (可用于保存到云端)
            if (this.onElementsMoved) {
                this.onElementsMoved(Array.from(this.selectedElements));
            }
        }
        
        // 结束平移
        if (this.isPanning) {
            this.isPanning = false;
            
            // 应用惯性
            this.applyInertia();
        }
        
        this.canvas.style.cursor = 'default';
    }
    
    /**
     * 鼠标滚轮 (缩放)
     */
    onWheel(e) {
        e.preventDefault();
        this.zoom(-e.deltaY, this.mouse.x, this.mouse.y);
    }
    
    /**
     * 键盘按下
     */
    onKeyDown(e) {
        // Delete / Backspace - 删除选中元素
        if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedElements.size > 0) {
            e.preventDefault();
            this.selectedElements.forEach(id => this.removeElement(id));
            this.selectedElements.clear();
            
            if (this.onElementsDeleted) {
                this.onElementsDeleted();
            }
        }
        
        // Ctrl+A - 全选
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            this.selectedElements.clear();
            this.elements.forEach((el, id) => this.selectedElements.add(id));
            this.isDirty = true;
        }
        
        // Escape - 取消选择
        if (e.key === 'Escape') {
            this.selectedElements.clear();
            this.isDirty = true;
        }
    }
    
    /**
     * 触摸开始 (移动端)
     */
    onTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY,
                button: 0
            });
            this.onMouseDown(mouseEvent);
        }
    }
    
    /**
     * 触摸移动
     */
    onTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.onMouseMove(mouseEvent);
        }
    }
    
    /**
     * 触摸结束
     */
    onTouchEnd(e) {
        this.onMouseUp(new MouseEvent('mouseup'));
    }
    
    /**
     * 应用惯性拖拽
     */
    applyInertia() {
        const friction = 0.95;
        const minVelocity = 0.01;
        
        const animate = () => {
            if (Math.abs(this.velocity.x) < minVelocity && Math.abs(this.velocity.y) < minVelocity) {
                this.velocity = { x: 0, y: 0 };
                return;
            }
            
            this.camera.x += this.velocity.x * 10;
            this.camera.y += this.velocity.y * 10;
            
            this.velocity.x *= friction;
            this.velocity.y *= friction;
            
            this.isDirty = true;
            requestAnimationFrame(animate);
        };
        
        if (Math.abs(this.velocity.x) > minVelocity || Math.abs(this.velocity.y) > minVelocity) {
            requestAnimationFrame(animate);
        }
    }
    
    // ========================================
    // 渲染系统
    // ========================================
    
    /**
     * 启动渲染循环
     */
    startRenderLoop() {
        const render = (timestamp) => {
            // 脏标记优化 - 只在需要时重绘
            if (this.isDirty) {
                this.render();
                this.isDirty = false;
            }
            
            this.renderRequest = requestAnimationFrame(render);
        };
        
        this.renderRequest = requestAnimationFrame(render);
    }
    
    /**
     * 停止渲染循环
     */
    stopRenderLoop() {
        if (this.renderRequest) {
            cancelAnimationFrame(this.renderRequest);
            this.renderRequest = null;
        }
    }
    
    /**
     * 渲染一帧
     */
    render() {
        // 清空画布
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 保存上下文
        this.ctx.save();
        
        // 应用摄像机变换
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // 绘制网格
        if (this.grid.enabled) {
            this.renderGrid();
        }
        
        // 绘制所有元素
        this.elements.forEach(element => {
            if (element.render) {
                element.render(this.ctx, this.selectedElements.has(element.id));
            }
        });
        
        // 绘制框选框
        if (this.selectionBox.active) {
            this.renderSelectionBox();
        }
        
        // 恢复上下文
        this.ctx.restore();
        
        // 绘制 UI 信息 (屏幕空间)
        this.renderUI();
    }
    
    /**
     * 渲染网格
     */
    renderGrid() {
        const gridSize = this.grid.size;
        const zoom = this.camera.zoom;
        
        // 计算可见区域
        const viewportLeft = this.camera.x - (this.canvas.width / 2 / zoom);
        const viewportTop = this.camera.y - (this.canvas.height / 2 / zoom);
        const viewportRight = this.camera.x + (this.canvas.width / 2 / zoom);
        const viewportBottom = this.camera.y + (this.canvas.height / 2 / zoom);
        
        // 网格线起始位置
        const startX = Math.floor(viewportLeft / gridSize) * gridSize;
        const startY = Math.floor(viewportTop / gridSize) * gridSize;
        
        this.ctx.strokeStyle = this.grid.color;
        this.ctx.lineWidth = 1 / zoom;
        this.ctx.beginPath();
        
        // 绘制垂直线
        for (let x = startX; x <= viewportRight; x += gridSize) {
            this.ctx.moveTo(x, viewportTop);
            this.ctx.lineTo(x, viewportBottom);
        }
        
        // 绘制水平线
        for (let y = startY; y <= viewportBottom; y += gridSize) {
            this.ctx.moveTo(viewportLeft, y);
            this.ctx.lineTo(viewportRight, y);
        }
        
        this.ctx.stroke();
    }
    
    /**
     * 渲染框选框
     */
    renderSelectionBox() {
        const box = this.selectionBox;
        const x = Math.min(box.startX, box.endX);
        const y = Math.min(box.startY, box.endY);
        const width = Math.abs(box.endX - box.startX);
        const height = Math.abs(box.endY - box.startY);
        
        // 填充
        this.ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        this.ctx.fillRect(x, y, width, height);
        
        // 边框
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 2 / this.camera.zoom;
        this.ctx.setLineDash([5 / this.camera.zoom, 5 / this.camera.zoom]);
        this.ctx.strokeRect(x, y, width, height);
        this.ctx.setLineDash([]);
    }
    
    /**
     * 渲染 UI 信息
     */
    renderUI() {
        // 显示 FPS, 元素数量, 缩放等信息
        this.ctx.fillStyle = '#000';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Elements: ${this.elements.size}`, 10, 20);
        this.ctx.fillText(`Selected: ${this.selectedElements.size}`, 10, 35);
        this.ctx.fillText(`Zoom: ${Math.round(this.camera.zoom * 100)}%`, 10, 50);
    }
    
    /**
     * 调整画布大小
     */
    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.isDirty = true;
    }
    
    /**
     * 导出画布数据
     */
    export() {
        return {
            camera: { ...this.camera },
            elements: Array.from(this.elements.values()).map(el => el.toJSON())
        };
    }
    
    /**
     * 导入画布数据
     */
    import(data) {
        if (data.camera) {
            this.camera = { ...this.camera, ...data.camera };
        }
        // 元素由 elements.js 负责创建
        this.isDirty = true;
    }
    
    /**
     * 销毁引擎
     */
    destroy() {
        this.stopRenderLoop();
        this.clearElements();
    }
}

// 暴露到全局
window.CanvasEngine = CanvasEngine;

console.log('✅ Canvas.js 加载完成');
