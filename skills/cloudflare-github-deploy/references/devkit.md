# DevKit 已知部署参数

仅用于 `hellen9527/devkit-tools`，确认基准日期 2026-09-08。续作优先读仓库 `docs/PROGRESS.md` 最新部分，并与当前 Git/控制台核对；不要把此参考当作实时状态。

| 项目 | 参数 |
|---|---|
| GitHub remote | `git@github.com:hellen9527/devkit-tools.git` |
| Cloudflare 产品/Worker | Workers Static Assets / `devkit-tools` |
| 正式分支 | `main`，Git 自动构建部署 |
| 正式 origin | `https://tools.fategenie.com` |
| 域名区域 | `fategenie.com`，Custom Domain 为 `tools.fategenie.com` |
| 根目录/产物 | 仓库根目录 / `./dist` |
| 云构建 | `npm test && npm run build` |
| 构建变量 | `SITE_URL=https://tools.fategenie.com` |
| 部署命令 | `npx wrangler deploy` |
| 工具链基准 | Node >=22、Wrangler 4.129.0 已锁定；实际以 package/lockfile 为准 |
| 临时入口/预览 | workers_dev=false、preview_urls=false；非生产分支自动构建关闭 |

本地适用检查：`npm test`，然后 `SITE_URL=https://tools.fategenie.com npm run build`。依赖未安装或锁文件变化时先 `npm ci`。只有 `dist` 可发布，源码、docs、tests、skills 与备份不能当静态产物上传。

页面基准：中英文共34页，英文 `/`、中文 `/zh`、14工具及 About/Privacy。只在根首页按浏览器/保存偏好选择语言，直接深层链接保留语言。检查 `/json`、`/zh/json`、本次变更工具、`/sitemap.xml`、`/robots.txt` 及未知路径404。使用实际浏览器时中文偏好可能触发根首页跳转，不把它误判为英文页面不存在。

历史发布证据：`docs/bilingual-live-checks.json` 保存34页与6个资源的公网验收；它不证明未来改动已上线。`docs/DEPLOY.zh-CN.md` 前部有旧 Google 状态，最新搜索状态看 `docs/PROGRESS.md`。保留 DNS 中 `_dnsauth` 与 Google 验证 TXT，无需把验证值/账号权限复制进 skill。

统计接入是独立事项：读取 `config/analytics.json` 与最新进度；measurementId 为空时统计关闭，不能填测试 ID 充当接入。仅部署网站不代表 GA4 收数、Google 全站收录或百度验证完成。本 skill 不代替这些平台的验收。

本机个人 skill 位于 `~/.codex/skills/cloudflare-github-deploy`；可版本管理的来源是本仓库 `skills/cloudflare-github-deploy`。修改来源并验证后再同步本机副本，避免两份内容漂移。
