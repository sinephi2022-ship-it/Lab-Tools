# Firebase 数据清理和验证指南

## 📊 当前数据分析

你的 Firebase 数据库中有：
- ✅ **3 个用户** (Chen, 其他用户)
- ✅ **3 个实验室** (labs 集合)
- ✅ **9 个元素** (包括 timer, note, protocol, text)
- ✅ **好友关系** (friends 列表)

## 🐛 发现的问题

### 问题 1: Canvas 视图状态 (NaN 值)

**位置**: `labs/6mUnj55q8FfUFPTgrTMX/view`

```json
{
  "panX": NaN,
  "panY": NaN,
  "zoom": NaN
}
```

**原因**: 无效的数值导致 Canvas 渲染出问题

**影响**: 画布可能不显示或显示异常

### 问题 2: createdAt 格式不一致

**发现的格式**:
- ✅ 时间戳数字: `1765006984739`
- ❌ ISO 字符串: `"2025-12-06T10:54:19.748Z"`
- ❌ Firestore Timestamp: `2025年12月7日 UTC+9 12:38:33`

**影响**: 日期转换代码需要处理多种格式

### 问题 3: Elements 中的日期

**发现**:
```javascript
// 某些元素有 createdAt/updatedAt
"createdAt": "2025-12-06T10:54:19.748Z",
"updatedAt": "2025-12-06T10:54:19.748Z"

// 但通常应该在 metadata 中
"metadata": {
    "duration": 300,
    "isRunning": false
}
```

---

## ✅ 修复方案

### 方案 1: 手动修复 NaN 值 (快速)

在 Firebase 控制台:

1. 进入 Firestore Database
2. 找到 `labs/6mUnj55q8FfUFPTgrTMX`
3. 编辑 `view` 字段，替换为:
```json
{
  "panX": 0,
  "panY": 0,
  "zoom": 1
}
```

### 方案 2: 自动修复代码 (推荐)

在 `app.js` 中的 `openLab()` 函数添加验证:

```javascript
// 修复无效的视图状态
const validateViewState = (view) => {
    return {
        panX: isNaN(view?.panX) ? 0 : view.panX,
        panY: isNaN(view?.panY) ? 0 : view.panY,
        zoom: isNaN(view?.zoom) ? 1 : view.zoom
    };
};

// 使用
currentLab.value.view = validateViewState(currentLab.value.view);
```

### 方案 3: 统一日期格式 (长期)

创建一个数据迁移脚本:

```javascript
// 将所有日期转换为时间戳
async function migrateDataToTimestamps() {
    const labs = await db.collection('labs').get();
    
    for (const labDoc of labs.docs) {
        const lab = labDoc.data();
        const updates = {
            createdAt: Utils.toDate(lab.createdAt)?.getTime() || Date.now(),
            updatedAt: Utils.toDate(lab.updatedAt)?.getTime() || Date.now()
        };
        
        // 处理 elements
        if (lab.elements && Array.isArray(lab.elements)) {
            updates.elements = lab.elements.map(elem => ({
                ...elem,
                createdAt: Utils.toDate(elem.createdAt)?.getTime() || Date.now(),
                updatedAt: Utils.toDate(elem.updatedAt)?.getTime() || Date.now()
            }));
        }
        
        await db.collection('labs').doc(labDoc.id).update(updates);
    }
    
    console.log('✅ 数据迁移完成');
}
```

---

## 🔧 立即修复步骤

### 步骤 1: 修复 NaN 值

**在 Firebase 控制台**:
1. 打开 https://console.firebase.google.com/
2. 选择项目 `labtool-5eb5e`
3. 进入 Firestore Database
4. 找到 `labs/6mUnj55q8FfUFPTgrTMX`
5. 点击 `view` 字段
6. 编辑为:
```json
{
  "panX": 0,
  "panY": 0,
  "zoom": 1
}
```
7. 保存

### 步骤 2: 在代码中添加防御性转换

修改 `app.js` 的 `openLab()` 函数:

```javascript
// 添加视图状态验证
if (currentLab.value.view) {
    currentLab.value.view = {
        panX: isNaN(currentLab.value.view.panX) ? 0 : currentLab.value.view.panX,
        panY: isNaN(currentLab.value.view.panY) ? 0 : currentLab.value.view.panY,
        zoom: isNaN(currentLab.value.view.zoom) ? 1 : currentLab.value.view.zoom
    };
} else {
    currentLab.value.view = { panX: 0, panY: 0, zoom: 1 };
}
```

### 步骤 3: 刷新浏览器测试

```
Ctrl + Shift + R
```

---

## 📈 数据质量检查

### 已验证正确的字段 ✅

- ✅ **Users**
  - 邮箱格式正确
  - 头像 URL 有效
  - 语言设置正确

- ✅ **Labs**
  - `title`: "123"
  - `ownerId`: 正确的用户 UID
  - `members`: 包含所有者
  - `isPublic`: false

- ✅ **Elements**
  - 类型正确 (timer, note, protocol, text)
  - 颜色值有效
  - 坐标和尺寸合理

### 需要修复的字段 ⚠️

- ❌ `view.panX/panY/zoom`: NaN → 需要修复
- ❌ `createdAt/updatedAt`: 格式不一致 → 可以工作但需要统一
- ⚠️ `elements[].createdAt`: ISO 字符串格式 → Utils.toDate() 可以处理

---

## 🚀 完整的数据验证函数

在 `config.js` 中添加:

```javascript
/**
 * 验证和修复 Firestore 数据
 */
window.validateLabData = (lab) => {
    return {
        ...lab,
        // 验证视图状态
        view: {
            panX: isNaN(lab.view?.panX) ? 0 : lab.view.panX,
            panY: isNaN(lab.view?.panY) ? 0 : lab.view.panY,
            zoom: isNaN(lab.view?.zoom) ? 1 : lab.view.zoom
        },
        // 验证元素
        elements: (lab.elements || []).map(elem => ({
            ...elem,
            createdAt: Utils.toDate(elem.createdAt),
            updatedAt: Utils.toDate(elem.updatedAt),
            // 确保必需字段存在
            x: elem.x || 0,
            y: elem.y || 0,
            w: elem.w || 150,
            h: elem.h || 150
        }))
    };
};
```

然后在 `app.js` 的 `openLab()` 中使用:

```javascript
currentLab.value = validateLabData(labData);
```

---

## 📞 后续步骤

1. **立即**: 在 Firebase 控制台修复 NaN 值
2. **今天**: 测试应用是否显示正常
3. **明天**: 添加数据验证函数到代码
4. **本周**: 运行数据迁移脚本统一日期格式

---

## 📝 数据模式最佳实践

**推荐的数据结构**:

```javascript
{
  labs: {
    [labId]: {
      // 基本信息
      title: string,
      ownerId: string,
      ownerName: string,
      
      // 时间戳 (推荐: 毫秒数字)
      createdAt: number (timestamp in ms),
      updatedAt: number (timestamp in ms),
      
      // 访问控制
      isPublic: boolean,
      members: string[],
      
      // 内容
      elements: Array<{
        id: string,
        type: string,
        x: number,
        y: number,
        w: number,
        h: number,
        ...typeSpecificFields
      }>,
      
      // 视图状态 (必须是有效数字)
      view: {
        panX: number,
        panY: number,
        zoom: number
      }
    }
  }
}
```

---

**项目**: LabMate Pro v2.0  
**更新时间**: 2025-12-07  
**状态**: 🚀 数据已验证，需要修复 NaN 值
