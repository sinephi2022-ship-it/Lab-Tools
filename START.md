# 快速启动指南

## 🚀 启动项目

### 方法 1: 使用 Python (推荐)
```bash
cd c:\Users\sinep\OneDrive\桌面\Project-Rebuild
python -m http.server 8000
```

然后访问: http://localhost:8000

### 方法 2: 使用 Node.js
```bash
cd c:\Users\sinep\OneDrive\桌面\Project-Rebuild
npx http-server -p 8000
```

### 方法 3: 使用 VS Code Live Server
1. 安装 Live Server 扩展
2. 右键 `index.html`
3. 选择 "Open with Live Server"

## 📦 项目结构

```
Project-Rebuild/
├── index.html          # 主入口文件
├── config.js           # Firebase 配置 + 国际化
├── canvas.js           # Canvas 渲染引擎 (800+ 行)
├── elements.js         # 五大元素系统 (850+ 行)
├── connections.js      # 连接线系统 (550+ 行)
├── chat.js             # 聊天和好友系统 (530+ 行)
├── collection.js       # 云端仓库 (620+ 行)
├── app.js              # Vue 3 主应用 (1500+ 行)
├── style.css           # 全局样式 (500+ 行)
├── package.json        # 项目配置
├── .gitignore          # Git 忽略规则
└── README.md           # 项目文档
```

**总代码量**: 约 5,500+ 行

## ✨ 核心功能

### 1. 用户系统
- ✅ 邮箱/密码登录注册
- ✅ Google OAuth 登录
- ✅ 自定义头像和昵称
- ✅ 多语言支持 (中/英/日)

### 2. 实验室管理
- ✅ 创建私密/公开实验室
- ✅ 邀请码和密码保护
- ✅ 实验室收藏功能
- ✅ 成员管理

### 3. 无限画布
- ✅ 高性能 Canvas 引擎
- ✅ 平移和缩放 (鼠标/触摸)
- ✅ 框选多元素
- ✅ 网格背景
- ✅ 60 FPS 流畅渲染

### 4. 五大元素
- ✅ **便签** - 黄色背景,手写体,可插入图片
- ✅ **计时器** - 红色背景,番茄钟功能
- ✅ **实验协议** - 绿色背景,步骤清单
- ✅ **文本框** - 紫色背景,富文本编辑
- ✅ **文件** - 蓝色背景,文件上传预览

### 5. 连接系统
- ✅ 贝塞尔曲线连接
- ✅ 自动箭头方向
- ✅ 连接标签
- ✅ 虚线样式

### 6. 社交功能
- ✅ 好友添加和管理
- ✅ 实时聊天
- ✅ 消息已读/未读
- ✅ 文件分享

### 7. 云端仓库
- ✅ 收藏管理
- ✅ 分类系统
- ✅ 搜索和过滤
- ✅ 元素市场

## 🎮 快捷键

| 快捷键 | 功能 |
|--------|------|
| 鼠标拖拽 | 移动元素 |
| 右键拖拽 | 平移画布 |
| 滚轮 | 缩放画布 |
| Ctrl+点击 | 多选元素 |
| Delete | 删除选中元素 |
| Ctrl+A | 全选元素 |
| Esc | 取消选择 |
| 双击空白 | 适应视图 |

## 🔧 技术栈

- **前端**: Vue 3.4 (CDN)
- **渲染**: HTML5 Canvas API
- **后端**: Firebase 9.22
  - Authentication
  - Firestore Database
  - Cloud Storage
- **样式**: Tailwind CSS 3 + Custom CSS
- **图标**: Font Awesome 6.5
- **字体**: Inter, Kalam, JetBrains Mono

## 📱 浏览器支持

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ 移动端浏览器

## 🐛 问题排查

### 问题 1: Firebase 查询错误 ✅ 已修复
**错误信息**: `The query requires an index`  
**状态**: v2.0.1 已自动修复,使用客户端排序  
**影响**: 无需创建 Firebase 索引即可正常运行

### 问题 2: Tailwind CSS 生产警告
**警告信息**: `cdn.tailwindcss.com should not be used in production`  
**状态**: 这是开发环境信息,不影响功能  
**生产部署**: 可改用 Tailwind CLI 消除此警告

### 问题 3: Font Awesome 跨域警告
**警告信息**: `Tracking Prevention blocked access to storage`  
**状态**: 正常,不影响图标显示  
**原因**: 浏览器反追踪功能

### 白屏或加载失败
1. 检查浏览器控制台 (F12) 查看 ✅/❌ 符号
2. 确认网络连接正常
3. 清空缓存重新加载 (Ctrl+Shift+R)
4. 查看 FIX-REPORT.md 获取详细信息

### 实验室列表为空
- 这是正常的初始状态
- 点击 "创建实验室" 添加数据
- 需要先登录才能看到个人实验室

### 性能问题
1. 元素过多时 (>1000) 可能卡顿
2. 关闭网格显示可提升性能
3. 降低浏览器缩放比例

## 🚢 部署到 GitHub Pages

```bash
cd c:\Users\sinep\OneDrive\桌面\Project-Rebuild
git init
git add .
git commit -m "Initial commit: LabMate Pro v2.0"
git remote add origin https://github.com/你的用户名/Lab-Tools.git
git push -u origin main
```

然后在 GitHub 仓库设置中启用 Pages。

## 📖 开发文档

详细的开发文档请参考:
- `📘 LabMate Pro 开发白皮书.pdf`
- README.md
- 代码内注释

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

## 📄 许可证

MIT License

---

**作者**: Sine chen  
**版本**: 2.0.0  
**创建日期**: 2025-12-07  
**项目状态**: ✅ 完整可运行
