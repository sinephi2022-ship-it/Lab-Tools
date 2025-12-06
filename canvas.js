/**
 * LabMate Pro - Canvas System
 * Infinite canvas with pan, zoom, and element management
 */

class LabCanvas {
    constructor(containerEl, options = {}) {
        this.container = containerEl;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Canvas settings
        this.width = containerEl.clientWidth;
        this.height = containerEl.clientHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        containerEl.appendChild(this.canvas);
        
        // View settings
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1;
        this.minZoom = 0.1;
        this.maxZoom = 5;
        
        // Element management
        this.elements = [];
        this.selectedElements = new Set();
        this.selectedBox = null;
        this.isDragging = false;
        this.dragStart = null;
        this.draggedElements = new Set();
        
        // Connection management
        this.connectionManager = null; // Will be initialized after canvas is ready
        
        // Grid settings
        this.gridSize = 20;
        this.showGrid = true;
        
        // Event tracking
        this.lastMousePos = { x: 0, y: 0 };
        this.isPanning = false;
        this.panStart = null;
        this.panVelocity = { x: 0, y: 0 };  // For momentum panning
        this.lastPanTime = 0;
        this.lastPanPos = null;
        
        // Performance
        this.animationFrameId = null;
        this.isDirty = true;
        
        this.setupEventListeners();
        this.startRenderLoop();
        
        // Initialize connection manager
        setTimeout(() => {
            if (typeof window.ConnectionManager !== 'undefined') {
                this.connectionManager = new window.ConnectionManager(this);
            }
        }, 100);
    }
    
    /**
     * Setup event listeners for canvas interactions
     */
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
        this.canvas.addEventListener('dblclick', (e) => this.onDoubleClick(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
        
        // Keyboard events
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Resize
        window.addEventListener('resize', () => this.onResize());
    }
    
    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.panX) / this.zoom,
            y: (screenY - this.panY) / this.zoom
        };
    }
    
    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX, worldY) {
        return {
            x: worldX * this.zoom + this.panX,
            y: worldY * this.zoom + this.panY
        };
    }
    
    /**
     * Mouse down event handler
     */
    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const worldPos = this.screenToWorld(screenX, screenY);
        
        // Check if clicking on an element
        let clickedElement = null;
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const el = this.elements[i];
            if (this.isPointInElement(worldPos.x, worldPos.y, el)) {
                clickedElement = el;
                break;
            }
        }
        
        if (e.button === 0) { // Left click
            if (clickedElement) {
                // Element selection
                if (!e.ctrlKey && !e.shiftKey) {
                    this.selectedElements.clear();
                }
                this.selectedElements.add(clickedElement.id);
                this.draggedElements.add(clickedElement.id);
                
                this.isDragging = true;
                this.dragStart = worldPos;
            } else {
                // Box selection or pan
                if (!e.ctrlKey) {
                    this.selectedElements.clear();
                }
                this.selectedBox = { x: worldPos.x, y: worldPos.y, width: 0, height: 0 };
            }
        } else if (e.button === 2) { // Right click for panning
            this.isPanning = true;
            this.panStart = { x: screenX, y: screenY };
        }
        
        this.isDirty = true;
    }
    
    /**
     * Mouse move event handler
     */
    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const worldPos = this.screenToWorld(screenX, screenY);
        
        this.lastMousePos = { x: screenX, y: screenY };
        
        if (this.isPanning && this.panStart) {
            // Calculate velocity for momentum
            const now = Date.now();
            const timeDelta = Math.max(1, now - this.lastPanTime);
            
            if (this.lastPanPos) {
                this.panVelocity.x = (screenX - this.lastPanPos.x) / timeDelta * 16; // Normalize to 60fps
                this.panVelocity.y = (screenY - this.lastPanPos.y) / timeDelta * 16;
            }
            
            // Pan canvas
            this.panX += screenX - this.panStart.x;
            this.panY += screenY - this.panStart.y;
            this.panStart = { x: screenX, y: screenY };
            this.lastPanPos = { x: screenX, y: screenY };
            this.lastPanTime = now;
        } else if (this.isDragging && this.dragStart) {
            // Drag selected elements
            const dx = worldPos.x - this.dragStart.x;
            const dy = worldPos.y - this.dragStart.y;
            
            for (const el of this.elements) {
                if (this.draggedElements.has(el.id)) {
                    el.x += dx;
                    el.y += dy;
                }
            }
            
            this.dragStart = worldPos;
        } else if (this.selectedBox) {
            // Update selection box
            this.selectedBox.width = worldPos.x - this.selectedBox.x;
            this.selectedBox.height = worldPos.y - this.selectedBox.y;
            
            // Select elements within box
            const box = this.normalizeBox(this.selectedBox);
            this.selectedElements.clear();
            for (const el of this.elements) {
                if (this.isElementInBox(el, box)) {
                    this.selectedElements.add(el.id);
                }
            }
        }
        
        // Update cursor
        this.updateCursor(worldPos);
        this.isDirty = true;
    }
    
    /**
     * Mouse up event handler
     */
    onMouseUp(e) {
        this.isDragging = false;
        this.isPanning = false;
        this.draggedElements.clear();
        this.dragStart = null;
        this.panStart = null;
        this.lastPanPos = null;
        this.selectedBox = null;
        this.isDirty = true;
        
        // Apply momentum if panning
        if (Math.abs(this.panVelocity.x) > 0.1 || Math.abs(this.panVelocity.y) > 0.1) {
            this.applyMomentum();
        }
    }
    
    /**
     * Apply momentum/inertia to panning
     */
    applyMomentum() {
        const momentum = () => {
            if (Math.abs(this.panVelocity.x) > 0.1 || Math.abs(this.panVelocity.y) > 0.1) {
                this.panX += this.panVelocity.x;
                this.panY += this.panVelocity.y;
                
                // Friction - slow down
                this.panVelocity.x *= 0.94;
                this.panVelocity.y *= 0.94;
                
                this.isDirty = true;
                requestAnimationFrame(momentum);
            }
        };
        requestAnimationFrame(momentum);
    }
    
    /**
     * Wheel event handler for zoom
     */
    onWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const worldPos = this.screenToWorld(screenX, screenY);
        
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * zoomFactor));
        
        // Zoom towards cursor
        const zoomDiff = newZoom - this.zoom;
        this.panX -= worldPos.x * zoomDiff;
        this.panY -= worldPos.y * zoomDiff;
        this.zoom = newZoom;
        
        this.isDirty = true;
    }
    
    /**
     * Double click event handler
     */
    onDoubleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const worldPos = this.screenToWorld(screenX, screenY);
        
        // Check if double-clicked on an element
        for (const el of this.elements) {
            if (this.isPointInElement(worldPos.x, worldPos.y, el)) {
                // Trigger element edit event
                this.onElementDoubleClick?.(el);
                return;
            }
        }
        
        // Double-click on empty space: zoom to fit
        this.zoomToFit();
    }
    
    /**
     * Touch start event handler
     */
    onTouchStart(e) {
        if (e.touches.length === 1) {
            this.onMouseDown({
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY,
                button: 0,
                ctrlKey: false,
                shiftKey: false
            });
        } else if (e.touches.length === 2) {
            this.touchDistance = this.getTouchDistance(e.touches);
        }
    }
    
    /**
     * Touch move event handler
     */
    onTouchMove(e) {
        if (e.touches.length === 1) {
            this.onMouseMove({
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY
            });
        } else if (e.touches.length === 2) {
            const newDistance = this.getTouchDistance(e.touches);
            const zoomFactor = newDistance / this.touchDistance;
            this.zoom *= zoomFactor;
            this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom));
            this.touchDistance = newDistance;
            this.isDirty = true;
        }
    }
    
    /**
     * Touch end event handler
     */
    onTouchEnd(e) {
        this.onMouseUp(e);
        this.touchDistance = null;
    }
    
    /**
     * Get distance between two touch points
     */
    getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Keyboard event handler
     */
    onKeyDown(e) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            this.deleteSelectedElements();
        } else if (e.key === 'Escape') {
            this.selectedElements.clear();
            this.isDirty = true;
        } else if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            for (const el of this.elements) {
                this.selectedElements.add(el.id);
            }
            this.isDirty = true;
        }
    }
    
    /**
     * Keyboard up event handler
     */
    onKeyUp(e) {
        // Handle key releases if needed
    }
    
    /**
     * Resize event handler
     */
    onResize() {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.isDirty = true;
    }
    
    /**
     * Update cursor based on position
     */
    updateCursor(worldPos) {
        for (const el of this.elements) {
            if (this.isPointInElement(worldPos.x, worldPos.y, el)) {
                this.canvas.style.cursor = 'grab';
                return;
            }
        }
        this.canvas.style.cursor = 'default';
    }
    
    /**
     * Add element to canvas
     */
    addElement(element) {
        const id = element.id || `elem_${Date.now()}_${Math.random()}`;
        const newElement = {
            id,
            type: element.type || 'note',
            x: element.x || 0,
            y: element.y || 0,
            width: element.width || 200,
            height: element.height || 150,
            content: element.content || '',
            color: element.color || '#ffffff',
            metadata: element.metadata || {}
        };
        this.elements.push(newElement);
        this.isDirty = true;
        return newElement;
    }
    
    /**
     * Remove element from canvas
     */
    removeElement(id) {
        this.elements = this.elements.filter(e => e.id !== id);
        this.selectedElements.delete(id);
        this.isDirty = true;
    }
    
    /**
     * Delete all selected elements
     */
    deleteSelectedElements() {
        for (const id of this.selectedElements) {
            this.removeElement(id);
        }
        this.selectedElements.clear();
    }
    
    /**
     * Get element by ID
     */
    getElement(id) {
        return this.elements.find(e => e.id === id);
    }
    
    /**
     * Update element data
     */
    updateElement(id, data) {
        const el = this.getElement(id);
        if (el) {
            Object.assign(el, data);
            this.isDirty = true;
        }
    }
    
    /**
     * Check if point is inside element
     */
    isPointInElement(x, y, element) {
        return x >= element.x && x <= element.x + element.width &&
               y >= element.y && y <= element.y + element.height;
    }
    
    /**
     * Check if element is inside selection box
     */
    isElementInBox(element, box) {
        return !(element.x + element.width < box.x ||
                 element.x > box.x + box.width ||
                 element.y + element.height < box.y ||
                 element.y > box.y + box.height);
    }
    
    /**
     * Normalize box coordinates
     */
    normalizeBox(box) {
        return {
            x: Math.min(box.x, box.x + box.width),
            y: Math.min(box.y, box.y + box.height),
            width: Math.abs(box.width),
            height: Math.abs(box.height)
        };
    }
    
    /**
     * Zoom to fit all elements
     */
    zoomToFit() {
        if (this.elements.length === 0) {
            this.zoom = 1;
            this.panX = 0;
            this.panY = 0;
            return;
        }
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const el of this.elements) {
            minX = Math.min(minX, el.x);
            minY = Math.min(minY, el.y);
            maxX = Math.max(maxX, el.x + el.width);
            maxY = Math.max(maxY, el.y + el.height);
        }
        
        const padding = 50;
        const contentWidth = maxX - minX + padding * 2;
        const contentHeight = maxY - minY + padding * 2;
        
        const zoomX = this.width / contentWidth;
        const zoomY = this.height / contentHeight;
        this.zoom = Math.min(zoomX, zoomY, this.maxZoom);
        
        this.panX = this.width / 2 - (minX + (maxX - minX) / 2) * this.zoom;
        this.panY = this.height / 2 - (minY + (maxY - minY) / 2) * this.zoom;
        
        this.isDirty = true;
    }
    
    /**
     * Start render loop
     */
    startRenderLoop() {
        const render = () => {
            if (this.isDirty) {
                this.render();
                this.isDirty = false;
            }
            this.animationFrameId = requestAnimationFrame(render);
        };
        render();
    }
    
    /**
     * Stop render loop
     */
    stopRenderLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
    
    /**
     * Main render function
     */
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw grid
        if (this.showGrid) {
            this.drawGrid();
        }
        
        // Save context
        this.ctx.save();
        
        // Apply pan and zoom
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoom, this.zoom);
        
        // Draw connections first (under elements)
        if (this.connectionManager) {
            this.connectionManager.drawConnections(this.ctx, this.zoom, this.panX, this.panY);
        }
        
        // Draw all elements
        for (const el of this.elements) {
            this.drawElement(el);
        }
        
        // Draw selection box
        if (this.selectedBox) {
            this.drawSelectionBox(this.selectedBox);
        }
        
        this.ctx.restore();
        
        // Draw UI overlays
        this.drawUIOverlay();
    }
    
    /**
     * Draw grid background
     */
    drawGrid() {
        const gridSize = this.gridSize * this.zoom;
        if (gridSize < 5) return; // Don't draw if grid too small
        
        this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.2)';
        this.ctx.lineWidth = 0.5;
        
        const startX = Math.floor(-this.panX / gridSize) * gridSize;
        const startY = Math.floor(-this.panY / gridSize) * gridSize;
        
        for (let x = startX; x < this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        
        for (let y = startY; y < this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }
    
    /**
     * Draw individual element
     */
    drawElement(element) {
        const x = element.x;
        const y = element.y;
        const w = element.width;
        const h = element.height;
        const isSelected = this.selectedElements.has(element.id);
        
        // Draw element background
        this.ctx.fillStyle = element.color;
        this.ctx.fillRect(x, y, w, h);
        
        // Draw border
        this.ctx.strokeStyle = isSelected ? '#2563eb' : '#cbd5e1';
        this.ctx.lineWidth = isSelected ? 3 : 1;
        this.ctx.strokeRect(x, y, w, h);
        
        // Draw type icon
        this.drawElementIcon(element);
        
        // Draw content preview
        this.drawElementContent(element);
    }
    
    /**
     * Draw element type icon
     */
    drawElementIcon(element) {
        const iconMap = {
            note: '📝',
            timer: '⏱️',
            protocol: '✓',
            text: 'T',
            file: '📎'
        };
        
        const icon = iconMap[element.type] || '?';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillStyle = '#64748b';
        this.ctx.fillText(icon, element.x + 8, element.y + 24);
    }
    
    /**
     * Draw element content preview
     */
    drawElementContent(element) {
        const x = element.x + 8;
        const y = element.y + 35;
        const maxWidth = element.width - 16;
        
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#475569';
        
        const text = element.content || '(empty)';
        const lines = this.wrapText(text, maxWidth);
        
        for (let i = 0; i < Math.min(lines.length, 3); i++) {
            this.ctx.fillText(lines[i], x, y + i * 16);
        }
    }
    
    /**
     * Wrap text to fit width
     */
    wrapText(text, maxWidth) {
        const lines = [];
        const words = text.split(' ');
        let currentLine = '';
        
        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = this.ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) lines.push(currentLine);
        return lines;
    }
    
    /**
     * Draw selection box
     */
    drawSelectionBox(box) {
        const normalized = this.normalizeBox(box);
        this.ctx.strokeStyle = '#2563eb';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(normalized.x, normalized.y, normalized.width, normalized.height);
        this.ctx.setLineDash([]);
    }
    
    /**
     * Draw UI overlay (info, zoom level, etc)
     */
    drawUIOverlay() {
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillText(`Zoom: ${(this.zoom * 100).toFixed(0)}% | Elements: ${this.elements.length}`, 10, this.height - 10);
        
        if (this.selectedElements.size > 0) {
            this.ctx.fillStyle = 'rgba(37, 99, 235, 0.8)';
            this.ctx.fillText(`Selected: ${this.selectedElements.size}`, 10, this.height - 25);
        }
    }
    
    /**
     * Export canvas data
     */
    export() {
        return {
            elements: JSON.parse(JSON.stringify(this.elements)),
            view: { panX: this.panX, panY: this.panY, zoom: this.zoom }
        };
    }
    
    /**
     * Import canvas data
     */
    import(data) {
        this.elements = data.elements || [];
        if (data.view) {
            this.panX = data.view.panX;
            this.panY = data.view.panY;
            this.zoom = data.view.zoom;
        }
        this.isDirty = true;
    }
    
    /**
     * Destroy canvas and cleanup
     */
    destroy() {
        this.stopRenderLoop();
        this.canvas.remove();
    }
}

// Export for use
window.LabCanvas = LabCanvas;
