# 🚀 GoldBet 快速开始指南

## ✅ 当前状态

- ✅ Supabase 项目已创建
- ✅ 数据库表已创建（user_profiles, gold_prices, predictions）
- ✅ RLS 策略已配置
- ✅ 小程序代码已集成 Supabase
- ✅ GoldAPI.io 集成完成

---

## 🎯 三步开始使用

### 步骤 1：插入初始金价数据

打开 **Supabase SQL Editor**（https://supabase.com/dashboard）：

```sql
INSERT INTO public.gold_prices (
  date,
  open_price,
  high_price,
  low_price,
  current_price,
  previous_close,
  change,
  change_percent,
  volatility
) VALUES (
  CURRENT_DATE,
  4616.13,
  4621.08,
  4536.74,
  4596.69,
  4616.13,
  -19.44,
  -0.42,
  1.83
) ON CONFLICT (date) DO UPDATE SET
  current_price = EXCLUDED.current_price,
  updated_at = NOW();
```

点击 **Run** 执行。

### 步骤 2：配置并运行金价更新脚本（可选）

这一步是可选的，如果你想使用实时金价数据：

1. 获取 Supabase Service Role Key：
   - 打开 https://supabase.com/dashboard
   - 选择 GoldBet 项目
   - 进入 **Settings** > **API**
   - 复制 **service_role** key（注意：不是 anon key）

2. 编辑脚本：
   ```bash
   open /Users/vivienna/Desktop/VibeCoding/GoldBet/scripts/update-gold-price.js
   ```

3. 替换第 8 行的 `YOUR_SERVICE_ROLE_KEY` 为实际的 key

4. 运行脚本：
   ```bash
   cd /Users/vivienna/Desktop/VibeCoding/GoldBet
   node scripts/update-gold-price.js
   ```

**预期输出**：
```
🚀 开始更新金价...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 正在从 GoldAPI.io 获取金价...
✅ 金价获取成功:
   💰 当前价格: $4596.69 USD/oz
   📊 开盘价: $4616.125 USD/oz
   ...
💾 正在保存到 Supabase...
✅ 保存成功！
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ 更新完成！
```

### 步骤 3：启动小程序

1. **打开 Luffa Cloud IDE**
   - 访问 https://luffa.im/
   - 点击 "创建项目" 或 "导入项目"

2. **导入项目**
   - 选择文件夹：`/Users/vivienna/Desktop/VibeCoding/GoldBet`
   - 项目类型：小程序

3. **配置 App ID**
   - 从 Luffa 开发者平台获取 App ID
   - 在 `project.config.json` 中填写：
   ```json
   {
     "appid": "你的 Luffa App ID",
     "projectname": "GoldBet"
   }
   ```

4. **运行小程序**
   - 点击 "编译" 按钮
   - 点击 "预览" 或 "真机调试"

5. **测试功能**
   - ✅ 点击 "连接钱包" 登录
   - ✅ 首页查看实时金价
   - ✅ 进入 "预测" 页面提交预测
   - ✅ 查看 "历史记录"
   - ✅ 查看 "排行榜"

---

## 🧪 测试清单

### 1. 测试认证
- [ ] 点击 "连接钱包" 按钮
- [ ] 应该自动注册并登录（首次）
- [ ] 查看 Console 应该显示：`✅ 登录成功`
- [ ] 刷新页面，应该保持登录状态

### 2. 测试金价显示
- [ ] 首页应该显示当前金价
- [ ] 显示涨跌幅（红色下跌，绿色上涨）
- [ ] 显示更新时间

### 3. 测试预测功能
- [ ] 点击 "预测" 标签页
- [ ] 选择涨跌方向（上涨/下跌）
- [ ] 选择波动幅度（小/中/大）
- [ ] 点击 "提交预测"
- [ ] 应该提示：`预测提交成功`
- [ ] 再次提交应该提示：`今日已预测`

### 4. 测试历史记录
- [ ] 点击 "历史" 标签页
- [ ] 应该显示个人统计（总数、正确数、准确率、积分）
- [ ] 应该显示预测列表
- [ ] 显示每条预测的状态（待结算/已结算）

### 5. 测试排行榜
- [ ] 点击 "排行榜" 标签页
- [ ] 切换不同榜单（积分榜/准确率榜/连胜榜）
- [ ] 应该显示 Top 50 用户

---

## 🔍 在 Supabase Dashboard 验证数据

### 查看用户数据

打开 **Table Editor** > **user_profiles**：

| wallet_address | total_predictions | correct_predictions | points | accuracy |
|----------------|-------------------|---------------------|--------|----------|
| 0x742d35... | 1 | 0 | 0 | 0.00 |

### 查看金价数据

打开 **Table Editor** > **gold_prices**：

| date | current_price | change | change_percent | volatility |
|------|---------------|--------|----------------|------------|
| 2026-01-18 | 4596.69 | -19.44 | -0.42 | 1.83 |

### 查看预测数据

打开 **Table Editor** > **predictions**：

| wallet_address | date | price_direction | volatility | status |
|----------------|------|-----------------|------------|--------|
| 0x742d35... | 2026-01-18 | up | small | pending |

---

## ⚙️ 可选配置

### 1. 设置定时更新金价

使用 Supabase Edge Functions（推荐）：

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 创建 Edge Function
supabase functions new update-gold-price

# 部署
supabase functions deploy update-gold-price
```

或者使用外部 Cron 服务：
- **EasyCron**: https://www.easycron.com/
- **Cron-job.org**: https://cron-job.org/

配置每小时调用一次 `scripts/update-gold-price.js`

### 2. 配置预测结算

创建类似的脚本 `scripts/settle-predictions.js`，每天市场收盘后运行：

```javascript
// 伪代码
1. 获取当天收盘价
2. 查询所有 status='pending' 且 date=今天 的预测
3. 判断预测是否正确
4. 更新 predictions 表（设置结果、积分）
5. 更新 user_profiles 表（累加统计数据）
```

---

## 📊 数据流程图

```
用户操作                    Supabase 数据库
  |                              |
  |-- 连接钱包 ---------------> auth.users (自动注册)
  |                              user_profiles (创建档案)
  |
  |-- 查看金价 ---------------> gold_prices (读取最新)
  |
  |-- 提交预测 ---------------> predictions (插入记录)
  |                              检查 UNIQUE(user_id, date)
  |
  |-- 查看历史 ---------------> predictions (user_id 过滤)
  |                              user_profiles (统计数据)
  |
  |-- 查看排行榜 -------------> user_profiles (排序 TOP 50)
```

---

## 🐛 常见问题

### Q1: 小程序提示 "登录失败"
**A**: 检查 `utils/supabase.js` 中的 URL 和 Anon Key 是否正确。

### Q2: 无法读取金价数据
**A**: 确保已在 Supabase SQL Editor 中插入了初始数据（步骤 1）。

### Q3: 提交预测失败 "今日已预测"
**A**: 数据库约束每天只能预测一次，这是正常的。删除记录后可重新测试：
```sql
DELETE FROM predictions WHERE user_id = '你的 user_id';
```

### Q4: 排行榜为空
**A**: 需要至少有一个用户提交预测后才会显示。

---

## 📁 项目文件结构

```
GoldBet/
├── miniprogram/              # 小程序代码
│   ├── app.js               # ✅ 已集成 Supabase 认证
│   ├── pages/               # 4 个页面
│   └── utils/
│       ├── api.js           # ✅ 完全重写为 Supabase SDK
│       └── supabase.js      # ✅ Supabase 配置
├── scripts/
│   └── update-gold-price.js # 金价更新脚本
├── supabase-schema.sql      # ✅ 数据库架构（已执行）
├── SUPABASE_INTEGRATION_COMPLETE.md  # 集成完成文档
├── QUICK_START.md           # 本文档
└── README.md                # 项目说明
```

---

## 🎯 成功标志

当你完成所有测试后，应该看到：

1. ✅ 小程序可以正常登录（钱包地址显示在右上角）
2. ✅ 首页显示实时金价和涨跌幅
3. ✅ 可以成功提交预测（每天一次）
4. ✅ 历史记录显示预测列表
5. ✅ 排行榜显示用户排名
6. ✅ Supabase Dashboard 中可以看到数据

---

## 📚 详细文档

如需更多技术细节，请参考：

- **Supabase 集成完成文档**: `SUPABASE_INTEGRATION_COMPLETE.md`
- **Supabase 迁移指南**: `SUPABASE_MIGRATION_GUIDE.md`
- **数据库架构**: `supabase-schema.sql`
- **产品需求文档**: `PRD_GoldBet.md`

---

## 🎉 开始使用

现在就开始测试吧！按照上面的三个步骤：

1. ✅ 插入金价数据（SQL）
2. ✅ 运行更新脚本（可选）
3. ✅ 启动小程序（Luffa IDE）

**祝你测试顺利！🚀**

---

**项目状态**: ✅ 就绪
**数据库**: Supabase PostgreSQL
**认证**: 钱包地址自动注册
**金价数据源**: GoldAPI.io
**小程序平台**: Luffa SuperBox
