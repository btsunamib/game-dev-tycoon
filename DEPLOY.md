# 🚀 部署到 GitHub Pages 完整指南

本指南将带你从零开始，将 **AI游戏开发商模拟器** 部署到 GitHub Pages，让任何人都能通过网址访问你的游戏。

---

## 📋 前置条件

### 1. 安装 Git

检查是否已安装 Git，打开 **命令提示符**（按 `Win + R`，输入 `cmd`，回车）：

```cmd
git --version
```

如果显示版本号（如 `git version 2.xx.x`），说明已安装，跳到下一步。

如果提示"不是内部或外部命令"，需要安装 Git：

1. 访问 [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. 下载 **64-bit Git for Windows Setup**
3. 运行安装程序，**一路点 Next 使用默认设置即可**
4. 安装完成后，**关闭并重新打开** 命令提示符
5. 再次运行 `git --version` 确认安装成功

### 2. 安装 Node.js

检查是否已安装：

```cmd
node --version
npm --version
```

如果没有安装：

1. 访问 [https://nodejs.org/](https://nodejs.org/)
2. 下载 **LTS（长期支持）版本**
3. 运行安装程序，使用默认设置
4. 重新打开命令提示符，确认安装成功

### 3. 注册 GitHub 账号

如果你还没有 GitHub 账���：

1. 访问 [https://github.com](https://github.com)
2. 点击右上角 **Sign up**
3. 按提示填写用户名、邮箱、密码
4. 完成邮箱验证

---

## 🏗️ 部署步骤

### 步骤一：在 GitHub 上创建仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角 **+** 号 → **New repository**
3. 填写信息：
   - **Repository name**：`game-dev-tycoon`（或你喜欢的名字）
   - **Description**（可选）：`AI驱动的游戏开发商经营模拟器`
   - 选择 **Public**（公开，GitHub Pages 免费版需要公开仓库）
   - **不要** 勾选 "Add a README file"
   - **不要** 勾选 "Add .gitignore"
4. 点击 **Create repository**
5. 创建完成后，页面会显示仓库地址，类似：
   ```
   https://github.com/你的用户名/game-dev-tycoon.git
   ```
   **记住这个地址，后面要用。**

### 步骤二：初始化本地 Git 仓库

打开命令提示符，进入项目目录：

```cmd
cd C:\Users\22148\Documents\代码\游戏开发商\game-dev-tycoon
```

初始化 Git 仓库：

```cmd
git init
```

配置 Git 用户信息（如果是第一次使用 Git）：

```cmd
git config user.name "你的GitHub用户名"
git config user.email "你的GitHub邮箱"
```

### 步骤三：添加文件并提交

```cmd
git add .
git commit -m "初始提交：AI游戏开发商模拟器"
```

### 步骤四：关联远程仓库并推送

将 `你的用户名` 替换为你的 GitHub 用户名：

```cmd
git branch -M main
git remote add origin https://github.com/你的用户名/game-dev-tycoon.git
git push -u origin main
```

> **首次推送时**，Git 会弹出登录窗口，要求你登录 GitHub 账号进行身份验证。
> 如果使用的是 HTTPS 方式，可能需要使用 **Personal Access Token** 代替密码：
> 1. 在 GitHub 上点击右上角头像 → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
> 2. 点击 **Generate new token (classic)**
> 3. 勾选 `repo` 权限
> 4. 生成后复制 Token，在密码输入框粘贴此 Token

### 步骤五：配置 GitHub Pages

1. 在 GitHub 上打开你的仓库页面
2. 点击 **Settings**（设置）标签
3. 在左侧菜单找到 **Pages**
4. 在 **Source** 部分，选择 **GitHub Actions**
5. 点击 **Save**（如果有的话）

> ⚠️ **重要**：Source 必须选择 **GitHub Actions**，而不是 "Deploy from a branch"。
> 因为我们使用 GitHub Actions 工作流来自动构建和部署。

### 步骤六：等待自动部署

推送代码后，GitHub Actions 会自动触发构建和部署：

1. 在仓��页面点击 **Actions** 标签
2. 你会看到一个正在运行的工作流 **"Deploy to GitHub Pages"**
3. 点击进去可以查看构建日志
4. 等待所有步骤显示 ✅ 绿色对勾（通常需要 1-3 分钟）

### 步骤七：访问你的网站 🎉

部署成功后，你的游戏就可以通过以下网址访问了：

```
https://你的用户名.github.io/game-dev-tycoon/
```

将 `你的用户名` 替换为你的 GitHub 用户名即可。

> 也可以在仓库的 **Settings → Pages** 页面找到部署后的网址。

---

## 🔄 后续更新

每次修改代码后，只需要三条命令就能自动更新网站：

```cmd
cd C:\Users\22148\Documents\代码\游戏开发商\game-dev-tycoon
git add .
git commit -m "描述你的修改内容"
git push
```

推送后 GitHub Actions 会自动重新构建和部署，1-3 分钟后网站就会更新。

---

## ❓ 常见问题

### Q: 构建失败怎么办？

1. 在 GitHub 仓库页面点击 **Actions** 标签
2. 点击失败的工作流运行
3. 查看错误日志，通常是依赖安装或编译错误
4. 先在本地测试构建是否成功：
   ```cmd
   cd C:\Users\22148\Documents\代码\游戏开发商\game-dev-tycoon
   npm run build
   ```
5. 如果本地构建成功但 CI 失败，检查 `package-lock.json` 是否已提交

### Q: 页面显示 404？

- 确认 **Settings → Pages → Source** 选择的是 **GitHub Actions**
- 确认工作流已成功运行（Actions 标签页中显示绿色 ✅）
- 等待几分钟，GitHub Pages 有时需要一点时间生效

### Q: 页面空白或资源加载失败？

- 这通常是 `publicPath` 配置问题。本项目已配置为生产模式使用相对路径 `./`，应该能正常工作
- 打开浏览器开发者工具（F12）查看 Console 和 Network 标签页的错误信息

### Q: 如何使用自定义域名？

1. 在 **Settings → Pages** 中填写你的自定义域名
2. 在你的域名 DNS 设置中添加 CNAME 记录指向 `你的用户名.github.io`
3. 在仓库根目录创建 `CNAME` 文件，内容为你的域名

### Q: 如何删除部署？

在 **Settings → Pages** 中可以取消发布。

---

## 📁 项目结构说明

```
game-dev-tycoon/
├── .github/
│   └── workflows/
│       └── deploy.yml      ← GitHub Actions 自动部署工作流
├── .gitignore               ← Git 忽略文件配置
├── dist/                    ← 构建输出目录（不会提交到 Git）
├── node_modules/            ← 依赖目录（不会提交到 Git）
├── src/                     ← 源代码
├── index.html               ← HTML ��板
├── package.json             ← 项目配置
├── webpack.config.cjs       ← Webpack 构建配置
└── DEPLOY.md                ← 本文件
```

---

## 🛠️ 本地测试构建

在部署前，建议先在本地测试构建是否成功：

```cmd
cd C:\Users\22148\Documents\代码\游戏开发商\game-dev-tycoon
npm install
npm run build
```

构建成功后，`dist/` 目录下会生成部署所需的所有文件。
