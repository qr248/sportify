<template>
  <div class="activities-container">
    <!-- 顶部操作区 -->
    <div class="header-actions">
      <button class="logout-btn" @click="handleLogout">
        退出登录
      </button>
    </div>

    <!-- 新增：活动搜索框 -->
    <div class="search-bar">
      <input
        v-model="searchKeyword"
        placeholder="搜索活动标题"
        class="search-input"
      />
    </div>

    <h2>活动列表</h2>
    <div class="activity-list">
      <div 
        class="activity-card" 
        v-for="activity in filteredActivities" 
        :key="activity.id"
        @click="$router.push(`/activities/${activity.id}`)"
      >
        <h3>{{ activity.title }}</h3>
        <p>时间：{{ activity.date ? formatDate(activity.date) : '暂无时间' }}</p>
        <p>地点：{{ activity.location || '暂无地点' }}</p>
        <p>价格：{{ activity.price !== undefined ? activity.price + '元/人' : '暂无价格' }}</p>
        <p>
          报名状态：
          <span :class="{ full: activity.currentParticipants >= activity.maxParticipants }">
            {{ activity.currentParticipants || 0 }}/{{ activity.maxParticipants || 0 }}人
          </span>
        </p>
        <button 
          @click.stop="joinActivity(activity.id)"
          :disabled="activity.currentParticipants >= activity.maxParticipants"
        >
          {{ activity.currentParticipants >= activity.maxParticipants ? '已报满' : '立即报名' }}
        </button>
      </div>
    </div>
    <button class="my-orders-btn" @click="$router.push('/myorders')">
      查看我的订单
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import request from '../utils/request';

const router = useRouter();
const activities = ref([]);

// 新增：搜索关键字
const searchKeyword = ref('');

// 新增：过滤后的活动列表
const filteredActivities = computed(() => {
  if (!searchKeyword.value.trim()) return activities.value;
  return activities.value.filter(act =>
    act.title && act.title.includes(searchKeyword.value.trim())
  );
});

// 新增：退出登录方法
const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    // 清除登录信息
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    // 跳转到登录页
    router.push('/login');
  }
};

// 原有逻辑：获取活动列表
const getActivities = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('未找到token，请先登录');
      return;
    }
    
    const res = await request.get('/activities', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    activities.value = Array.isArray(res) ? res : [];
  } catch (err) {
    console.error('获取活动失败:', err);
    activities.value = [
      {
        id: 1,
        title: '测试活动',
        date: new Date().toISOString(),
        location: '测试地点',
        price: 50,
        currentParticipants: 5,
        maxParticipants: 20
      }
    ];
  }
};

// 原有逻辑：报名活动
const joinActivity = async (activityId) => {
  try {
    const token = localStorage.getItem('token');
    console.log('报名时使用的token:', token);
    if (!token) {
      alert('请先登录');
      return;
    }

    // 明确指定 headers，防止 axios 封装问题
    const res = await request.post(
      '/orders',
      { activityId, quantity: 1 },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    // 兼容不同返回格式
    if (res && res.data && res.data.code === 401) {
      throw new Error(res.data.message || '未授权');
    }
    alert('报名成功！');
    getActivities();
  } catch (err) {
    // 输出后端详细错误信息
    console.error('报名失败:', err, err?.response?.data);
    alert('报名失败：' + (err?.response?.data?.message || err.message || '请稍后再试'));
  }
};

// 原有逻辑：格式化日期
const formatDate = (dateStr) => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return '日期无效';
    }
    return date.toLocaleString();
  } catch (error) {
    return '日期格式错误';
  }
};

onMounted(getActivities);
</script>

<style>
/* 新增：顶部操作区和退出按钮样式 */
.header-actions {
  text-align: right;
  margin: 10px 0;
}
.logout-btn {
  background-color: #e74c3c; /* 红色按钮区分退出功能 */
  margin-top: 0;
}
.logout-btn:hover {
  background-color: #c0392b;
}

/* 新增：搜索框样式 */
.search-bar {
  margin: 10px 0 20px 0;
  text-align: left;
}
.search-input {
  width: 300px;
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

/* 原有样式保持不变 */
.activities-container {
  max-width: 1000px;
  margin: 20px auto;
  padding: 0 20px;
}
.activity-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin: 20px 0;
}
.activity-card {
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}
.activity-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.full {
  color: red;
  font-weight: bold;
}
button {
  padding: 8px 16px;
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
.my-orders-btn {
  margin-top: 20px;
  background: #3498db;
}
</style>