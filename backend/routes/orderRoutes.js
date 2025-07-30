const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Order = require('../models/Order');
const User = require('../models/User');
const Activity = require('../models/Activity');
const sequelize = require('../config/db');
const { Op } = require('sequelize');

// 创建订单（报名活动）
router.post('/', auth, async (req, res) => {
  try {
    const { activityId, quantity = 1, paymentMethod } = req.body;
    const userId = req.user.id; // 从登录状态获取用户ID

    // 1. 验证核心参数（确保UserId和ActivityId有值）
    if (!userId) {
      return res.status(401).json({ message: '用户身份验证失败，请重新登录' });
    }
    if (!activityId) {
      return res.status(400).json({ message: '请传入活动ID' });
    }

    // 2. 验证活动是否存在
    const activity = await Activity.findByPk(activityId);
    if (!activity) {
      return res.status(404).json({ message: '活动不存在' });
    }

    // 3. 验证报名数量合理性
    if (quantity < 1) {
      return res.status(400).json({ message: '报名数量不能小于1' });
    }

    // 4. 防止重复报名（查询条件匹配数据库字段）
    const existingOrder = await Order.findOne({
      where: { UserId: userId, ActivityId: activityId } // 关键：使用UserId和ActivityId（大写开头）
    });
    if (existingOrder) {
      return res.status(400).json({ message: '您已报名该活动，不可重复报名' });
    }

    // 5. 活动满员检测
    if (activity.currentParticipants >= activity.maxParticipants) {
      return res.status(400).json({ message: '活动已报满，无法报名' });
    }

    // 6. 计算订单总价
    const totalPrice = activity.price * quantity;

    // 7. 事务处理（确保数据一致性）
    const order = await sequelize.transaction(async (t) => {
      // 创建订单（字段名严格匹配数据库的UserId和ActivityId）
      const newOrder = await Order.create({
        UserId: userId, // 核心：对应数据库的UserId字段（大写U）
        ActivityId: activityId, // 核心：对应数据库的ActivityId字段（大写A）
        quantity: quantity,
        totalPrice: totalPrice,
        paymentMethod: paymentMethod || null,
        status: 'pending'
      }, { transaction: t });

      // 更新活动参与人数
      await activity.update({
        currentParticipants: activity.currentParticipants + quantity
      }, { transaction: t });

      return newOrder;
    });

    // 8. 返回包含活动信息的完整订单
    const fullOrder = await Order.findByPk(order.id, {
      include: [{
        model: Activity,
        attributes: ['id', 'title', 'date', 'location', 'price']
      }]
    });

    res.status(201).json(fullOrder);
  } catch (error) {
    console.error('创建订单错误:', error);
    // 细化错误提示
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => `${err.path}：${err.message}`);
      return res.status(400).json({ message: '报名失败', details: messages });
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ message: '活动或用户不存在，无法报名' });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: '订单创建冲突，请稍后重试' });
    }
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取当前用户的所有订单
router.get('/myorders', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`用户[${userId}]查询订单`);

    // 查询条件使用UserId（匹配数据库字段）
    const orders = await Order.findAll({
      where: { UserId: userId }, // 关键：使用UserId（大写U）
      include: [
        { 
          model: Activity, 
          attributes: ['id', 'title', 'date', 'location', 'price', 'status'] 
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // 空订单提示
    if (orders.length === 0) {
      return res.status(200).json({ message: '暂无订单', orders: [] });
    }

    res.json(orders);
  } catch (error) {
    console.error('获取用户订单错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 管理员获取所有订单
router.get('/', [auth, admin], async (req, res) => {
  try {
    // 支持多条件筛选（字段名匹配数据库）
    const { activityId, userId, status } = req.query;
    const whereCondition = {};
    if (activityId) whereCondition.ActivityId = activityId; // 大写A
    if (userId) whereCondition.UserId = userId; // 大写U
    if (status) whereCondition.status = status;

    const orders = await Order.findAll({
      where: whereCondition,
      include: [
        { model: User, attributes: ['id', 'username', 'email', 'phone'] },
        { model: Activity, attributes: ['id', 'title', 'date', 'location', 'status'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    console.error('管理员获取订单错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 取消订单
router.delete('/:id', auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    // 查询订单及关联活动
    const order = await Order.findByPk(orderId, {
      include: [{ model: Activity }]
    });

    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    // 权限验证（使用UserId匹配）
    if (order.UserId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限取消此订单' });
    }

    // 事务处理：删除订单+回滚活动人数
    await sequelize.transaction(async (t) => {
      await order.destroy({ transaction: t });

      const activity = await Activity.findByPk(order.ActivityId, { transaction: t });
      await activity.update({
        currentParticipants: Math.max(0, activity.currentParticipants - order.quantity)
      }, { transaction: t });
    });

    res.json({ message: '订单已取消', orderId: orderId });
  } catch (error) {
    console.error('取消订单错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新订单状态（例如支付后更新为已支付）
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    const userId = req.user.id;

    // 验证状态有效性
    const validStatuses = ['pending', 'paid', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `状态无效，允许的值：${validStatuses.join(', ')}` 
      });
    }

    // 查询订单
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    // 权限验证
    if (order.UserId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限修改此订单' });
    }

    // 更新状态
    await order.update({ status });
    res.json({ message: '订单状态已更新', order });
  } catch (error) {
    console.error('更新订单状态错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;