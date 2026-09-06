# DevKit 搜索与首批用户推广

## 已有SEO

2026-09-06：中文版已上线，公开站点地图为34页，中英文canonical/hreflang及全部页面公网验收通过。Google控制台上次发现17页，新处理状态待核对；百度尚未登录提交。

每工具独立静态页面、标题/说明/示例、canonical、结构化数据；robots和站点地图；Google域名验证完成，地图处理成功并发现17页面；首页实时抓取通过，索引申请已提交。该状态说明搜索引擎可以发现网站，不代表已获得排名或流量。新的实际收录状态以Search Console为准。

## 推进顺序

1. 先完成真实中文版本和双语SEO。中文工具页用用户实际会搜的词，例如“JSON格式化 大整数不丢精度”“Cron表达式解析”“Unix时间戳转换”，自然放在标题和说明里，不堆砌关键词。
2. 中文站部署后，在百度搜索资源平台添加/验证网站，再使用账户实际开放的“普通收录”入口提交中文工具链接；若有sitemap入口则提交网站地图。百度说明提交可帮助发现链接，但不保证收录。登录、验证码或手机验证视实际页面处理，不记录用户密码。
3. 为3个主打工具各准备一篇解决具体问题的短文：JSON大整数、curl跨shell引号、Cron时区。每篇只链接到对应工具，提供可复制示例、结果及限制。先按用户所在社区的规则发布，不批量复制或灌水。
4. 请真实开发者试用：重点询问“哪一步卡住”“哪种输入结果不对”“手机能否完成操作”。优先修复反馈，再扩工具数量。
5. 有数据后查看Search Console的查询词、展现、点击、索引问题；有展现但点击少则改标题/摘要，有访问却不好用则改工具流程。不要反复申请同一URL收录。

“快”的第一步是直接分享能解决具体问题的页面，SEO通常需要等待抓取和积累内容。当前不建议花钱买排名、外链套餐或虚假访问量。

## 可审阅的中文首发草稿（未发布）

标题：JSON格式化时，大整数为什么可能悄悄变了？

接口返回 {"id":9007199254740993}，格式化后却变成9007199254740992？如果工具先把JSON解析成JavaScript Number，再序列化，超出安全整数范围的数字可能失去精度。

我做了一个轻量开发者工具站DevKit。JSON格式化会保留原始数字文本、键顺序和重复键，而不通过重新序列化数值来美化；可以直接用上面的样例试试。重复键虽然保留，但不同应用对它的解释仍可能不同。

英文工具：https://tools.fategenie.com/json
中文工具：https://tools.fategenie.com/zh/json

工具输入在浏览器本地处理，不需要注册。欢迎反馈不能正确处理的样例，尤其是大整数、转义字符和手机操作问题。请先删除样例中的真实密钥或个人信息。

## 英文首发草稿（未发布）

Title: A JSON formatter that keeps large integer text intact

Try formatting {"id":9007199254740993}. A formatter that parses this into a JavaScript Number and serializes it again can change the last digit. DevKit preserves the original number tokens when formatting or minifying JSON, along with key order and duplicate keys.

Try it: https://tools.fategenie.com/json

The tool processes inputs locally in the browser and needs no account. Duplicate keys remain ambiguous across other applications, so preserving them is not a recommendation to use them. Feedback on edge cases and mobile usability is welcome; please remove credentials or personal data from any example you share.

## 官方资料

- [Google多语言站点](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)
- [百度站点管理](https://ziyuan.baidu.com/site/index)
- [百度普通收录说明](https://ziyuan.baidu.com/linksubmit/index)

## 第二篇草稿：curl 换个终端为什么就不能运行了？（未发布）

同一条 curl 命令，直接从 Bash 粘贴到 cmd.exe 或 PowerShell，可能因为引号、空格和续行规则不同而改变参数。例如请求头 `X-Name: Jane Doe` 必须作为一个参数传递，空字符串参数也不能丢失。

DevKit 的 curl 转换工具会把字面量参数转换成目标终端的写法，并明确拒绝变量展开、命令替换和管道等不支持的情况。它只生成命令，不发送网络请求。自动识别不明确时，请手动选择来源终端。

适用范围：Bash/zsh、交互式 cmd.exe，以及采用标准原生参数传递的 PowerShell 7.3+。cmd 输出不适用于 .bat 文件；Windows 输出有解析器回归测试，但尚未在真实 Windows 终端验收。

演示输入：`curl -H 'X-Name: Jane Doe' 'https://example.com'`

工具：https://tools.fategenie.com/zh/curl

## 第三篇草稿：Cron 写了星期一，为什么月初也会运行？（未发布）

试一下五字段表达式 `0 9 1 * MON`。当“日”和“星期”都有限制时，常见 Unix Cron 规则采用“或”：每月 1 日或每周一的 09:00 都可能运行，并不是只在“恰好是周一的每月 1 日”运行。

DevKit 会解释字段含义，并列出本地时区中接下来的最多 5 次运行时间。你可以拿计划执行日期逐项核对。它支持五字段 Cron，不支持 Quartz 的 `?`、`L`、`#`；具体任务调度平台的语法和时区设置仍应单独确认。

演示输入：`0 9 1 * MON`；再与 `0 9 * * MON` 对比。

工具：https://tools.fategenie.com/zh/cron

## 首批推广的执行与观察

- 每次分享一个具体问题及可复现样例，链接到对应工具；先选择自己已参与、允许此类分享的开发者社区。上述草稿目前均未对外发布。
- 首批目标是拿到真实可操作反馈，记录工具、输入样例、预期结果、实际结果和设备；不以工具数量或虚假访问量作为成果。
- 每周查看 Search Console 的查询词、页面、展现、点击及索引状态；新站数据不足时不根据零散波动大改页面。
- 百度需要站长账号登录后才能添加/验证站点。2026-09-06 已实际打开登录页，尚未完成登录和提交；不能把公开入口可访问写成已提交。
- 本站当前没有应用访问统计；因此不能声称已掌握站内转化率、留存或工具使用次数。先用搜索数据与明确反馈判断是否值得增加统计功能。
