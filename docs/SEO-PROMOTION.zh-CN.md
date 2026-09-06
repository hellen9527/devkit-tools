# DevKit 搜索与首批用户推广

## 已有SEO

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
中文工具：上线后再加入/zh/json链接，未验收前不发布。

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
