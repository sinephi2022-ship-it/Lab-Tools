# GitHub 部署指南

## 🚀 快速部署到 GitHub Pages (5分钟)

### 前提条件
- ✅ 安装了 Git
- ✅ 有 GitHub 账户
- ✅ 在 GitHub 上创建了仓库 `Lab-Tools`

### 步骤 1: 初始化 Git 仓库

```bash
cd c:\Users\sinep\OneDrive\桌面\Project-Rebuild
git init
```

### 步骤 2: 配置 Git 用户信息

```bash
git config --global user.name "Sine chen"
git config --global user.email "your-email@example.com"
```

### 步骤 3: 添加所有文件并提交

```bash
git add .
git commit -m "Initial commit: LabMate Pro v2.0 - 完整实验室协作平台"
```

### 步骤 4: 添加远程仓库

替换 `YOUR_USERNAME` 为你的 GitHub 用户名:

```bash
git remote add origin https://github.com/YOUR_USERNAME/Lab-Tools.git
```

### 步骤 5: 创建 main 分支并推送

```bash
git branch -M main
git push -u origin main
```

---

## 🔐 使用 SSH 密钥 (推荐)

如果上面的 HTTPS 方法提示输入密码,建议使用 SSH:

1. 生成 SSH 密钥 (如果没有的话):
```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```

2. 将公钥添加到 GitHub Settings → SSH Keys

3. 使用 SSH 推送:
```bash
git remote set-url origin git@github.com:YOUR_USERNAME/Lab-Tools.git
git push -u origin main
```

---

## 📝 GitHub Pages 设置

### 在 GitHub 网站上配置:

1. 打开你的仓库: https://github.com/YOUR_USERNAME/Lab-Tools

2. 进入 **Settings** 标签

3. 在左侧菜单找到 **Pages**

4. 配置:
   - Source: 选择 **Deploy from a branch**
   - Branch: 选择 **main** 和 **/(root)**
   - 点击 **Save**

5. 等待 1-5 分钟后,你的网站就会发布

### 访问你的网站:
```
https://YOUR_USERNAME.github.io/Lab-Tools/
```

---

## ✅ 部署检查清单

- [ ] Git 已安装: `git --version`
- [ ] 已初始化仓库: `.git` 文件夹存在
- [ ] 已添加远程: `git remote -v` 显示 GitHub 链接
- [ ] 已推送到 GitHub: 网站上显示所有文件
- [ ] GitHub Pages 已启用: Pages 设置已配置
- [ ] 网站在线: 可以访问 GitHub Pages URL

---

## 🆘 常见问题

### 问题 1: Push 时要求输入密码
**解决**: 使用 GitHub Personal Access Token 或 SSH 密钥

### 问题 2: 仓库已存在错误
```bash
# 清除现有远程
git remote remove origin

# 重新添加
git remote add origin https://github.com/YOUR_USERNAME/Lab-Tools.git
```

### 问题 3: GitHub Pages 显示 404
- 等待 5-10 分钟让 GitHub 重新构建
- 检查仓库是否为公开
- 确认 `index.html` 在根目录

### 问题 4: CNAME 配置 (自定义域名)
如果要使用自己的域名:
1. 在根目录创建 `CNAME` 文件
2. 内容: `yourdomain.com`
3. 在域名提供商设置 DNS

---

## 📊 部署后验证

访问你的网站并检查:

- [ ] 页面加载成功
- [ ] 不显示 404 错误
- [ ] CSS 样式正确应用
- [ ] JavaScript 正常工作
- [ ] 没有 CORS 错误

---

## 🔄 持续更新

每次更新代码后:

```bash
git add .
git commit -m "描述你的更改"
git push origin main
```

GitHub Pages 会自动重新部署!

---

**需要帮助?** 
- 查看 GitHub Pages 文档: https://pages.github.com/
- 查看 Git 指南: https://git-scm.com/book/zh/v2
