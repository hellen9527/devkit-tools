# DevKit 当前进度与续作入口

更新：2026-09-06。英文：https://tools.fategenie.com/ 。中文：https://tools.fategenie.com/zh 。

## 当前结果

- 初版14工具正确性及手机适配、GitHub管理、Cloudflare部署、域名、Google验证与首次sitemap提交已完成。
- 完整中文版已上线。中英文各17页，共34页：各自首页、14工具、About、Privacy；共享算法，中文表单/按钮/错误/说明示例；62个HTTP状态描述支持中文搜索。
- 用户已明确选择浏览器语言方案，不采用亚洲IP。仅根首页/按保存偏好或浏览器首选语言选择中文/英文；直接工具网址保持语言。手动切换记住en/zh，不保存工具输入；存储禁用也可用。英文首页的?lang=en用于避免自动切换循环。
- 34页拥有独立标题、描述、canonical、双向en/zh-Hans/x-default hreflang及结构化数据；双语404；正式sitemap34条；未配置SITE_URL的预览仍noindex。
- 38项Node回归通过；本地真实浏览器测试全部14中文工具、两种语言的手机布局、手动切换与偏好记忆；需求和代码质量审查通过。详情docs/BILINGUAL-VERIFICATION.md。

## 最新发布与证据

- GitHub：git@github.com:hellen9527/devkit-tools.git；正式分支main。devkit/bilingual已快进合入，功能提交f427059。
- main推送后公网确认已更新：34页面HTTP200、各自canonical/hreflang/lang/H1正确、没有noindex；6个脚本/样式（含Regex Worker）与最终本地构建逐字节一致；4个未知或内部路径HTTP404。
- 完整结果：docs/bilingual-live-checks.json。旧docs/live-checks.json仅为初版17页历史证据。
- 锁屏导致本轮未能读取Cloudflare控制台构建编号；已通过公网内容及资源一致性确认功能发布。不要写成本轮已核对控制台绿色构建。
- 上次已确认的控制台构建是ff6bac9，build4224bd51-3373-487f-a96f-bd2a269159e4，19秒。首次build94d6aca5-99e2-4085-9b23-48d4cb480402。

## Google与百度状态

- Google Search Console：sc-domain:fategenie.com已经DNS验证；必须保留Google验证TXT及原_dnsauth记录。
- 已提交https://tools.fategenie.com/sitemap.xml，上次控制台状态成功、发现17页。现在同一公开地图已更新为34页，但本轮未读取Google重新处理后的发现数，不能声称Google已经发现34页。
- 上次首页索引库尚未收录；实时测试明确可编入索引，首页索引申请成功加入优先抓取队列。不要重复提交同一个首页，不把申请成功当作已经收录。
- 用户最新已明确告知“百度已完成登陆”。站点验证和提交尚未完成；不要要求重新登录。已准备17个中文网址清单docs/baidu-submit-urls.txt，可用于账户实际开放的手动提交入口。
- 本轮Mac已解锁，但Chrome控制随后只返回旧窗口标题、没有页面元素，截图报告不可用；重连及重置CUA后仍相同。已请用户把已登录的百度平台窗口切到前台并保持打开。这是浏览器控制阻塞，不是百度未登录。密码/验证码不发聊天、不记录。

## 下一次继续

1. 检查git状态和额度，阅读本文件；双语开发与部署已完成，不从头重做，不重复添加中文页。用户已报告百度登录，先恢复Chrome页面可读状态。
2. 用户解锁后，通过CUA重新获取Chrome状态，不能复用旧元素编号。查看Search Console现有sitemap和索引报告；检查/zh或代表中文工具的实时可抓取性，按实际需要申请新中文入口收录，不重复申请英文首页。
3. 读取已登录的百度平台后添加/验证tools.fategenie.com，使用账户实际开放的普通收录入口提交中文工具链接。有sitemap权限再提交地图；不要假定所有账户都有该入口。DNS或HTML验证依照实际平台要求，保留现有记录。
4. 推广草稿在docs/SEO-PROMOTION.zh-CN.md：JSON中英文、curl/Cron中文均已准备，中文链接现已有效。尚未向外发布，未购买广告。只有用户明确要求发布时才发帖或发消息。
5. 有真实反馈/搜索数据后才扩工具和优化文案；不凭空添加大量工具，不承诺排名和流量。

## 维护与已知范围

- Node22+；npm ci；npm test；默认npm run dev为noindex预览。正式构建SITE_URL=https://tools.fategenie.com npm run build。
- Cloudflare Worker devkit-tools，main自动部署，构建npm test && npm run build，部署npx wrangler deploy。非生产分支构建关闭。只发布dist，不上传docs/tests/备份。
- wrangler.jsonc保留tools.fategenie.com custom_domain、workers_dev=false、preview_urls=false。不要更换现有托管方案。
- Cron五字段、本地时区、未来8年内最多5次；curl字面量参数且Windows终端尚未实机验收；JWT不验签；CIDR仅IPv4；Base64是UTF-8文本；Regex1秒超时、1000匹配上限。详情各工具页。
- 工具输入不存储、不上传；语言偏好是唯一应用localStorage项。网站无应用访问统计、广告脚本；不声称掌握留存或转化率。

## 授权与额度续作

已授权GitHub仅此仓库的Cloudflare连接、此前展开并批准的构建API令牌权限、正式域名部署、GSC验证提交及普通合法维护操作。不要重复询问相同权限；系统强制本人操作的登录或新增敏感授权仍按实际要求处理。

不得购买域名或额度，不使用重置券。五小时或周额度剩余不足10%时存档等待。原有heartbeat id=devkit；本轮完成所有不依赖本人操作的工作后暂停，等待用户将已登录的Chrome窗口切到前台恢复控制（问题已提出），不重复创建。后续额度不足且存在可执行待办时可恢复原任务。

## 2026-09-08：搜索与GA4新进展（进行中）

- CUA控制已恢复。GSC站点地图最新读取2026-09-07、成功、发现34页面；中文首页https://tools.fategenie.com/zh已明确显示“网址已收录到Google / 网页已编入索引”，不要重复申请该网址。
- GSC概览显示0次网页搜索点击，索引汇总仍提示处理数据。不可声称全部34页已收录。
- 用户新增要求配置GSC/GA4访问监控，已解释Cloudflare请求口径与GSC搜索/GA4访问口径不同。
- Google账号Analytics尚无账号，已进入新建流程；账号DevKit、4项可选数据共享关闭。自动审批曾拦截“下一步”涉及创建账号/条款，用户已明确回复“允许创建账号并继续”，随后已进入媒体资源设置。
- 媒体资源名称DevKit Tools已填；界面默认报告时区中国时间GMT+08、币种人民币。已到最终服务条款弹窗（国家中国），尚未接受；已询问确认中国大陆运营者/北京时间及允许接受两项具体协议，等待回复。账号创建授权已收到，不要重复问同一个授权。
- 开发分支devkit/analytics；统计方案/计划在docs/superpowers/{specs,plans}/2026-09-08-analytics.md。网页接入正在独立开发，真实G-衡量ID尚未取得，GA4尚未在正式站生效。
- 百度已实际读取登录成功账号；点击添加网站弹出“完善账户信息”，必填真实姓名/职务/QQ/微信/所在地并接受隐私声明，手机邮箱已掩码绑定。已请用户直接在平台填写保存（不索取这些个人信息到聊天）。尚未进入域名验证。
- GA4接入代码已完成初审：生产域名与已知页面校验、中英文允许/拒绝/撤回、只发固定按钮操作枚举、移除URL查询与片段及来源路径，不上传工具内容。config/analytics.json仍为空，不要用测试ID发布。48项测试通过，正式构建34页；独立代码复核已通过，发现的中文首页自动跳转重复计数问题已修复并加入集成回归。实际Google脚本、Cookie命名和实时收数仍需上线后验证。
- Google最终协议链接：https://marketingplatform.google.com/about/analytics/terms/cn/；数据处理条款：https://privacy.google.com/businesses/processorterms/。待明确回复后，再通过CUA读取新元素编号、勾选和接受，创建Web数据流tools.fategenie.com，关闭全部增强型衡量及Signals/广告个性化，取得真实G-ID后接入。此时尚无正式账号/媒体资源/数据流ID。

## 可复用部署技能（2026-09-08）

- 用户要求将已完成的Cloudflare部署流程沉淀为个人skill，以后发布可复用。源码位于skills/cloudflare-github-deploy；个人安装位置~/.codex/skills/cloudflare-github-deploy，调用名$cloudflare-github-deploy。
- 主文件只保留发布和验收短流程；references/setup.md保存首次配置、域名与排错，references/devkit.md保存本站已知参数，均不包含凭据。已有Pages或其他项目不自动迁移，不复制本站域名/权限。
- 本轮只整理技能和保存代码，不触发正式站部署。GA4最终协议、真实ID与上线收数的等待状态仍如上所述。
