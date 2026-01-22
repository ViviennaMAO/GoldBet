// test-price-update.js - 测试价格更新服务
require('dotenv').config();
const mongoose = require('mongoose');
const priceService = require('./src/services/priceService');

console.log('\n🧪 Testing Price Update Service\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function testPriceUpdate() {
  try {
    // 连接数据库
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // 执行价格更新
    console.log('🔄 Fetching and saving gold price...\n');
    const result = await priceService.fetchAndSavePrice();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Price Update Test Completed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📊 Saved Price Data:');
    console.log('   Date:', result.date);
    console.log('   Current Price: $' + result.currentPrice);
    console.log('   Open Price: $' + result.openPrice);
    console.log('   High Price: $' + result.highPrice);
    console.log('   Low Price: $' + result.lowPrice);
    console.log('   Change: $' + result.change + ' (' + result.changePercent.toFixed(2) + '%)');
    console.log('');

    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// 运行测试
testPriceUpdate();
