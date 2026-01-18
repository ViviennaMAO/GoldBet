// test-goldapi.js - 测试 GoldAPI.io 集成
require('dotenv').config();
const axios = require('axios');

console.log('\n🧪 Testing GoldAPI.io Integration\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function testGoldAPI() {
  try {
    const apiKey = process.env.GOLD_API_KEY;

    if (!apiKey) {
      console.error('❌ Error: GOLD_API_KEY not found in environment variables');
      console.log('\n📝 Steps to fix:');
      console.log('1. Copy .env.example to .env');
      console.log('   cp .env.example .env');
      console.log('\n2. Register at https://www.goldapi.io/');
      console.log('\n3. Get your API key from the dashboard');
      console.log('\n4. Add it to your .env file:');
      console.log('   GOLD_API_KEY=your_api_key_here');
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return;
    }

    console.log('✅ API Key found:', apiKey.substring(0, 8) + '...');
    console.log('\n📡 Fetching gold price from GoldAPI.io...\n');

    const url = 'https://www.goldapi.io/api/XAU/USD';

    const response = await axios.get(url, {
      headers: {
        'x-access-token': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const data = response.data;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUCCESS! Gold price data received:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('💰 Current Price:     $' + data.price + ' USD/oz');
    console.log('📊 Open Price:        $' + data.open_price + ' USD/oz');
    console.log('📈 High Price:        $' + data.high_price + ' USD/oz');
    console.log('📉 Low Price:         $' + data.low_price + ' USD/oz');
    console.log('📋 Previous Close:    $' + data.prev_close_price + ' USD/oz');
    console.log('');
    console.log('🔄 Change:            $' + data.ch + ' (' + data.chp + '%)');
    console.log('🕐 Timestamp:         ' + new Date(data.timestamp * 1000).toLocaleString());
    console.log('');
    console.log('📍 Metal:             ' + data.metal);
    console.log('💱 Currency:          ' + data.currency);
    console.log('🏦 Exchange:          ' + data.exchange);
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ API Integration Working Perfectly!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📝 Next Steps:');
    console.log('1. Start your backend server: npm run dev');
    console.log('2. The price will update automatically every hour');
    console.log('3. Check the logs to see price updates');
    console.log('\n✨ You\'re all set!\n');

  } catch (error) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ API Test Failed');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (error.response) {
      console.error('Status Code:', error.response.status);
      console.error('Error Message:', error.response.data);
      console.log('');

      if (error.response.status === 401) {
        console.log('⚠️  Authentication Failed');
        console.log('');
        console.log('Possible reasons:');
        console.log('1. Invalid API key');
        console.log('2. API key not activated yet');
        console.log('3. Account not verified');
        console.log('');
        console.log('💡 Solution:');
        console.log('1. Check your API key in .env file');
        console.log('2. Login to https://www.goldapi.io/dashboard');
        console.log('3. Verify your account if needed');
        console.log('4. Copy the correct API key');
        console.log('');
      } else if (error.response.status === 429) {
        console.log('⚠️  Rate Limit Exceeded');
        console.log('');
        console.log('Free plan limit: 1 request per hour');
        console.log('');
        console.log('💡 Solution:');
        console.log('1. Wait for 1 hour before trying again');
        console.log('2. Or upgrade to a paid plan for more requests');
        console.log('');
      } else {
        console.log('⚠️  Unexpected Error');
        console.log('');
        console.log('💡 Solution:');
        console.log('1. Check your internet connection');
        console.log('2. Try again in a few minutes');
        console.log('3. Contact GoldAPI.io support if problem persists');
        console.log('');
      }
    } else if (error.request) {
      console.error('❌ No response received from server');
      console.log('');
      console.log('💡 Solution:');
      console.log('1. Check your internet connection');
      console.log('2. Check if GoldAPI.io is accessible');
      console.log('3. Try again in a few minutes');
      console.log('');
    } else {
      console.error('Error:', error.message);
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}

// 运行测试
testGoldAPI();
