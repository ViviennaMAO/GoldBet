// utils/supabase.js - Supabase 客户端配置（小程序版本）
const { createClient } = require('@supabase/supabase-js');

// Supabase 项目配置
const SUPABASE_URL = 'https://xdvulevrojtvhcmdaexd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkdnVsZXZyb2p0dmhjbWRhZXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MTQzNTksImV4cCI6MjA4NDI5MDM1OX0.g77x_IbCvHFRd0v2Np9AAizZHctkV0oE-hgotwzkyNA';

// 创建 Supabase 客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // 小程序环境配置
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// 辅助函数：获取当前用户
async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('获取用户失败:', error);
    return null;
  }
  return user;
}

// 辅助函数：检查是否登录
async function isLoggedIn() {
  const user = await getCurrentUser();
  return !!user;
}

// 辅助函数：退出登录
async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('退出登录失败:', error);
    return false;
  }
  return true;
}

module.exports = {
  supabase,
  getCurrentUser,
  isLoggedIn,
  signOut
};
