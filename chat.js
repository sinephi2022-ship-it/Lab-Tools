/**
 * LabMate Pro - Chat & Friends System
 * 聊天和好友系统 - 实时消息 + 好友管理
 * 
 * @author Sine chen
 * @version 2.0.0
 * @date 2025-12-07
 */

// ========================================
// 消息类
// ========================================
class Message {
    constructor(senderId, receiverId, content, type = 'text') {
        this.id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.content = content;
        this.type = type; // 'text', 'image', 'file', 'link', 'element', 'code'
        this.timestamp = Date.now();
        this.read = false;
        this.metadata = {}; // 额外数据(如文件URL、图片URL等)
        
        // ✨ 新增: 消息反应系统
        this.reactions = []; // [{emoji, userId, userName}, ...]
        
        // ✨ 新增: 消息编辑历史
        this.edited = false;
        this.editedAt = null;
        this.editHistory = []; // [{oldContent, editedAt}, ...]
        
        // ✨ 新增: 消息引用/回复
        this.replyTo = null; // 引用的消息 ID
    }

    /**
     * ✨ 添加反应
     */
    addReaction(emoji, userId, userName) {
        const existingReaction = this.reactions.find(r => r.emoji === emoji && r.userId === userId);
        
        if (existingReaction) {
            // 移除反应
            this.reactions = this.reactions.filter(r => !(r.emoji === emoji && r.userId === userId));
        } else {
            // 添加反应
            this.reactions.push({ emoji, userId, userName, timestamp: Date.now() });
        }
        
        return this.reactions;
    }

    /**
     * ✨ 获取反应统计
     */
    getReactionStats() {
        const stats = {};
        
        this.reactions.forEach(reaction => {
            if (!stats[reaction.emoji]) {
                stats[reaction.emoji] = {
                    emoji: reaction.emoji,
                    count: 0,
                    users: []
                };
            }
            stats[reaction.emoji].count++;
            stats[reaction.emoji].users.push(reaction.userName);
        });
        
        return Object.values(stats);
    }

    /**
     * ✨ 编辑消息
     */
    edit(newContent) {
        // 保存编辑历史
        this.editHistory.push({
            oldContent: this.content,
            editedAt: this.editedAt || this.timestamp
        });
        
        this.content = newContent;
        this.edited = true;
        this.editedAt = Date.now();
    }

    /**
     * ✨ 撤销最后一次编辑
     */
    undoEdit() {
        if (this.editHistory.length === 0) {
            console.warn('⚠️ 没有编辑历史可以撤销');
            return false;
        }
        
        const lastEdit = this.editHistory.pop();
        this.content = lastEdit.oldContent;
        
        if (this.editHistory.length === 0) {
            this.edited = false;
            this.editedAt = null;
        }
        
        return true;
    }

    toJSON() {
        return {
            id: this.id,
            senderId: this.senderId,
            receiverId: this.receiverId,
            content: this.content,
            type: this.type,
            timestamp: this.timestamp,
            read: this.read,
            metadata: this.metadata,
            reactions: this.reactions,
            edited: this.edited,
            editedAt: this.editedAt,
            editHistory: this.editHistory,
            replyTo: this.replyTo
        };
    }

    static fromJSON(data) {
        const msg = new Message(data.senderId, data.receiverId, data.content, data.type);
        msg.id = data.id;
        msg.timestamp = data.timestamp;
        msg.read = data.read || false;
        msg.metadata = data.metadata || {};
        msg.reactions = data.reactions || [];
        msg.edited = data.edited || false;
        msg.editedAt = data.editedAt || null;
        msg.editHistory = data.editHistory || [];
        msg.replyTo = data.replyTo || null;
        return msg;
    }
}

// ========================================
// 好友类
// ========================================
class Friend {
    constructor(userId, displayName, avatar = null) {
        this.userId = userId;
        this.displayName = displayName;
        this.avatar = avatar;
        this.status = 'offline'; // 'online', 'offline', 'busy', 'away'
        this.lastSeen = Date.now();
        this.addedAt = Date.now();
        this.bio = '';
        this.tags = []; // 好友标签
    }

    toJSON() {
        return {
            userId: this.userId,
            displayName: this.displayName,
            avatar: this.avatar,
            status: this.status,
            lastSeen: this.lastSeen,
            addedAt: this.addedAt,
            bio: this.bio,
            tags: this.tags
        };
    }

    static fromJSON(data) {
        const friend = new Friend(data.userId, data.displayName, data.avatar);
        friend.status = data.status || 'offline';
        friend.lastSeen = data.lastSeen || Date.now();
        friend.addedAt = data.addedAt || Date.now();
        friend.bio = data.bio || '';
        friend.tags = data.tags || [];
        return friend;
    }
}

// ========================================
// 聊天管理器
// ========================================
class ChatManager {
    constructor() {
        this.currentUserId = null;
        this.friends = new Map(); // <userId, Friend>
        this.messages = new Map(); // <conversationId, Message[]>
        this.unreadCounts = new Map(); // <userId, count>
        this.listeners = new Map(); // Firestore 监听器
        this.callbacks = {
            onNewMessage: null,
            onFriendStatusChange: null,
            onFriendAdded: null,
            onFriendRemoved: null
        };
    }

    /**
     * 初始化聊天系统
     */
    async init(userId) {
        if (!window.db || !window.auth) {
            console.error('❌ Firebase 未初始化');
            return false;
        }

        this.currentUserId = userId;
        console.log(`✅ 聊天系统初始化 - 用户: ${userId}`);

        // 加载好友列表
        await this.loadFriends();

        // 监听好友状态变化
        this.startFriendStatusListener();

        // 监听新消息
        this.startMessageListener();

        return true;
    }

    /**
     * 加载好友列表
     */
    async loadFriends() {
        try {
            const friendsRef = window.db.collection('users')
                .doc(this.currentUserId)
                .collection('friends');

            const snapshot = await friendsRef.get();
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const friend = Friend.fromJSON(data);
                this.friends.set(friend.userId, friend);
            });

            console.log(`✅ 加载了 ${this.friends.size} 个好友`);
        } catch (error) {
            console.error('❌ 加载好友失败:', error);
        }
    }

    /**
     * 添加好友
     */
    async addFriend(userId, displayName, avatar = null) {
        if (!this.currentUserId) {
            console.error('❌ 未登录');
            return false;
        }

        if (userId === this.currentUserId) {
            console.error('❌ 不能添加自己为好友');
            return false;
        }

        try {
            const friend = new Friend(userId, displayName, avatar);
            
            // 保存到 Firestore
            await window.db.collection('users')
                .doc(this.currentUserId)
                .collection('friends')
                .doc(userId)
                .set(friend.toJSON());

            // 双向添加好友
            const currentUser = window.auth.currentUser;
            await window.db.collection('users')
                .doc(userId)
                .collection('friends')
                .doc(this.currentUserId)
                .set({
                    userId: this.currentUserId,
                    displayName: currentUser.displayName || currentUser.email,
                    avatar: currentUser.photoURL,
                    status: 'online',
                    lastSeen: Date.now(),
                    addedAt: Date.now(),
                    bio: '',
                    tags: []
                });

            this.friends.set(userId, friend);
            this.callbacks.onFriendAdded?.(friend);

            console.log(`✅ 添加好友成功: ${displayName}`);
            return true;
        } catch (error) {
            console.error('❌ 添加好友失败:', error);
            return false;
        }
    }

    /**
     * 删除好友
     */
    async removeFriend(userId) {
        if (!this.currentUserId) return false;

        try {
            // 从 Firestore 删除
            await window.db.collection('users')
                .doc(this.currentUserId)
                .collection('friends')
                .doc(userId)
                .delete();

            // 双向删除
            await window.db.collection('users')
                .doc(userId)
                .collection('friends')
                .doc(this.currentUserId)
                .delete();

            const friend = this.friends.get(userId);
            this.friends.delete(userId);
            this.callbacks.onFriendRemoved?.(friend);

            console.log(`✅ 删除好友成功: ${userId}`);
            return true;
        } catch (error) {
            console.error('❌ 删除好友失败:', error);
            return false;
        }
    }

    /**
     * 发送消息
     */
    async sendMessage(receiverId, content, type = 'text', metadata = {}) {
        if (!this.currentUserId) {
            console.error('❌ 未登录');
            return null;
        }

        try {
            const message = new Message(this.currentUserId, receiverId, content, type);
            message.metadata = metadata;

            // 保存到 Firestore
            const conversationId = this.getConversationId(this.currentUserId, receiverId);
            await window.db.collection('conversations')
                .doc(conversationId)
                .collection('messages')
                .doc(message.id)
                .set(message.toJSON());

            // 更新会话信息
            await window.db.collection('conversations')
                .doc(conversationId)
                .set({
                    participants: [this.currentUserId, receiverId],
                    lastMessage: content,
                    lastMessageTime: message.timestamp,
                    lastMessageSender: this.currentUserId
                }, { merge: true });

            // 添加到本地缓存
            if (!this.messages.has(conversationId)) {
                this.messages.set(conversationId, []);
            }
            this.messages.get(conversationId).push(message);

            console.log(`✅ 发送消息成功 -> ${receiverId}`);
            return message;
        } catch (error) {
            console.error('❌ 发送消息失败:', error);
            return null;
        }
    }

    /**
     * 加载聊天记录
     */
    async loadMessages(userId, limit = 50) {
        if (!this.currentUserId) return [];

        try {
            const conversationId = this.getConversationId(this.currentUserId, userId);
            const messagesRef = window.db.collection('conversations')
                .doc(conversationId)
                .collection('messages')
                .orderBy('timestamp', 'desc')
                .limit(limit);

            const snapshot = await messagesRef.get();
            const messages = [];

            snapshot.forEach(doc => {
                const msg = Message.fromJSON(doc.data());
                messages.push(msg);
            });

            messages.reverse(); // 按时间正序排列
            this.messages.set(conversationId, messages);

            console.log(`✅ 加载了 ${messages.length} 条消息`);
            return messages;
        } catch (error) {
            console.error('❌ 加载消息失败:', error);
            return [];
        }
    }

    /**
     * 标记消息为已读
     */
    async markAsRead(userId) {
        if (!this.currentUserId) return;

        try {
            const conversationId = this.getConversationId(this.currentUserId, userId);
            const messages = this.messages.get(conversationId) || [];

            const batch = window.db.batch();
            messages.forEach(msg => {
                if (msg.receiverId === this.currentUserId && !msg.read) {
                    const msgRef = window.db.collection('conversations')
                        .doc(conversationId)
                        .collection('messages')
                        .doc(msg.id);
                    batch.update(msgRef, { read: true });
                    msg.read = true;
                }
            });

            await batch.commit();
            this.unreadCounts.set(userId, 0);

            console.log(`✅ 标记消息已读: ${userId}`);
        } catch (error) {
            console.error('❌ 标记已读失败:', error);
        }
    }

    /**
     * 获取未读消息数
     */
    getUnreadCount(userId) {
        return this.unreadCounts.get(userId) || 0;
    }

    /**
     * 获取总未读消息数
     */
    getTotalUnreadCount() {
        let total = 0;
        this.unreadCounts.forEach(count => {
            total += count;
        });
        return total;
    }

    /**
     * 监听好友状态变化
     */
    startFriendStatusListener() {
        if (!this.currentUserId) return;

        const friendsRef = window.db.collection('users')
            .doc(this.currentUserId)
            .collection('friends');

        const unsubscribe = friendsRef.onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                const data = change.doc.data();
                const userId = change.doc.id;

                if (change.type === 'modified') {
                    const friend = this.friends.get(userId);
                    if (friend) {
                        const oldStatus = friend.status;
                        friend.status = data.status;
                        friend.lastSeen = data.lastSeen;
                        
                        if (oldStatus !== friend.status) {
                            this.callbacks.onFriendStatusChange?.(friend);
                        }
                    }
                }
            });
        });

        this.listeners.set('friendStatus', unsubscribe);
    }

    /**
     * 监听新消息
     */
    startMessageListener() {
        if (!this.currentUserId) return;

        this.friends.forEach((friend, userId) => {
            const conversationId = this.getConversationId(this.currentUserId, userId);
            const messagesRef = window.db.collection('conversations')
                .doc(conversationId)
                .collection('messages')
                .where('receiverId', '==', this.currentUserId)
                .orderBy('timestamp', 'desc')
                .limit(1);

            const unsubscribe = messagesRef.onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const msg = Message.fromJSON(change.doc.data());
                        
                        // 只处理新消息(不是历史消息)
                        if (Date.now() - msg.timestamp < 5000) {
                            if (!this.messages.has(conversationId)) {
                                this.messages.set(conversationId, []);
                            }
                            this.messages.get(conversationId).push(msg);

                            // 更新未读计数
                            if (!msg.read) {
                                const count = this.unreadCounts.get(userId) || 0;
                                this.unreadCounts.set(userId, count + 1);
                            }

                            this.callbacks.onNewMessage?.(msg, friend);
                        }
                    }
                });
            });

            this.listeners.set(`messages_${userId}`, unsubscribe);
        });
    }

    /**
     * 更新在线状态
     */
    async updateStatus(status) {
        if (!this.currentUserId) return;

        try {
            // 更新所有好友中的自己状态
            const batch = window.db.batch();
            
            this.friends.forEach((friend, userId) => {
                const friendRef = window.db.collection('users')
                    .doc(userId)
                    .collection('friends')
                    .doc(this.currentUserId);
                
                batch.update(friendRef, {
                    status: status,
                    lastSeen: Date.now()
                });
            });

            await batch.commit();
            console.log(`✅ 更新状态: ${status}`);
        } catch (error) {
            console.error('❌ 更新状态失败:', error);
        }
    }

    /**
     * 搜索好友
     */
    searchFriends(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();

        this.friends.forEach(friend => {
            if (friend.displayName.toLowerCase().includes(lowerQuery) ||
                friend.userId.toLowerCase().includes(lowerQuery)) {
                results.push(friend);
            }
        });

        return results;
    }

    /**
     * ✨ 编辑消息
     */
    async editMessage(conversationId, messageId, newContent) {
        if (!this.currentUserId) return false;

        try {
            // 获取消息
            const messageRef = window.db.collection('conversations')
                .doc(conversationId)
                .collection('messages')
                .doc(messageId);
            
            const messageDoc = await messageRef.get();
            if (!messageDoc.exists) {
                console.error('❌ 消息不存在');
                return false;
            }

            const message = Message.fromJSON(messageDoc.data());
            
            // 只有发送者可以编辑
            if (message.senderId !== this.currentUserId) {
                console.error('❌ 只有消息发送者可以编辑');
                return false;
            }

            // 编辑消息
            message.edit(newContent);
            
            // 更新到 Firestore
            await messageRef.update(message.toJSON());
            
            console.log(`✅ 编辑消息成功`);
            return true;
        } catch (error) {
            console.error('❌ 编辑消息失败:', error);
            return false;
        }
    }

    /**
     * ✨ 删除消息
     */
    async deleteMessage(conversationId, messageId) {
        if (!this.currentUserId) return false;

        try {
            // 获取消息
            const messageRef = window.db.collection('conversations')
                .doc(conversationId)
                .collection('messages')
                .doc(messageId);
            
            const messageDoc = await messageRef.get();
            if (!messageDoc.exists) {
                console.error('❌ 消息不存在');
                return false;
            }

            const message = Message.fromJSON(messageDoc.data());
            
            // 只有发送者可以删除
            if (message.senderId !== this.currentUserId) {
                console.error('❌ 只有消息发送者可以删除');
                return false;
            }

            // 删除消息
            await messageRef.delete();
            
            // 从本地缓存删除
            if (this.messages.has(conversationId)) {
                const messages = this.messages.get(conversationId);
                const index = messages.findIndex(m => m.id === messageId);
                if (index !== -1) {
                    messages.splice(index, 1);
                }
            }

            console.log(`✅ 删除消息成功`);
            return true;
        } catch (error) {
            console.error('❌ 删除消息失败:', error);
            return false;
        }
    }

    /**
     * ✨ 添加消息反应
     */
    async addReaction(conversationId, messageId, emoji, userName) {
        if (!this.currentUserId) return false;

        try {
            const messageRef = window.db.collection('conversations')
                .doc(conversationId)
                .collection('messages')
                .doc(messageId);
            
            const messageDoc = await messageRef.get();
            if (!messageDoc.exists) {
                console.error('❌ 消息不存在');
                return false;
            }

            const message = Message.fromJSON(messageDoc.data());
            
            // 添加或移除反应
            message.addReaction(emoji, this.currentUserId, userName);
            
            // 更新到 Firestore
            await messageRef.update({
                reactions: message.reactions
            });

            console.log(`✅ 反应已添加: ${emoji}`);
            return true;
        } catch (error) {
            console.error('❌ 添加反应失败:', error);
            return false;
        }
    }

    /**
     * ✨ 获取消息反应统计
     */
    getReactionStats(conversationId, messageId) {
        const messages = this.messages.get(conversationId) || [];
        const message = messages.find(m => m.id === messageId);
        
        if (!message) return [];
        
        return message.getReactionStats();
    }

    /**
     * ✨ 回复消息 (添加引用)
     */
    async replyToMessage(receiverId, content, replyToMessageId) {
        try {
            const message = new Message(this.currentUserId, receiverId, content, 'text');
            message.replyTo = replyToMessageId;

            // 保存到 Firestore
            const conversationId = this.getConversationId(this.currentUserId, receiverId);
            await window.db.collection('conversations')
                .doc(conversationId)
                .collection('messages')
                .doc(message.id)
                .set(message.toJSON());

            // 更新会话信息
            await window.db.collection('conversations')
                .doc(conversationId)
                .set({
                    participants: [this.currentUserId, receiverId],
                    lastMessage: content,
                    lastMessageTime: message.timestamp,
                    lastMessageSender: this.currentUserId
                }, { merge: true });

            // 添加到本地缓存
            if (!this.messages.has(conversationId)) {
                this.messages.set(conversationId, []);
            }
            this.messages.get(conversationId).push(message);

            console.log(`✅ 回复消息成功`);
            return message;
        } catch (error) {
            console.error('❌ 回复消息失败:', error);
            return null;
        }
    }

    /**
     * 获取会话 ID
     */
    getConversationId(userId1, userId2) {
        return [userId1, userId2].sort().join('_');
    }

    /**
     * 发送元素(分享画布元素)
     */
    async sendElement(receiverId, element) {
        const content = `分享了 ${element.type} 元素`;
        const metadata = {
            elementType: element.type,
            elementData: element.toJSON()
        };

        return await this.sendMessage(receiverId, content, 'element', metadata);
    }

    /**
     * 发送文件
     */
    async sendFile(receiverId, file) {
        if (!window.storage) {
            console.error('❌ Firebase Storage 未初始化');
            return null;
        }

        try {
            // 上传文件
            const storageRef = window.storage.ref();
            const fileRef = storageRef.child(`chat_files/${Date.now()}_${file.name}`);
            await fileRef.put(file);
            const fileUrl = await fileRef.getDownloadURL();

            // 发送消息
            const content = `发送了文件: ${file.name}`;
            const metadata = {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                fileUrl: fileUrl
            };

            return await this.sendMessage(receiverId, content, 'file', metadata);
        } catch (error) {
            console.error('❌ 发送文件失败:', error);
            return null;
        }
    }

    /**
     * 发送图片
     */
    async sendImage(receiverId, imageFile) {
        if (!window.storage) {
            console.error('❌ Firebase Storage 未初始化');
            return null;
        }

        try {
            // 上传图片
            const storageRef = window.storage.ref();
            const imageRef = storageRef.child(`chat_images/${Date.now()}_${imageFile.name}`);
            await imageRef.put(imageFile);
            const imageUrl = await imageRef.getDownloadURL();

            // 发送消息
            const content = '[图片]';
            const metadata = {
                imageUrl: imageUrl,
                fileName: imageFile.name
            };

            return await this.sendMessage(receiverId, content, 'image', metadata);
        } catch (error) {
            console.error('❌ 发送图片失败:', error);
            return null;
        }
    }

    /**
     * 清理资源
     */
    destroy() {
        // 取消所有监听器
        this.listeners.forEach(unsubscribe => {
            unsubscribe();
        });
        this.listeners.clear();

        // 清空数据
        this.friends.clear();
        this.messages.clear();
        this.unreadCounts.clear();

        console.log('✅ 聊天系统已清理');
    }

    /**
     * 设置回调函数
     */
    on(event, callback) {
        if (this.callbacks.hasOwnProperty('on' + event.charAt(0).toUpperCase() + event.slice(1))) {
            this.callbacks['on' + event.charAt(0).toUpperCase() + event.slice(1)] = callback;
        }
    }

    /**
     * 获取好友列表
     */
    getFriends() {
        return Array.from(this.friends.values());
    }

    /**
     * 获取在线好友
     */
    getOnlineFriends() {
        return this.getFriends().filter(f => f.status === 'online');
    }

    /**
     * 获取好友信息
     */
    getFriend(userId) {
        return this.friends.get(userId);
    }

    /**
     * 导出聊天记录
     */
    exportMessages(userId) {
        const conversationId = this.getConversationId(this.currentUserId, userId);
        const messages = this.messages.get(conversationId) || [];
        return messages.map(msg => msg.toJSON());
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Message,
        Friend,
        ChatManager
    };
}

console.log('✅ Chat System 加载完成');
