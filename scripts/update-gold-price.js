// scripts/update-gold-price.js
// 从 GoldAPI.io 获取金价并保存到 Supabase

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const https = require('https');

// 环境变量检查
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xdvulevrojtvhcmdaexd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOLD_API_KEY = process.env.GOLD_API_KEY;

// 代理配置
const PROXY_URL = process.env.PROXY_URL || process.env.HTTP_PROXY || process.env.HTTPS_PROXY;

// 验证必要配置
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 错误：未配置 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!GOLD_API_KEY) {
  console.error('❌ 错误：未配置 GOLD_API_KEY');
  process.exit(1);
}

// 初始化 Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * 获取 Axios 实例（根据是否配置代理）
 */
function getAxiosInstance() {
  const config = {
    timeout: 10000
  };

  if (PROXY_URL) {
    console.log(`🌐 检测到代理配置: ${PROXY_URL}`);
    try {
      const proxyUrl = new URL(PROXY_URL);
      config.proxy = {
        protocol: proxyUrl.protocol.replace(':', ''),
        host: proxyUrl.hostname,
        port: proxyUrl.port,
        auth: proxyUrl.username ? {
          username: proxyUrl.username,
          password: proxyUrl.password
        } : undefined
      };

      // 如果使用 HTTPS 代理，可能还需要 httpsAgent
      if (proxyUrl.protocol === 'https:') {
        config.httpsAgent = new https.Agent({
          rejectUnauthorized: false // 视情况而定，有些代理可能证书不被信任
        });
      }

    } catch (e) {
      console.error('❌ 代理 URL 解析失败:', e.message);
      // 继续尝试直连
    }
  } else {
    console.log('DIRECT 连接（无代理）');
  }

  return axios.create(config);
}

/**
 * 从 GoldAPI.io 获取最新金价
 */
async function fetchGoldPrice() {
  try {
    console.log('📡 正在从 GoldAPI.io 获取金价...');

    const client = getAxiosInstance();

    const response = await client.get('https://www.goldapi.io/api/XAU/USD', {
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
    } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      console.error('   网络错误：可能是 IP 被屏蔽，请尝试使用代理');
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
    // 1. 获取金价
    const priceData = await fetchGoldPrice();

    // 2. 保存到 Supabase
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

