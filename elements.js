/**
 * LabMate Pro - Element System
 * 五大元素系统: 便签/计时器/实验协议/文本框/文件
 * 
 * @author Sine chen
 * @version 2.0.0
 * @date 2025-12-07
 */

// ========================================
// 基础元素类
// ========================================
class BaseElement {
    constructor(x, y, type) {
        this.id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = 200;
        this.height = 150;
        this.rotation = 0;
        this.zIndex = 0;
        this.locked = false;
        this.visible = true;
        this.createdAt = Date.now();
        this.updatedAt = Date.now();
    }

    /**
     * 检测点是否在元素内
     */
    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    /**
     * 移动元素
     */
    move(dx, dy) {
        this.x += dx;
        this.y += dy;
        this.updatedAt = Date.now();
    }

    /**
     * 设置位置
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.updatedAt = Date.now();
    }

    /**
     * 调整大小
     */
    resize(width, height) {
        this.width = Math.max(100, width);
        this.height = Math.max(80, height);
        this.updatedAt = Date.now();
    }

    /**
     * 序列化为 JSON
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            rotation: this.rotation,
            zIndex: this.zIndex,
            locked: this.locked,
            visible: this.visible,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * 从 JSON 恢复
     */
    static fromJSON(data) {
        const element = new this(data.x, data.y, data.type);
        Object.assign(element, data);
        return element;
    }

    /**
     * 渲染元素 (子类必须实现)
     */
    render(ctx, isSelected) {
        throw new Error('render() must be implemented by subclass');
    }
}

// ========================================
// 1. 便签元素 (NoteElement)
// ========================================
class NoteElement extends BaseElement {
    constructor(x, y) {
        super(x, y, 'note');
        this.width = 250;
        this.height = 200;
        this.backgroundColor = '#FFF9C4'; // 淡黄色
        this.text = '点击编辑便签内容...';
        this.fontSize = 16;
        this.fontFamily = 'cursive, "Comic Sans MS"'; // 手写体
        this.textColor = '#424242';
        this.padding = 15;
        this.editing = false;
    }

    render(ctx, isSelected) {
        if (!this.visible) return;

        ctx.save();

        // 阴影效果
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        // 绘制背景
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // 清除阴影
        ctx.shadowColor = 'transparent';

        // 绘制边框
        if (isSelected) {
            ctx.strokeStyle = '#FBC02D';
            ctx.lineWidth = 3;
        } else {
            ctx.strokeStyle = '#F9A825';
            ctx.lineWidth = 1;
        }
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // 绘制"撕纸"效果顶部
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + 15);
        ctx.lineTo(this.x + this.width, this.y + 15);
        ctx.strokeStyle = '#F9A825';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // 绘制文本
        ctx.fillStyle = this.textColor;
        ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        ctx.textBaseline = 'top';

        const lines = this.wrapText(ctx, this.text, this.width - this.padding * 2);
        const lineHeight = this.fontSize * 1.4;
        const startY = this.y + 25;

        lines.forEach((line, i) => {
            if (startY + i * lineHeight < this.y + this.height - this.padding) {
                ctx.fillText(line, this.x + this.padding, startY + i * lineHeight);
            }
        });

        // 编辑指示器
        if (this.editing) {
            ctx.strokeStyle = '#FBC02D';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
            ctx.setLineDash([]);
        }

        ctx.restore();
    }

    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        if (currentLine) lines.push(currentLine);
        return lines;
    }

    setText(text) {
        this.text = text;
        this.updatedAt = Date.now();
    }

    toJSON() {
        return {
            ...super.toJSON(),
            backgroundColor: this.backgroundColor,
            text: this.text,
            fontSize: this.fontSize,
            fontFamily: this.fontFamily,
            textColor: this.textColor
        };
    }
}

// ========================================
// 2. 计时器元素 (TimerElement)
// ========================================
class TimerElement extends BaseElement {
    constructor(x, y) {
        super(x, y, 'timer');
        this.width = 200;
        this.height = 150;
        this.backgroundColor = '#FFCDD2'; // 淡红色
        this.duration = 25 * 60; // 默认25分钟(秒)
        this.remaining = this.duration;
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = null;
        this.pausedTime = 0;
        this.label = '番茄钟';
    }

    render(ctx, isSelected) {
        if (!this.visible) return;

        ctx.save();

        // 阴影
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // 背景
        ctx.fillStyle = this.backgroundColor;
        this.roundRect(ctx, this.x, this.y, this.width, this.height, 10);
        ctx.fill();

        // 边框
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = isSelected ? '#E53935' : '#E57373';
        ctx.lineWidth = isSelected ? 3 : 2;
        this.roundRect(ctx, this.x, this.y, this.width, this.height, 10);
        ctx.stroke();

        // 标题
        ctx.fillStyle = '#B71C1C';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, this.x + this.width / 2, this.y + 25);

        // 时间显示
        const minutes = Math.floor(this.remaining / 60);
        const seconds = this.remaining % 60;
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        ctx.font = 'bold 36px "Courier New", monospace';
        ctx.fillStyle = '#C62828';
        ctx.fillText(timeStr, this.x + this.width / 2, this.y + 70);

        // 进度条
        const progress = this.remaining / this.duration;
        const barWidth = this.width - 40;
        const barHeight = 8;
        const barX = this.x + 20;
        const barY = this.y + this.height - 35;

        // 背景条
        ctx.fillStyle = '#FFFFFF';
        this.roundRect(ctx, barX, barY, barWidth, barHeight, 4);
        ctx.fill();

        // 进度条
        ctx.fillStyle = this.isRunning ? '#4CAF50' : '#F44336';
        this.roundRect(ctx, barX, barY, barWidth * progress, barHeight, 4);
        ctx.fill();

        // 状态指示
        const statusY = this.y + this.height - 15;
        ctx.font = '12px Arial';
        ctx.fillStyle = '#666';
        const status = this.isRunning ? (this.isPaused ? '⏸ 已暂停' : '▶ 运行中') : '⏹ 已停止';
        ctx.fillText(status, this.x + this.width / 2, statusY);

        ctx.restore();
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            this.startTime = Date.now();
            this.tick();
        }
    }

    pause() {
        if (this.isRunning && !this.isPaused) {
            this.isPaused = true;
            this.pausedTime = Date.now();
        }
    }

    resume() {
        if (this.isRunning && this.isPaused) {
            this.isPaused = false;
            this.startTime += Date.now() - this.pausedTime;
        }
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        this.remaining = this.duration;
    }

    reset() {
        this.stop();
        this.remaining = this.duration;
    }

    tick() {
        if (!this.isRunning || this.isPaused) return;

        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        this.remaining = Math.max(0, this.duration - elapsed);

        if (this.remaining === 0) {
            this.isRunning = false;
            this.onComplete?.();
        } else {
            setTimeout(() => this.tick(), 100);
        }
    }

    setDuration(minutes) {
        this.duration = minutes * 60;
        if (!this.isRunning) {
            this.remaining = this.duration;
        }
    }

    toJSON() {
        return {
            ...super.toJSON(),
            backgroundColor: this.backgroundColor,
            duration: this.duration,
            label: this.label
        };
    }
}

// ========================================
// 3. 实验协议元素 (ProtocolElement)
// ========================================
class ProtocolElement extends BaseElement {
    constructor(x, y) {
        super(x, y, 'protocol');
        this.width = 300;
        this.height = 400;
        this.backgroundColor = '#C8E6C9'; // 淡绿色
        this.title = '实验协议';
        this.steps = [
            { id: 1, text: '准备实验材料', completed: false },
            { id: 2, text: '设置实验参数', completed: false },
            { id: 3, text: '执行实验步骤', completed: false }
        ];
        this.nextStepId = 4;
    }

    render(ctx, isSelected) {
        if (!this.visible) return;

        ctx.save();

        // 阴影
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // 背景
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // 边框
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = isSelected ? '#388E3C' : '#66BB6A';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // 标题栏
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(this.x, this.y, this.width, 40);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.title, this.x + this.width / 2, this.y + 20);

        // 步骤列表
        ctx.textAlign = 'left';
        const stepY = this.y + 55;
        const stepHeight = 35;
        const padding = 15;

        this.steps.forEach((step, index) => {
            const y = stepY + index * stepHeight;
            
            // 复选框
            const checkboxX = this.x + padding;
            const checkboxY = y;
            const checkboxSize = 20;

            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 2;
            ctx.strokeRect(checkboxX, checkboxY, checkboxSize, checkboxSize);

            if (step.completed) {
                // 打勾
                ctx.strokeStyle = '#4CAF50';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(checkboxX + 4, checkboxY + 10);
                ctx.lineTo(checkboxX + 8, checkboxY + 16);
                ctx.lineTo(checkboxX + 16, checkboxY + 4);
                ctx.stroke();
            }

            // 步骤文本
            ctx.fillStyle = step.completed ? '#9E9E9E' : '#2E7D32';
            ctx.font = step.completed ? '14px Arial' : 'bold 14px Arial';
            const textX = checkboxX + checkboxSize + 10;
            ctx.fillText(`${index + 1}. ${step.text}`, textX, y + 10);

            // 删除线
            if (step.completed) {
                const textWidth = ctx.measureText(`${index + 1}. ${step.text}`).width;
                ctx.strokeStyle = '#9E9E9E';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(textX, y + 10);
                ctx.lineTo(textX + textWidth, y + 10);
                ctx.stroke();
            }
        });

        // 进度统计
        const completed = this.steps.filter(s => s.completed).length;
        const total = this.steps.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        ctx.fillStyle = '#1B5E20';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `完成进度: ${completed}/${total} (${percentage}%)`,
            this.x + this.width / 2,
            this.y + this.height - 15
        );

        ctx.restore();
    }

    addStep(text) {
        this.steps.push({
            id: this.nextStepId++,
            text: text,
            completed: false
        });
        this.updatedAt = Date.now();
    }

    removeStep(stepId) {
        this.steps = this.steps.filter(s => s.id !== stepId);
        this.updatedAt = Date.now();
    }

    toggleStep(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (step) {
            step.completed = !step.completed;
            this.updatedAt = Date.now();
        }
    }

    getStepAtPosition(localY) {
        const stepY = 55;
        const stepHeight = 35;
        const index = Math.floor((localY - stepY) / stepHeight);
        return index >= 0 && index < this.steps.length ? this.steps[index] : null;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            backgroundColor: this.backgroundColor,
            title: this.title,
            steps: this.steps,
            nextStepId: this.nextStepId
        };
    }
}

// ========================================
// 4. 文本框元素 (TextElement)
// ========================================
class TextElement extends BaseElement {
    constructor(x, y) {
        super(x, y, 'text');
        this.width = 300;
        this.height = 200;
        this.backgroundColor = '#E1BEE7'; // 淡紫色
        this.text = '输入文本内容...';
        this.fontSize = 14;
        this.fontFamily = 'Arial, sans-serif';
        this.textColor = '#4A148C';
        this.padding = 20;
        this.lineHeight = 1.5;
        this.textAlign = 'left';
        this.editing = false;
    }

    render(ctx, isSelected) {
        if (!this.visible) return;

        ctx.save();

        // 阴影
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // 背景
        ctx.fillStyle = this.backgroundColor;
        this.roundRect(ctx, this.x, this.y, this.width, this.height, 8);
        ctx.fill();

        // 边框
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = isSelected ? '#7B1FA2' : '#BA68C8';
        ctx.lineWidth = isSelected ? 3 : 2;
        this.roundRect(ctx, this.x, this.y, this.width, this.height, 8);
        ctx.stroke();

        // 文本内容
        ctx.fillStyle = this.textColor;
        ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        ctx.textBaseline = 'top';

        const lines = this.wrapText(ctx, this.text, this.width - this.padding * 2);
        const lineHeightPx = this.fontSize * this.lineHeight;
        const startY = this.y + this.padding;

        lines.forEach((line, i) => {
            const y = startY + i * lineHeightPx;
            if (y < this.y + this.height - this.padding) {
                let x = this.x + this.padding;
                if (this.textAlign === 'center') {
                    x = this.x + this.width / 2;
                    ctx.textAlign = 'center';
                } else if (this.textAlign === 'right') {
                    x = this.x + this.width - this.padding;
                    ctx.textAlign = 'right';
                } else {
                    ctx.textAlign = 'left';
                }
                ctx.fillText(line, x, y);
            }
        });

        // 编辑状态
        if (this.editing) {
            ctx.strokeStyle = '#9C27B0';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            this.roundRect(ctx, this.x + 3, this.y + 3, this.width - 6, this.height - 6, 5);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    wrapText(ctx, text, maxWidth) {
        const paragraphs = text.split('\n');
        const lines = [];

        paragraphs.forEach(paragraph => {
            const words = paragraph.split(' ');
            let currentLine = '';

            words.forEach(word => {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            });
            if (currentLine) lines.push(currentLine);
        });

        return lines;
    }

    setText(text) {
        this.text = text;
        this.updatedAt = Date.now();
    }

    toJSON() {
        return {
            ...super.toJSON(),
            backgroundColor: this.backgroundColor,
            text: this.text,
            fontSize: this.fontSize,
            fontFamily: this.fontFamily,
            textColor: this.textColor,
            textAlign: this.textAlign,
            lineHeight: this.lineHeight
        };
    }
}

// ========================================
// 5. 文件元素 (FileElement)
// ========================================
class FileElement extends BaseElement {
    constructor(x, y) {
        super(x, y, 'file');
        this.width = 220;
        this.height = 180;
        this.backgroundColor = '#BBDEFB'; // 淡蓝色
        this.fileName = 'document.pdf';
        this.fileSize = 0;
        this.fileType = 'pdf';
        this.fileUrl = null;
        this.thumbnailUrl = null;
        this.uploadProgress = 0;
        this.isUploading = false;
    }

    render(ctx, isSelected) {
        if (!this.visible) return;

        ctx.save();

        // 阴影
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // 背景
        ctx.fillStyle = this.backgroundColor;
        this.roundRect(ctx, this.x, this.y, this.width, this.height, 10);
        ctx.fill();

        // 边框
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = isSelected ? '#1976D2' : '#64B5F6';
        ctx.lineWidth = isSelected ? 3 : 2;
        this.roundRect(ctx, this.x, this.y, this.width, this.height, 10);
        ctx.stroke();

        // 文件图标
        const iconY = this.y + 30;
        this.drawFileIcon(ctx, this.x + this.width / 2, iconY, this.fileType);

        // 文件名
        ctx.fillStyle = '#0D47A1';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const fileName = this.truncateText(ctx, this.fileName, this.width - 30);
        ctx.fillText(fileName, this.x + this.width / 2, this.y + 100);

        // 文件大小
        ctx.fillStyle = '#424242';
        ctx.font = '12px Arial';
        ctx.fillText(this.formatFileSize(this.fileSize), this.x + this.width / 2, this.y + 120);

        // 上传进度
        if (this.isUploading) {
            const barWidth = this.width - 40;
            const barHeight = 6;
            const barX = this.x + 20;
            const barY = this.y + this.height - 40;

            // 进度条背景
            ctx.fillStyle = '#E3F2FD';
            this.roundRect(ctx, barX, barY, barWidth, barHeight, 3);
            ctx.fill();

            // 进度
            ctx.fillStyle = '#2196F3';
            this.roundRect(ctx, barX, barY, barWidth * (this.uploadProgress / 100), barHeight, 3);
            ctx.fill();

            // 百分比
            ctx.fillStyle = '#1976D2';
            ctx.font = '11px Arial';
            ctx.fillText(`${this.uploadProgress}%`, this.x + this.width / 2, this.y + this.height - 20);
        } else {
            // 状态
            ctx.fillStyle = '#1976D2';
            ctx.font = '11px Arial';
            const status = this.fileUrl ? '✓ 已上传' : '⊙ 本地文件';
            ctx.fillText(status, this.x + this.width / 2, this.y + this.height - 20);
        }

        ctx.restore();
    }

    drawFileIcon(ctx, centerX, centerY, fileType) {
        const iconSize = 50;
        const colors = {
            pdf: '#D32F2F',
            doc: '#1976D2',
            docx: '#1976D2',
            xls: '#388E3C',
            xlsx: '#388E3C',
            ppt: '#F57C00',
            pptx: '#F57C00',
            txt: '#616161',
            image: '#7B1FA2',
            default: '#757575'
        };

        const color = colors[fileType] || colors.default;

        // 文件夹形状
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(centerX - iconSize / 2, centerY - iconSize / 3);
        ctx.lineTo(centerX + iconSize / 2, centerY - iconSize / 3);
        ctx.lineTo(centerX + iconSize / 2, centerY + iconSize / 2);
        ctx.lineTo(centerX - iconSize / 2, centerY + iconSize / 2);
        ctx.closePath();
        ctx.fill();

        // 文件类型标签
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fileType.toUpperCase(), centerX, centerY + 5);
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    truncateText(ctx, text, maxWidth) {
        if (ctx.measureText(text).width <= maxWidth) return text;
        
        let truncated = text;
        while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
        }
        return truncated + '...';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    setFile(file) {
        this.fileName = file.name;
        this.fileSize = file.size;
        const ext = file.name.split('.').pop().toLowerCase();
        this.fileType = ext;
        this.updatedAt = Date.now();
    }

    async upload(file) {
        if (!window.storage) {
            console.error('Firebase Storage 未初始化');
            return;
        }

        this.isUploading = true;
        this.uploadProgress = 0;

        try {
            const storageRef = window.storage.ref();
            const fileRef = storageRef.child(`files/${Date.now()}_${file.name}`);
            const uploadTask = fileRef.put(file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    this.uploadProgress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                },
                (error) => {
                    console.error('上传失败:', error);
                    this.isUploading = false;
                },
                async () => {
                    this.fileUrl = await uploadTask.snapshot.ref.getDownloadURL();
                    this.isUploading = false;
                    this.uploadProgress = 100;
                    console.log('文件上传成功:', this.fileUrl);
                }
            );
        } catch (error) {
            console.error('上传错误:', error);
            this.isUploading = false;
        }
    }

    toJSON() {
        return {
            ...super.toJSON(),
            backgroundColor: this.backgroundColor,
            fileName: this.fileName,
            fileSize: this.fileSize,
            fileType: this.fileType,
            fileUrl: this.fileUrl,
            thumbnailUrl: this.thumbnailUrl
        };
    }
}

// ========================================
// 元素工厂
// ========================================
class ElementFactory {
    static create(type, x, y) {
        const constructors = {
            'note': NoteElement,
            'timer': TimerElement,
            'protocol': ProtocolElement,
            'text': TextElement,
            'file': FileElement
        };

        const Constructor = constructors[type];
        if (!Constructor) {
            throw new Error(`未知的元素类型: ${type}`);
        }

        return new Constructor(x, y);
    }

    static fromJSON(data) {
        const element = this.create(data.type, data.x, data.y);
        Object.assign(element, data);
        return element;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BaseElement,
        NoteElement,
        TimerElement,
        ProtocolElement,
        TextElement,
        FileElement,
        ElementFactory
    };
}

console.log('✅ Element System 加载完成');
