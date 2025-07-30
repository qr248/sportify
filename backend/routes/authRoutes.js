const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// 生成JWT Token
const generateToken = (userId, userRole) => {
  // 生产环境建议将密钥存放在环境变量中
  const secret = process.env.JWT_SECRET || 'sportify_jwt_secret'; 
  return jwt.sign(
    { id: userId, role: userRole },
    secret,
    { expiresIn: '7d' } // 有效期7天
  );
};

// 注册接口
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 基础参数验证
    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ message: '用户名长度必须为3-20位' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: '密码长度不能少于6位' });
    }

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: '用户名已被占用' });
    }

    // 创建新用户（密码会通过模型钩子自动加密）
    const user = await User.create({ username, password });

    // 返回注册成功信息（包含token实现自动登录）
    res.status(201).json({
      message: '注册成功',
      token: generateToken(user.id, user.role),
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('注册错误:', error);
    // 区分验证错误和服务器错误
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      return res.status(400).json({ message: messages.join('，') });
    }
    res.status(500).json({ message: '服务器错误，注册失败' });
  }
});

// 登录接口
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 基础参数验证
    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    // 查找用户（包含密码字段，默认查询会排除）
    const user = await User.findOne({ 
      where: { username },
      attributes: { include: ['password'] } // 显式查询密码字段
    });

    // 验证用户是否存在
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 返回登录信息（包含token）
    res.json({
      token: generateToken(user.id, user.role),
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器错误，登录失败' });
  }
});

module.exports = router;