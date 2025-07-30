# Sportify 运动活动报名平台

Sportify 是一个基于 Vue3 + Node.js + Sequelize + MySQL 的运动活动报名与管理平台，支持用户注册、登录、活动浏览、报名、评论、订单管理等功能，适合运动俱乐部、兴趣小组等场景。

## 目录结构

```
sportify/
├── backend/         # Node.js 后端（Express + Sequelize）
│   ├── models/      # 数据库模型
│   ├── routes/      # 路由
│   ├── middleware/  # 中间件（如鉴权）
│   ├── config/      # 配置（如数据库连接）
│   └── app.js       # 启动入口
├── frontend/        # 前端（Vue3 + Vite）
│   ├── src/
│   │   ├── views/   # 页面组件
│   │   ├── utils/   # 工具函数
│   │   └── App.vue
│   └── vite.config.js
└── README.md
```

## 功能简介

- **用户注册/登录**：支持 JWT 鉴权，注册后可登录。
- **活动浏览/搜索**：可按标题关键字搜索活动，查看活动详情。
- **活动报名**：登录后可报名活动，报名人数受限。
- **订单管理**：可查看、取消自己的报名订单。
- **评论与评分**：可对已报名活动进行评论和星级评分，支持删除自己的评论。
- **管理员功能**：可管理所有订单（需后端配置 admin 角色）。

## 快速开始

### 1. 启动后端

1. 安装依赖  
   ```bash
   cd backend
   npm install
   ```

2. 配置数据库  
   修改 `backend/config/db.js`，填入你的 MySQL 连接信息。

3. 启动服务  
   ```bash
   npm start
   ```
   默认监听 `http://localhost:5000`

### 2. 启动前端

1. 安装依赖  
   ```bash
   cd frontend
   npm install
   ```

2. 启动开发服务器  
   ```bash
   npm run dev
   ```
   默认监听 `http://localhost:5173`

### 3. 访问平台

浏览器访问 [http://localhost:5173](http://localhost:5173) 即可体验全部功能。

## 主要依赖

- **前端**：Vue3, Vue Router, Axios, Vite
- **后端**：Express, Sequelize, MySQL, jsonwebtoken, bcrypt

## 常见问题

- **401 未授权**：请确认已登录，token 未过期，前后端 JWT 密钥一致。
- **数据库连接失败**：请检查 MySQL 服务和配置。
- **报名失败**：活动已满、重复报名或未登录均会提示。

## 贡献与反馈

欢迎提交 issue 或 PR 反馈问题与建议！

---

© 2025