// scripts/update-gold-price.js
// 从 GoldAPI.io 获取金价并保存到 Supabase

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const https = require('https');

// 环境变量检查
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xdvulevrojtvhcmdaexd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOLD_API_KEY = process.env.GOLD_API_KEY;

// 代理配置 (支持 HTTP/HTTPS 代理)
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
 * 解析并编码代理 URL
 * 解决密码中包含特殊字符导致的 407 错误
 */
function getSafeProxyAgent(proxyUrlStr) {
  try {
    // 1. 尝试直接解析
    const url = new URL(proxyUrlStr);

    // 如果有用户名密码，需要重新构建
    if (url.username && url.password) {
      // 注意：decodeURIComponent 是为了防止已经被编码过的字符被二次编码
      // 但这里我们假设输入的是原始字符串，或者已经是部分编码的
      // 最稳妥的方式是：手动提取，然后重新正确编码

      // 使用正则从原始字符串中提取，因为 new URL() 可能已经把某些字符搞乱了
      // 格式通常是: protocol://user:pass@host:port
      const match = proxyUrlStr.match(/^(https?:\/\/)([^:]+):([^@]+)@(.+)$/);

      if (match) {
        console.log('🔒 检测到认证信息，正在重组安全 URL...');
        const protocol = match[1];
        const user = match[2];
        const pass = match[3];
        const hostPath = match[4];

        // 对用户名和密码进行编码
        const encodedUser = encodeURIComponent(decodeURIComponent(user));
        const encodedPass = encodeURIComponent(decodeURIComponent(pass));

        const safeUrl = `${protocol}${encodedUser}:${encodedPass}@${hostPath}`;
        return new HttpsProxyAgent(safeUrl);
      }
    }

    return new HttpsProxyAgent(proxyUrlStr);

  } catch (e) {
    console.error('⚠️ 代理 URL 解析异常:', e.message);
    return new HttpsProxyAgent(proxyUrlStr);
  }
}

/**
 * 获取 Axios 实例（根据是否配置代理）
 */
function getAxiosInstance() {
  const config = {
    timeout: 20000 // 增加到 20s
  };

  if (PROXY_URL) {
    console.log(`🌐 检测到代理配置，正在初始化...`);
    try {
      const agent = getSafeProxyAgent(PROXY_URL);

      config.httpsAgent = agent;
      config.proxy = false; // 禁用默认 proxy

      console.log('✅ 代理 Agent 已配置');
    } catch (e) {
      console.error('❌ 代理配置失败:', e.message);
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

      if (error.response.status === 407) {
        console.error('   🚨 代理认证失败 (407)！已尝试自动编码.');
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
