const jwt = require('jsonwebtoken');

// 验证用户是否登录的中间件
module.exports = function(req, res, next) {
  // 从请求头获取Authorization字段
  const authHeader = req.header('Authorization');
  
  // 1. 提取token：严格检查格式（必须以Bearer开头且有实际令牌）
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // 仅当以 "Bearer " 开头时才提取（空格必须存在）
    token = authHeader.split(' ')[1]; // 拆分后取第二个元素（令牌部分）
  }

  // 2. 检查token是否有效（排除空字符串）
  if (!token || token.trim() === '') {
    return res.status(401).json({ message: '无访问权限，请先登录' });
  }

  try {
    // 3. 验证token：使用与生成时一致的密钥（关键！）
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'sportify_jwt_secret' // 统一默认密钥
    );

    // 4. 存入用户信息
    req.user = decoded;
    console.log(req.user);
    next();
  } catch (err) {
    // 细分错误提示
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '令牌已过期，请重新登录' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '令牌格式错误或无效' });
    }
    res.status(401).json({ message: '令牌验证失败' });
  }
};