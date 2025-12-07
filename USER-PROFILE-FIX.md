# 🐛 用户资料缺失问题修复

## 问题分析

你的 Firebase 认证账户 (`sinephi2022@outlook.com`) 存在，但在 Firestore `users` 集合中没有对应的文档。

这导致：
- ⚠️ 用户资料无法加载
- 应用可能卡在初始化

## ✅ 快速修复 (3 步)

### 步骤 1: 在 Firebase 控制台创建用户资料

1. 打开 Firebase 控制台: https://console.firebase.google.com/
2. 选择项目: `labtool-5eb5e`
3. 进入 **Firestore Database**
4. 点击 **创建集合** (如果 `users` 不存在)
   - 集合名称: `users`
   - 文档 ID: `ubqyNXjY1RNFM3t3zP52IebXa1D3` (你的用户 UID)

5. 添加以下字段:
```javascript
{
  email: "sinephi2022@outlook.com",
  displayName: "Chen",
  avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Felix",
  lang: "zh",
  createdAt: (服务器时间戳),
  joinedAt: (服务器时间戳),
  friends: [],
  favorites: [],
  currentLab: "",
  lastSeen: (当前时间戳)
}
```

### 步骤 2: 自动创建用户资料 (推荐)

修改 `app.js` 中的 `onMounted` 函数，如果用户资料不存在则自动创建：

```javascript
// 加载用户资料
const userDoc = await db.collection('users').doc(firebaseUser.uid).get();
if (!userDoc.exists) {
    console.warn('⚠️ 用户资料不存在，正在创建...');
    
    // 自动创建用户资料
    await db.collection('users').doc(firebaseUser.uid).set({
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || '新用户',
        avatar: firebaseUser.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + firebaseUser.uid,
        lang: currentLang.value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
        friends: [],
        favorites: [],
        currentLab: '',
        lastSeen: Date.now()
    });
    
    console.log('✅ 用户资料已创建');
    userProfile.value = {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || '新用户',
        avatar: firebaseUser.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + firebaseUser.uid,
        lang: currentLang.value
    };
} else {
    console.log('✅ 用户资料已加载');
    userProfile.value = userDoc.data();
    if (userProfile.value.lang) {
        currentLang.value = userProfile.value.lang;
    }
}
```

---

## 📝 更新代码

我将为你自动更新 `app.js`，使其能够自动创建缺失的用户资料。

这样新用户登录时，系统会自动创建他们的资料，解决卡在初始化的问题。

---

**推荐方案**: 让我修改代码，自动为新用户创建资料。这样就不会卡在初始化了。
