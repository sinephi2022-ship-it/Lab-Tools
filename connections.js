/**
 * LabMate Pro - Connection System
 * 元素连接线系统 - 贝塞尔曲线 + 箭头
 * 
 * @author Sine chen
 * @version 2.0.0
 * @date 2025-12-07
 */

// ========================================
// 连接点 (Anchor Point)
// ========================================
class AnchorPoint {
    constructor(elementId, position = 'center') {
        this.elementId = elementId;
        this.position = position; // 'top', 'right', 'bottom', 'left', 'center'
        this.offsetX = 0;
        this.offsetY = 0;
    }

    /**
     * 计算锚点的世界坐标
     */
    getWorldPosition(element) {
        let x = element.x;
        let y = element.y;

        switch (this.position) {
            case 'top':
                x += element.width / 2;
                break;
            case 'right':
                x += element.width;
                y += element.height / 2;
                break;
            case 'bottom':
                x += element.width / 2;
                y += element.height;
                break;
            case 'left':
                y += element.height / 2;
                break;
            case 'center':
                x += element.width / 2;
                y += element.height / 2;
                break;
        }

        return {
            x: x + this.offsetX,
            y: y + this.offsetY
        };
    }

    toJSON() {
        return {
            elementId: this.elementId,
            position: this.position,
            offsetX: this.offsetX,
            offsetY: this.offsetY
        };
    }

    static fromJSON(data) {
        const anchor = new AnchorPoint(data.elementId, data.position);
        anchor.offsetX = data.offsetX || 0;
        anchor.offsetY = data.offsetY || 0;
        return anchor;
    }
}

// ========================================
// 连接线类
// ========================================
class Connection {
    constructor(sourceElementId, targetElementId) {
        this.id = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.source = new AnchorPoint(sourceElementId, 'right');
        this.target = new AnchorPoint(targetElementId, 'left');
        
        // 样式配置
        this.color = '#2196F3';
        this.width = 2;
        this.style = 'bezier'; // 'bezier', 'straight', 'orthogonal'
        this.arrowType = 'arrow'; // 'arrow', 'circle', 'diamond', 'none'
        this.arrowSize = 10;
        this.dashed = false;
        this.dashPattern = [5, 5];
        
        // 标签
        this.label = '';
        this.labelPosition = 0.5; // 0-1, 标签在连线上的位置
        this.labelBackgroundColor = '#FFFFFF';
        this.labelTextColor = '#000000';
        this.labelFontSize = 12;
        
        // 状态
        this.visible = true;
        this.selected = false;
        this.hovered = false;
        
        // 控制点(用于贝塞尔曲线)
        this.controlPoint1 = null; // 自动计算
        this.controlPoint2 = null; // 自动计算
        
        // 元数据
        this.createdAt = Date.now();
        this.updatedAt = Date.now();
    }

    /**
     * 渲染连接线
     */
    render(ctx, elements) {
        if (!this.visible) return;

        const sourceElement = elements.get(this.source.elementId);
        const targetElement = elements.get(this.target.elementId);

        if (!sourceElement || !targetElement) {
            console.warn(`连接线 ${this.id} 的元素不存在`);
            return;
        }

        const start = this.source.getWorldPosition(sourceElement);
        const end = this.target.getWorldPosition(targetElement);

        ctx.save();

        // 设置样式
        ctx.strokeStyle = this.selected ? '#FF9800' : (this.hovered ? '#64B5F6' : this.color);
        ctx.lineWidth = this.selected ? this.width + 2 : this.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (this.dashed) {
            ctx.setLineDash(this.dashPattern);
        }

        // 绘制连线
        switch (this.style) {
            case 'straight':
                this.drawStraightLine(ctx, start, end);
                break;
            case 'orthogonal':
                this.drawOrthogonalLine(ctx, start, end);
                break;
            case 'bezier':
            default:
                this.drawBezierLine(ctx, start, end);
                break;
        }

        ctx.stroke();
        ctx.setLineDash([]);

        // 绘制箭头
        this.drawArrow(ctx, start, end);

        // 绘制标签
        if (this.label) {
            this.drawLabel(ctx, start, end);
        }

        // 绘制选择/悬停高亮
        if (this.selected || this.hovered) {
            this.drawHighlight(ctx, start, end);
        }

        ctx.restore();
    }

    /**
     * 绘制直线
     */
    drawStraightLine(ctx, start, end) {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
    }

    /**
     * 绘制正交线(直角折线)
     */
    drawOrthogonalLine(ctx, start, end) {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        
        const midX = (start.x + end.x) / 2;
        ctx.lineTo(midX, start.y);
        ctx.lineTo(midX, end.y);
        ctx.lineTo(end.x, end.y);
    }

    /**
     * 绘制贝塞尔曲线
     */
    drawBezierLine(ctx, start, end) {
        // 自动计算控制点
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const controlDistance = Math.min(distance * 0.5, 100);

        const cp1 = this.controlPoint1 || {
            x: start.x + controlDistance,
            y: start.y
        };

        const cp2 = this.controlPoint2 || {
            x: end.x - controlDistance,
            y: end.y
        };

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
    }

    /**
     * 绘制箭头
     */
    drawArrow(ctx, start, end) {
        if (this.arrowType === 'none') return;

        // 计算箭头方向
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const arrowSize = this.arrowSize;

        ctx.save();
        ctx.translate(end.x, end.y);
        ctx.rotate(angle);

        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;

        switch (this.arrowType) {
            case 'arrow':
                // 三角形箭头
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-arrowSize, -arrowSize / 2);
                ctx.lineTo(-arrowSize, arrowSize / 2);
                ctx.closePath();
                ctx.fill();
                break;

            case 'circle':
                // 圆形箭头
                ctx.beginPath();
                ctx.arc(0, 0, arrowSize / 2, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'diamond':
                // 菱形箭头
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-arrowSize * 0.7, -arrowSize / 2);
                ctx.lineTo(-arrowSize * 1.4, 0);
                ctx.lineTo(-arrowSize * 0.7, arrowSize / 2);
                ctx.closePath();
                ctx.fill();
                break;
        }

        ctx.restore();
    }

    /**
     * 绘制标签
     */
    drawLabel(ctx, start, end) {
        // 计算标签位置
        const t = this.labelPosition;
        let x, y;

        if (this.style === 'bezier') {
            const dx = end.x - start.x;
            const distance = Math.sqrt(dx * dx + (end.y - start.y) * (end.y - start.y));
            const controlDistance = Math.min(distance * 0.5, 100);

            const cp1 = { x: start.x + controlDistance, y: start.y };
            const cp2 = { x: end.x - controlDistance, y: end.y };

            // 贝塞尔曲线上的点
            const t1 = 1 - t;
            x = t1 * t1 * t1 * start.x + 3 * t1 * t1 * t * cp1.x + 3 * t1 * t * t * cp2.x + t * t * t * end.x;
            y = t1 * t1 * t1 * start.y + 3 * t1 * t1 * t * cp1.y + 3 * t1 * t * t * cp2.y + t * t * t * end.y;
        } else {
            x = start.x + (end.x - start.x) * t;
            y = start.y + (end.y - start.y) * t;
        }

        // 绘制标签背景
        ctx.font = `${this.labelFontSize}px Arial`;
        const metrics = ctx.measureText(this.label);
        const padding = 4;
        const bgWidth = metrics.width + padding * 2;
        const bgHeight = this.labelFontSize + padding * 2;

        ctx.fillStyle = this.labelBackgroundColor;
        ctx.fillRect(x - bgWidth / 2, y - bgHeight / 2, bgWidth, bgHeight);

        // 绘制边框
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x - bgWidth / 2, y - bgHeight / 2, bgWidth, bgHeight);

        // 绘制文字
        ctx.fillStyle = this.labelTextColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, x, y);
    }

    /**
     * 绘制高亮效果
     */
    drawHighlight(ctx, start, end) {
        ctx.save();
        ctx.strokeStyle = this.selected ? '#FF9800' : '#64B5F6';
        ctx.lineWidth = this.width + 6;
        ctx.globalAlpha = 0.3;

        if (this.style === 'bezier') {
            this.drawBezierLine(ctx, start, end);
        } else if (this.style === 'orthogonal') {
            this.drawOrthogonalLine(ctx, start, end);
        } else {
            this.drawStraightLine(ctx, start, end);
        }

        ctx.stroke();
        ctx.restore();
    }

    /**
     * 检测点是否在连线上
     */
    hitTest(x, y, elements, threshold = 8) {
        const sourceElement = elements.get(this.source.elementId);
        const targetElement = elements.get(this.target.elementId);

        if (!sourceElement || !targetElement) return false;

        const start = this.source.getWorldPosition(sourceElement);
        const end = this.target.getWorldPosition(targetElement);

        // 简化的点到线段距离检测
        const distance = this.pointToLineDistance(x, y, start, end);
        return distance <= threshold;
    }

    /**
     * 点到线段的距离
     */
    pointToLineDistance(px, py, start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const lengthSquared = dx * dx + dy * dy;

        if (lengthSquared === 0) {
            return Math.sqrt((px - start.x) ** 2 + (py - start.y) ** 2);
        }

        let t = ((px - start.x) * dx + (py - start.y) * dy) / lengthSquared;
        t = Math.max(0, Math.min(1, t));

        const projX = start.x + t * dx;
        const projY = start.y + t * dy;

        return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
    }

    /**
     * 设置样式
     */
    setStyle(style) {
        this.style = style;
        this.updatedAt = Date.now();
    }

    /**
     * 设置颜色
     */
    setColor(color) {
        this.color = color;
        this.updatedAt = Date.now();
    }

    /**
     * 设置标签
     */
    setLabel(label) {
        this.label = label;
        this.updatedAt = Date.now();
    }

    /**
     * 序列化
     */
    toJSON() {
        return {
            id: this.id,
            source: this.source.toJSON(),
            target: this.target.toJSON(),
            color: this.color,
            width: this.width,
            style: this.style,
            arrowType: this.arrowType,
            arrowSize: this.arrowSize,
            dashed: this.dashed,
            dashPattern: this.dashPattern,
            label: this.label,
            labelPosition: this.labelPosition,
            labelBackgroundColor: this.labelBackgroundColor,
            labelTextColor: this.labelTextColor,
            labelFontSize: this.labelFontSize,
            visible: this.visible,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * 从 JSON 恢复
     */
    static fromJSON(data) {
        const conn = new Connection(data.source.elementId, data.target.elementId);
        conn.id = data.id;
        conn.source = AnchorPoint.fromJSON(data.source);
        conn.target = AnchorPoint.fromJSON(data.target);
        conn.color = data.color;
        conn.width = data.width;
        conn.style = data.style;
        conn.arrowType = data.arrowType;
        conn.arrowSize = data.arrowSize;
        conn.dashed = data.dashed;
        conn.dashPattern = data.dashPattern;
        conn.label = data.label || '';
        conn.labelPosition = data.labelPosition || 0.5;
        conn.labelBackgroundColor = data.labelBackgroundColor || '#FFFFFF';
        conn.labelTextColor = data.labelTextColor || '#000000';
        conn.labelFontSize = data.labelFontSize || 12;
        conn.visible = data.visible !== false;
        conn.createdAt = data.createdAt;
        conn.updatedAt = data.updatedAt;
        return conn;
    }
}

// ========================================
// 连接管理器
// ========================================
class ConnectionManager {
    constructor() {
        this.connections = new Map();
        this.tempConnection = null; // 正在创建的临时连线
    }

    /**
     * 添加连接
     */
    add(connection) {
        this.connections.set(connection.id, connection);
        console.log(`✅ 添加连接: ${connection.id}`);
    }

    /**
     * 删除连接
     */
    remove(connectionId) {
        const deleted = this.connections.delete(connectionId);
        if (deleted) {
            console.log(`✅ 删除连接: ${connectionId}`);
        }
        return deleted;
    }

    /**
     * 获取连接
     */
    get(connectionId) {
        return this.connections.get(connectionId);
    }

    /**
     * 创建连接
     */
    create(sourceElementId, targetElementId) {
        const connection = new Connection(sourceElementId, targetElementId);
        this.add(connection);
        return connection;
    }

    /**
     * 删除元素的所有连接
     */
    removeElementConnections(elementId) {
        const toRemove = [];
        this.connections.forEach((conn, id) => {
            if (conn.source.elementId === elementId || conn.target.elementId === elementId) {
                toRemove.push(id);
            }
        });
        toRemove.forEach(id => this.remove(id));
        return toRemove.length;
    }

    /**
     * 获取元素的所有连接
     */
    getElementConnections(elementId) {
        const result = [];
        this.connections.forEach(conn => {
            if (conn.source.elementId === elementId || conn.target.elementId === elementId) {
                result.push(conn);
            }
        });
        return result;
    }

    /**
     * 检测点击的连接
     */
    hitTest(x, y, elements) {
        for (const [id, conn] of this.connections) {
            if (conn.hitTest(x, y, elements)) {
                return conn;
            }
        }
        return null;
    }

    /**
     * 渲染所有连接
     */
    render(ctx, elements) {
        this.connections.forEach(conn => {
            conn.render(ctx, elements);
        });

        // 渲染临时连接(正在创建中)
        if (this.tempConnection) {
            this.tempConnection.render(ctx, elements);
        }
    }

    /**
     * 开始创建临时连接
     */
    startTempConnection(sourceElementId, mouseX, mouseY) {
        this.tempConnection = {
            sourceId: sourceElementId,
            endX: mouseX,
            endY: mouseY,
            render: (ctx, elements) => {
                const sourceElement = elements.get(sourceElementId);
                if (!sourceElement) return;

                const start = {
                    x: sourceElement.x + sourceElement.width / 2,
                    y: sourceElement.y + sourceElement.height / 2
                };

                ctx.save();
                ctx.strokeStyle = '#9E9E9E';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(this.tempConnection.endX, this.tempConnection.endY);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }
        };
    }

    /**
     * 更新临时连接
     */
    updateTempConnection(mouseX, mouseY) {
        if (this.tempConnection) {
            this.tempConnection.endX = mouseX;
            this.tempConnection.endY = mouseY;
        }
    }

    /**
     * 完成临时连接
     */
    finishTempConnection(targetElementId) {
        if (this.tempConnection && targetElementId) {
            const connection = this.create(this.tempConnection.sourceId, targetElementId);
            this.tempConnection = null;
            return connection;
        }
        this.tempConnection = null;
        return null;
    }

    /**
     * 取消临时连接
     */
    cancelTempConnection() {
        this.tempConnection = null;
    }

    /**
     * 清空所有连接
     */
    clear() {
        this.connections.clear();
        this.tempConnection = null;
    }

    /**
     * 导出所有连接
     */
    exportToJSON() {
        const data = [];
        this.connections.forEach(conn => {
            data.push(conn.toJSON());
        });
        return data;
    }

    /**
     * 从 JSON 导入连接
     */
    importFromJSON(data) {
        this.clear();
        data.forEach(connData => {
            const conn = Connection.fromJSON(connData);
            this.add(conn);
        });
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AnchorPoint,
        Connection,
        ConnectionManager
    };
}

console.log('✅ Connection System 加载完成');
