const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// 计算数据文件夹和数据库文件路径
const dataDir = path.join(process.cwd(), '.');
const dbFullPath = path.join(dataDir, 'sportify.db');

// 确保data文件夹存在
if (!fs.existsSync(dataDir)) {
  const dataDir = path.join(process.cwd(), '.');
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`✅ 已创建data文件夹: ${dataDir}`);
}

// 初始化Sequelize并强制设置路径
const sequelize = new Sequelize('', '', '', {
  dialect: 'sqlite',
  logging: false
});

// 强制设置数据库路径（绕过内部解析逻辑）
sequelize.config.storage = dbFullPath;
sequelize.options.storage = dbFullPath;

// 验证路径设置
console.log('📌 数据库文件路径:', sequelize.config.storage);

// 测试数据库连接
sequelize.authenticate()
  .then(() => console.log('✅ SQLite数据库连接成功'))
  .catch(err => console.error('❌ SQLite连接失败:', err));

module.exports = sequelize;
