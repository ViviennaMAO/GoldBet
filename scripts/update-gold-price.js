// scripts/update-gold-price.js
// 从 GoldAPI.io 获取金价并保存到 Supabase

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// 环境变量检查
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xdvulevrojtvhcmdaexd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOLD_API_KEY = process.env.GOLD_API_KEY;

// 代理配置 (去除首尾空格)
const RAW_PROXY_URL = (process.env.PROXY_URL || process.env.HTTP_PROXY || process.env.HTTPS_PROXY || '').trim();

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
 * 解析代理配置对象
 * 将 URL 字符串转换为 Axios 需要的 proxy 对象
 */
function getProxyConfig() {
  if (!RAW_PROXY_URL) return null;

  try {
    console.log('🔍 解析代理配置...');
    const url = new URL(RAW_PROXY_URL);

    // 基础配置
    const proxyConfig = {
      protocol: url.protocol.replace(':', ''), // http or https
      host: url.hostname,
      port: parseInt(url.port)
    };

    // 认证配置
    if (url.username && url.password) {
      console.log('🔒 发现代理认证信息，正在配置...');
      // 必须对取出的 username/password 进行 decode，防止被双重编码
      // 因为 new URL() 会自动对部分字符编码，或者用户已经编码过
      // Axios 的 auth 字段需要原始字符串
      proxyConfig.auth = {
        username: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password)
      };

      // 调试日志 (隐藏敏感信息)
      const maskPass = proxyConfig.auth.password.substring(0, 3) + '***' + proxyConfig.auth.password.substring(proxyConfig.auth.password.length - 3);
      console.log(`👤 用户: ${proxyConfig.auth.username}`);
      console.log(`🔑 密码: ${maskPass} (长度: ${proxyConfig.auth.password.length})`);
    }

    console.log(`🌐 代理地址: ${proxyConfig.host}:${proxyConfig.port}`);
    return proxyConfig;

  } catch (e) {
    console.error('❌ 代理 URL 解析失败，将尝试直连:', e.message);
    return null;
  }
}

/**
 * 获取 Axios 实例
 */
function getAxiosInstance() {
  const config = {
    timeout: 20000 // 20秒超时
  };

  const proxyConfig = getProxyConfig();
  if (proxyConfig) {
    config.proxy = proxyConfig;
    console.log('✅ 已启用 Axios 原生代理模式');
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
        console.error('   🚨 代理认证依然失败 (407)');
        console.error('   建议检查: 1. 密码是否包含特殊字符 2. 流量包是否已用尽 3. IP白名单限制');
      } else if (error.response.status === 403) {
        console.error('   🚫 访问被拒绝 (403): 可能是 IP 问题或 API Key 限制');
      }
    } else {
      console.error('   错误详情:', error.code || error);
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
