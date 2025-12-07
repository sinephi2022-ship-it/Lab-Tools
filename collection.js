/**
 * LabMate Pro - Collection System
 * 云端仓库系统 - 收藏管理 + 文件上传下载
 * 
 * @author Sine chen
 * @version 2.0.0
 * @date 2025-12-07
 */

// ========================================
// 收藏项类
// ========================================
class CollectionItem {
    constructor(name, type, data) {
        this.id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.name = name;
        this.type = type; // 'element', 'template', 'file', 'image', 'link', 'workspace'
        this.data = data; // 实际数据
        this.description = '';
        this.tags = [];
        this.category = 'uncategorized';
        this.thumbnail = null;
        this.fileUrl = null;
        this.fileSize = 0;
        this.downloads = 0;
        this.likes = 0;
        this.public = false; // 是否公开分享
        this.createdAt = Date.now();
        this.updatedAt = Date.now();
        this.createdBy = null; // 创建者 userId
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            data: this.data,
            description: this.description,
            tags: this.tags,
            category: this.category,
            thumbnail: this.thumbnail,
            fileUrl: this.fileUrl,
            fileSize: this.fileSize,
            downloads: this.downloads,
            likes: this.likes,
            public: this.public,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            createdBy: this.createdBy
        };
    }

    static fromJSON(data) {
        const item = new CollectionItem(data.name, data.type, data.data);
        Object.assign(item, data);
        return item;
    }
}

// ========================================
// 收藏分类类
// ========================================
class Category {
    constructor(name, color = '#2196F3') {
        this.id = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.name = name;
        this.color = color;
        this.icon = '📁';
        this.description = '';
        this.itemCount = 0;
        this.createdAt = Date.now();
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            icon: this.icon,
            description: this.description,
            itemCount: this.itemCount,
            createdAt: this.createdAt
        };
    }

    static fromJSON(data) {
        const category = new Category(data.name, data.color);
        Object.assign(category, data);
        return category;
    }
}

// ========================================
// 收藏管理器
// ========================================
class CollectionManager {
    constructor() {
        this.currentUserId = null;
        this.items = new Map(); // <itemId, CollectionItem>
        this.categories = new Map(); // <categoryId, Category>
        this.listeners = new Map();
        this.callbacks = {
            onItemAdded: null,
            onItemRemoved: null,
            onItemUpdated: null,
            onCategoryAdded: null,
            onCategoryRemoved: null
        };
    }

    /**
     * 初始化收藏系统
     */
    async init(userId) {
        if (!window.db || !window.storage) {
            console.error('❌ Firebase 未初始化');
            return false;
        }

        this.currentUserId = userId;
        console.log(`✅ 收藏系统初始化 - 用户: ${userId}`);

        // 创建默认分类
        await this.createDefaultCategories();

        // 加载收藏项
        await this.loadItems();

        // 加载分类
        await this.loadCategories();

        // 开始监听
        this.startListeners();

        return true;
    }

    /**
     * 创建默认分类
     */
    async createDefaultCategories() {
        const defaultCategories = [
            { name: '未分类', color: '#9E9E9E', icon: '📦' },
            { name: '实验模板', color: '#4CAF50', icon: '🧪' },
            { name: '常用元素', color: '#2196F3', icon: '🔧' },
            { name: '文档资料', color: '#FF9800', icon: '📄' },
            { name: '图片素材', color: '#E91E63', icon: '🖼️' }
        ];

        for (const catData of defaultCategories) {
            const exists = await this.categoryExists(catData.name);
            if (!exists) {
                const category = new Category(catData.name, catData.color);
                category.icon = catData.icon;
                await this.addCategory(category);
            }
        }
    }

    /**
     * 检查分类是否存在
     */
    async categoryExists(name) {
        try {
            const snapshot = await window.db.collection('users')
                .doc(this.currentUserId)
                .collection('categories')
                .where('name', '==', name)
                .get();
            return !snapshot.empty;
        } catch (error) {
            return false;
        }
    }

    /**
     * 加载收藏项
     */
    async loadItems() {
        try {
            const itemsRef = window.db.collection('users')
                .doc(this.currentUserId)
                .collection('collection');

            const snapshot = await itemsRef.get();
            
            snapshot.forEach(doc => {
                const item = CollectionItem.fromJSON(doc.data());
                this.items.set(item.id, item);
            });

            console.log(`✅ 加载了 ${this.items.size} 个收藏项`);
        } catch (error) {
            console.error('❌ 加载收藏项失败:', error);
        }
    }

    /**
     * 加载分类
     */
    async loadCategories() {
        try {
            const categoriesRef = window.db.collection('users')
                .doc(this.currentUserId)
                .collection('categories');

            const snapshot = await categoriesRef.get();
            
            snapshot.forEach(doc => {
                const category = Category.fromJSON(doc.data());
                this.categories.set(category.id, category);
            });

            console.log(`✅ 加载了 ${this.categories.size} 个分类`);
        } catch (error) {
            console.error('❌ 加载分类失败:', error);
        }
    }

    /**
     * 添加收藏项
     */
    async addItem(item) {
        if (!this.currentUserId) {
            console.error('❌ 未登录');
            return false;
        }

        try {
            item.createdBy = this.currentUserId;
            
            // 保存到 Firestore
            await window.db.collection('users')
                .doc(this.currentUserId)
                .collection('collection')
                .doc(item.id)
                .set(item.toJSON());

            this.items.set(item.id, item);
            this.callbacks.onItemAdded?.(item);

            // 更新分类计数
            await this.updateCategoryCount(item.category);

            console.log(`✅ 添加收藏: ${item.name}`);
            return true;
        } catch (error) {
            console.error('❌ 添加收藏失败:', error);
            return false;
        }
    }

    /**
     * 删除收藏项
     */
    async removeItem(itemId) {
        if (!this.currentUserId) return false;

        try {
            const item = this.items.get(itemId);
            
            // 从 Firestore 删除
            await window.db.collection('users')
                .doc(this.currentUserId)
                .collection('collection')
                .doc(itemId)
                .delete();

            // 删除关联文件
            if (item && item.fileUrl) {
                try {
                    const fileRef = window.storage.refFromURL(item.fileUrl);
                    await fileRef.delete();
                } catch (error) {
                    console.warn('删除文件失败:', error);
                }
            }

            this.items.delete(itemId);
            this.callbacks.onItemRemoved?.(item);

            // 更新分类计数
            if (item) {
                await this.updateCategoryCount(item.category);
            }

            console.log(`✅ 删除收藏: ${itemId}`);
            return true;
        } catch (error) {
            console.error('❌ 删除收藏失败:', error);
            return false;
        }
    }

    /**
     * 更新收藏项
     */
    async updateItem(itemId, updates) {
        if (!this.currentUserId) return false;

        try {
            const item = this.items.get(itemId);
            if (!item) return false;

            Object.assign(item, updates);
            item.updatedAt = Date.now();

            await window.db.collection('users')
                .doc(this.currentUserId)
                .collection('collection')
                .doc(itemId)
                .update(updates);

            this.callbacks.onItemUpdated?.(item);
            console.log(`✅ 更新收藏: ${itemId}`);
            return true;
        } catch (error) {
            console.error('❌ 更新收藏失败:', error);
            return false;
        }
    }

    /**
     * 添加分类
     */
    async addCategory(category) {
        if (!this.currentUserId) return false;

        try {
            await window.db.collection('users')
                .doc(this.currentUserId)
                .collection('categories')
                .doc(category.id)
                .set(category.toJSON());

            this.categories.set(category.id, category);
            this.callbacks.onCategoryAdded?.(category);

            console.log(`✅ 添加分类: ${category.name}`);
            return true;
        } catch (error) {
            console.error('❌ 添加分类失败:', error);
            return false;
        }
    }

    /**
     * 删除分类
     */
    async removeCategory(categoryId) {
        if (!this.currentUserId) return false;

        try {
            // 检查是否有项目使用此分类
            const itemsInCategory = this.getItemsByCategory(categoryId);
            if (itemsInCategory.length > 0) {
                console.error('❌ 分类中还有项目,无法删除');
                return false;
            }

            await window.db.collection('users')
                .doc(this.currentUserId)
                .collection('categories')
                .doc(categoryId)
                .delete();

            const category = this.categories.get(categoryId);
            this.categories.delete(categoryId);
            this.callbacks.onCategoryRemoved?.(category);

            console.log(`✅ 删除分类: ${categoryId}`);
            return true;
        } catch (error) {
            console.error('❌ 删除分类失败:', error);
            return false;
        }
    }

    /**
     * 收藏元素
     */
    async collectElement(element, name, category = 'uncategorized') {
        const item = new CollectionItem(name || `${element.type} 元素`, 'element', element.toJSON());
        item.category = category;
        item.description = `收藏的 ${element.type} 元素`;
        return await this.addItem(item);
    }

    /**
     * 收藏工作区
     */
    async collectWorkspace(elements, connections, name, category = 'uncategorized') {
        const workspaceData = {
            elements: Array.from(elements.values()).map(e => e.toJSON()),
            connections: Array.from(connections.values()).map(c => c.toJSON())
        };

        const item = new CollectionItem(name, 'workspace', workspaceData);
        item.category = category;
        item.description = `包含 ${elements.size} 个元素和 ${connections.size} 个连接`;
        
        return await this.addItem(item);
    }

    /**
     * 上传文件到收藏
     */
    async uploadFile(file, name, category = 'uncategorized', description = '') {
        if (!window.storage) {
            console.error('❌ Firebase Storage 未初始化');
            return null;
        }

        try {
            // 上传文件
            const storageRef = window.storage.ref();
            const fileRef = storageRef.child(`collection/${this.currentUserId}/${Date.now()}_${file.name}`);
            
            const uploadTask = fileRef.put(file);
            
            return new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log(`上传进度: ${progress.toFixed(2)}%`);
                    },
                    (error) => {
                        console.error('上传失败:', error);
                        reject(error);
                    },
                    async () => {
                        const fileUrl = await uploadTask.snapshot.ref.getDownloadURL();
                        
                        // 创建收藏项
                        const item = new CollectionItem(name || file.name, 'file', null);
                        item.fileUrl = fileUrl;
                        item.fileSize = file.size;
                        item.category = category;
                        item.description = description;
                        
                        const success = await this.addItem(item);
                        resolve(success ? item : null);
                    }
                );
            });
        } catch (error) {
            console.error('❌ 上传文件失败:', error);
            return null;
        }
    }

    /**
     * 下载收藏项
     */
    async downloadItem(itemId) {
        const item = this.items.get(itemId);
        if (!item) return false;

        try {
            if (item.fileUrl) {
                // 下载文件
                window.open(item.fileUrl, '_blank');
            } else if (item.type === 'element' || item.type === 'workspace') {
                // 导出为 JSON
                const dataStr = JSON.stringify(item.data, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${item.name}.json`;
                a.click();
                URL.revokeObjectURL(url);
            }

            // 增加下载计数
            await this.updateItem(itemId, { downloads: item.downloads + 1 });
            
            console.log(`✅ 下载: ${item.name}`);
            return true;
        } catch (error) {
            console.error('❌ 下载失败:', error);
            return false;
        }
    }

    /**
     * 点赞收藏项
     */
    async likeItem(itemId) {
        const item = this.items.get(itemId);
        if (!item) return false;

        item.likes++;
        return await this.updateItem(itemId, { likes: item.likes });
    }

    /**
     * 搜索收藏项
     */
    searchItems(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();

        this.items.forEach(item => {
            if (item.name.toLowerCase().includes(lowerQuery) ||
                item.description.toLowerCase().includes(lowerQuery) ||
                item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
                results.push(item);
            }
        });

        return results;
    }

    /**
     * 按分类获取收藏项
     */
    getItemsByCategory(categoryId) {
        const results = [];
        this.items.forEach(item => {
            if (item.category === categoryId) {
                results.push(item);
            }
        });
        return results;
    }

    /**
     * 按类型获取收藏项
     */
    getItemsByType(type) {
        const results = [];
        this.items.forEach(item => {
            if (item.type === type) {
                results.push(item);
            }
        });
        return results;
    }

    /**
     * 按标签获取收藏项
     */
    getItemsByTag(tag) {
        const results = [];
        this.items.forEach(item => {
            if (item.tags.includes(tag)) {
                results.push(item);
            }
        });
        return results;
    }

    /**
     * 更新分类计数
     */
    async updateCategoryCount(categoryId) {
        const count = this.getItemsByCategory(categoryId).length;
        const category = this.categories.get(categoryId);
        if (category) {
            category.itemCount = count;
            await window.db.collection('users')
                .doc(this.currentUserId)
                .collection('categories')
                .doc(categoryId)
                .update({ itemCount: count });
        }
    }

    /**
     * 获取公开收藏(浏览市场)
     */
    async browsePublicItems(limit = 50, type = null) {
        try {
            let query = window.db.collectionGroup('collection')
                .where('public', '==', true)
                .orderBy('likes', 'desc')
                .limit(limit);

            if (type) {
                query = query.where('type', '==', type);
            }

            const snapshot = await query.get();
            const items = [];

            snapshot.forEach(doc => {
                const item = CollectionItem.fromJSON(doc.data());
                items.push(item);
            });

            console.log(`✅ 浏览到 ${items.length} 个公开收藏`);
            return items;
        } catch (error) {
            console.error('❌ 浏览公开收藏失败:', error);
            return [];
        }
    }

    /**
     * 分享收藏项(设为公开)
     */
    async shareItem(itemId, isPublic = true) {
        return await this.updateItem(itemId, { public: isPublic });
    }

    /**
     * 复制他人的收藏到自己
     */
    async cloneItem(sourceItem) {
        const newItem = CollectionItem.fromJSON(sourceItem.toJSON());
        newItem.id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        newItem.createdBy = this.currentUserId;
        newItem.createdAt = Date.now();
        newItem.updatedAt = Date.now();
        newItem.public = false;
        newItem.likes = 0;
        newItem.downloads = 0;

        return await this.addItem(newItem);
    }

    /**
     * 开始监听
     */
    startListeners() {
        if (!this.currentUserId) return;

        // 监听收藏项变化
        const itemsRef = window.db.collection('users')
            .doc(this.currentUserId)
            .collection('collection');

        const unsubscribeItems = itemsRef.onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                const item = CollectionItem.fromJSON(change.doc.data());
                
                if (change.type === 'added' && !this.items.has(item.id)) {
                    this.items.set(item.id, item);
                    this.callbacks.onItemAdded?.(item);
                } else if (change.type === 'modified') {
                    this.items.set(item.id, item);
                    this.callbacks.onItemUpdated?.(item);
                } else if (change.type === 'removed') {
                    this.items.delete(item.id);
                    this.callbacks.onItemRemoved?.(item);
                }
            });
        });

        this.listeners.set('items', unsubscribeItems);
    }

    /**
     * 获取统计信息
     */
    getStats() {
        const stats = {
            totalItems: this.items.size,
            totalCategories: this.categories.size,
            totalDownloads: 0,
            totalLikes: 0,
            byType: {}
        };

        this.items.forEach(item => {
            stats.totalDownloads += item.downloads;
            stats.totalLikes += item.likes;
            
            if (!stats.byType[item.type]) {
                stats.byType[item.type] = 0;
            }
            stats.byType[item.type]++;
        });

        return stats;
    }

    /**
     * 清理资源
     */
    destroy() {
        this.listeners.forEach(unsubscribe => {
            unsubscribe();
        });
        this.listeners.clear();
        this.items.clear();
        this.categories.clear();
        console.log('✅ 收藏系统已清理');
    }

    /**
     * 设置回调
     */
    on(event, callback) {
        const key = 'on' + event.charAt(0).toUpperCase() + event.slice(1);
        if (this.callbacks.hasOwnProperty(key)) {
            this.callbacks[key] = callback;
        }
    }

    /**
     * 获取所有收藏项
     */
    getItems() {
        return Array.from(this.items.values());
    }

    /**
     * 获取所有分类
     */
    getCategories() {
        return Array.from(this.categories.values());
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CollectionItem,
        Category,
        CollectionManager
    };
}

console.log('✅ Collection System 加载完成');
