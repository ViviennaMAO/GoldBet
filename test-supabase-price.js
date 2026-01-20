// test-supabase-price.js - 测试Supabase金价数据
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xdvulevrojtvhcmdaexd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkdnVsZXZyb2p0dmhjbWRhZXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MTQzNTksImV4cCI6MjA4NDI5MDM1OX0.g77x_IbCvHFRd0v2Np9AAizZHctkV0oE-hgotwzkyNA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSupabasePrice() {
  console.log('\n🧪 测试Supabase金价数据\n');
  console.log('━'.repeat(50));

  try {
    // 1. 测试连接
    console.log('📡 正在连接Supabase...');

    // 2. 查询最新金价
    const { data, error } = await supabase
      .from('gold_prices')
      .select('*')
      .order('date', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ 查询失败:', error.message);
      console.log('\n可能的原因:');
      console.log('1. RLS策略未正确配置');
      console.log('2. gold_prices表不存在');
      console.log('3. 网络连接问题');
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  数据库中没有金价数据');
      console.log('\n这就是价格未更新的原因！');
      console.log('\n解决方案:');
      console.log('1. 需要配置Service Role Key');
      console.log('2. 运行 scripts/update-gold-price.js 插入数据');
      console.log('3. 或者设置定时任务自动更新');
      return;
    }

    // 3. 显示数据
    console.log('✅ 成功获取金价数据\n');
    console.log('━'.repeat(50));

    const price = data[0];
    console.log('📅 日期:', price.date);
    console.log('💰 当前价格: $' + price.current_price);
    console.log('📊 开盘价: $' + price.open_price);
    console.log('📈 最高价: $' + price.high_price);
    console.log('📉 最低价: $' + price.low_price);
    console.log('📋 前收盘: $' + price.previous_close);
    console.log('🔄 涨跌: $' + price.change + ' (' + price.change_percent + '%)');
    console.log('📊 波动率: ' + price.volatility + '%');
    console.log('🕐 更新时间:', price.updated_at);

    console.log('\n━'.repeat(50));
    console.log('✅ Supabase数据正常！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testSupabasePrice();
