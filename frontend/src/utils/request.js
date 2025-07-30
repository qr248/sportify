// src/utils/request.js（核心配置）
import axios from 'axios';

// 创建实例时指定后端基础地址（避免每次写完整URL）
const request = axios.create({
  baseURL: 'http://localhost:5000/api' // 必须正确，否则接口地址错误
});

// 请求拦截器：自动添加token（双重保障）
request.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    // 即使页面中忘了传，这里也会自动添加
    config.headers.Authorization = `Bearer ${token.trim().replace(/^["']|["']$/g, '')}`;
  }
  return config;
});

// 响应拦截器：统一处理数据
request.interceptors.response.use(
  res => res.data, // 直接返回data，简化页面处理
  err => Promise.reject(err) // 交给页面处理错误
);

export default request;