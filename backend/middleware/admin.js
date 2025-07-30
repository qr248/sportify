// 管理员权限验证中间件（需配合auth中间件使用）
module.exports = function(req, res, next) {
    try {
        // 1. 验证用户是否已登录（依赖auth中间件设置的req.user）
        console.log(req.user);
        if (!req.user) {
            console.warn('管理员权限验证失败：用户未登录');
            return res.status(401).json({ 
                code: 401,
                message: '请先登录后再执行此操作' 
            });
        }

        // 2. 容错处理：确保role字段存在且为字符串
        const userRole = typeof req.user.role === 'string' 
            ? req.user.role.toLowerCase() 
            : '';

        // 3. 验证是否为管理员角色
        if (userRole !== 'admin') {
            console.warn(`管理员权限验证失败：用户[${req.user.id}]角色为[${userRole}]`);
            return res.status(403).json({ 
                code: 403,
                message: '没有管理员权限，无法执行此操作' 
            });
        }

        // 4. 验证通过，记录日志并继续
        console.log(`管理员权限验证通过：用户[${req.user.id}]`);
        next();
    } catch (error) {
        // 捕获意外错误（如req.user格式异常）
        console.error('管理员权限验证中间件错误：', error);
        res.status(500).json({ 
            code: 500,
            message: '权限验证过程中发生错误' 
        });
    }
};
    