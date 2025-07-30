// models/Order.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Activity = require('./Activity');

const Order = sequelize.define('Order', {
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    validate: {
      isIn: [['online', 'cash', 'wechat', 'alipay', null]]
    }
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'paid', 'cancelled']]
    }
  }
  // 关键：删除手动添加的 userId 和 activityId 字段
  // 这两个字段会由下面的 belongsTo 自动生成，无需手动声明
}, {
  timestamps: true
});

// 关联关系：自动生成 userId 和 activityId 列
Order.belongsTo(User); // 自动添加 userId 列（非空约束由关联逻辑保证）
Order.belongsTo(Activity); // 自动添加 activityId 列

module.exports = Order;