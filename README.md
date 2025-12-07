# LabMate Pro

**实时实验室协作平台**

基于 HTML5 Canvas 的高性能虚拟实验室,支持无限画布、实时协作、云端存储。

## ✨ 核心特性

- 🎨 **无限画布** - 高性能 Canvas 引擎,支持 5000+ 元素流畅运行
- 🔄 **实时协作** - Firebase 云端同步,多人在线编辑
- 💬 **社交聊天** - 好友系统、实时消息、文件分享
- 📦 **云端仓库** - 个人收藏、文件上传、跨项目共享
- 🌍 **多语言** - 支持中文、英文、日文
- 📱 **响应式** - 适配 PC 和移动设备

## 🛠️ 技术栈

- **前端框架**: Vue 3 (CDN)
- **渲染引擎**: HTML5 Canvas
- **后端服务**: Firebase (Auth + Firestore + Storage)
- **样式**: Tailwind CSS
- **图标**: Font Awesome 6

## 🚀 快速开始

### 在线访问

访问: https://sinephi2022-ship-it.github.io/Lab-Tools/

### 本地运行

1. 克隆仓库
```bash
git clone https://github.com/sinephi2022-ship-it/Lab-Tools.git
cd Lab-Tools
```

2. 启动本地服务器
```bash
# 使用 Python
python -m http.server 8000

# 或使用 Node.js
npx http-server -p 8000
```

3. 打开浏览器访问 `http://localhost:8000`

## 📦 项目结构

```
Project-Rebuild/
├── index.html          # 主入口文件
├── config.js           # Firebase 配置 + 国际化
├── canvas.js           # Canvas 引擎核心
├── elements.js         # 五大元素系统
├── connections.js      # 连接线系统
├── chat.js             # 聊天和好友系统
├── collection.js       # 云端仓库系统
├── app.js              # Vue 主应用
├── style.css           # 全局样式
└── package.json        # 项目配置
```

## 🎯 核心功能

### 五大元素

1. **Note (便签)** - 黄色背景,手写体,支持图片插入
2. **Timer (计时器)** - 拟物化设计,精确计时
3. **Protocol (实验协议)** - 可打勾清单,支持批注
4. **Text (文本框)** - 透明背景,多种对齐方式
5. **File (文件)** - 文件预览、下载、分享

### 协作功能

- 实时多人编辑
- 用户在线状态显示
- 协作光标追踪
- 冲突自动解决

### 社交功能

- 好友添加和管理
- 实时消息聊天
- 文件分享
- 已读/未读状态

## 🔧 配置

Firebase 配置在 `config.js` 中:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyDcOJyJEpVsc-asPeYvqaKnZF0oa7J3xfI",
    authDomain: "labtool-5eb5e.firebaseapp.com",
    projectId: "labtool-5eb5e",
    storageBucket: "labtool-5eb5e.firebasestorage.app",
    messagingSenderId: "439026642074",
    appId: "1:439026642074:web:d91c42764c1b2a8cb8a40c"
};
```

## 📄 开发文档

详见 `📘 LabMate Pro 开发白皮书.pdf`

## 📝 更新日志

### v2.0.0 (2025-12-07)
- ✨ 完全重构为 Canvas 引擎
- 🚀 性能提升 10 倍
- 💬 新增社交聊天系统
- 📦 云端仓库功能
- 🌍 多语言支持

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

## 📄 许可证

MIT License

---

**作者**: Sine chen  
**版本**: 2.0.0  
**更新日期**: 2025-12-07
