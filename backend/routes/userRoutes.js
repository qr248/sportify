const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const User = require('../models/User');

// 1. 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, phone, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: '请填写用户名、邮箱和密码' });
    }

    const existingUser = await User.findOne({
      where: { [Op.or]: [{ email }, { username }] }
    });

    if (existingUser) {
      return res.status(400).json({ message: '用户名或邮箱已被使用' });
    }

    const user = await User.create({
      username,
      email,
      password,
      phone,
      role: role || 'user'
    });

    // 生成token：使用与验证时一致的密钥（关键！）
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'sportify_jwt_secret', // 与auth.js统一
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('注册接口错误：', error);
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      return res.status(400).json({ message: messages.join('，') });
    }
    res.status(500).json({ message: '服务器错误' });
  }
});

// 2. 用户登录（移除调试代码，避免干扰）
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: '请输入邮箱和密码' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: '邮箱或密码不正确' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: '邮箱或密码不正确' });
    }

    // 生成token：密钥与auth.js统一
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'sportify_jwt_secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('登录接口错误：', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 3. 获取当前登录用户信息
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json(user);
  } catch (error) {
    console.error('获取用户信息错误：', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;