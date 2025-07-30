const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Activity = require('./Activity');

// 定义评论模型
const Comment = sequelize.define('Comment', {
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true // 内容不能为空
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    validate: {
      min: 1,
      max: 5 // 评分限制在1-5之间
    }
  }
}, { timestamps: true });

// 关联关系：评论属于用户，属于活动
Comment.belongsTo(User); // 评论表会自动添加 userId 字段
Comment.belongsTo(Activity); // 评论表会自动添加 activityId 字段

module.exports = Comment;