const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const path = require('path');
const sequelize = require('../config/db'); // 直接引用数据库配置

// 验证模型使用的数据库路径
console.log('🔍 User模型使用的数据库路径:', sequelize.config.storage);

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 20] // 用户名长度限制3-20位
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true // 验证邮箱格式（可选字段）
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 100] // 密码长度至少6位
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true // 可选字段
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user',
    validate: {
      isIn: [['user', 'admin']] // 角色限制
    }
  }
}, {
  timestamps: true,
  hooks: {
    // 密码加密（创建用户时）
    beforeCreate: async (user) => {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    },
    // 密码更新时重新加密
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// 密码验证方法（登录时使用）
User.prototype.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = User;