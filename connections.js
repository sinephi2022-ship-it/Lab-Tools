/**
 * LabMate Pro - Connection System
 * Draw and manage connections between canvas elements
 */

class Connection {
    constructor(id, fromElementId, toElementId, data = {}) {
        this.id = id;
        this.fromElementId = fromElementId;
        this.toElementId = toElementId;
        this.label = data.label || '';
        this.style = data.style || 'solid'; // 'solid', 'dashed', 'dotted'
        this.color = data.color || '#64748b';
        this.lineWidth = data.lineWidth || 2;
        this.arrowType = data.arrowType || 'end'; // 'none', 'start', 'end', 'both'
        this.curvature = data.curvature || 0; // 0 = straight, 0.5 = curved
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }
    
    toJSON() {
        return {
            id: this.id,
            fromElementId: this.fromElementId,
            toElementId: this.toElementId,
            label: this.label,
            style: this.style,
            color: this.color,
            lineWidth: this.lineWidth,
            arrowType: this.arrowType,
            curvature: this.curvature,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

class ConnectionManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.connections = [];
        this.selectedConnection = null;
        this.isDrawing = false;
        this.drawStart = null;
        this.drawEnd = null;
        this.tempLine = null;
        
        this.setupEventListeners();
    }
    
    /**
     * Setup connection drawing events
     */
    setupEventListeners() {
        // Enhanced canvas mouse events for connection drawing
        this.originalMouseDown = this.canvas.onMouseDown?.bind(this.canvas);
        this.originalMouseMove = this.canvas.onMouseMove?.bind(this.canvas);
        this.originalMouseUp = this.canvas.onMouseUp?.bind(this.canvas);
        
        // Override or wrap canvas events if needed
    }
    
    /**
     * Start drawing a new connection
     */
    startDrawing(elementId) {
        this.isDrawing = true;
        this.drawStart = elementId;
        this.tempLine = {
            startElement: this.canvas.getElement(elementId),
            endPos: null
        };
    }
    
    /**
     * Update drawing position
     */
    updateDrawing(worldPos) {
        if (this.isDrawing && this.tempLine) {
            this.tempLine.endPos = worldPos;
        }
    }
    
    /**
     * Complete drawing connection
     */
    completeDrawing(toElementId) {
        if (!this.isDrawing || !this.drawStart) return;
        
        if (toElementId === this.drawStart) {
            // Cannot connect to self
            this.cancelDrawing();
            return;
        }
        
        // Create connection
        const connectionId = `conn_${Date.now()}_${Math.random()}`;
        const connection = new Connection(connectionId, this.drawStart, toElementId);
        this.connections.push(connection);
        
        this.cancelDrawing();
        return connection;
    }
    
    /**
     * Cancel drawing
     */
    cancelDrawing() {
        this.isDrawing = false;
        this.drawStart = null;
        this.tempLine = null;
    }
    
    /**
     * Add connection
     */
    addConnection(fromElementId, toElementId, data = {}) {
        const connectionId = `conn_${Date.now()}_${Math.random()}`;
        const connection = new Connection(connectionId, fromElementId, toElementId, data);
        this.connections.push(connection);
        
        // Trigger onConnectionCreate callback if available
        if (this.canvas && this.canvas.onConnectionCreate) {
            this.canvas.onConnectionCreate(connection);
        }
        
        return connection;
    }
    
    /**
     * Remove connection
     */
    removeConnection(connectionId) {
        this.connections = this.connections.filter(c => c.id !== connectionId);
        if (this.selectedConnection?.id === connectionId) {
            this.selectedConnection = null;
        }
    }
    
    /**
     * Get connection by ID
     */
    getConnection(id) {
        return this.connections.find(c => c.id === id);
    }
    
    /**
     * Update connection
     */
    updateConnection(id, data) {
        const conn = this.getConnection(id);
        if (conn) {
            Object.assign(conn, data);
            conn.updatedAt = new Date();
        }
    }
    
    /**
     * Get connections for an element
     */
    getConnectionsForElement(elementId) {
        return this.connections.filter(c => 
            c.fromElementId === elementId || c.toElementId === elementId
        );
    }
    
    /**
     * Check if point is near connection line
     */
    isPointNearConnection(x, y, connection, threshold = 5) {
        const fromEl = this.canvas.getElement(connection.fromElementId);
        const toEl = this.canvas.getElement(connection.toElementId);
        
        if (!fromEl || !toEl) return false;
        
        const x1 = fromEl.x + fromEl.width / 2;
        const y1 = fromEl.y + fromEl.height / 2;
        const x2 = toEl.x + toEl.width / 2;
        const y2 = toEl.y + toEl.height / 2;
        
        // Calculate distance from point to line
        const distance = this.distanceToLine(x, y, x1, y1, x2, y2);
        return distance <= threshold;
    }
    
    /**
     * Calculate distance from point to line segment
     */
    distanceToLine(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
        const closestX = x1 + t * dx;
        const closestY = y1 + t * dy;
        return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
    }
    
    /**
     * Select connection
     */
    selectConnection(connectionId) {
        this.selectedConnection = this.getConnection(connectionId);
    }
    
    /**
     * Deselect connection
     */
    deselectConnection() {
        this.selectedConnection = null;
    }
    
    /**
     * Draw all connections
     */
    drawConnections(ctx, canvasZoom, canvasPanX, canvasPanY) {
        ctx.save();
        ctx.translate(canvasPanX, canvasPanY);
        ctx.scale(canvasZoom, canvasZoom);
        
        // Draw all connections
        for (const conn of this.connections) {
            this.drawConnection(ctx, conn, conn === this.selectedConnection);
        }
        
        // Draw temporary connection being drawn
        if (this.isDrawing && this.tempLine) {
            this.drawTemporaryConnection(ctx);
        }
        
        ctx.restore();
    }
    
    /**
     * Draw a single connection
     */
    drawConnection(ctx, connection, isSelected) {
        const fromEl = this.canvas.getElement(connection.fromElementId);
        const toEl = this.canvas.getElement(connection.toElementId);
        
        if (!fromEl || !toEl) return;
        
        // Calculate connection points (center of elements)
        const x1 = fromEl.x + fromEl.width / 2;
        const y1 = fromEl.y + fromEl.height / 2;
        const x2 = toEl.x + toEl.width / 2;
        const y2 = toEl.y + toEl.height / 2;
        
        // Draw line
        ctx.strokeStyle = isSelected ? '#2563eb' : connection.color;
        ctx.lineWidth = connection.lineWidth;
        ctx.globalAlpha = isSelected ? 1 : 0.7;
        
        // Apply line style
        if (connection.style === 'dashed') {
            ctx.setLineDash([5, 5]);
        } else if (connection.style === 'dotted') {
            ctx.setLineDash([2, 3]);
        } else {
            ctx.setLineDash([]);
        }
        
        // Draw line with optional curvature
        if (connection.curvature > 0) {
            this.drawCurvedLine(ctx, x1, y1, x2, y2, connection.curvature);
        } else {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        
        // Draw arrow
        this.drawArrow(ctx, x1, y1, x2, y2, connection.arrowType, connection.color);
        
        // Draw label if exists
        if (connection.label) {
            this.drawLabel(ctx, x1, y1, x2, y2, connection.label, isSelected);
        }
    }
    
    /**
     * Draw curved line using quadratic curve
     */
    drawCurvedLine(ctx, x1, y1, x2, y2, curvature) {
        const controlX = (x1 + x2) / 2;
        const controlY = (y1 + y2) / 2;
        const offsetX = (y2 - y1) * curvature;
        const offsetY = (x1 - x2) * curvature;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(
            controlX + offsetX,
            controlY + offsetY,
            x2,
            y2
        );
        ctx.stroke();
    }
    
    /**
     * Draw arrow head
     */
    drawArrow(ctx, x1, y1, x2, y2, arrowType, color) {
        const arrowSize = 8;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.8;
        
        if (arrowType === 'end' || arrowType === 'both') {
            this.drawArrowHead(ctx, x2, y2, angle, arrowSize);
        }
        
        if (arrowType === 'start' || arrowType === 'both') {
            this.drawArrowHead(ctx, x1, y1, angle + Math.PI, arrowSize);
        }
        
        ctx.globalAlpha = 1;
    }
    
    /**
     * Draw single arrow head
     */
    drawArrowHead(ctx, x, y, angle, size) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
            x - size * Math.cos(angle - Math.PI / 6),
            y - size * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            x - size * Math.cos(angle + Math.PI / 6),
            y - size * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
    }
    
    /**
     * Draw connection label
     */
    drawLabel(ctx, x1, y1, x2, y2, label, isSelected) {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = isSelected ? '#2563eb' : '#1f2937';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw background
        const metrics = ctx.measureText(label);
        const padding = 4;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(
            midX - metrics.width / 2 - padding,
            midY - 8,
            metrics.width + padding * 2,
            16
        );
        
        // Draw text
        ctx.fillStyle = isSelected ? '#2563eb' : '#1f2937';
        ctx.fillText(label, midX, midY);
        ctx.textAlign = 'left';
    }
    
    /**
     * Draw temporary connection being drawn
     */
    drawTemporaryConnection(ctx) {
        if (!this.tempLine || !this.tempLine.startElement) return;
        
        const startEl = this.tempLine.startElement;
        const x1 = startEl.x + startEl.width / 2;
        const y1 = startEl.y + startEl.height / 2;
        const x2 = this.tempLine.endPos?.x || x1;
        const y2 = this.tempLine.endPos?.y || y1;
        
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.globalAlpha = 0.7;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        
        // Draw arrow
        const angle = Math.atan2(y2 - y1, x2 - x1);
        this.drawArrowHead(ctx, x2, y2, angle, 6);
    }
    
    /**
     * Export connections
     */
    export() {
        return this.connections.map(c => c.toJSON());
    }
    
    /**
     * Import connections
     */
    import(data) {
        this.connections = data.map(c => new Connection(
            c.id,
            c.fromElementId,
            c.toElementId,
            c
        ));
    }
    
    /**
     * Get statistics
     */
    getStats() {
        return {
            totalConnections: this.connections.length,
            connectionsByStyle: {
                solid: this.connections.filter(c => c.style === 'solid').length,
                dashed: this.connections.filter(c => c.style === 'dashed').length,
                dotted: this.connections.filter(c => c.style === 'dotted').length
            },
            connectionsByArrow: {
                none: this.connections.filter(c => c.arrowType === 'none').length,
                start: this.connections.filter(c => c.arrowType === 'start').length,
                end: this.connections.filter(c => c.arrowType === 'end').length,
                both: this.connections.filter(c => c.arrowType === 'both').length
            }
        };
    }
}

// Export
window.Connection = Connection;
window.ConnectionManager = ConnectionManager;
