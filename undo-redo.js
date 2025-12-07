/**
 * LabMate Pro - Undo/Redo System
 * 撤销/重做系统 - 支持命令模式的操作历史管理
 * 
 * @author Sine chen
 * @version 2.0.0
 * @date 2025-12-07
 */

/**
 * 命令基类 - 所有可撤销的操作都继承此类
 */
class Command {
    constructor() {
        this.timestamp = Date.now();
    }

    /**
     * 执行命令
     */
    execute() {
        throw new Error('execute() 必须被实现');
    }

    /**
     * 撤销命令
     */
    undo() {
        throw new Error('undo() 必须被实现');
    }

    /**
     * 重做命令
     */
    redo() {
        this.execute();
    }

    /**
     * 获取命令描述
     */
    getDescription() {
        return '命令';
    }
}

/**
 * 添加元素命令
 */
class AddElementCommand extends Command {
    constructor(canvasEngine, element) {
        super();
        this.canvasEngine = canvasEngine;
        this.element = element;
    }

    execute() {
        this.canvasEngine.addElement(this.element);
    }

    undo() {
        this.canvasEngine.removeElement(this.element.id);
    }

    getDescription() {
        return `添加 ${this.element.type || '元素'}`;
    }
}

/**
 * 删除元素命令
 */
class RemoveElementCommand extends Command {
    constructor(canvasEngine, element) {
        super();
        this.canvasEngine = canvasEngine;
        this.element = JSON.parse(JSON.stringify(element)); // 深拷贝保存状态
        this.elementId = element.id;
    }

    execute() {
        this.canvasEngine.removeElement(this.elementId);
    }

    undo() {
        // 重建元素 (需要重建实际的元素对象)
        // 这里简化处理，实际实现可能需要更复杂的逻辑
        const element = Object.assign(
            Object.create(Object.getPrototypeOf(this.element)),
            this.element
        );
        this.canvasEngine.addElement(element);
    }

    getDescription() {
        return `删除 ${this.element.type || '元素'}`;
    }
}

/**
 * 移动元素命令
 */
class MoveElementCommand extends Command {
    constructor(canvasEngine, elementId, fromX, fromY, toX, toY) {
        super();
        this.canvasEngine = canvasEngine;
        this.elementId = elementId;
        this.fromX = fromX;
        this.fromY = fromY;
        this.toX = toX;
        this.toY = toY;
    }

    execute() {
        const element = this.canvasEngine.getElement(this.elementId);
        if (element) {
            element.x = this.toX;
            element.y = this.toY;
            this.canvasEngine.markDirty('RENDER');
        }
    }

    undo() {
        const element = this.canvasEngine.getElement(this.elementId);
        if (element) {
            element.x = this.fromX;
            element.y = this.fromY;
            this.canvasEngine.markDirty('RENDER');
        }
    }

    getDescription() {
        return '移动元素';
    }
}

/**
 * 修改元素属性命令
 */
class ModifyElementCommand extends Command {
    constructor(canvasEngine, elementId, changedProps) {
        super();
        this.canvasEngine = canvasEngine;
        this.elementId = elementId;
        this.changedProps = changedProps;
        this.previousProps = {};
        
        // 保存修改前的属性值
        const element = canvasEngine.getElement(elementId);
        if (element) {
            Object.keys(changedProps).forEach(key => {
                this.previousProps[key] = element[key];
            });
        }
    }

    execute() {
        const element = this.canvasEngine.getElement(this.elementId);
        if (element) {
            Object.assign(element, this.changedProps);
            this.canvasEngine.markDirty('RENDER');
        }
    }

    undo() {
        const element = this.canvasEngine.getElement(this.elementId);
        if (element) {
            Object.assign(element, this.previousProps);
            this.canvasEngine.markDirty('RENDER');
        }
    }

    getDescription() {
        return `修改元素属性`;
    }
}

/**
 * 批量命令 - 将多个命令合并为一个
 */
class MacroCommand extends Command {
    constructor(commands = []) {
        super();
        this.commands = commands;
    }

    addCommand(command) {
        this.commands.push(command);
    }

    execute() {
        this.commands.forEach(cmd => cmd.execute());
    }

    undo() {
        // 反向执行撤销
        for (let i = this.commands.length - 1; i >= 0; i--) {
            this.commands[i].undo();
        }
    }

    getDescription() {
        return `批量操作 (${this.commands.length} 个)`;
    }
}

/**
 * 命令历史管理器 - Undo/Redo 核心
 */
class CommandHistory {
    constructor(maxSteps = 100) {
        this.maxSteps = maxSteps;
        this.history = [];
        this.currentIndex = -1;
    }

    /**
     * 执行命令并加入历史
     */
    execute(command) {
        // 删除当前位置之后的所有历史 (重做栈)
        this.history = this.history.slice(0, this.currentIndex + 1);
        
        // 执行命令
        command.execute();
        
        // 添加到历史
        this.history.push(command);
        this.currentIndex++;
        
        // 限制历史记录数量
        if (this.history.length > this.maxSteps) {
            this.history.shift();
            this.currentIndex--;
        }
    }

    /**
     * 撤销
     */
    undo() {
        if (this.canUndo()) {
            const command = this.history[this.currentIndex];
            command.undo();
            this.currentIndex--;
            return command.getDescription();
        }
        return null;
    }

    /**
     * 重做
     */
    redo() {
        if (this.canRedo()) {
            this.currentIndex++;
            const command = this.history[this.currentIndex];
            command.redo();
            return command.getDescription();
        }
        return null;
    }

    /**
     * 是否可以撤销
     */
    canUndo() {
        return this.currentIndex >= 0;
    }

    /**
     * 是否可以重做
     */
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    /**
     * 获取历史信息
     */
    getHistory() {
        return this.history.map((cmd, index) => ({
            index,
            description: cmd.getDescription(),
            timestamp: cmd.timestamp,
            isCurrentPosition: index === this.currentIndex
        }));
    }

    /**
     * 清空历史
     */
    clear() {
        this.history = [];
        this.currentIndex = -1;
    }

    /**
     * 获取当前状态描述
     */
    getStatus() {
        return {
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            undoDescription: this.canUndo() ? this.history[this.currentIndex].getDescription() : null,
            redoDescription: this.canRedo() ? this.history[this.currentIndex + 1].getDescription() : null,
            historyLength: this.history.length,
            currentIndex: this.currentIndex
        };
    }
}

// 导出
window.Command = Command;
window.AddElementCommand = AddElementCommand;
window.RemoveElementCommand = RemoveElementCommand;
window.MoveElementCommand = MoveElementCommand;
window.ModifyElementCommand = ModifyElementCommand;
window.MacroCommand = MacroCommand;
window.CommandHistory = CommandHistory;

console.log('✅ Undo/Redo System 加载完成');
