# LabMate Pro - 虚拟实验室协作平台

## 项目简介

LabMate Pro 是一个基于 Vue 3 和 HTML5 Canvas 的在线虚拟实验室协作平台，支持多用户实时协作、实验项目管理、数据收集和报告生成。

## 核心功能

### 🎨 无限画布
- 基于 HTML5 Canvas 的高性能渲染引擎
- 支持缩放、平移和惯性拖拽
- 60FPS 流畅动画体验
- 网格背景和坐标系统

### 📝 五大元素类型
- **便签 (Note)**: 支持文本和图片，手写体风格
- **计时器 (Timer)**: 精确计时，支持多个同时运行
- **实验协议 (Protocol)**: 可勾选的步骤清单
- **文本 (Text)**: 支持多种对齐方式
- **文件 (File)**: 支持文件上传和预览

### 🔗 连接系统
- 贝塞尔曲线连接线
- 动态箭头指向
- 虚线样式支持
- 智能路径计算

### 💬 实时聊天
- 类似微信的聊天界面
- 支持文件和图片分享
- 表情符号支持
- 在线状态显示

### 👥 用户系统
- 匿名登录
- 个人资料管理
- 头像上传
- 多语言支持（中文、英文、日文）

### 📊 数据管理
- 云端数据同步
- 个人收藏夹
- 项目文件管理
- 数据导入导出

### 📄 报告生成
- HTML 格式报告
- Markdown 格式报告
- 自定义导出选项
- 专业排版样式

## 技术架构

### 前端框架
- **Vue 3**: 组合式 API 和响应式系统
- **Vite**: 快速开发构建工具
- **Pinia**: 状态管理

### 核心引擎
- **HTML5 Canvas**: 高性能图形渲染
- **Camera System**: 摄像机控制系统
- **Render Loop**: 60FPS 渲染循环

### 后端服务
- **Firebase**: 实时数据库和身份验证
- **Firestore**: 数据持久化
- **Firebase Storage**: 文件存储

### UI/UX 设计
- **Material Design**: 设计语言规范
- **响应式设计**: 支持桌面和移动端
- **暗色主题**: 护眼模式支持

## 项目结构

```
LabMate-Pro/
├── src/
│   ├── components/          # Vue 组件
│   │   ├── CanvasContainer.vue    # 画布容器
│   │   ├── Toolbar.vue            # 工具栏
│   │   ├── FilePanel.vue          # 文件面板
│   │   ├── ProjectInfo.vue        # 项目信息
│   │   ├── ChatBubble.vue         # 聊天气泡
│   │   ├── EnhancedChatWindow.vue # 增强聊天窗口
│   │   ├── UserProfile.vue        # 用户资料
│   │   └── ReportExportModal.vue  # 报告导出弹窗
│   ├── stores/              # Pinia 状态管理
│   │   ├── project.js             # 项目状态
│   │   ├── chat.js                # 聊天状态
│   │   ├── collection.js          # 收藏状态
│   │   └── auth.js                # 认证状态
│   ├── utils/               # 工具函数
│   │   ├── firebase.js            # Firebase 配置
│   │   ├── elements.js            # 元素类定义
│   │   ├── connections.js         # 连接系统
│   │   ├── i18n.js                # 国际化
│   │   └── reportGenerator.js     # 报告生成器
│   └── styles/              # 样式文件
│       └── global.css            # 全局样式
├── public/                     # 静态资源
├── index.html                  # 入口 HTML
├── vite.config.js             # Vite 配置
└── package.json               # 项目配置
```

## 开发指南

### 环境要求
- Node.js 16+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建项目
```bash
npm run build
```

### 预览构建
```bash
npm run preview
```

## 使用说明

### 基本操作
1. **添加元素**: 从左侧工具栏选择元素类型
2. **移动画布**: 右键拖拽画布进行平移
3. **缩放视图**: 鼠标滚轮缩放画布
4. **选择元素**: 左键点击元素进行选择
5. **框选元素**: 按住左键拖拽进行框选

### 聊天功能
1. 点击左下角聊天气泡打开聊天窗口
2. 支持发送文字、表情和文件
3. 可以查看参与者在线状态

### 文件管理
1. 右侧文件面板可以上传本地文件
2. 支持从个人收藏添加文件到画布
3. 文件可以在画布上预览和下载

### 报告导出
1. 点击右下角"导出报告"按钮
2. 选择导出格式（HTML 或 Markdown）
3. 自定义导出选项
4. 下载生成的报告文件

## 性能优化

### Canvas 渲染优化
- 使用脏标记系统避免不必要的重绘
- 视口裁剪只渲染可见区域
- 元素层级优化减少绘制调用

### 内存管理
- 及时清理事件监听器
- 组件卸载时释放资源
- 图片资源懒加载

### 网络优化
- Firebase 实时监听优化
- 文件上传进度显示
- 离线数据缓存

## 部署说明

### Firebase 配置
1. 在 Firebase 控制台创建项目
2. 启用 Authentication 和 Firestore
3. 配置 Storage 规则
4. 更新 `src/utils/firebase.js` 中的配置

### 环境变量
```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
```

### 构建部署
```bash
npm run build
# 将 dist 目录部署到静态托管服务
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

- 项目链接: [https://github.com/sinephi2022-ship-it/Lab-Tools](https://github.com/sinephi2022-ship-it/Lab-Tools)
- 问题反馈: [Issues](https://github.com/sinephi2022-ship-it/Lab-Tools/issues)

---

**LabMate Pro** - 让实验室协作更高效！ 🚀