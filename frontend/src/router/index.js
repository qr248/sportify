import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import ActivitiesView from '../views/ActivitiesView.vue';
import MyOrdersView from '../views/MyOrdersView.vue';
import ActivityDetailView from '../views/ActivityDetailView.vue';

// 路由守卫：未登录强制跳转登录页
const requireAuth = (to, from, next) => {
  const token = localStorage.getItem('token');
  if (token) {
    next(); // 已登录：放行
  } else {
    next('/login'); // 未登录：强制跳登录页
  }
};

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/login', 
      component: LoginView, 
      name: 'Login' 
      // 登录页无需守卫，允许未登录访问
    },
    { 
      path: '/', 
      component: ActivitiesView, 
      name: 'Activities',
      beforeEnter: requireAuth 
    },
    { 
      path: '/myorders', 
      component: MyOrdersView, 
      name: 'MyOrders',
      beforeEnter: requireAuth 
    },
    { 
      path: '/activities/:id', 
      component: ActivityDetailView, 
      name: 'ActivityDetail',
      beforeEnter: requireAuth 
    },
    // 关键修改：默认路径（打开网页）重定向到登录页
    { path: '/:pathMatch(.*)*', redirect: '/login' }
  ]
});

export default router;