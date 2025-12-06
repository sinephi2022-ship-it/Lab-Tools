/**
 * LabMate Pro - Element Types
 * Note, Timer, Protocol, Text, File elements
 */

class LabElement {
    constructor(id, type, data = {}) {
        this.id = id;
        this.type = type;
        this.x = data.x || 0;
        this.y = data.y || 0;
        this.width = data.width || 200;
        this.height = data.height || 150;
        this.color = data.color || '#ffffff';
        this.content = data.content || '';
        this.metadata = data.metadata || {};
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }
    
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            color: this.color,
            content: this.content,
            metadata: this.metadata,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

class NoteElement extends LabElement {
    constructor(id, data = {}) {
        super(id, 'note', data);
        this.color = data.color || '#fef08a';
        this.metadata.fontSize = data.metadata?.fontSize || 12;
        this.metadata.images = data.metadata?.images || [];
    }
    
    render(ctx, x, y, w, h, isSelected) {
        // Draw sticky note shape
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, w, h);
        
        // Shadow effect
        if (isSelected) {
            ctx.shadowColor = 'rgba(37, 99, 235, 0.5)';
            ctx.shadowBlur = 8;
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 3;
        } else {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
            ctx.shadowBlur = 4;
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
        }
        
        ctx.strokeRect(x, y, w, h);
        ctx.shadowColor = 'transparent';
        
        // Draw text
        ctx.font = `${this.metadata.fontSize}px "Kalam", cursive`;
        ctx.fillStyle = '#1f2937';
        this.drawWrappedText(ctx, this.content, x + 8, y + 24, w - 16, h - 32);
    }
    
    drawWrappedText(ctx, text, x, y, maxWidth, maxHeight) {
        const lines = [];
        const words = text.split(' ');
        let currentLine = '';
        
        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) lines.push(currentLine);
        
        const lineHeight = this.metadata.fontSize + 4;
        for (let i = 0; i < Math.min(lines.length, Math.floor(maxHeight / lineHeight)); i++) {
            ctx.fillText(lines[i], x, y + i * lineHeight);
        }
    }
}

class TimerElement extends LabElement {
    constructor(id, data = {}) {
        super(id, 'timer', data);
        this.color = data.color || '#fca5a5';
        this.metadata.duration = data.metadata?.duration || 300; // seconds
        this.metadata.remaining = data.metadata?.remaining || 300;
        this.metadata.isRunning = data.metadata?.isRunning || false;
        this.metadata.startTime = data.metadata?.startTime || null;
    }
    
    start() {
        this.metadata.isRunning = true;
        this.metadata.startTime = Date.now();
    }
    
    pause() {
        this.metadata.isRunning = false;
    }
    
    reset() {
        this.metadata.isRunning = false;
        this.metadata.remaining = this.metadata.duration;
        this.metadata.startTime = null;
    }
    
    update() {
        if (this.metadata.isRunning && this.metadata.startTime) {
            const elapsed = Math.floor((Date.now() - this.metadata.startTime) / 1000);
            this.metadata.remaining = Math.max(0, this.metadata.duration - elapsed);
            
            if (this.metadata.remaining === 0) {
                this.pause();
            }
        }
    }
    
    render(ctx, x, y, w, h, isSelected) {
        // Draw timer background
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, w, h);
        
        ctx.strokeStyle = isSelected ? '#2563eb' : '#dc2626';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.strokeRect(x, y, w, h);
        
        // Draw time display
        const minutes = Math.floor(this.metadata.remaining / 60);
        const seconds = this.metadata.remaining % 60;
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        ctx.font = 'bold 32px "JetBrains Mono", monospace';
        ctx.fillStyle = '#7f1d1d';
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, x + w / 2, y + h / 2 + 12);
        ctx.textAlign = 'left';
        
        // Draw status
        ctx.font = 'bold 12px Arial';
        const status = this.metadata.isRunning ? '运行中' : '暂停';
        ctx.fillText(status, x + 8, y + h - 8);
    }
}

class ProtocolElement extends LabElement {
    constructor(id, data = {}) {
        super(id, 'protocol', data);
        this.color = data.color || '#a7f3d0';
        this.metadata.steps = data.metadata?.steps || ['Step 1', 'Step 2', 'Step 3'];
        this.metadata.completed = data.metadata?.completed || [];
    }
    
    toggleStep(index) {
        if (this.metadata.completed.includes(index)) {
            this.metadata.completed = this.metadata.completed.filter(i => i !== index);
        } else {
            this.metadata.completed.push(index);
        }
    }
    
    render(ctx, x, y, w, h, isSelected) {
        // Draw protocol background
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, w, h);
        
        ctx.strokeStyle = isSelected ? '#2563eb' : '#059669';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.strokeRect(x, y, w, h);
        
        // Draw steps
        const stepHeight = 18;
        const startY = y + 8;
        
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#065f46';
        
        for (let i = 0; i < Math.min(this.metadata.steps.length, Math.floor((h - 16) / stepHeight)); i++) {
            const stepY = startY + i * stepHeight;
            const isCompleted = this.metadata.completed.includes(i);
            
            // Draw checkbox
            const checkboxSize = 12;
            ctx.strokeStyle = '#059669';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 8, stepY, checkboxSize, checkboxSize);
            
            if (isCompleted) {
                ctx.fillStyle = '#059669';
                ctx.fillRect(x + 8, stepY, checkboxSize, checkboxSize);
                ctx.fillStyle = '#ffffff';
                ctx.fillText('✓', x + 10, stepY + 11);
            }
            
            // Draw step text
            ctx.fillStyle = isCompleted ? '#999' : '#065f46';
            const text = this.metadata.steps[i];
            ctx.fillText(text.substring(0, 20), x + 24, stepY + 12);
        }
    }
}

class TextElement extends LabElement {
    constructor(id, data = {}) {
        super(id, 'text', data);
        this.color = data.color || '#e9d5ff';
        this.metadata.fontSize = data.metadata?.fontSize || 16;
        this.metadata.fontWeight = data.metadata?.fontWeight || 'bold';
        this.metadata.align = data.metadata?.align || 'left';
    }
    
    render(ctx, x, y, w, h, isSelected) {
        // Draw text background
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, w, h);
        
        ctx.strokeStyle = isSelected ? '#2563eb' : '#d8b4fe';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.strokeRect(x, y, w, h);
        
        // Draw text
        ctx.font = `${this.metadata.fontWeight} ${this.metadata.fontSize}px "Inter", sans-serif`;
        ctx.fillStyle = '#5b21b6';
        ctx.textAlign = this.metadata.align;
        
        const textX = this.metadata.align === 'center' ? x + w / 2 : 
                      this.metadata.align === 'right' ? x + w - 8 : x + 8;
        
        ctx.fillText(this.content || 'Text', textX, y + h / 2 + this.metadata.fontSize / 2);
        ctx.textAlign = 'left';
    }
}

class FileElement extends LabElement {
    constructor(id, data = {}) {
        super(id, 'file', data);
        this.color = data.color || '#dbeafe';
        this.metadata.fileName = data.metadata?.fileName || 'document.pdf';
        this.metadata.fileSize = data.metadata?.fileSize || 0;
        this.metadata.fileUrl = data.metadata?.fileUrl || '';
        this.metadata.fileType = data.metadata?.fileType || 'pdf';
    }
    
    render(ctx, x, y, w, h, isSelected) {
        // Draw file background
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, w, h);
        
        ctx.strokeStyle = isSelected ? '#2563eb' : '#0284c7';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.strokeRect(x, y, w, h);
        
        // Draw file icon
        const iconX = x + 12;
        const iconY = y + 16;
        
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.strokeRect(iconX, iconY, 20, 28);
        
        // File type label
        ctx.font = 'bold 8px Arial';
        ctx.fillStyle = '#0284c7';
        ctx.textAlign = 'center';
        ctx.fillText(this.metadata.fileType.toUpperCase(), iconX + 10, iconY + 20);
        ctx.textAlign = 'left';
        
        // File name and size
        ctx.font = '12px Arial';
        ctx.fillStyle = '#0c4a6e';
        const fileName = this.metadata.fileName.substring(0, 15);
        ctx.fillText(fileName, x + 40, y + 20);
        
        ctx.font = '10px Arial';
        ctx.fillStyle = '#64748b';
        const fileSize = this.metadata.fileSize > 1024 * 1024 ? 
            (this.metadata.fileSize / (1024 * 1024)).toFixed(1) + ' MB' :
            (this.metadata.fileSize / 1024).toFixed(1) + ' KB';
        ctx.fillText(fileSize, x + 40, y + 35);
    }
}

/**
 * Factory function to create elements
 */
function createElement(type, id, data = {}) {
    switch (type) {
        case 'note':
            return new NoteElement(id, data);
        case 'timer':
            return new TimerElement(id, data);
        case 'protocol':
            return new ProtocolElement(id, data);
        case 'text':
            return new TextElement(id, data);
        case 'file':
            return new FileElement(id, data);
        default:
            return new LabElement(id, type, data);
    }
}

// Export classes and factory
window.LabElement = LabElement;
window.NoteElement = NoteElement;
window.TimerElement = TimerElement;
window.ProtocolElement = ProtocolElement;
window.TextElement = TextElement;
window.FileElement = FileElement;
window.createElement = createElement;
