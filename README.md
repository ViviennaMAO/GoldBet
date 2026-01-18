# GoldBet - 黄金价格预测小游戏

基于 Luffa SuperBox 平台的轻量级黄金价格预测小游戏，用户可以预测黄金价格的涨跌趋势和波动幅度。

## 📋 项目概述

### 核心功能
- 🔗 **Luffa钱包登录** - 基于Web3钱包的去中心化身份验证
- 📊 **黄金价格展示** - 实时/准实时金价数据
- 📈 **涨跌预测** - 预测明天收盘价相对今天的涨跌
- 📉 **波动幅度预测** - 预测小幅/中度/大幅波动
- 📜 **预测记录** - 查看历史预测和准确率统计
- 🏆 **排行榜** - 积分、准确率、连胜榜

### 技术栈

**前端（小程序）**
- Luffa SuperBox 小程序框架
- WXML + WXSS + JavaScript
- 模块化组件设计

**后端**
- Node.js + Express
- MongoDB (Mongoose)
- JWT认证
- Cron定时任务

**第三方服务**
- 黄金价格数据API（Alpha Vantage / Metals-API）
- Luffa Wallet SDK

## 🚀 快速开始

### 前置要求

- Node.js >= 14.0.0
- MongoDB >= 4.4
- Luffa Cloud IDE（用于小程序开发）
- Luffa App ID（从Luffa开发者平台获取）

### 安装步骤

#### 1. 克隆项目

```bash
git clone <repository-url>
cd GoldBet
```

#### 2. 后端设置

```bash
cd server

# 安装依赖
npm install

# 复制环境变量配置文件
cp .env.example .env

# 编辑 .env 文件，填入必要的配置
# - MONGODB_URI: MongoDB连接字符串
# - JWT_SECRET: JWT密钥
# - GOLD_API_KEY: 黄金价格API密钥
# - LUFFA_APP_ID: Luffa应用ID
# - LUFFA_APP_SECRET: Luffa应用密钥

# 启动开发服务器
npm run dev
```

后端服务将运行在 `http://localhost:3000`

#### 3. 小程序设置

```bash
# 回到项目根目录
cd ..

# 使用Luffa Cloud IDE打开项目
# 1. 打开Luffa Cloud IDE
# 2. 选择 "导入项目"
# 3. 选择 GoldBet 目录
# 4. 填入你的 Luffa App ID
```

**修改API地址**

编辑 `app.js`，将 `apiBaseUrl` 改为你的后端地址：

```javascript
globalData: {
  apiBaseUrl: 'http://localhost:3000/api' // 开发环境
  // apiBaseUrl: 'https://api.goldbet.com/api' // 生产环境
}
```

## 📁 项目结构

```
GoldBet/
├── app.js                  # 小程序入口
├── app.json               # 全局配置
├── app.wxss               # 全局样式
├── pages/                 # 页面目录
│   ├── index/            # 首页
│   ├── predict/          # 预测页
│   ├── history/          # 历史记录页
│   └── leaderboard/      # 排行榜页
├── utils/                # 工具函数
│   ├── api.js           # API封装
│   └── util.js          # 通用工具
├── server/              # 后端服务
│   ├── src/
│   │   ├── controllers/ # 控制器
│   │   ├── models/      # 数据模型
│   │   ├── routes/      # 路由
│   │   ├── services/    # 业务逻辑
│   │   ├── middleware/  # 中间件
│   │   └── index.js     # 服务入口
│   ├── package.json
│   └── .env.example
├── PRD_GoldBet.md       # 产品需求文档
└── README.md            # 本文件
```

## 🔧 配置说明

### 环境变量 (server/.env)

```bash
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库
MONGODB_URI=mongodb://localhost:27017/goldbet

# JWT密钥（生产环境请务必修改）
JWT_SECRET=your_jwt_secret_key_change_this_in_production

# 黄金价格API
GOLD_API_KEY=your_alpha_vantage_api_key
GOLD_API_URL=https://www.alphavantage.co/query

# Luffa钱包配置（待Luffa提供文档后填写）
LUFFA_APP_ID=your_luffa_app_id
LUFFA_APP_SECRET=your_luffa_app_secret

# 交易时间设置（UTC时间）
MARKET_CLOSE_HOUR=20
MARKET_CLOSE_MINUTE=0

# 定时任务
PRICE_UPDATE_INTERVAL=*/15 * * * *    # 每15分钟更新价格
SETTLEMENT_CHECK_INTERVAL=0 * * * *   # 每小时检查结算
```

### 黄金价格数据源

项目支持多种黄金价格数据API，推荐以下服务：

**1. Alpha Vantage**（推荐）
- 官网：https://www.alphavantage.co/
- 免费额度：500次/天
- 注册后获取API Key

**2. Metals-API**
- 官网：https://metals-api.com/
- 免费额度：100次/月
- 需要注册账户

**配置步骤**：
1. 注册并获取API Key
2. 在 `.env` 文件中设置 `GOLD_API_KEY`
3. 修改 `server/src/services/priceService.js` 中的API调用逻辑

## 🎯 API文档

### 认证接口

#### POST /api/auth/wallet-login
Luffa钱包登录

**请求**
```json
{
  "code": "luffa_auth_code",
  "walletType": "luffa"
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "walletAddress": "0x...",
    "userId": "user_id"
  }
}
```

#### POST /api/auth/verify
验证Token（需要认证）

### 价格接口

#### GET /api/prices/current
获取当前金价

**响应**
```json
{
  "success": true,
  "data": {
    "currentPrice": 2045.50,
    "previousClose": 2038.20,
    "change": 7.30,
    "changePercent": 0.36,
    "updateTime": "2026-01-17T10:30:00Z"
  }
}
```

#### GET /api/prices/today
获取今日价格数据

#### GET /api/prices/history?days=7
获取历史价格数据

### 预测接口

#### POST /api/predictions/submit
提交预测（需要认证）

**请求**
```json
{
  "direction": "up",
  "volatility": "medium",
  "basePrice": 2045.50
}
```

#### GET /api/predictions/my
获取我的预测记录（需要认证）

#### GET /api/predictions/today
检查今日是否已预测（需要认证）

### 用户接口

#### GET /api/users/stats
获取用户统计数据（需要认证）

### 排行榜接口

#### GET /api/leaderboard/points
获取积分排行榜

#### GET /api/leaderboard/accuracy
获取准确率排行榜

#### GET /api/leaderboard/streak
获取连胜排行榜

完整API文档请参考 [PRD_GoldBet.md](./PRD_GoldBet.md)

## 🔐 Luffa钱包集成

### ⚠️ 重要提示

**当前钱包登录使用的是通用Web3钱包方案的临时实现。**

由于Luffa SuperBox的官方钱包登录API文档尚未获取，项目预留了Luffa钱包接口，待官方文档发布后可快速对接。

### 集成步骤（待Luffa文档发布）

1. **获取Luffa开发者文档**
   - 访问 Luffa开发者中心
   - 申请App ID和App Secret
   - 查阅钱包登录API文档

2. **替换登录逻辑**
   - 修改 `app.js` 中的 `loginWithLuffaWallet` 方法
   - 修改 `server/src/controllers/authController.js` 中的验证逻辑

3. **测试钱包连接**
   - 使用Luffa Wallet进行登录测试
   - 验证钱包地址获取是否正确

### 临时方案说明

当前实现：
- 使用微信小程序的 `wx.login()` 作为临时登录方案
- 生成模拟的钱包地址用于开发测试
- 保留了Luffa钱包的接口设计

## 📊 数据库Schema

### User（用户）
```javascript
{
  walletAddress: String,      // 钱包地址（唯一）
  username: String,           // 用户名（可选）
  totalPredictions: Number,   // 总预测次数
  correctPredictions: Number, // 正确次数
  accuracy: Number,           // 准确率
  points: Number,             // 积分
  consecutiveWins: Number     // 连胜次数
}
```

### Prediction（预测记录）
```javascript
{
  userId: ObjectId,           // 用户ID
  date: Date,                 // 预测日期
  priceDirection: String,     // 涨跌预测 (up/down)
  volatility: String,         // 波动预测 (small/medium/large)
  basePrice: Number,          // 基准价格
  resultPrice: Number,        // 实际价格
  resultVolatility: Number,   // 实际波动
  directionCorrect: Boolean,  // 涨跌是否正确
  volatilityCorrect: Boolean, // 波动是否正确
  pointsEarned: Number,       // 获得积分
  status: String              // 状态 (pending/settled)
}
```

### GoldPrice（黄金价格）
```javascript
{
  date: Date,          // 日期
  openPrice: Number,   // 开盘价
  highPrice: Number,   // 最高价
  lowPrice: Number,    // 最低价
  closePrice: Number,  // 收盘价
  currentPrice: Number,// 当前价
  previousClose: Number,// 昨日收盘
  volatility: Number   // 波动幅度
}
```

## 🎮 游戏规则

### 预测规则
1. 每天只能提交一次预测
2. 预测截止时间：当日收盘前（默认北京时间凌晨4点）
3. 次日收盘后自动结算预测结果

### 涨跌判定
- **看涨**：明天收盘价 > 今天收盘价
- **看跌**：明天收盘价 < 今天收盘价

### 波动幅度计算
```
波动幅度 = |当日最高价 - 当日最低价| / 当日开盘价 × 100%

- 小幅波动：< 0.5%
- 中度波动：0.5% - 2%
- 大幅波动：> 2%
```

### 积分系统
- 涨跌预测正确：+10分
- 波动预测正确：+5分
- 连续3天预测正确：额外+20分
- 连续7天预测正确：额外+100分

## 🚀 部署指南

### 后端部署（推荐使用云服务器）

**1. 准备服务器**
- Ubuntu 20.04+ / CentOS 7+
- Node.js 14+
- MongoDB 4.4+
- Nginx（可选，用于反向代理）

**2. 部署步骤**

```bash
# 1. 克隆代码
git clone <repository-url>
cd GoldBet/server

# 2. 安装依赖
npm install --production

# 3. 配置环境变量
cp .env.example .env
vim .env  # 修改配置

# 4. 使用PM2启动服务
npm install -g pm2
pm2 start src/index.js --name goldbet-api
pm2 save
pm2 startup

# 5. 配置Nginx反向代理（可选）
# /etc/nginx/sites-available/goldbet
server {
    listen 80;
    server_name api.goldbet.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 小程序发布

1. **使用Luffa Cloud IDE打开项目**
2. **修改生产环境API地址**（app.js中的apiBaseUrl）
3. **点击"上传"按钮**
4. **填写版本号和更新说明**
5. **提交审核**
6. **审核通过后发布**

## 🧪 开发调试

### 后端调试

```bash
cd server
npm run dev  # 使用nodemon自动重启
```

### 小程序调试

- 使用Luffa Cloud IDE的调试器
- 查看Console输出
- 使用Network面板查看API请求

### 常见问题

**Q: MongoDB连接失败**
A: 检查MongoDB服务是否启动，确认连接字符串是否正确

**Q: 钱包登录失败**
A: 当前使用临时方案，需要等待Luffa官方API文档

**Q: 价格数据获取失败**
A: 检查API Key是否配置正确，是否超过免费额度

## 📝 待办事项

- [ ] 集成真实的Luffa钱包登录API
- [ ] 接入真实的黄金价格数据API
- [ ] 添加单元测试
- [ ] 添加数据可视化图表
- [ ] 实现分享功能
- [ ] 添加成就徽章系统
- [ ] 优化移动端UI/UX
- [ ] 添加多语言支持

## 📄 许可证

MIT License

## 👥 贡献指南

欢迎提交Issue和Pull Request！

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- Issue：在GitHub仓库提交Issue
- Email：[your-email@example.com]

## 🙏 致谢

- Luffa SuperBox 团队
- 黄金价格数据提供商
- 所有贡献者

---

**⚠️ 免责声明**：本应用仅供娱乐和学习使用，不构成任何投资建议。黄金价格预测存在不确定性，请勿将预测结果作为实际投资决策依据。
