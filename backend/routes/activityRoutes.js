const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // 登录验证
const admin = require('../middleware/admin'); // 管理员权限
const Activity = require('../models/Activity'); // 引入活动模型

// 1. 获取所有活动（公开接口，无需登录）
router.get('/', async (req, res) => {
  try {
    // 查询所有活动，按日期升序排列（最近的活动在前）
    const activities = await Activity.findAll({
      order: [['date', 'ASC']]
    });
    res.json(activities);
  } catch (error) {
    console.error('获取活动列表错误：', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 2. 获取单个活动详情（公开接口）
router.get('/:id', async (req, res) => {
  try {
    // 通过 ID 查询活动（findByPk = 根据主键查询）
    const activity = await Activity.findByPk(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: '活动不存在' });
    }
    res.json(activity);
  } catch (error) {
    console.error('获取活动详情错误：', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 3. 创建活动（仅管理员可操作）
router.post('/', [auth, admin], async (req, res) => {
  try {
    // 从请求体中获取活动数据（前端提交的表单数据）
    const {
      title,
      description,
      type,
      location,
      date,
      startTime,
      endTime,
      maxParticipants,
      price
    } = req.body;

    // 创建活动（Sequelize 的 create 方法自动插入数据库）
    const newActivity = await Activity.create({
      title,
      description,
      type,
      location,
      date,
      startTime,
      endTime,
      maxParticipants,
      price,
      status: 'active' // 默认可报名状态
    });

    // 返回创建成功的活动数据（状态码 201 表示创建成功）
    res.status(201).json(newActivity);
  } catch (error) {
    console.error('创建活动错误：', error);
    // 如果是验证错误（如缺少必填字段），返回具体提示
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      return res.status(400).json({ message: messages.join('，') });
    }
    res.status(500).json({ message: '服务器错误' });
  }
});

// 4. 更新活动（仅管理员可操作）
router.put('/:id', [auth, admin], async (req, res) => {
  try {
    // 先查询活动是否存在
    const activity = await Activity.findByPk(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: '活动不存在' });
    }

    // 更新活动数据（update 方法会自动保存到数据库）
    await activity.update(req.body);
    res.json(activity); // 返回更新后的活动数据
  } catch (error) {
    console.error('更新活动错误：', error);
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      return res.status(400).json({ message: messages.join('，') });
    }
    res.status(500).json({ message: '服务器错误' });
  }
});

// 5. 关闭活动（仅管理员可操作）
router.patch('/:id/close', [auth, admin], async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: '活动不存在' });
    }

    // 仅更新状态为“已结束”
    await activity.update({ status: 'closed' });
    res.json({ message: '活动已关闭', activity });
  } catch (error) {
    console.error('关闭活动错误：', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;