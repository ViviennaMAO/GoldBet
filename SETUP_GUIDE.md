# GoldBet 价格自动更新配置指南

## ✅ 已完成的步骤

1. ✅ 安装了脚本依赖（axios 和 @supabase/supabase-js）
2. ✅ 创建了 GitHub Actions workflow 配置文件
3. ✅ 项目诊断完成（详见 DIAGNOSIS_REPORT.md）

## 🚀 下一步操作（重要！）

### 步骤1: 配置本地更新脚本的 Service Role Key

这个步骤是**立即修复价格显示问题**的关键！

1. **获取 Supabase Service Role Key**：
   ```
   访问: https://supabase.com/dashboard
   选择: GoldBet 项目
   进入: Settings > API
   复制: service_role key（以 eyJhbGc... 开头）
   ```

2. **编辑更新脚本**：
   打开文件 `scripts/update-gold-price.js`，将第10行：
   ```javascript
   const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY';
   ```

   改为：
   ```javascript
   const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGc...你复制的真实key...';
   ```

3. **立即运行一次更新**（更新今天的数据）：
   ```bash
   node scripts/update-gold-price.js
   ```

4. **验证更新是否成功**：
   ```bash
   node test-supabase-price.js
   ```

   应该看到：
   - 📅 日期: 2026-01-20（今天）
   - 💰 当前价格: $4,xxx.xx（最新）

### 步骤2: 配置 GitHub Actions 自动更新

这个步骤是**实现自动化定时更新**，让你不用再手动运行脚本。

1. **在 GitHub 仓库中添加 Secret**：
   ```
   进入你的 GitHub 仓库
   点击: Settings > Secrets and variables > Actions
   点击: New repository secret

   Name:  SUPABASE_SERVICE_ROLE_KEY
   Value: [粘贴你在步骤1中获取的 service_role key]
   ```

2. **提交代码到 GitHub**：
   ```bash
   git add .
   git commit -m "Add GitHub Actions for automatic gold price updates"
   git push
   ```

3. **启用并测试 GitHub Actions**：
   - 进入仓库的 **Actions** 标签页
   - 选择 **Update Gold Price** workflow
   - 点击 **Run workflow** 手动测试一次
   - 查看运行日志确认成功

### 步骤3: 验证小程序显示正确价格

1. 重新编译小程序
2. 刷新价格数据
3. 确认显示的是最新金价（不再是 $2,045.50）

## 📊 问题总结

### 发现的问题
1. **Web预览页面**: 显示硬编码价格 `$2,045.50`（仅用于UI演示）
2. **Supabase数据库**: 价格数据过期（最后更新: 2026-01-18）
3. **更新脚本**: Service Role Key 未配置，依赖未安装

### 解决方案
1. ✅ 安装依赖: `npm install axios @supabase/supabase-js`
2. ⏳ 配置 Service Role Key（需要你手动操作）
3. ⏳ 运行更新脚本更新今天的数据
4. ⏳ 配置 GitHub Actions 实现自动化

## ⚙️ 自动更新机制

配置完成后：
- ✅ GitHub Actions 每小时自动运行一次
- ✅ 从 GoldAPI.io 获取最新金价
- ✅ 自动更新到 Supabase 数据库
- ✅ 小程序实时显示最新价格

## 🔍 文件说明

| 文件 | 说明 |
|------|------|
| `scripts/update-gold-price.js` | 价格更新脚本 |
| `.github/workflows/update-gold-price.yml` | GitHub Actions 配置 |
| `.github/workflows/README.md` | 详细配置文档 |
| `test-supabase-price.js` | 测试 Supabase 数据 |
| `DIAGNOSIS_REPORT.md` | 完整诊断报告 |

## ⚠️ 重要提醒

1. **Service Role Key 是敏感信息**，不要提交到 Git 仓库！
2. **GoldAPI.io 免费版**限制为每小时1次请求
3. **GitHub Actions** 每小时运行一次，符合 API 限制
4. 首次配置后建议**手动测试一次**确保正常工作

## 🐛 故障排除

### 如果运行脚本失败

1. **检查 Service Role Key 是否正确配置**
   ```bash
   # 查看脚本第10行是否还是占位符
   head -n 10 scripts/update-gold-price.js | grep SERVICE_ROLE_KEY
   ```

2. **检查依赖是否安装**
   ```bash
   npm list axios @supabase/supabase-js
   ```

3. **查看详细错误信息**
   ```bash
   node scripts/update-gold-price.js
   ```

### 如果小程序仍显示旧价格

1. 清除小程序缓存
2. 重新编译小程序
3. 检查网络请求是否成功
4. 查看控制台是否有错误信息

## 📞 需要帮助？

- 查看完整诊断报告: `DIAGNOSIS_REPORT.md`
- GitHub Actions 配置说明: `.github/workflows/README.md`
- 如有问题，检查各个脚本的日志输出

---

**当前状态**: ⏳ 等待配置 Service Role Key 并运行首次更新

**下一步**: 按照"步骤1"获取并配置 Service Role Key
