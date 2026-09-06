# DevKit 部署与收录

## 当前事实

仓库：hellen9527/devkit-tools。开发分支 devkit/launch-ready，正式分支 main。2026-09-05 登录控制台检查：fategenie.com 有效，到期 2028-03-15；未配置网站解析。建议 tools.fategenie.com；域名目标尚待用户回复。下面的地址是建议值，不代表已绑定上线。

## 1. Cloudflare 连接 GitHub

在 Cloudflare 的 Workers & Pages 创建 Worker，选择连接 GitHub 仓库 hellen9527/devkit-tools。若要求授权 GitHub App，尽量选择仅此仓库。项目名称必须与 wrangler.jsonc 一致：devkit-tools。

配置：

| 字段 | 值 |
|---|---|
| Production branch | 完成合并后的 main |
| Root directory | 仓库根目录 |
| Build command | npm test && npm run build |
| Deploy command | npx wrangler deploy |
| Build variable SITE_URL | https://tools.fategenie.com（确认后使用） |
| Build Node version | 22 或更新的受支持版本 |
| Static asset directory | wrangler.jsonc 中的 ./dist |

不要把仓库根目录当成静态资源目录。无需手动复制14份页面；每次构建自动生成。未设置 SITE_URL 的预览默认 noindex，不提交给 Google。

配置依据：[Cloudflare 构建配置](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)、[Git 集成](https://developers.cloudflare.com/workers/ci-cd/builds/)。

## 2. 绑定域名

部署成功后，在 Worker 的 Settings → Domains & Routes 添加确认后的 Custom Domain。域名已在同一 Cloudflare 账号时，按控制台提示由平台管理对应 DNS 和证书。保留现有 _dnsauth TXT；不要用示例 IP 或其他项目域名填写解析。

打开 HTTPS 正式地址，验证首页、/json、/regex、/sitemap.xml 和 /robots.txt。随便输入不存在的工具地址应返回 HTTP404，不应该显示首页。检查每个 canonical 都是正式域名，页面没有 noindex。临时 workers.dev 地址不是提交给 Google 的主网址；在自定义域名可用后关闭不需要的临时域名入口。

配置依据：[静态页面和404](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/)。

## 3. Google Search Console

1. 登录要长期管理网站的 Google 账号，添加 Domain property：fategenie.com（不带 https）。
2. 根据 Google 给出的值添加 DNS TXT 验证记录；可以和已有 TXT 并存，不删除其他验证值。
3. 返回 Search Console 点击验证，等待成功。Domain property 可以覆盖子域名。
4. 在 Sitemaps 提交正式地址的 /sitemap.xml，例如 https://tools.fategenie.com/sitemap.xml。
5. 用 URL Inspection 检查首页、/json、/timestamp 等代表页面，运行实时测试并检查抓取、canonical 和索引状态；必要时申请编入索引。

提交 sitemap 是告知 Google 页面地址，不保证立即收录或排名。以后根据 Performance 和 Page indexing 报告改进，不为搜索词堆砌工具或说明。

依据：[域名所有权验证](https://support.google.com/webmasters/answer/9008080)、[站点地图报告](https://support.google.com/webmasters/answer/7451001)、[URL 检查](https://support.google.com/webmasters/answer/9012289)。

## 4. 维护

改动先跑 npm test，再构建和浏览器检查，提交 Git；Cloudflare 按连接的分支自动部署。需要恢复时，使用已验证的 Git 提交或 Cloudflare 历史部署。未上线的本地状态和待操作事项以 PROGRESS.md 为准。
