# GitHub Actions 自动化配置

## 📋 说明

此目录包含 GitHub Actions workflow 配置，用于自动更新黄金价格数据。

## 🔧 配置步骤

### 1. 获取 Supabase Service Role Key

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的 **GoldBet** 项目
3. 进入 **Settings > API**
4. 找到 **Project API keys** 部分
5. 复制 **service_role** key（以 `eyJhbGc...` 开头的长字符串）

### 2. 在 GitHub 仓库中添加 Secret

1. 在你的 GitHub 仓库页面，进入 **Settings**
2. 在左侧菜单选择 **Secrets and variables > Actions**
3. 点击 **New repository secret** 按钮
4. 添加以下 Secret：
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: 粘贴你在步骤1中复制的 service_role key

### 3. 启用 GitHub Actions

1. 进入仓库的 **Actions** 标签页
2. 如果 Actions 被禁用，点击 **I understand my workflows, go ahead and enable them**
3. 你会看到 **Update Gold Price** workflow

### 4. 手动触发测试（可选）

在配置完成后，建议先手动测试一次：

1. 进入 **Actions** 标签页
2. 选择左侧的 **Update Gold Price** workflow
3. 点击右上角的 **Run workflow** 按钮
4. 选择 `main` 分支
5. 点击绿色的 **Run workflow** 按钮
6. 等待几秒钟，查看运行结果

## 📅 运行时间表

- **自动运行**: 每小时的第5分钟（UTC时间）
- **手动运行**: 随时可以通过 Actions 页面手动触发

## 🔍 查看运行日志

1. 进入 **Actions** 标签页
2. 点击任意一次运行记录
3. 点击 **update-price** job
4. 展开各个步骤查看详细日志

## ⚠️ 注意事项

### API 限制
- **GoldAPI.io 免费版**: 每小时最多 1 次请求
- 如果超过限制会返回 429 错误
- Workflow 设置为每小时运行一次，符合限制要求

### 安全性
- ⚠️ **切勿将 Service Role Key 提交到代码仓库**
- ✅ 只通过 GitHub Secrets 传递敏感信息
- ✅ 脚本使用 `sed` 在运行时替换占位符

### 时区说明
- Cron 表达式使用 UTC 时间
- `5 * * * *` 表示每小时的第5分钟（UTC）
- 换算为北京时间（UTC+8）：
  - UTC 00:05 → 北京时间 08:05
  - UTC 08:05 → 北京时间 16:05

## 🔄 修改更新频率

如果需要修改更新频率，编辑 `.github/workflows/update-gold-price.yml` 文件中的 `cron` 表达式：

```yaml
on:
  schedule:
    # Cron 格式: 分 时 日 月 周
    - cron: '5 * * * *'  # 当前: 每小时第5分钟
```

常见配置示例：
- `*/30 * * * *` - 每30分钟
- `0 */2 * * *` - 每2小时
- `0 9 * * *` - 每天 UTC 9:00（北京时间 17:00）

## 📊 验证更新是否成功

运行以下命令检查数据库中的最新数据：

```bash
node test-supabase-price.js
```

预期输出应包含今天的日期和最新金价。

## 🐛 故障排除

### Workflow 失败
1. 检查 GitHub Secrets 是否正确配置
2. 查看 Actions 日志中的错误信息
3. 确认 Supabase 项目正常运行

### 数据未更新
1. 检查 GoldAPI.io 是否超过请求限制（429错误）
2. 验证 Service Role Key 是否有效
3. 检查 Supabase RLS 策略是否正确配置

### 手动更新
如果需要手动更新价格，可以本地运行：

```bash
# 1. 确保已配置 Service Role Key
# 编辑 scripts/update-gold-price.js 第10行

# 2. 安装依赖
npm install axios @supabase/supabase-js

# 3. 运行脚本
node scripts/update-gold-price.js
```

## 📞 支持

如果遇到问题，请查看：
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Supabase 文档](https://supabase.com/docs)
- 项目根目录的 `DIAGNOSIS_REPORT.md` 文件
