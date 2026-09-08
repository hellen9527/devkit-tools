# 首次配置与按需排错

以仓库与控制台实际状态为准。以下是静态多页站示例，不是要求所有项目改用同一框架。

## 1. 确认产品和产物

新静态站可采用 Workers Static Assets，不需要为纯静态托管额外写 Worker 入口。既有 Pages 项目继续使用它的 Git 集成、构建输出及域名设置，不能套用 `wrangler deploy`。SSR、API、数据库等项目使用当前框架的 Cloudflare 适配方式，保留 Worker 入口、bindings、secrets 和迁移步骤。

从 `package.json`、锁文件及现有构建结果确定命令和输出目录。Node/Wrangler 使用相容版本并锁定依赖，不把某次部署的版本永久当作最新版本。只有首次配置、版本升级或实际错误需要时，针对性查看下方官方资料。

## 2. Workers 静态多页配置示例

`wrangler.jsonc` 示例，使用前替换项目名、日期、域名、产物目录；compatibility_date 新项目采用实际创建日期，已有项目不随部署自动改动。

```jsonc
{
  "name": "your-project",
  "compatibility_date": "2026-09-08",
  "assets": {
    "directory": "./dist",
    "html_handling": "drop-trailing-slash",
    "not_found_handling": "404-page"
  },
  "workers_dev": false,
  "preview_urls": false,
  "routes": [{ "pattern": "tools.example.com", "custom_domain": true }]
}
```

这是自定义域名作为唯一公开入口的配置。临时入口/预览是否关闭取决于项目需求，保留既有策略。`404-page` 适用于多页站，产物应有 `404.html`；真正的 SPA 可使用 SPA fallback，不能为了掩盖路径错误随意改成所有路径 HTTP 200。Vite 插件或框架生成配置时，沿用其约定，不重复维护冲突配置。

## 3. GitHub → Workers Builds

连接目标仓库，核对仓库全名（尤其连字符/下划线）、Worker 名称、生产分支及 monorepo 根目录。已有连接不要重复创建。新增 GitHub App 授权优先仅目标仓库；凭据由平台/环境保存。

| 配置 | 取值方法 |
|---|---|
| Production branch | 读取项目约定，不假定当前分支就是生产分支 |
| Root directory | 构建脚本所在项目目录 |
| Build command | 仓库已有构建及必要检查，例如 `npm test && npm run build`；没有 test 脚本不机械照抄 |
| Deploy command | Workers 示例 `npx wrangler deploy`，使用已锁定的本地版本 |
| Build variables | 构建器使用的正式 origin 等；`SITE_URL` 只对读取它的项目有效 |
| Runtime variables/secrets | Worker 运行时需要的独立配置，不能误放到公开前端产物 |
| Nonproduction branches | 按项目需要配置预览或关闭，不让功能分支意外发布到生产 |

构建与部署是两个步骤；Workers Builds 的构建变量不会自动成为运行时变量。原有 Git 自动部署成功后，后续发布通常只需检查、集成和推送。

## 4. 自定义域名

确认目标域名/子域名以及对应 Cloudflare zone 已激活。在 Worker 的 Domains & Routes 添加 Custom Domain，或使用上述 `custom_domain: true` 配置。Custom Domain 主机名不带协议、路径和 `/*`，不要混同需要源站的 Worker Route。

检查同名 DNS 是否服务其他业务；发生冲突先查用途，不直接覆盖。让 Custom Domain 流程管理所需 DNS/证书，不凭空填写示例 IP。保留邮件、其他站点、`_dnsauth`、Google 所有权验证等已有记录。证书/解析未就绪时报告真实状态，不能关闭 TLS 验证充当成功。

## 5. 常见定位

| 现象 | 先检查 |
|---|---|
| 本地构建成功、云构建失败 | Node/依赖锁文件、项目根目录、构建变量、失败日志 |
| 推送后旧内容不变 | 推送分支、构建是否触发、目标 Worker/域名、部署对应 SHA、产物是否新生成 |
| 首页正常、深层链接或资源失败 | 实际输出路径、HTML handling、资源 URL、SPA/多页路由选择 |
| 正式页显示预览域名/noindex | 正式构建变量、重新构建是否生效 |
| 浏览器控制不可读 | 刷新实际 UI 状态/用已有授权的其他接口；不要复用旧元素编号或连续盲点 |

## 官方参考（配置依据核对于 2026-09-08）

- [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Workers Builds 配置](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [静态多页与 404](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/)

资料用于核对变动字段与遇到的问题，不必每次例行发布重新阅读整套文档。
