// 测试 Supabase API Key
const https = require('https');

const SUPABASE_URL = 'https://xdvulevrojtvhcmdaexd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkdnVsZXZyb2p0dmhjbWRhZXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxNzQ3NDMsImV4cCI6MjA1Mjc1MDc0M30.sb_publishable_x_UqpqqQDRi_-FXdqtVShg_WkIFGHZp';

console.log('🧪 测试 Supabase API Key...\n');
console.log('📍 URL:', SUPABASE_URL);
console.log('🔑 Key (前50字符):', SUPABASE_ANON_KEY.substring(0, 50) + '...');
console.log('📏 Key 长度:', SUPABASE_ANON_KEY.length);
console.log('🔍 Key 分段数:', SUPABASE_ANON_KEY.split('.').length);
console.log('\n分段详情:');
SUPABASE_ANON_KEY.split('.').forEach((part, i) => {
  console.log(`  ${i + 1}. ${part.substring(0, 30)}... (${part.length} 字符)`);
});

console.log('\n📡 发送测试请求...\n');

const options = {
  hostname: 'xdvulevrojtvhcmdaexd.supabase.co',
  path: '/rest/v1/gold_prices?order=date.desc&limit=1',
  method: 'GET',
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  console.log(`✅ 状态码: ${res.statusCode}`);
  console.log('📋 响应头:', JSON.stringify(res.headers, null, 2));

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n📦 响应数据:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ 请求失败:', e.message);
});

req.end();
