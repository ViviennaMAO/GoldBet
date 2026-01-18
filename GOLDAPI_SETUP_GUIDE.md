# GoldAPI.io 集成指南

## 🎯 快速开始（5分钟完成）

### 步骤 1️⃣：注册 GoldAPI.io

1. 访问 **https://www.goldapi.io/**

2. 点击右上角 **"Sign Up"** 按钮

3. 填写注册信息：
   - Email（邮箱）
   - Password（密码）
   - 确认密码

4. 验证邮箱（检查收件箱）

5. 登录到 Dashboard

### 步骤 2️⃣：获取 API Key

1. 登录后，在 Dashboard 页面

2. 找到 **"API Key"** 部分

3. 复制你的 API Key（格式类似：`goldapi-xxxxxx-xxxxxx`）

### 步骤 3️⃣：配置环境变量

1. 进入项目后端目录：
```bash
cd server
```

2. 复制环境变量示例文件：
```bash
cp .env.example .env
```

3. 编辑 `.env` 文件：
```bash
# macOS/Linux
nano .env

# Windows
notepad .env
```

4. 找到这一行并替换为你的 API Key：
```bash
GOLD_API_KEY=your_goldapi_io_api_key_here
```

改为：
```bash
GOLD_API_KEY=goldapi-xxxxxx-xxxxxx  # 替换为你实际的API Key
```

5. 保存文件（nano: Ctrl+X, Y, Enter）

### 步骤 4️⃣：安装依赖

```bash
npm install
```

### 步骤 5️⃣：测试 API 连接

```bash
node test-goldapi.js
```

**成功的输出应该像这样：**
```
🧪 Testing GoldAPI.io Integration

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ API Key found: goldapi-...

📡 Fetching gold price from GoldAPI.io...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SUCCESS! Gold price data received:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Current Price:     $2045.50 USD/oz
📊 Open Price:        $2040.00 USD/oz
📈 High Price:        $2055.20 USD/oz
📉 Low Price:         $2038.10 USD/oz
📋 Previous Close:    $2038.20 USD/oz

🔄 Change:            $7.30 (0.36%)
🕐 Timestamp:         1/17/2026, 10:30:00 AM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ API Integration Working Perfectly!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 步骤 6️⃣：启动后端服务

```bash
npm run dev
```

**成功启动后，你会看到：**
```
✓ Connected to MongoDB
✓ Server running on port 3000
✓ Environment: development
✓ Cron jobs scheduled

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ Running price update job...
🕐 Time: 2026-01-17T10:00:00.000Z
📡 Fetching gold price from GoldAPI.io...
✅ Gold price fetched successfully: 2045.50
✨ Creating new price record for today...
✅ Gold price saved successfully
💰 Current Price: 2045.5 USD/oz
📊 Open: 2040 | High: 2055.2 | Low: 2038.1
📈 Change: 7.3 ( 0.36 %)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

🎉 **恭喜！GoldAPI.io 集成成功！**

---

## 🔍 常见问题

### Q1: 测试时显示 401 错误？

**原因**：API Key 无效或未激活

**解决方案**：
1. 检查 `.env` 文件中的 API Key 是否正确
2. 确保没有多余的空格或引号
3. 重新登录 GoldAPI.io Dashboard 获取 API Key
4. 验证邮箱（如果还没验证）

### Q2: 测试时显示 429 错误？

**原因**：超过免费版限制（1次/小时）

**解决方案**：
1. 等待1小时后再试
2. 检查是否有其他程序在调用API
3. 考虑升级到付费计划（如果需要）

### Q3: 没有安装 MongoDB？

**macOS 安装**：
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu) 安装**：
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Windows 安装**：
- 下载：https://www.mongodb.com/try/download/community
- 运行安装程序
- 启动 MongoDB 服务

### Q4: 价格不更新？

**检查**：
1. 后端服务是否在运行
2. 查看控制台是否有错误
3. 检查定时任务设置（`.env` 中的 `PRICE_UPDATE_INTERVAL`）

**手动触发更新**：
```bash
# 在MongoDB中查看数据
mongosh goldbet
db.goldprices.find().pretty()
```

### Q5: 想使用模拟数据测试？

如果暂时没有 API Key，系统会自动使用模拟数据：

1. 不设置 `GOLD_API_KEY`（留空或注释掉）
2. 启动服务，系统会生成随机价格
3. 你会看到：`🎲 Generated mock price: 2045.50`

---

## 📊 API 使用限制

### 免费计划
- ✅ **请求次数**：1次/小时
- ✅ **数据延迟**：实时数据
- ✅ **支持货币**：USD, EUR, GBP等
- ✅ **技术支持**：社区支持

### 收费计划（可选）
如果需要更多请求次数，可以升级：

| 计划 | 请求次数 | 价格 |
|------|----------|------|
| Free | 1次/小时 | $0/月 |
| Basic | 100次/天 | $10/月 |
| Pro | 1000次/天 | $50/月 |

**💡 建议**：免费计划完全够用！预测游戏不需要频繁更新价格。

---

## 🛠️ 高级配置

### 调整更新频率

编辑 `server/.env`：

```bash
# 每小时更新（推荐，免费版限制）
PRICE_UPDATE_INTERVAL=0 */1 * * *

# 每2小时更新
PRICE_UPDATE_INTERVAL=0 */2 * * *

# 每天早上9点更新
PRICE_UPDATE_INTERVAL=0 9 * * *
```

### 配置备用数据源

如果想配置 Metals.dev 作为备用：

1. 注册 Metals.dev：https://metals.dev/

2. 获取 API Key

3. 添加到 `.env`：
```bash
METALS_API_KEY=your_metals_dev_api_key
```

系统会在 GoldAPI.io 失败时自动切换到 Metals.dev

---

## 📱 测试完整流程

### 1. 测试后端 API

```bash
# 启动后端
cd server
npm run dev

# 另开一个终端，测试API
curl http://localhost:3000/api/prices/current
```

**预期响应**：
```json
{
  "success": true,
  "data": {
    "currentPrice": 2045.5,
    "previousClose": 2038.2,
    "change": 7.3,
    "changePercent": 0.36,
    "updateTime": "2026-01-17T10:30:00.000Z"
  }
}
```

### 2. 测试小程序

1. 使用 Luffa Cloud IDE 打开小程序项目
2. 修改 `app.js` 中的 `apiBaseUrl`：
```javascript
apiBaseUrl: 'http://localhost:3000/api'
```
3. 运行小程序
4. 查看首页是否显示金价

---

## 🎓 代码说明

### 价格数据流程

```
GoldAPI.io
    ↓
priceService.fetchAndSavePrice()
    ↓
MongoDB (GoldPrice collection)
    ↓
priceController.getCurrentPrice()
    ↓
小程序 API 调用
    ↓
首页显示金价
```

### 自动更新机制

```javascript
// server/src/index.js

// 每小时自动运行
cron.schedule('0 */1 * * *', async () => {
  await priceService.fetchAndSavePrice();
});
```

### 错误处理机制

```
GoldAPI.io 失败
    ↓
尝试 Metals.dev（如果配置）
    ↓
使用模拟数据（最后兜底）
```

---

## ✅ 验收检查清单

完成以下检查，确保集成成功：

- [ ] 成功注册 GoldAPI.io 账户
- [ ] 获取并配置 API Key
- [ ] `test-goldapi.js` 测试通过
- [ ] 后端服务启动成功
- [ ] 看到价格更新日志
- [ ] MongoDB 中有价格数据
- [ ] API 接口返回正确数据
- [ ] 小程序显示金价

---

## 🆘 需要帮助？

如果遇到问题：

1. **检查日志**：查看控制台输出的错误信息
2. **查看文档**：阅读 GoldAPI.io 官方文档
3. **测试 API**：运行 `node test-goldapi.js`
4. **检查配置**：确认 `.env` 文件设置正确

**常用命令**：
```bash
# 查看日志
npm run dev

# 测试API
node test-goldapi.js

# 查看数据库
mongosh goldbet
db.goldprices.find().pretty()

# 重启服务
# Ctrl+C 停止，然后
npm run dev
```

---

**🎉 祝你集成顺利！如有问题，随时查看这份指南。**
