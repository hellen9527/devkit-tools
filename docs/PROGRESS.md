# DevKit 续作存档

更新：2026-09-05。用户已授权按评估报告的五阶段顺序实施，并要求额度不足时暂停、恢复后继续。保留英文工具站、现有深色风格和本地处理输入。

## 当前阶段

阶段 1 部分完成，因五小时额度已用 97% 存档。原版基线提交 8bf134f。index.html 已修第一批问题，未完成完整浏览器回归，不能发布。

## 五阶段状态

- [ ] 1. 正确性和手机体验：以 docs/REVIEW.zh-CN.md 的问题为范围，先测试后修复。
- [ ] 2. 独立静态页面：共享 CSS/JS，14 个工具各自标题、描述、示例、URL，真实 404，干净 dist。
- [ ] 3. GitHub + Cloudflare Workers Static Assets + 正式域名。
- [ ] 4. Search Console 域名验证、sitemap、收录检查。
- [ ] 5. 依据反馈迭代；不急着新增工具或接广告。

## 授权与限制

- 可以修代码、测试、本地 Git 存档，准备和执行用户要求的建站流程。
- 不使用额度重置券或付费购买额度；额度用尽时等待恢复。
- 正式域名、GitHub/Cloudflare/Search Console 登录及目标账号尚未确认。不要自行购买域名或编造联系方式。
- 用户明确选择自己的 GitHub/Cloudflare，不改成托管在 Sites 的另一个项目。
- 阶段 5 没有实际反馈时等待，不为了完成清单凭空补工具。

## 接手方式

先读本文件，再读 docs/superpowers/plans/2026-09-05-reliability.md 和 docs/REVIEW.zh-CN.md。检查 git status 后继续未完成项，不覆盖用户后续修改。每个已验证批次更新本文件并提交；不要把 docs、tests、_backup 部署到公网。

## 已有证据

初始审计：docs/audit-results.json。审计程序仅输出观察值，不是回归通过证明。此文件是修复前证据，保留不覆盖。

## 额度续作

开始时 Codex 五小时已用 79%，周已用 27%。已请求设置本任务每小时续作 heartbeat（DevKit 额度恢复后续作），结果见任务工具记录。五小时预计 2026-09-05 14:38:09 UTC（洛杉矶 07:38:09）恢复。每次先检查额度；不足 10% 时安静等待。

## 2026-09-05 第一批修改存档

- 新增 tests/load-app.cjs 与 tests/reliability.test.cjs，运行 `node --test tests/*.test.cjs`。
- 原版 14 项：2 通过 / 12 失败；修改后：10 通过 / 4 失败（Cron 两项、curl 两项）。完整输出 docs/checkpoint-tests.txt。
- 已改：JSON 保留大整数/指数/重复键且高亮按原始 token；HTML Unicode 编码与实体解码；Base64 文本拒绝非法 UTF-8；空文本 Hash；JWT claims 标签与清空；Now 尊重毫秒并保留 live clock 日期子节点；CIDR 严格输入；Color alpha/短 HEX。
- 未改：Cron、curl、Regex 报错与 worker、UUID 安全随机 fallback、手机界面。阶段 2–5 未开始。
- 下一步：先修 4 项失败（测试已红），再增加 Regex 匹配/flags/Unicode 空匹配/超时测试并实现 worker，最后手机布局。
- 注意：tests 的 DOM adapter 不模拟 HTML entity 命名解码，必须在浏览器检查 &eacute;/&Alpha; 和不执行标签。旧 audit-checks 的 adapter 不再适合检查命名实体，不把其输出当新回归证据。
- 待补检查：JSON 错误位置、深层/大输入；Base64 错误清旧输出；Color/CIDR 失败清旧输出；完整浏览器回归。时间戳测试目前硬编码 2026 年，下一批改为当年。
- 本地预览上一轮启动在 127.0.0.1:8765，是否仍存活请先检查，不要重复启动或盲目扫端口。
- 未安装 gh，未登录 GitHub/Cloudflare，未选定域名。不需要重读全部技能；用户已确认方案，继续已授权实现。
