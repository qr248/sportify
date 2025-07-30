<template>
  <div class="login-container">
    <h2>活动报名系统 - {{ isRegistering ? '注册' : '登录' }}</h2>
    
    <!-- 切换按钮 -->
    <button class="toggle-btn" @click="toggleMode">
      {{ isRegistering ? '已有账号？去登录' : '没有账号？去注册' }}
    </button>

    <div class="form-item">
      <label>用户名：</label>
      <input type="text" v-model="username" placeholder="请输入用户名（3-20位）">
    </div>
    
    <div class="form-item">
      <label>密码：</label>
      <input type="password" v-model="password" placeholder="请输入密码（至少6位）">
    </div>
    
    <!-- 注册专属：确认密码 -->
    <div class="form-item" v-if="isRegistering">
      <label>确认密码：</label>
      <input type="password" v-model="confirmPassword" placeholder="请再次输入密码">
      <p class="error-tip" v-if="passwordMismatch">两次密码输入不一致</p>
    </div>
    
    <button @click="handleSubmit">
      {{ isRegistering ? '注册' : '登录' }}
    </button>
    
    <!-- 错误提示 -->
    <p class="error-tip" v-if="errorMsg">{{ errorMsg }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

// 状态管理
const isRegistering = ref(false); // 切换登录/注册模式
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const errorMsg = ref('');
const router = useRouter();

// 验证两次密码是否一致
const passwordMismatch = computed(() => {
  return isRegistering.value && password.value !== confirmPassword.value;
});

// 切换登录/注册模式
const toggleMode = () => {
  // 重置表单
  username.value = '';
  password.value = '';
  confirmPassword.value = '';
  errorMsg.value = '';
  isRegistering.value = !isRegistering.value;
};

// 登录处理
const handleLogin = async () => {
  // 基础验证
  if (!username.value || !password.value) {
    errorMsg.value = '请输入用户名和密码';
    return;
  }

  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      username: username.value,
      password: password.value
    });

    // 清理并存储token（处理可能的多余引号）
    const token = response.data.token?.trim().replace(/^["']|["']$/g, '');
    if (!token) {
      throw new Error('未获取到有效token');
    }

    // 存储用户信息
    localStorage.setItem('token', token);
    localStorage.setItem('userId', response.data.user.id);
    localStorage.setItem('username', response.data.user.username);

    alert('登录成功');
    router.push('/'); // 跳转到活动列表
  } catch (err) {
    errorMsg.value = err.response?.data?.message || '用户名或密码错误';
  }
};

// 注册处理
const handleRegister = async () => {
  // 基础验证
  if (!username.value || !password.value) {
    errorMsg.value = '用户名和密码不能为空';
    return;
  }
  if (username.value.length < 3 || username.value.length > 20) {
    errorMsg.value = '用户名长度必须为3-20位';
    return;
  }
  if (password.value.length < 6) {
    errorMsg.value = '密码长度不能少于6位';
    return;
  }
  if (passwordMismatch.value) {
    errorMsg.value = '两次密码输入不一致';
    return;
  }

  try {
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      username: username.value,
      password: password.value
    });

    // 注册成功后自动切换到登录模式
    alert('注册成功，请登录');
    toggleMode();
  } catch (err) {
    errorMsg.value = err.response?.data?.message || '注册失败，请稍后再试';
  }
};

// 新增：统一处理按钮点击
const handleSubmit = () => {
  if (isRegistering.value) {
    handleRegister();
  } else {
    handleLogin();
  }
};
</script>

<style>
.login-container {
  max-width: 300px;
  margin: 100px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  text-align: center;
}

.form-item {
  margin: 15px 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

label {
  margin-right: 10px;
  width: 80px;
  text-align: right;
}

input {
  width: 200px;
  padding: 6px;
}

button {
  width: 100%;
  padding: 8px;
  margin-top: 10px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.toggle-btn {
  background: #3498db;
  width: auto;
  margin-bottom: 15px;
}

.error-tip {
  color: #e74c3c;
  font-size: 12px;
  margin: 5px 0 0;
  text-align: right;
}
</style>