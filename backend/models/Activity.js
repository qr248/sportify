const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // 引入 MySQL 连接

// 定义活动模型（对应 MySQL 中的 activities 表）
const Activity = sequelize.define('Activity', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true // 不允许空字符串
    }
  },
  description: {
    type: DataTypes.TEXT, // 长文本类型，适合描述
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['篮球', '羽毛球', '瑜伽', '跑步', '游泳', '乒乓球','足球','其他']] // 限制活动类型
    }
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false // 活动地点必填
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false // 活动日期必填
  },
  startTime: {
    type: DataTypes.STRING,
    allowNull: false // 开始时间（如 "14:00"）
  },
  endTime: {
    type: DataTypes.STRING,
    allowNull: false // 结束时间（如 "16:00"）
  },
  maxParticipants: {
    type: DataTypes.INTEGER,
    allowNull: false,
    min: 1 // 最少1人
  },
  currentParticipants: {
    type: DataTypes.INTEGER,
    defaultValue: 0, // 默认当前参与人数为0
    validate: {
      max: function(value) {
        // 限制当前人数不能超过最大人数
        if (value > this.maxParticipants) {
          throw new Error('当前参与人数不能超过最大限制');
        }
      }
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2), // 价格（保留2位小数）
    allowNull: false,
    min: 0 // 价格不能为负数
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active', // 状态：active（可报名）、closed（已结束）
    validate: {
      isIn: [['active', 'closed']]
    }
  }
}, {
  timestamps: true, // 自动添加 createdAt（创建时间）和 updatedAt（更新时间）
  tableName: 'activities' // 明确表名（可选，默认是模型名复数）
});

module.exports = Activity;