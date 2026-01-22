# 黄金价格API诊断报告 (Supabase版本)

## 诊断时间
2026-01-19

## 问题描述
部署后黄金价格没有实时更新。

## 架构说明
项目已从 **MongoDB + Node.js** 迁移到 **Supabase**：
- 前端：微信小程序
- 后端：Supabase (PostgreSQL + Auth)
- 价格更新：需要手动或定时运行 `scripts/update-gold-price.js`

---

## 诊断结果

### ✅ 正常的部分

1. **GoldAPI.io 连接正常**
   - API Key 有效: `goldapi-3ykfysmkjea0q6-io`
   - 测试连接成功，可以正常获取实时数据
   - **当前金价**: $4676.14 USD/oz (2026-01-19)
   - 测试命令: `node server/test-goldapi.js`

2. **Supabase 连接正常**
   - 项目 URL: `https://xdvulevrojtvhcmdaexd.supabase.co`
   - Anon Key 有效
   - 数据库表结构正确
   - RLS 策略配置正确
   - 测试命令: `node test-supabase-price.js`

3. **代码逻辑正确**
   - `utils/api.js` - Supabase SDK集成完成
   - `scripts/update-gold-price.js` - 价格更新脚本存在
   - 小程序前端已适配Supabase

### ❌ 发现的问题

#### 问题1: 数据库中的金价数据过期 🔴 (核心问题)

**检测结果**:
```
数据库中的金价日期: 2026-01-18
今天的日期:         2026-01-19
数据延迟:           1天
```

**具体数据**:
- 📅 日期: **2026-01-18** (昨天)
- 💰 当前价格: $4596.69
- 🕐 更新时间: 2026-01-18T07:30:36
- ⚠️ **问题**: 今天 (2026-01-19) 的数据尚未插入

**对比实时API数据**:
- GoldAPI.io 实时价格: $4676.14 (2026-01-19)
- 数据库中的价格: $4596.69 (2026-01-18)
- **价差**: $79.45 (1.73%)

**影响**:
- 用户看到的是昨天的价格
- 今天的预测无法提交（基于昨天的价格）
- 用户体验差，显示数据不是"实时"的

---

#### 问题2: 价格更新脚本未配置 Service Role Key ⚠️

**位置**: `scripts/update-gold-price.js:10`

```javascript
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // ❌ 未配置
```

**问题说明**:
- Service Role Key 仍是占位符
- 脚本无法写入 `gold_prices` 表（RLS策略要求 service_role）
- 即使运行脚本也会失败

**获取 Service Role Key 的步骤**:
1. 登录 https://supabase.com/dashboard
2. 选择 GoldBet 项目
3. 进入 **Settings > API**
4. 复制 **service_role** key (注意不是 anon key)
5. 替换脚本中的 `YOUR_SERVICE_ROLE_KEY`

---

#### 问题3: 缺少自动化定时任务 ⚠️

**当前状态**:
- ❌ 没有配置定时任务
- ❌ 需要手动运行 `node scripts/update-gold-price.js`
- ❌ 部署后无自动更新机制

**建议的自动化方案**:

**选项1: Supabase Edge Functions (推荐)**
- 创建 Edge Function
- 配置 Cron trigger (每小时)
- 自动调用 GoldAPI.io 并更新数据库
- 零服务器维护

**选项2: 外部 Cron 服务**
- EasyCron: https://www.easycron.com/
- Cron-job.org: https://cron-job.org/
- GitHub Actions (免费)

**选项3: 服务器定时任务 (需要自己的服务器)**
```bash
# Linux crontab
0 * * * * cd /path/to/GoldBet && node scripts/update-gold-price.js
```

---

## 问题根因分析

黄金价格未实时更新的**根本原因**是：

1. **价格更新脚本未配置 Service Role Key** (阻塞性问题)
   - 脚本无法向数据库写入数据
   - 即使手动运行也会失败

2. **数据库中的数据过期** (表象)
   - 最后一次更新是 2026-01-18
   - 今天 (2026-01-19) 的数据未插入

3. **缺少自动化机制** (长期问题)
   - 没有配置定时任务
   - 依赖手动运行脚本
   - 部署后容易被遗忘

---

## 解决方案

### 🔧 立即修复 (紧急)

#### 步骤1: 配置 Service Role Key

1. 登录 Supabase Dashboard:
   ```
   https://supabase.com/dashboard
   ```

2. 选择 **GoldBet** 项目

3. 导航到 **Settings > API**

4. 找到 **Project API keys** 部分

5. 复制 **service_role** 的值 (⚠️ 这是敏感信息，不要泄露)

6. 编辑 `scripts/update-gold-price.js`，替换第10行：
   ```javascript
   const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGc...'; // 粘贴你复制的key
   ```

#### 步骤2: 手动更新今天的金价

```bash
cd /Users/vivienna/Desktop/VibeCoding/GoldBet
node scripts/update-gold-price.js
```

**预期输出**:
```
🚀 开始更新金价...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 正在从 GoldAPI.io 获取金价...
✅ 金价获取成功:
   💰 当前价格: $4676.14 USD/oz
   📊 开盘价: $4596.69 USD/oz
   ...
💾 正在保存到 Supabase...
✅ 保存成功！
   📅 日期: 2026-01-19
   💰 当前价格: $4676.14
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ 更新完成！
```

#### 步骤3: 验证修复

```bash
# 测试Supabase数据
node test-supabase-price.js
```

**预期结果**:
- 📅 日期应该显示: **2026-01-19** (今天)
- 💰 价格应该是: **$4676.14** (最新)

---

### 🤖 长期方案: 自动化定时更新

#### 方案A: GitHub Actions (免费，推荐)

创建 `.github/workflows/update-gold-price.yml`:

```yaml
name: Update Gold Price

on:
  schedule:
    # 每小时的第5分钟执行 (避开整点高峰)
    - cron: '5 * * * *'
  workflow_dispatch: # 允许手动触发

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd scripts
          npm install @supabase/supabase-js axios

      - name: Update gold price
        env:
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: node scripts/update-gold-price.js
```

**配置步骤**:
1. 在 GitHub 仓库中添加 Secret:
   - 进入 **Settings > Secrets and variables > Actions**
   - 添加 `SUPABASE_SERVICE_ROLE_KEY`
2. 提交 workflow 文件
3. GitHub 会自动每小时运行一次

**优点**:
- ✅ 完全免费
- ✅ 无需维护服务器
- ✅ 可手动触发
- ✅ 有日志记录

---

#### 方案B: Supabase Edge Functions

创建 Edge Function:

```typescript
// supabase/functions/update-gold-price/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // 1. 从 GoldAPI.io 获取金价
    const response = await fetch('https://www.goldapi.io/api/XAU/USD', {
      headers: {
        'x-access-token': Deno.env.get('GOLD_API_KEY')!
      }
    })
    const data = await response.json()

    // 2. 保存到 Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const today = new Date().toISOString().split('T')[0]

    await supabase.from('gold_prices').upsert({
      date: today,
      current_price: data.price,
      open_price: data.open_price,
      high_price: data.high_price,
      low_price: data.low_price,
      // ...
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    })
  }
})
```

**配置 Cron**:
```bash
supabase functions schedule update-gold-price --cron="0 * * * *"
```

**优点**:
- ✅ 与 Supabase 深度集成
- ✅ 自动扩展
- ✅ 有免费额度

---

## 验证修复清单

运行以下命令验证一切正常：

```bash
# 1. 测试 GoldAPI.io 连接
node server/test-goldapi.js
# 预期: ✅ 获取到最新金价 $4676.14

# 2. 配置 Service Role Key
# 编辑 scripts/update-gold-price.js

# 3. 更新今天的金价
node scripts/update-gold-price.js
# 预期: ✅ 保存成功！日期: 2026-01-19

# 4. 验证 Supabase 数据
node test-supabase-price.js
# 预期: 📅 日期: 2026-01-19, 💰 价格: $4676.14

# 5. 测试小程序 API
# 在小程序中调用 API.getCurrentPrice()
# 预期: 返回今天的价格
```

---

## 注意事项

### 🔒 安全性

- **Service Role Key 是高权限密钥**，不要泄露！
- ❌ 不要提交到 Git 仓库
- ✅ 使用环境变量或 GitHub Secrets
- ✅ 只在服务端使用，不要暴露给客户端

### ⏰ API 限制

- **GoldAPI.io 免费版**: 1次/小时
- 建议更新频率: 每小时一次
- 超额处理: 脚本会显示 429 错误，等待下一小时

### 📊 数据一致性

- 使用 `upsert` 操作，避免重复插入
- `ON CONFLICT (date)` 确保每天只有一条记录
- 自动更新 `updated_at` 时间戳

---

## 总结

### 核心问题
**Supabase 数据库中的金价数据过期（2026-01-18），今天的数据尚未更新**

### 根本原因
1. 价格更新脚本的 Service Role Key 未配置
2. 没有配置自动化定时任务

### 解决方法
1. ✅ 立即配置 Service Role Key
2. ✅ 手动运行 `node scripts/update-gold-price.js` 更新今天的数据
3. ✅ 配置 GitHub Actions 或 Edge Functions 实现自动化
4. ✅ 验证小程序能读取到最新价格

### 预期效果
- 数据库中有今天 (2026-01-19) 的最新金价
- 小程序显示实时价格: $4676.14
- 每小时自动更新，无需手动干预
