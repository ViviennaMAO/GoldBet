// scripts/update-gold-price.js
// 从 GoldAPI.io 获取金价并保存到 Supabase

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Supabase 配置
// 注意：这里需要使用 Service Role Key，从 Supabase Dashboard > Settings > API 获取
const SUPABASE_URL = 'https://xdvulevrojtvhcmdaexd.supabase.co';
// 优先使用环境变量，本地开发时可以直接写在这里
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkdnVsZXZyb2p0dmhjbWRhZXhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODcxNDM1OSwiZXhwIjoyMDg0MjkwMzU5fQ.2lca1CIbGfuV6CVIQuAgLcPQzZFpJJ25_ES27RK6nHA';

// GoldAPI.io 配置
const GOLD_API_KEY = 'goldapi-3ykfysmkjea0q6-io';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * 从 GoldAPI.io 获取最新金价
 */
async function fetchGoldPrice() {
  try {
    console.log('📡 正在从 GoldAPI.io 获取金价...');

    const response = await axios.get('https://www.goldapi.io/api/XAU/USD', {
      headers: {
        'x-access-token': GOLD_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const data = response.data;

    console.log('✅ 金价获取成功:');
    console.log(`   💰 当前价格: $${data.price} USD/oz`);
    console.log(`   📊 开盘价: $${data.open_price} USD/oz`);
    console.log(`   📈 最高价: $${data.high_price} USD/oz`);
    console.log(`   📉 最低价: $${data.low_price} USD/oz`);
    console.log(`   📋 前收盘: $${data.prev_close_price} USD/oz`);
    console.log(`   🔄 涨跌: ${data.ch > 0 ? '+' : ''}${data.ch} (${data.chp > 0 ? '+' : ''}${data.chp}%)`);

    return {
      currentPrice: parseFloat(data.price),
      openPrice: parseFloat(data.open_price),
      highPrice: parseFloat(data.high_price),
      lowPrice: parseFloat(data.low_price),
      previousClose: parseFloat(data.prev_close_price),
      change: parseFloat(data.ch),
      changePercent: parseFloat(data.chp)
    };
  } catch (error) {
    console.error('❌ 获取金价失败:', error.message);

    if (error.response) {
      console.error('   状态码:', error.response.status);
      console.error('   响应:', error.response.data);

      if (error.response.status === 429) {
        console.error('   提示: GoldAPI.io 免费版限制为 1次/小时，请稍后再试');
      }
    }

    throw error;
  }
}

/**
 * 计算波动率
 */
function calculateVolatility(highPrice, lowPrice, openPrice) {
  const volatility = ((highPrice - lowPrice) / openPrice) * 100;
  return parseFloat(volatility.toFixed(2));
}

/**
 * 保存金价到 Supabase
 */
async function saveToSupabase(priceData) {
  try {
    console.log('\n💾 正在保存到 Supabase...');

    const today = new Date().toISOString().split('T')[0];
    const volatility = calculateVolatility(
      priceData.highPrice,
      priceData.lowPrice,
      priceData.openPrice
    );

    const { data, error } = await supabase
      .from('gold_prices')
      .upsert({
        date: today,
        open_price: priceData.openPrice,
        high_price: priceData.highPrice,
        low_price: priceData.lowPrice,
        current_price: priceData.currentPrice,
        previous_close: priceData.previousClose,
        change: priceData.change,
        change_percent: priceData.changePercent,
        volatility: volatility,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'date'
      });

    if (error) throw error;

    console.log('✅ 保存成功！');
    console.log(`   📅 日期: ${today}`);
    console.log(`   💰 当前价格: $${priceData.currentPrice}`);
    console.log(`   📊 波动率: ${volatility}%`);

    return data;
  } catch (error) {
    console.error('❌ 保存失败:', error.message);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始更新金价...\n');
  console.log('━'.repeat(50));

  try {
    // 1. 检查 Service Role Key 是否配置
    if (SUPABASE_SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY') {
      console.error('❌ 错误：请先配置 SUPABASE_SERVICE_ROLE_KEY');
      console.error('   获取方式：');
      console.error('   1. 登录 https://supabase.com/dashboard');
      console.error('   2. 选择 GoldBet 项目');
      console.error('   3. 进入 Settings > API');
      console.error('   4. 复制 service_role key');
      console.error('   5. 替换本文件第 8 行的 YOUR_SERVICE_ROLE_KEY');
      process.exit(1);
    }

    // 2. 获取金价
    const priceData = await fetchGoldPrice();

    // 3. 保存到 Supabase
    await saveToSupabase(priceData);

    console.log('━'.repeat(50));
    console.log('✨ 更新完成！\n');
  } catch (error) {
    console.log('━'.repeat(50));
    console.error('❌ 更新失败:', error.message);
    process.exit(1);
  }
}

// 运行主函数
main();
