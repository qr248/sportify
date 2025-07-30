<template>
  <div class="my-orders-container">
    <h2>我的订单</h2>

    <!-- 无有效订单时显示提示（仅此时显示） -->
    <div v-if="!hasValidOrders" class="no-orders">
      暂无订单，快去报名活动吧～
    </div>

    <!-- 有有效订单时才显示订单列表 -->
    <div class="orders-list" v-else>
      <!-- 只循环有效订单（过滤空数据和无效数据） -->
      <div 
        class="order-item" 
        v-for="order in validOrders" 
        :key="order.id"
      >
        <h3>订单 {{ order.id }}：{{ order.Activity?.title || '未知活动' }}</h3>
        <p>报名时间：{{ formatDate(order.createdAt) }}</p>
        <p>数量：{{ order.quantity }}人</p>
        <p>总价：{{ order.totalPrice }}元</p>
        <p>状态：{{ order.status === 'pending' ? '待确认' : order.status }}</p>
        <button 
          @click="handleCancelOrder(order.id)"
          class="cancel-btn"
          v-if="order.status === 'pending'"
        >
          取消报名
        </button>
      </div>
    </div>

    <button class="back-btn" @click="$router.push('/')">
      返回活动列表
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import request from '../utils/request';

// 原始订单数据（可能包含无效数据）
const orders = ref([]);
const router = useRouter();
const isLoading = ref(false);

// 1. 过滤有效订单（核心：排除空数据、无id、无活动信息的无效项）
const validOrders = computed(() => {
  return orders.value.filter(order => {
    // 有效订单必须满足：存在、有id、有总价（基础校验）
    return order 
      && order.id 
      && order.totalPrice !== undefined 
      && order.totalPrice >= 0;
  });
});

// 2. 判断是否有有效订单（决定显示提示还是列表）
const hasValidOrders = computed(() => {
  return validOrders.value.length > 0;
});

// 获取我的订单
const getMyOrders = async () => {
  try {
    isLoading.value = true;
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('请先登录');
      router.push('/login');
      return;
    }

    // 请求后端订单接口
    const response = await request.get('/orders/myorders');
    // 适配后端返回格式
    const orderList = Array.isArray(response) 
      ? response 
      : Array.isArray(response.data) 
        ? response.data 
        : Array.isArray(response.orders) 
          ? response.orders 
          : [];
    orders.value = orderList;
    console.log('原始订单数据：', orders.value); // 调试用，可保留
    console.log('过滤后有效订单：', validOrders.value); // 调试用
  } catch (err) {
    console.error('获取订单失败:', err);
    orders.value = []; // 出错时强制清空，避免渲染问题
  } finally {
    isLoading.value = false;
  }
};

// 取消订单
const handleCancelOrder = async (orderId) => {
  if (isLoading.value) return;
  if (!window.confirm('确定要取消报名吗？')) return;

  try {
    isLoading.value = true;
    await request.delete(`/orders/${orderId}`);
    alert('取消成功');
    getMyOrders(); // 刷新订单
  } catch (err) {
    alert('取消失败: ' + (err.response?.data?.message || '操作失败'));
  } finally {
    isLoading.value = false;
  }
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '未知时间';
  return new Date(dateStr).toLocaleString('zh-CN');
};

// 页面加载时获取订单
onMounted(getMyOrders);
</script>

<style scoped>
.my-orders-container {
  max-width: 1000px;
  margin: 20px auto;
  padding: 0 20px;
}

h2 {
  color: #333;
  border-bottom: 2px solid #42b983;
  padding-bottom: 10px;
}

.orders-list {
  margin-top: 20px;
}

.order-item {
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.no-orders {
  text-align: center;
  padding: 50px 0;
  color: #999;
  background: #f9f9f9;
  border-radius: 8px;
  margin: 20px 0;
}

.cancel-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.cancel-btn:hover {
  background: #c0392b;
}

.back-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 20px;
}
</style>