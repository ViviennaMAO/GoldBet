# 💰 GoldBet 真实资金系统设计方案

## 📊 当前状态 vs 真实资金系统对比

### 当前系统（积分制）
- ✅ 用户通过预测赚取积分
- ✅ 积分用于排行榜竞争
- ✅ 无真实资金流动
- ✅ 无需金融牌照

### 真实资金系统（需升级）
- 💰 用户充值真实货币
- 💰 预测下注消耗余额
- 💰 预测成功赚取奖金
- 💰 提现到钱包
- ⚠️ **需要金融牌照和监管许可**

---

## 🏗️ 方案 A：中心化托管（推荐入门）

### 架构设计

```
用户 → 充值 → 平台账户 → 下注 → 奖池 → 结算 → 用户账户
                ↓
            手续费钱包
```

### 数据库架构

#### 1. 扩展 user_profiles 表

```sql
ALTER TABLE user_profiles ADD COLUMN balance DECIMAL(20,8) DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN frozen_balance DECIMAL(20,8) DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN total_deposited DECIMAL(20,8) DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN total_withdrawn DECIMAL(20,8) DEFAULT 0;
```

#### 2. 创建交易记录表

```sql
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  wallet_address TEXT NOT NULL,
  type TEXT CHECK (type IN ('deposit', 'withdraw', 'bet', 'win', 'fee', 'refund')) NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  currency TEXT DEFAULT 'USDT',
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',

  -- 关联信息
  prediction_id UUID REFERENCES predictions(id),
  tx_hash TEXT, -- 区块链交易哈希

  -- 手续费
  fee_amount DECIMAL(20,8) DEFAULT 0,
  fee_rate DECIMAL(5,4) DEFAULT 0,

  -- 备注
  note TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_type ON transactions(type, status);
CREATE INDEX idx_transactions_status ON transactions(status);
```

#### 3. 创建手续费记录表

```sql
CREATE TABLE IF NOT EXISTS public.platform_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id),
  user_id UUID REFERENCES auth.users(id),
  fee_amount DECIMAL(20,8) NOT NULL,
  fee_rate DECIMAL(5,4) NOT NULL,
  fee_type TEXT CHECK (fee_type IN ('bet_fee', 'withdraw_fee', 'platform_fee')) NOT NULL,

  -- 已提取到哪里
  withdrawn BOOLEAN DEFAULT FALSE,
  withdrawn_at TIMESTAMP WITH TIME ZONE,
  withdrawn_to TEXT, -- 提现地址

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_platform_fees_withdrawn ON platform_fees(withdrawn, created_at);
```

#### 4. 创建平台钱包表

```sql
CREATE TABLE IF NOT EXISTS public.platform_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_type TEXT CHECK (wallet_type IN ('fee_wallet', 'prize_pool', 'reserve')) NOT NULL,
  currency TEXT DEFAULT 'USDT',
  balance DECIMAL(20,8) DEFAULT 0,

  -- 累计统计
  total_received DECIMAL(20,8) DEFAULT 0,
  total_withdrawn DECIMAL(20,8) DEFAULT 0,

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(wallet_type, currency)
);

-- 插入初始钱包
INSERT INTO platform_wallet (wallet_type, currency, balance) VALUES
  ('fee_wallet', 'USDT', 0),
  ('prize_pool', 'USDT', 0),
  ('reserve', 'USDT', 0)
ON CONFLICT (wallet_type, currency) DO NOTHING;
```

### 手续费配置

#### 5. 创建配置表

```sql
CREATE TABLE IF NOT EXISTS public.platform_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入手续费配置
INSERT INTO platform_config (key, value, description) VALUES
  ('bet_fee_rate', '0.02', '下注手续费率 (2%)'),
  ('withdraw_fee_rate', '0.01', '提现手续费率 (1%)'),
  ('min_bet_amount', '10', '最小下注金额 (USDT)'),
  ('max_bet_amount', '10000', '最大下注金额 (USDT)'),
  ('min_withdraw_amount', '20', '最小提现金额 (USDT)')
ON CONFLICT (key) DO NOTHING;
```

---

## 💼 手续费管理

### 1. 手续费来源

#### A. 下注手续费（2%）
```javascript
用户下注 100 USDT
├─ 实际下注: 98 USDT → 奖池
└─ 手续费: 2 USDT → fee_wallet
```

#### B. 提现手续费（1%）
```javascript
用户提现 1000 USDT
├─ 实际到账: 990 USDT
└─ 手续费: 10 USDT → fee_wallet
```

### 2. 手续费流向

```
用户交易
    ↓
收取手续费
    ↓
platform_fees 表记录
    ↓
累加到 platform_wallet (fee_wallet)
    ↓
定期提现到管理员钱包
```

### 3. 查看手续费数据

#### SQL 查询 - 总手续费收入

```sql
-- 今日手续费收入
SELECT
  SUM(fee_amount) as total_fees,
  COUNT(*) as transaction_count,
  fee_type
FROM platform_fees
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY fee_type;

-- 本月手续费收入
SELECT
  SUM(fee_amount) as total_fees,
  COUNT(*) as transaction_count
FROM platform_fees
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE);

-- 未提现的手续费
SELECT
  SUM(fee_amount) as pending_fees
FROM platform_fees
WHERE withdrawn = FALSE;
```

#### SQL 查询 - 平台钱包余额

```sql
SELECT
  wallet_type,
  currency,
  balance,
  total_received,
  total_withdrawn
FROM platform_wallet;
```

### 4. 管理后台界面（需开发）

创建 `admin-dashboard.html`:

```javascript
// 显示实时数据
{
  fee_wallet: {
    balance: 12345.67,
    total_collected: 50000.00,
    withdrawn: 37654.33
  },
  prize_pool: {
    balance: 98765.43,
    active_bets: 123
  },
  statistics: {
    today_fees: 234.56,
    week_fees: 1234.56,
    month_fees: 5678.90
  }
}
```

---

## 🏗️ 方案 B：去中心化智能合约（高级）

### 架构设计

```
用户 → 充值到智能合约 → 自动托管 → 预测结算 → 自动分配
                              ↓
                        手续费自动转入平台地址
```

### 智能合约设计（Solidity）

```solidity
contract GoldBetPlatform {
    address public owner;
    uint256 public betFeeRate = 200; // 2% = 200 basis points
    uint256 public withdrawFeeRate = 100; // 1%

    struct Bet {
        address user;
        uint256 amount;
        uint256 prediction; // 1: up, 2: down
        bool settled;
    }

    mapping(address => uint256) public balances;
    mapping(uint256 => Bet) public bets;

    uint256 public feeBalance; // 手续费余额
    uint256 public prizePool;  // 奖池余额

    // 下注
    function placeBet(uint256 prediction) external payable {
        require(msg.value >= minBetAmount, "Amount too low");

        uint256 fee = (msg.value * betFeeRate) / 10000;
        uint256 betAmount = msg.value - fee;

        feeBalance += fee;
        prizePool += betAmount;

        // 记录下注
        bets[betId] = Bet({
            user: msg.sender,
            amount: betAmount,
            prediction: prediction,
            settled: false
        });
    }

    // 提取手续费（仅管理员）
    function withdrawFees() external onlyOwner {
        payable(owner).transfer(feeBalance);
        feeBalance = 0;
    }
}
```

**优势**：
- ✅ 完全透明，所有交易上链
- ✅ 用户资金不可被平台挪用
- ✅ 自动执行，无需信任

**劣势**：
- ❌ Gas 费用高
- ❌ 开发和审计成本高
- ❌ 需要精通智能合约

---

## 📊 手续费数据仪表板设计

### 实时监控页面

```javascript
// API: /api/admin/fees/dashboard
{
  "real_time": {
    "fee_wallet_balance": 12345.67,
    "prize_pool_balance": 98765.43,
    "pending_withdrawals": 234.56
  },
  "statistics": {
    "today": {
      "total_bets": 156,
      "total_bet_amount": 15600.00,
      "fees_collected": 312.00,
      "withdrawals": 5,
      "withdraw_fees": 45.00
    },
    "this_week": {
      "total_fees": 2345.67,
      "total_bets": 890,
      "avg_bet_amount": 125.50
    },
    "this_month": {
      "total_fees": 8765.43,
      "total_bets": 3456,
      "total_users": 234
    }
  },
  "top_contributors": [
    {
      "wallet_address": "0x742d35...",
      "total_fees_contributed": 234.56,
      "bet_count": 45
    }
  ]
}
```

### 数据可视化

- 📈 手续费收入趋势图（日/周/月）
- 📊 交易类型分布（下注/提现）
- 💰 钱包余额实时监控
- 👥 活跃用户统计

---

## ⚠️ 重要法律和合规问题

### 1. 监管要求

**在线博彩/预测市场在大多数国家需要牌照**：

- 🇺🇸 美国: 需要州级博彩牌照
- 🇨🇳 中国: 严格禁止在线博彩
- 🇸🇬 新加坡: 需要博彩管制局许可
- 🇲🇹 马耳他: 博彩友好，但需 MGA 牌照

### 2. 反洗钱（AML）要求

- 📋 KYC 实名认证（Know Your Customer）
- 📋 交易监控和可疑交易报告
- 📋 资金来源审查

### 3. 税务合规

- 💼 手续费收入需缴纳营业税
- 💼 用户盈利可能需缴纳所得税
- 💼 跨境交易可能涉及外汇管制

### 4. 资金隔离

- 🏦 用户资金必须与平台运营资金分离
- 🏦 可能需要第三方托管
- 🏦 定期审计和公开财务报告

---

## 🎯 推荐方案

### 初期（测试阶段）
✅ **保持当前积分制系统**
- 无需金融牌照
- 无法律风险
- 专注产品打磨

### 中期（有用户基础后）
✅ **引入虚拟货币代币**
- 用户可购买代币（非法币）
- 代币仅用于游戏内
- 明确标注"无现金价值"

### 长期（合规后）
✅ **申请牌照，开通真实资金**
- 获得合法博彩牌照
- 实现完整的资金管理系统
- 接入支付网关（Stripe, PayPal）

---

## 📋 实施清单

如果决定实施真实资金系统，需要：

### 技术层面
- [ ] 设计新的数据库表结构
- [ ] 开发充值/提现功能
- [ ] 接入支付网关
- [ ] 开发管理后台
- [ ] 实现自动结算系统
- [ ] 添加交易审计日志

### 法律层面
- [ ] 咨询律师评估合规性
- [ ] 申请相关金融牌照
- [ ] 实施 KYC/AML 流程
- [ ] 购买保险（资金安全）

### 运营层面
- [ ] 设置专门的财务团队
- [ ] 建立客服体系
- [ ] 准备应急资金（赔付）
- [ ] 制定风控策略

---

## 💡 结论

**当前 GoldBet 是积分制游戏，不涉及真实资金。**

如果要升级为真实资金系统：
1. **必须先解决法律合规问题**
2. 建议从小规模测试开始
3. 逐步申请必要的牌照和许可
4. 建立完善的财务和风控体系

**手续费数据查看位置**：
- 开发管理后台（需创建）
- Supabase Dashboard 查询 SQL
- 定期生成财务报表

需要我帮你：
1. 创建管理后台原型？
2. 编写手续费统计 SQL 脚本？
3. 设计合规的积分兑换系统？
