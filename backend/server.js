const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
// 导入所有模型
const User = require('./models/User');
const Activity = require('./models/Activity');
const Order = require('./models/Order');
const Comment = require('./models/Comment'); // 新增：评论模型

// 导入所有路由
const authRoutes = require('./routes/authRoutes');
const activityRoutes = require('./routes/activityRoutes');
const orderRoutes = require('./routes/orderRoutes');
const commentRoutes = require('./routes/commentRoutes'); // 新增：评论路由

const path = require('path'); // 新增

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件（必须在路由前）
app.use(cors()); // 允许跨域
app.use(express.json()); // 解析JSON请求体（评论、订单等接口需要）

// 路由注册（包含评论路由）
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/comments', commentRoutes); // 新增：注册评论路由

// 托管前端静态文件（dist 目录）
app.use(express.static(path.join(__dirname, './public')));

// SPA 路由兼容：所有未知路由返回前端 index.html
app.get(/^\/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, './public/index.html'));
});

// 定义所有模型关联（包含评论）
User.hasMany(Order);
Activity.hasMany(Order);
Order.belongsTo(User);
Order.belongsTo(Activity);

// 新增：评论模型关联
User.hasMany(Comment);       // 一个用户可发多个评论
Comment.belongsTo(User);     // 评论属于一个用户（自动添加userId）
Activity.hasMany(Comment);   // 一个活动可有多个评论
Comment.belongsTo(Activity); // 评论属于一个活动（自动添加activityId）

// 初始化数据库并启动服务器
const initDB = async () => {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 同步所有模型（不会删除现有数据）
    await sequelize.sync({ force: false });
    console.log('✅ 所有模型同步成功（包含评论表）');

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('❌ 初始化失败：', err);
    process.exit(1);
  }
};

// 执行初始化
initDB();