# DevKit 双语与推广方案

用户请求中文站、自动语言选择、手动切换，并了解如何通过Google和百度推广。用户已明确选择“按浏览器语言：中文用户默认中文，其他默认英文”，代替原先亚洲IP方案。保持现有视觉和14工具，不改工具算法。

## 语言与网址

- 现有英文网址保持原样，例如 /json；中文为 /zh/json，中文首页 /zh（沿用Cloudflare去尾斜杠设置）。
- 翻译14工具的导航、表单、按钮、占位符、说明、示例、错误及结果提示，以及首页、About、Privacy、404。代码片段、协议字段名、UUID、Hash等结果不翻译。
- 每页顶部固定显示中文/English链接，切换到同一个工具的对应语言；无JS也能使用语言链接。
- 仅在首次访问首页 / 时，优先采用明确保存的手动偏好，否则依据navigator.languages中的首选语言，zh及其变体选中文，其余英文。工具深链接和显式/zh页面不强制跳转，避免分享链接失效和搜索引擎无法访问另一语言。
- 手动选择保存语言标识到localStorage，try/catch容忍被禁用；仅存语言，不存工具输入。更新中英隐私说明。
- 当前静态架构即可实现，不新增IP查询、定位API、Cloudflare运行时函数或地理数据收集。

## SEO

- 英中文独立静态HTML、对应语言的lang/title/description/h1/结构化数据。
- 两种语言各自canonical，互相提供hreflang en、zh-Hans与x-default英文入口，不把中文版canonical指向英文。
- sitemap从17变34个可索引页面，404不入地图；保留robots正式域名和预览noindex。
- 首页有静态中英入口，Google不依赖自动跳转才发现中文页面。
- Google建议独立语言URL、hreflang且避免猜测语言强制跳转。用户明确要求首次默认语言，因此将自动选择限定首页，工具深链接保持稳定。

## 实施与验收

1. 在独立开发分支实施，现有main线上站保持可用。
2. 先增加多语言构建/路由测试：34页面，正确lang、canonical、双向hreflang，语言切换同工具，中文导航不回英文，404和预览noindex。
3. 将展示文案与算法分离，避免对用户输入/结果全文替换。翻译必须覆盖动态错误与结果标签，不能只把导航改中文。
4. 测试自动选择：zh-CN、zh-TW、en、ja、无语言数据；偏好覆盖；localStorage不可用；工具深链接不跳转。
5. 浏览器检查两种语言的14工具，尤其JSON大整数、Regex Worker/超时、Cron和错误清旧输出；手机顶部语言切换不能挤出屏幕。
6. 原25回归继续通过；构建后更新站点地图并部署，公网验收中文页面和语言替代链接。
7. Google站点地图已有提交会被重新处理；核对新发现页面。百度需登录百度搜索资源平台后按账户实际可用入口验证并提交，不假定每个账户有sitemap权限。

## 不在本次自动执行范围

不购买广告、链接或域名；不群发、不自动发社区帖子。先提供可审阅的推广文案，用户明确要求发布时再操作。不能承诺多久收录、排名或获客数量。

## 依据

Google多语言站点：https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
Google语言版本：https://developers.google.com/search/docs/specialty/international/localized-versions
百度站点管理：https://ziyuan.baidu.com/site/index
百度普通收录：https://ziyuan.baidu.com/linksubmit/index
