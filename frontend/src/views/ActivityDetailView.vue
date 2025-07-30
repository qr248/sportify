<template>
  <div class="detail-container">
    <!-- 返回按钮 -->
    <button class="back-btn" @click="$router.go(-1)">← 返回活动列表</button>

    <!-- 活动基本信息 -->
    <div class="activity-info">
      <h1>{{ activity.title }}</h1>
      <div class="info-grid">
        <div class="info-item">
          <p class="label">活动时间</p>
          <p>{{ formatDate(activity.date) }}</p>
        </div>
        <div class="info-item">
          <p class="label">活动地点</p>
          <p>{{ activity.location }}</p>
        </div>
        <div class="info-item">
          <p class="label">活动价格</p>
          <p>{{ activity.price }}元/人</p>
        </div>
        <div class="info-item">
          <p class="label">报名人数</p>
          <p>{{ activity.currentParticipants }}/{{ activity.maxParticipants }}人</p>
        </div>
        <div class="info-item">
          <p class="label">活动状态</p>
          <p class="status" :class="activity.status === 'active' ? 'active' : 'closed'">
            {{ activity.status === 'active' ? '可报名' : '已结束' }}
          </p>
        </div>
      </div>

      <div class="description">
        <p class="label">活动详情</p>
        <p>{{ activity.description }}</p>
      </div>

      <button 
        class="join-btn"
        @click="joinActivity"
        :disabled="activity.currentParticipants >= activity.maxParticipants || activity.status !== 'active'"
      >
        {{ activity.currentParticipants >= activity.maxParticipants ? '已报满' : '立即报名' }}
      </button>
    </div>

    <!-- 评论区 -->
    <div class="comment-section">
      <h2>用户评论 ({{ comments.length }})</h2>

      <!-- 评论输入框 -->
      <div class="comment-input-box">
        <textarea 
          v-model="commentContent" 
          placeholder="分享你的看法..."
          rows="3"
          :disabled="isSubmitting"
        ></textarea>
        <div class="rating-input">
          <span>评分：</span>
          <div class="stars">
            <span 
              v-for="star in 5" 
              :key="star"
              @click="setRating(star)"
              :class="{ active: rating >= star }"
              class="star"
            >★</span>
          </div>
        </div>
        <button 
          @click="submitComment"
          :disabled="!commentContent.trim() || isSubmitting"
          class="submit-comment-btn"
        >
          {{ isSubmitting ? '发布中...' : '发布评论' }}
        </button>
      </div>

      <!-- 评论列表 -->
      <div class="comments-list">
        <div 
          class="comment-item" 
          v-for="comment in comments" 
          :key="comment.id"
        >
          <div class="comment-header">
            <span class="username">{{ comment.User?.username || '匿名用户' }}</span>
            <div class="rating">
              <span 
                v-for="star in 5" 
                :key="star" 
                :class="{ active: Number(comment.rating) >= star }"
              >★</span>
            </div>
            <span class="time">{{ formatDate(comment.createdAt) }}</span>
          </div>
          <div class="comment-content">{{ comment.content }}</div>
          
          <!-- 自己的评论显示删除按钮 -->
          <button 
            class="delete-comment-btn"
            @click="deleteComment(comment.id)"
            v-if="isOwnComment(comment)"
          >
            删除
          </button>
        </div>

        <div v-if="comments.length === 0 && !isLoadingComments" class="no-comments">
          暂无评论，快来发表第一条评论吧～
        </div>
        <div v-if="isLoadingComments" class="loading-comments">
          加载评论中...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import request from '../utils/request';

// 路由参数
const route = useRoute();
const router = useRouter();
const activityId = route.params.id;

// 数据
const activity = ref({});
const comments = ref([]);
const commentContent = ref('');
const rating = ref(5); // 默认5星
const isSubmitting = ref(false);
const isLoadingComments = ref(false);
const userId = ref(localStorage.getItem('userId') || ''); // 从本地存储获取用户ID

// 获取活动详情
const getActivityDetail = async () => {
  try {
    const res = await request.get(`/activities/${activityId}`);
    activity.value = res;
  } catch (err) {
    alert('获取活动详情失败');
    router.push('/'); // 失败则返回列表页
  }
};

// 获取活动评论
const getComments = async () => {
  try {
    isLoadingComments.value = true;
    const res = await request.get(`/comments/activity/${activityId}`);
    comments.value = Array.isArray(res) ? res : [];
    console.log(comments);
  } catch (err) {
    console.error('获取评论失败', err);
    alert('获取评论失败，请稍后再试');
  } finally {
    isLoadingComments.value = false;
  }
};

// 报名活动
const joinActivity = async () => {
  try {
    await request.post('/orders', { activityId });
    alert('报名成功！');
    getActivityDetail(); // 刷新活动信息（更新报名人数）
  } catch (err) {
    alert('报名失败：' + (err.response?.data?.message || '操作失败'));
  }
};

// 发布评论
const submitComment = async () => {
  const content = commentContent.value.trim();
  if (!content) {
    alert('评论内容不能为空');
    return;
  }

  try {
    isSubmitting.value = true;
    // 调用评论接口
    const newComment = await request.post('/comments', {
      activityId,
      content,
      rating: rating.value
    });
    // 新增评论添加到列表最前面
    comments.value.unshift(newComment);
    // 清空输入
    commentContent.value = '';
    rating.value = 5;
    alert('评论发布成功！');
  } catch (err) {
    alert('评论发布失败：' + (err.response?.data?.message || '服务器错误'));
  } finally {
    isSubmitting.value = false;
  }
};

// 删除评论
const deleteComment = async (commentId) => {
  if (!confirm('确定要删除这条评论吗？')) return;

  try {
    await request.delete(`/comments/${commentId}`);
    // 从列表中移除删除的评论
    comments.value = comments.value.filter(comment => comment.id !== commentId);
    alert('评论已删除');
  } catch (err) {
    alert('删除失败：' + (err.response?.data?.message || '没有权限或评论不存在'));
  }
};

// 设置评分
const setRating = (star) => {
  rating.value = star;
};

// 判断是否是自己的评论（用于显示删除按钮）
const isOwnComment = (comment) => {
  return (
    (comment.userId && comment.userId.toString() === userId.value.toString()) ||
    (comment.User && comment.User.id && comment.User.id.toString() === userId.value.toString())
  );
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '未知时间';
  try {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateStr;
  }
};

// 页面加载时获取数据
onMounted(() => {
  getActivityDetail();
  getComments();
});
</script>

<style scoped>
.detail-container {
  max-width: 1000px;
  margin: 20px auto;
  padding: 0 20px;
}

.back-btn {
  margin-bottom: 20px;
  padding: 8px 16px;
  background-color: #f0f2f5;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.activity-info {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

h1 {
  margin-top: 0;
  color: #1f2329;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.info-item {
  background-color: #f7f8fa;
  padding: 10px;
  border-radius: 4px;
}

.label {
  color: #86909c;
  font-size: 14px;
  margin-bottom: 5px;
}

.status.active {
  color: #00875a;
}

.status.closed {
  color: #ff7d00;
}

.description {
  margin: 20px 0;
  line-height: 1.6;
}

.join-btn {
  padding: 10px 20px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin: 10px 0;
}

.join-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.comment-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 40px;
}

.comment-input-box {
  margin: 20px 0;
}

.comment-input-box textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: none;
  margin-bottom: 10px;
  font-family: inherit;
}

.rating-input {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.stars {
  color: #ccc;
  cursor: pointer;
  font-size: 20px;
}

.stars .active {
  color: #faad14;
}

.rating .active {
  color: #faad14;
}

.star:hover {
  color: #faad14;
  transition: color 0.2s;
}

.submit-comment-btn {
  padding: 8px 16px;
  background-color: #722ed1;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.submit-comment-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.comments-list {
  margin-top: 30px;
}

.comment-item {
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.username {
  font-weight: bold;
  color: #1f2329;
}

.time {
  color: #86909c;
  font-size: 12px;
}

.comment-content {
  line-height: 1.6;
  margin: 5px 0;
}

.delete-comment-btn {
  margin-top: 5px;
  padding: 4px 8px;
  background-color: #f5222d;
  color: white;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  font-size: 12px;
}

.delete-comment-btn:hover {
  background-color: #d91e18;
}

.no-comments {
  text-align: center;
  padding: 50px 0;
  color: #86909c;
}

.loading-comments {
  text-align: center;
  padding: 30px 0;
  color: #86909c;
}
</style>
