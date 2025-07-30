const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // 登录验证中间件
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const User = require('../models/User');

// 1. 获取指定活动的所有评论（公开接口）
router.get('/activity/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params;

    // 验证活动是否存在
    const activity = await Activity.findByPk(activityId);
    if (!activity) {
      return res.status(404).json({ message: '活动不存在' });
    }

    // 查询评论并关联用户名（不暴露用户隐私）
    const comments = await Comment.findAll({
      where: { activityId }, // 只查当前活动的评论
      include: [
        {
          model: User,
          attributes: ['username'] // 仅返回用户名
        }
      ],
      order: [['createdAt', 'DESC']] // 最新评论排在前面
    });

    res.json(comments); // 返回评论列表
  } catch (error) {
    console.error('获取评论错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 2. 发布评论（需登录，通过auth中间件验证）
router.post('/', auth, async (req, res) => {
  try {
    let { activityId, content, rating } = req.body;
     activityId = Number(activityId);
    const userId = req.user.id; // 从token中获取当前登录用户ID
    // 基础参数验证（前端已做，后端再次验证）
    if (!activityId) {
      return res.status(400).json({ message: '活动ID不能为空' });
    }
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: '评论内容不能为空' });
    }

    // 验证活动是否存在
    const activity = await Activity.findByPk(activityId);
    if (!activity) {
      return res.status(404).json({ message: '活动不存在' });
    }

    // 创建评论（存入数据库）
    console.log(userId,activityId);
    const comment = await Comment.create({
      UserId:userId,         // 评论者ID（关联User表）
      ActivityId:activityId,     // 活动ID（关联Activity表）
      content:content,        // 评论内容
      rating: rating || 5 // 评分（默认5星，1-5之间）
    });
    // 返回包含用户名的评论（前端显示用）
    const newComment = await Comment.findByPk(comment.id, {
      include: [{ model: User, attributes: ['username'] }]
    });

    res.status(201).json(newComment); // 201表示创建成功
  } catch (error) {
    console.error('创建评论错误:', error);
    // 区分错误类型（开发时方便排查）
    if (error.name === 'SequelizeValidationError') {
      // 数据验证错误（如评分超出1-5范围）
      return res.status(400).json({
        message: '评论格式错误',
        details: error.errors.map(err => err.message)
      });
    }
    res.status(500).json({ message: '服务器错误' });
  }
});

// 3. 删除自己的评论（需登录）
router.delete('/:id', auth, async (req, res) => {
  try {
    const commentId = req.params.id;
    const currentUserId = req.user.id;

    // 查找评论
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    // 验证权限：只能删除自己的评论（或管理员）
    if (comment.userId !== currentUserId && req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限删除此评论' });
    }

    // 执行删除
    await comment.destroy();
    res.json({ message: '评论已成功删除' });
  } catch (error) {
    console.error('删除评论错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;