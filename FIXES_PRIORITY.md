# LabMate Pro - 功能修复计划与优先级

## 审计日期: 2024年12月
## 功能完成度: 约 60-65%

---

## 🔴 关键缺失功能 (CRITICAL - 必须修复)

### 1. 撤销/重做系统 (UNDO/REDO)
**状态**: ❌ 不存在

**影响**: 用户很容易误删元素或做了错误操作无法恢复

**修复难度**: 中等 ⭐⭐⭐

**实现方案**:
```javascript
// 需要添加到canvas.js
class History {
    constructor(maxSteps = 50) {
        this.stack = [];
        this.index = -1;
        this.maxSteps = maxSteps;
    }
    
    push(state) {
        this.stack = this.stack.slice(0, this.index + 1);
        this.stack.push(JSON.parse(JSON.stringify(state)));
        this.index++;
        if (this.stack.length > this.maxSteps) {
            this.stack.shift();
            this.index--;
        }
    }
    
    undo() { if (this.index > 0) return this.stack[--this.index]; }
    redo() { if (this.index < this.stack.length - 1) return this.stack[++this.index]; }
}
```

**优先级**: 🔴 立即修复
**预计工作量**: 2-3小时

---

### 2. 复制/粘贴功能 (Copy/Paste)
**状态**: ⚠️ 部分实现 (有Duplicate按钮但无Ctrl+C/V)

**影响**: 用户无法使用快捷键复制粘贴，降低工作效率

**修复难度**: 低 ⭐⭐

**缺失部分**:
- Ctrl+C 复制到剪贴板
- Ctrl+V 从剪贴板粘贴
- 右键菜单的复制/粘贴选项

**修复方案**:
```javascript
// 在canvas.js onKeyDown中添加
if (e.ctrlKey && e.key === 'c') {
    e.preventDefault();
    canvas.clipboard = this.getSelectedElementsData();
}
if (e.ctrlKey && e.key === 'v') {
    e.preventDefault();
    this.pasteElements(canvas.clipboard);
}
```

**优先级**: 🔴 立即修复
**预计工作量**: 1小时

---

### 3. 私聊功能完整化
**状态**: ❌ UI存在但后端不完整

**缺失部分**:
- `loadPrivateMessages()` 方法未实现
- 私聊消息存储结构未明确
- 消息同步逻辑缺失

**影响**: 用户无法与好友私聊

**修复难度**: 中等 ⭐⭐⭐

**修复方案** (chat.js):
```javascript
async loadPrivateMessages(chatId) {
    const [uid1, uid2] = chatId.split('_');
    const messages = await db.collection('privateMessages')
        .where('chatId', '==', chatId)
        .orderBy('createdAt')
        .get();
    
    this.privateMessages = messages.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

async sendPrivateMessage(content, recipientUid) {
    const chatId = [this.userId, recipientUid].sort().join('_');
    await db.collection('privateMessages').add({
        chatId,
        fromUid: this.userId,
        toUid: recipientUid,
        content,
        createdAt: new Date(),
        readAt: null
    });
}
```

**优先级**: 🔴 立即修复
**预计工作量**: 2-3小时

---

### 4. 好友申请系统
**状态**: ❌ 不存在

**现状**: 只能邀请已知邮箱的用户，无法搜索和添加陌生人为好友

**影响**: 社交功能不完整，用户无法发现新朋友

**修复难度**: 中等 ⭐⭐⭐

**需要实现**:
- 用户搜索功能
- 好友申请系统
- 申请通知
- 申请审核界面

**修复方案**:
```javascript
// 添加到app.js

// 搜索用户
const searchUsers = async (searchTerm) => {
    try {
        const snapshot = await db.collection('users')
            .where('email', '==', searchTerm)
            .get();
        return snapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Search error:', error);
    }
};

// 发送好友申请
const sendFriendRequest = async (toUid) => {
    const requestId = Utils.generateId();
    await db.collection('friendRequests').doc(requestId).set({
        fromUid: user.value.uid,
        toUid: toUid,
        status: 'pending',
        createdAt: new Date()
    });
};

// 接受好友申请
const acceptFriendRequest = async (requestId, fromUid) => {
    const userDoc = user.value.uid;
    
    // 更新双方好友列表
    await db.collection('users').doc(user.value.uid).update({
        friends: firebase.firestore.FieldValue.arrayUnion(fromUid)
    });
    
    await db.collection('users').doc(fromUid).update({
        friends: firebase.firestore.FieldValue.arrayUnion(user.value.uid)
    });
    
    // 更新申请状态
    await db.collection('friendRequests').doc(requestId).update({
        status: 'accepted'
    });
};

// 拒绝好友申请
const rejectFriendRequest = async (requestId) => {
    await db.collection('friendRequests').doc(requestId).update({
        status: 'rejected'
    });
};
```

**优先级**: 🔴 立即修复
**预计工作量**: 3-4小时

---

### 5. 通知系统基础
**状态**: ❌ 不存在

**影响**: 用户无法获知邀请、消息、好友请求等重要事件

**修复难度**: 高 ⭐⭐⭐⭐

**需要实现**:
- 通知数据库结构
- 实时通知订阅
- 通知中心UI
- 邮件通知服务 (可选)

**修复方案** (最小可行版本):
```javascript
// 添加通知系统到app.js

class NotificationSystem {
    constructor(userId, db) {
        this.userId = userId;
        this.db = db;
        this.notifications = [];
        this.unsubscribe = null;
    }
    
    async init() {
        // 监听实时通知
        this.unsubscribe = this.db.collection('notifications')
            .where('recipientUid', '==', this.userId)
            .where('read', '==', false)
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                this.notifications = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                this.onNotificationsChange?.(this.notifications);
            });
    }
    
    async markAsRead(notificationId) {
        await this.db.collection('notifications').doc(notificationId).update({
            read: true,
            readAt: new Date()
        });
    }
    
    async markAllAsRead() {
        for (const notif of this.notifications) {
            await this.markAsRead(notif.id);
        }
    }
    
    destroy() {
        if (this.unsubscribe) this.unsubscribe();
    }
}
```

**优先级**: 🔴 立即修复
**预计工作量**: 4-5小时

---

## 🟠 高优先级缺失功能 (HIGH - 2周内完成)

### 6. Canvas右键菜单
**状态**: ❌ 不存在

**缺失操作**: 复制、粘贴、删除、编辑、分组等

**实现难度**: 低 ⭐⭐

**实现方案**: 在canvas中添加contextmenu事件处理

---

### 7. 用户资料编辑界面
**状态**: ❌ 缺失编辑界面

**影响**: 用户无法修改头像、用户名、邮箱等

**实现难度**: 低 ⭐⭐

**需要**:
- 用户资料页面
- 头像上传/更改
- 用户名编辑
- 密码修改

---

### 8. Lab编辑功能
**状态**: ❌ 缺失编辑界面

**现状**: 创建后无法编辑Lab标题、描述、图标等

**实现难度**: 低 ⭐⭐

**需要实现**:
- Lab信息编辑模态框
- 标题编辑
- 描述编辑
- 公开/私密切换
- 权限设置UI

---

### 9. 消息搜索
**状态**: ❌ 不存在

**实现难度**: 中等 ⭐⭐⭐

**方案**: 在聊天面板添加搜索框，支持按内容、时间、用户搜索

---

### 10. 移动端优化
**状态**: ⚠️ 基础支持，但不完整

**问题**:
- Canvas在小屏幕上操作困难
- 侧边栏占用空间过多
- 没有移动菜单
- 触摸支持不完整

**实现难度**: 高 ⭐⭐⭐⭐

---

## 🟡 中优先级功能 (MEDIUM - 3-4周内完成)

### 11. PDF/Excel导出
**状态**: ⚠️ Doc导出存在但PDF/Excel缺失

**实现难度**: 中等 ⭐⭐⭐

**需要库**: pdfkit 或 jspdf, xlsx

---

### 12. Canvas图层管理
**状态**: ❌ 不存在

**需要**:
- 元素排序 (bring to front, send to back)
- 锁定/隐藏
- 分组功能

**实现难度**: 中等 ⭐⭐⭐

---

### 13. Lab使用统计面板
**状态**: ❌ 不存在

**显示**:
- 元素数量
- 成员数量
- 消息数量
- 最后修改时间
- 创建时间

**实现难度**: 低 ⭐⭐

---

### 14. Lab搜索功能
**状态**: ❌ 不存在

**需要**:
- 按标题搜索
- 按描述搜索
- 按标签搜索

**实现难度**: 低 ⭐⭐

---

### 15. 元素旋转与变形
**状态**: ❌ 不存在

**实现难度**: 中等 ⭐⭐⭐

---

## 实际可用性测试结果

### ✅ 已验证可用:
- 登录/注册
- Lab创建和加入
- 基础Canvas绘图
- 元素添加/删除
- 聊天（Lab内）
- 邀请成员

### ⚠️ 部分可用:
- 元素编辑 (需验证双击编辑)
- 连接线 (需验证完整功能)
- 收藏系统 (仅本地)

### ❌ 不可用:
- 私聊功能
- 好友添加
- 撤销/重做
- 复制/粘贴
- 通知系统
- 权限管理UI

---

## 修复优先级排序

### 第1周 (最紧急)
1. ✅ 撤销/重做系统
2. ✅ Ctrl+C/V 快捷键
3. ✅ 私聊功能完整化
4. ✅ 好友申请系统基础
5. ✅ 简单通知系统

### 第2周
1. ✅ 右键菜单
2. ✅ 用户资料编辑
3. ✅ Lab编辑功能
4. ✅ 消息搜索
5. ✅ 移动端优化基础

### 第3-4周
1. ✅ PDF/Excel导出
2. ✅ 图层管理
3. ✅ 使用统计
4. ✅ Lab搜索
5. ✅ Canvas高级功能

---

## 建议修复代码框架

### 1. 撤销/重做 (最重要)

```javascript
// 在canvas.js中添加

this.history = new CanvasHistory();

// 每次操作后保存状态
addElement(element) {
    this.history.push(this.getState());
    // ... 添加元素逻辑
}

deleteSelectedElements() {
    this.history.push(this.getState());
    // ... 删除逻辑
}

// 快捷键处理
onKeyDown(e) {
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        this.undo();
    }
    if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        this.redo();
    }
}

undo() {
    const state = this.history.undo();
    if (state) this.setState(state);
}

redo() {
    const state = this.history.redo();
    if (state) this.setState(state);
}
```

### 2. 私聊功能

```javascript
// 在chat.js中添加

async loadPrivateMessages(chatId) {
    // 从Firestore加载私聊消息
}

async sendPrivateMessage(toUid, content) {
    // 发送私聊消息
}

subscribeToPrivateChat(chatId, callback) {
    // 实时订阅私聊消息
}
```

### 3. 好友申请

```javascript
// 在app.js setup中添加

const sendFriendRequest = async (toEmail) => {
    // 搜索用户
    // 发送申请
    // 显示通知
}

const acceptFriendRequest = async (requestId) => {
    // 添加好友
    // 更新申请状态
}
```

---

## 测试清单

在修复每个功能后需要测试:

- [ ] 功能在Chrome上工作
- [ ] 功能在Firefox上工作
- [ ] 功能在Safari上工作
- [ ] 功能在移动设备上工作
- [ ] 没有控制台错误
- [ ] Firestore数据正确保存
- [ ] 多用户同时操作不冲突
- [ ] 长时间使用不会内存泄漏

---

## 总结

**当前完成度**: 60-65% ✓

**可立即使用的场景**:
- 单人绘图和笔记
- 小团队的基本协作

**需要修复才能称为"完整产品"的功能**:
- 撤销/重做
- 复制/粘贴
- 私聊
- 好友系统
- 通知系统

**建议策略**:
1. 优先修复上述5个关键功能
2. 进行基本的多用户测试
3. 然后逐步添加其他功能
4. 定期收集用户反馈

**工作量估计**:
- 第1周关键功能: 15-20小时
- 第2周高优先级: 20-25小时
- 第3-4周中优先级: 25-30小时
- 总计: 60-75小时 (约1.5-2周全职工作)

