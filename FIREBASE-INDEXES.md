# Firebase Firestore 索引配置

## 📋 所需的复合索引

### 索引 1: isPublic + updatedAt

**集合**: `labs`

**用途**: 查询公开实验室并排序

**字段配置**:
| 字段 | 顺序 | 状态 |
|------|------|------|
| isPublic | 升序 (ASC) | ✓ |
| updatedAt | 降序 (DESC) | ✓ |

---

## 🔧 创建索引的方法

### 方法 1: 通过 Firebase 控制台 (推荐)

1. **访问 Firebase 控制台**
   - 打开: https://console.firebase.google.com/
   - 选择项目: `labtool-5eb5e`

2. **进入 Firestore Database**
   - 左侧菜单 → Firestore Database

3. **找到索引部分**
   - 点击 "索引" 标签 (Indexes)

4. **创建复合索引**
   - 点击 "创建索引"
   - 集合: `labs`
   - 添加字段:
     - 字段 1: `isPublic` (升序/Ascending)
     - 字段 2: `updatedAt` (降序/Descending)
   - 点击 "创建"

5. **等待索引构建**
   - 通常需要 5-10 分钟
   - 状态显示 "已启用" 时表示完成

### 方法 2: 通过 Firebase CLI

```bash
# 安装 Firebase CLI (如果未安装)
npm install -g firebase-tools

# 登录 Firebase
firebase login

# 初始化 Firebase 项目
firebase init firestore

# 创建索引配置文件 firestore.indexes.json
```

**firestore.indexes.json 内容**:
```json
{
  "indexes": [
    {
      "collectionGroup": "labs",
      "queryScope": "Collection",
      "fields": [
        {
          "fieldPath": "isPublic",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "updatedAt",
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```

然后执行:
```bash
firebase deploy --only firestore:indexes
```

---

## ✅ 验证索引

### 在 Firebase 控制台验证

1. 进入 Firestore Database
2. 点击 "索引" 标签
3. 查看 "复合索引" 部分
4. 确认索引状态为 "已启用"

### 测试查询

在 Firebase 控制台的 "Firestore" 编辑器中运行:

```javascript
// 测试查询
db.collection('labs')
   .where('isPublic', '==', true)
   .orderBy('updatedAt', 'desc')
   .limit(10)
   .get()
```

如果没有错误,说明索引配置成功!

---

## 🔐 Firestore 安全规则

同时建议配置以下安全规则:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 实验室集合
    match /labs/{document=**} {
      // 任何人可以读取公开实验室
      allow read: if resource.data.isPublic == true;
      
      // 只有所有者可以修改
      allow write: if request.auth.uid == resource.data.owner;
      
      // 所有者可以创建新实验室
      allow create: if request.auth.uid == request.resource.data.owner;
    }
    
    // 消息集合
    match /messages/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // 用户资料
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
  }
}
```

---

## 📝 当前代码状态

### ✅ 已优化的查询

当前代码已移除 `orderBy`,改用客户端排序:

```javascript
// 查询不需要索引
const snapshot = await db.collection('labs')
    .where('isPublic', '==', true)
    .limit(50)
    .get();

// 客户端排序 (无需索引)
publicLabs.value.sort((a, b) => {
    const timeA = a.updatedAt?.getTime() || 0;
    const timeB = b.updatedAt?.getTime() || 0;
    return timeB - timeA;
});
```

### ⚠️ 索引的作用

创建索引后的优势:

1. **性能提升**: 直接在服务器获取排序结果
2. **可扩展**: 支持大量数据时更快
3. **符合最佳实践**: Firebase 生产环境推荐

### 🔄 索引创建后

创建索引后,可以修改代码以使用更高效的查询:

```javascript
// 使用索引的高效查询
const snapshot = await db.collection('labs')
    .where('isPublic', '==', true)
    .orderBy('updatedAt', 'desc')
    .limit(50)
    .get();

// 数据已排序,无需客户端排序
publicLabs.value = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate()
}));
```

---

## 🚀 后续步骤

1. **立即**: 通过 Firebase 控制台创建索引 (5分钟)
2. **验证**: 确认索引状态为 "已启用"
3. **测试**: 刷新应用查看是否仍然正常工作
4. **优化**: 索引完成后可选择在 app.js 中恢复 orderBy 查询

---

## 📞 遇到问题?

| 问题 | 解决方案 |
|------|--------|
| 索引创建失败 | 检查集合名称和字段拼写 |
| 索引创建很慢 | Firebase 大型集合可能需要 30+ 分钟 |
| 查询仍然报错 | 清除浏览器缓存,刷新页面 |
| 权限问题 | 检查 Firestore 安全规则是否正确配置 |

---

**项目**: LabMate Pro v2.0  
**更新时间**: 2025-12-07  
**状态**: ✅ 应用已部署,索引创建中
