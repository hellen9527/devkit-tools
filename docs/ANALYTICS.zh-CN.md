# DevKit：如何看访问与推广效果

## 三类统计分工

| 平台 | 主要用途 | 不要直接当作什么 |
|---|---|---|
| Cloudflare 请求/流量分析 | 请求量、流量、安全、缓存、异常响应 | 全部真人访客数；可能包含爬虫和自动请求 |
| Google Search Console | Google自然搜索展现、点击、查询词、页面、收录 | 网站全部访问；直接访问和其他来源不在搜索点击里 |
| Google Analytics 4 | 同意统计且标签成功加载的用户、会话、页面、来源、工具操作 | 完整访问日志；拒绝统计、拦截器及未加载标签的访问可能缺失 |

Cloudflare还有单独的Web Analytics，不应把所有Cloudflare报表都混成一个指标。比较时先统一域名、日期和时区，再区分requests/pageviews/users/clicks。不能因为GA4数字较小就断言哪一方算错。

## 已核对的搜索状态（2026-09-08）

- GSC资源fategenie.com已验证，覆盖tools子域名。
- 站点地图https://tools.fategenie.com/sitemap.xml：最后读取2026-09-07，成功，发现34页面。
- 中文首页https://tools.fategenie.com/zh：网址已收录到Google、网页已编入索引。不能据此宣称其余33页均已收录。
- 概览当前显示0次网页搜索点击；索引汇总仍处理数据。新站先观察曝光和查询，不凭空承诺排名。

## GA4接入配置目标（尚未完成）

- Analytics账号DevKit，媒体资源DevKit Tools，网站数据流https://tools.fategenie.com。
- 创建流程中关闭4项可选账号数据共享；时区/条款地区按运营者真实情况填写。
- 取得真实G-衡量ID后写入config/analytics.json。它是公开标识，不能替换成账号ID或媒体资源数字ID。
- 关闭增强型衡量和Google Signals/广告个性化；本站显式发送page_view及tool_action，GA4本身还可能产生标准会话、首次访问和互动事件。
- 仅正式域名启用统计，预览、未知404不计数。
- 中英文访问者选择允许后才加载Google tag；拒绝或未选择不发送统计。页脚可调整/撤回选择。
- URL不包含query/hash，来源网址仅保留origin；工具事件仅携带固定工具名、操作类别和界面语言。按钮点击不代表转换成功。
- 为避免网址夹带用户资料，当前也不保留UTM推广参数，因此无法用这版统计区分具体UTM活动；可先看来源站点和GSC搜索表现。
- 不发送JSON、JWT、curl、正则测试文本、Hash原文、计算结果或自由输入的搜索词。
- 更新中英隐私页面；GA4会处理统计Cookie/标识、访问/设备及粗略地区等资料，不能称为完全匿名。

## 完成后如何验收与看报表

1. 打开正式网站并允许统计，进入两个工具并操作一次；GA4实时报告应能看到测试访问和tool_action。测试访问不是新获客。
2. 未允许或拒绝时浏览工具，确认没有Google脚本请求；撤回后停止后续事件。工具本身不受影响。
3. 管理→产品关联→Search Console关联，选择已验证的fategenie.com及此Web数据流；如要求新增授权，按实际权限确认。
4. 日常看流量获取（来源/媒介）、网页与屏幕、事件及界面语言；GSC看查询词、展现、点击和未收录原因。
5. 先形成每周观察习惯，数据量很小时不要把少量波动当作效果。后续只有真实需求才新增广告、营销跟踪或复杂事件。

## 当前接入检查点（2026-09-08）

账号创建流程已获授权，当前停在最终Google Analytics服务条款确认页，尚未接受。页面地区为中国，报表为北京时间，等待运营者确认地区及两项具体协议。网站代码已实现，配置中的measurementId保持为空；这不代表GA4已经开始收数。

本地48项测试通过，正式构建生成34页；使用模拟Google脚本检查了英文桌面和390px中文手机界面的同意、拒绝、撤回、按钮操作和隐私字段隔离。这些测试没有向真实GA4发送数据，仍须取得真实ID、核对后台开关、部署后验收实时报告及真实Cookie清理。

## 官方参考

- [Cloudflare统计差异说明](https://developers.cloudflare.com/analytics/faq/about-analytics/)
- [Cloudflare报表种类](https://developers.cloudflare.com/analytics/types-of-analytics/)
- [GA4网站设置](https://support.google.com/analytics/answer/14183469)
- [关联Search Console](https://support.google.com/analytics/answer/10737381)
- [Google tag同意模式](https://developers.google.com/tag-platform/security/guides/consent)
- [增强型衡量及自动采集内容](https://support.google.com/analytics/answer/9216061)
