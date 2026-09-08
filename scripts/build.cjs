'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const decode=s=>s.replace(/&(?:amp|lt|gt|quot|apos|#39|#\d+|#x[\da-f]+);/gi,entity=>{
 const known={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'"};
 if(known[entity])return known[entity];
 const n=entity.startsWith('&#x')?parseInt(entity.slice(3,-1),16):parseInt(entity.slice(2,-1),10);
 return Number.isInteger(n)&&n>=0&&n<=0x10ffff?String.fromCodePoint(n):entity;
});
// Translate only authored display text and accessible labels. Code, examples,
// scripts, input values and textarea contents must remain byte-for-byte intact.
function localizeMarkup(markup, dictionary){
 let protectedTag='';
 const translate=text=>{
  const trimmed=text.trim();const value=dictionary[trimmed]??dictionary[decode(trimmed)];
  return value===undefined?text:text.replace(trimmed,()=>escape(value));
 };
 return markup.replace(/<(?:[^>"']|"[^"]*"|'[^']*')*>|[^<]+|</g,token=>{
  if(protectedTag){if(new RegExp('^</'+protectedTag+'\\s*>$','i').test(token))protectedTag='';return token;}
  if(token.startsWith('<')){
   const match=token.match(/^<(script|style|textarea|pre|code|svg)\b/i);
   if(match)protectedTag=match[1];
   return token.replace(/\b(aria-label|placeholder|title)=("([^"]*)"|'([^']*)')/g,(_,attr,quoted,doubleValue,singleValue)=>`${attr}=${quoted[0]}${translate(doubleValue??singleValue)}${quoted[0]}`);
  }
  return translate(token);
 });
}
function buildSite({outDir=path.join(root,'dist'),siteUrl=process.env.SITE_URL||'',analyticsConfig=json('config/analytics.json')}={}){
 let base='';
 if(siteUrl){
  const u=new URL(siteUrl);
  if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw new Error('SITE_URL must be an HTTPS origin without path, credentials, query or fragment.');
  base=u.origin;
 }
 const measurementId=analyticsConfig?.measurementId??'';
 if(typeof measurementId!=='string'||(measurementId&&!/^G-[A-Z0-9]+$/.test(measurementId)))throw new Error('analytics measurementId must be empty or a valid G- measurement ID.');
 const analyticsEnabled=base==='https://tools.fategenie.com'&&!!measurementId;
 const source=read('index.html');
 const css=source.match(/<style>([\s\S]*?)<\/style>/)[1];
 const app=source.slice(source.indexOf('<script>\n"use strict";')+8,source.lastIndexOf('</script>'));
 const meta=app.slice(app.indexOf('const ICONS'),app.indexOf('/* ===================== Router'));
 const {TOOLS,GROUPS,ICONS}=vm.runInNewContext(meta+';({TOOLS,GROUPS,ICONS})');
 const statuses=vm.runInNewContext(app.match(/const HTTP_STATUS = \[[\s\S]*?\n\];/)[0]+';HTTP_STATUS');
 const content=json('content/tools.json');
 const zh={meta:json('content/zh-CN/metadata.json'),content:json('content/zh-CN/tools.json'),ui:json('content/zh-CN/ui.json'),http:json('content/zh-CN/http-status.json')};
 const sections=new Map([...source.matchAll(/<section class="view(?: active)?" id="view-([\w-]+)">[\s\S]*?<\/section>/g)].map(m=>[m[1],m[0]]));
 if(sections.size!==TOOLS.length+1)throw new Error('Tool sections could not be extracted.');
 for(const t of TOOLS)if(!content[t.id]||!zh.content[t.id]||!zh.meta[t.id]||!sections.has(t.id))throw new Error('Missing tool content: '+t.id);
 fs.mkdirSync(path.join(outDir,'assets'),{recursive:true});
 const write=(file,data)=>{const dest=path.join(outDir,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,data);};
 const asset=(name,ext,data)=>{const file=`assets/${name}.${createHash('sha256').update(data).digest('hex').slice(0,12)}.${ext}`;write(file,data);return '/'+file;};
 const worker=asset('regex-worker','js',read('assets/regex-worker.js'));
 const appUrl=asset('app','js',app.replace("'/assets/regex-worker.js'",JSON.stringify(worker)));
 const localeUrl=asset('zh-CN','js','globalThis.DEVKIT_LOCALE='+JSON.stringify({ui:zh.ui,http:zh.http}).replace(/</g,'\\u003c')+';');
 const i18nUrl=asset('i18n','js',read('assets/i18n.js'));
 const languageUrl=asset('language','js',read('assets/language.js'));
 const analyticsUrl=analyticsEnabled?asset('analytics','js',read('assets/analytics.js')):'';
 const analyticsCssUrl=analyticsEnabled?asset('analytics','css',read('assets/analytics.css')):'';
 const cssUrl=asset('style','css',css+`\n.tool-guide{margin-top:36px;border-top:1px solid var(--border);padding-top:20px;max-width:900px;line-height:1.65}.tool-guide h2{font-size:20px;margin:24px 0 12px}.tool-guide li{margin:8px 0}.tool-guide p{color:var(--muted)}.tool-guide pre{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:18px;font-size:14px}.site-footer{display:flex;gap:24px;flex-wrap:wrap;margin-top:40px;padding:20px 0;border-top:1px solid var(--border)}.site-footer a{color:var(--muted)}.noscript{padding:12px;background:var(--panel2);color:var(--accent)}.language-switch{display:flex;align-items:center;gap:4px;white-space:nowrap;font-size:12px}.language-switch a{padding:6px 8px;border-radius:5px;color:var(--muted);text-decoration:none}.language-switch a[aria-current]{color:var(--accent);background:var(--panel2)}.language-switch a:focus-visible{outline:2px solid var(--accent)}.topbar-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.topbar-right{flex-shrink:0;gap:12px}html[lang="zh-Hans"] .tool-desc,html[lang="zh-Hans"] .tc-desc{line-height:1.75}@media(max-width:768px){.topbar-right .privacy-chip{display:none}.language-switch a{padding:8px 6px}.topbar{gap:6px}.topbar-right{margin-left:auto}.menu-btn{flex-shrink:0}}\n`);
 const icon=source.match(/<link rel="icon"[^>]*>/)[0];
 const paths=[];
 for(const language of ['en','zh']){
  const chinese=language==='zh';
  const prefix=chinese?'/zh':'';
  const route=id=>prefix+(id==='home'?(prefix?'':'/'):'/'+id);
  const output=id=>(chinese?'zh/':'')+(id==='home'?'':id+'/')+'index.html';
  const tools=TOOLS.map(t=>chinese?{...t,...zh.meta[t.id]}:t);
  const text=(en,cn)=>chinese?cn:en;
  const footer=`<footer class="site-footer"><a href="${route('home')}">${text('All tools','全部工具')}</a><a href="${route('about')}">${text('About','关于')}</a><a href="${route('privacy')}">${text('Privacy','隐私')}</a>${analyticsEnabled?`<button type="button" class="analytics-preferences" id="analytics-preferences" aria-controls="analytics-consent" hidden>${text('Analytics preferences','统计偏好')}</button>`:''}</footer>`;
  const groupNames={time:'日期与时间',format:'格式处理',encoding:'编码与转换',text:'文本与正则',security:'安全与网络',generate:'生成工具'};
  const nav=selected=>GROUPS.map(g=>'<div class="nav-group-label">'+escape(chinese?groupNames[g.id]:g.name)+'</div>'+tools.filter(t=>t.group===g.id).map(t=>`<a class="nav-item${t.id===selected?' active':''}" href="${route(t.id)}" data-tool="${t.id}"${t.id===selected?' aria-current="page"':''}>${ICONS[t.id]}<span>${escape(t.name)}</span></a>`).join('')).join('');
  const grid=tools.map(t=>`<a class="tool-card" href="${route(t.id)}"><div class="tc-icon">${ICONS[t.id]}</div><div class="tc-name">${escape(t.name)}</div><div class="tc-desc">${escape(t.desc)}</div><div class="tc-run"><span>${t.id}</span></div></a>`).join('');
  function page(id,title,description,section,{noindex=false,tool=null}={}){
   const pagePath=route(id);const url=base+pagePath;
   const enPath=id==='home'?'/':'/'+id;const zhPath='/zh'+(id==='home'?'':'/'+id);
   const graph=tool?{'@type':'WebApplication',name:tool.name,description:tool.desc,url,inLanguage:chinese?'zh-Hans':'en',applicationCategory:'DeveloperApplication',operatingSystem:'Any',browserRequirements:'Requires JavaScript',offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}}:{'@type':id==='home'?'WebSite':'WebPage',name:title,url,inLanguage:chinese?'zh-Hans':'en'};
   const alternatives=base&&!noindex?[['en',enPath],['zh-Hans',zhPath],['x-default',enPath]].map(([lang,p])=>`<link rel="alternate" hreflang="${lang}" href="${escape(base+p)}">`).join(''):'';
   const head=`<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escape(title)}</title><meta name="description" content="${escape(description)}"><meta name="theme-color" content="#0c0f14">${icon}\n${!base||noindex?'<meta name="robots" content="noindex, follow">':`<link rel="canonical" href="${escape(url)}">`}${alternatives}\n<meta property="og:type" content="website"><meta property="og:site_name" content="DevKit"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:locale" content="${chinese?'zh_CN':'en_US'}">${base?`<meta property="og:url" content="${escape(url)}">`:''}<meta name="twitter:card" content="summary">\n${base&&!noindex?'<script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org',...graph}).replace(/</g,'\\u003c')+'</script>':''}\n<link rel="stylesheet" href="${cssUrl}">${chinese?`<script defer src="${localeUrl}"></script>`:''}<script defer src="${i18nUrl}"></script><script defer src="${languageUrl}"></script><script defer src="${appUrl}"></script>${analyticsEnabled&&!noindex?`<link rel="stylesheet" href="${analyticsCssUrl}"><script defer src="${analyticsUrl}" data-measurement-id="${measurementId}"></script>`:''}`;
   let html=source.replace(/<head>[\s\S]*?<\/head>/,'<head></head>').replace(/<script>\n"use strict";[\s\S]*?<\/script>/,'').replace(/<script[^>]*src="\/?assets\/i18n\.js"[^>]*><\/script>/g,'').replace('<body>',`<body data-page="${id}">`);
   html=html.replace(/<section class="view(?: active)?" id="view-[\w-]+">[\s\S]*?<\/section>/g,'');
   html=html.replace('<div class="content" id="content" tabindex="-1">','<div class="content" id="content" tabindex="-1"><noscript><p class="noscript">'+text('Enable JavaScript to run the tools. Instructions and navigation are available below.','运行工具需要启用 JavaScript。下方的说明和导航仍可使用。')+'</p></noscript>'+section);
   html=html.replace('<nav class="nav" id="nav"></nav>','<nav class="nav" id="nav" aria-label="'+text('Tools','工具')+'">'+nav(id)+'</nav>');
   html=html.replace('id="topbarTitle">toolbox','id="topbarTitle">'+escape(tool?tool.name:id==='home'?text('toolbox','工具箱'):title.split(' — ')[0]));
   html=html.replace('href="/" data-route=""',`href="${route('home')}" data-route=""`);
   html=html.replace(/<!--[^]*?-->/g,'');
   if(chinese)html=localizeMarkup(html,zh.ui);
   const switcher=`<nav class="language-switch" aria-label="${text('Language','语言')}"><a data-language="en" href="${noindex?'/?lang=en':enPath+(id==='home'?'?lang=en':'')}" lang="en"${!chinese?' aria-current="true"':''}>English</a><a data-language="zh" href="${noindex?'/zh':zhPath}" lang="zh-Hans"${chinese?' aria-current="true"':''}>中文</a></nav>`;
   html=html.replace('<div class="topbar-right">','<div class="topbar-right">'+switcher);
   html=html.replace(/<html lang="[^"]*">/,`<html lang="${chinese?'zh-Hans':'en'}">`).replace('<head></head>','<head>\n'+head+'\n</head>');
   if(noindex)html=html.replace(/<button[^>]*id="analytics-preferences"[^>]*>[^<]*<\/button>/,'');
   if(analyticsEnabled&&!noindex){
    const consent=`<aside class="analytics-consent" id="analytics-consent" aria-labelledby="analytics-consent-title" hidden><h2 id="analytics-consent-title">${text('Optional analytics','可选访问统计')}</h2><p>${text('Allow Google Analytics 4 to measure page visits and selected tool button clicks? Tool inputs and outputs are never included. Google receives website request information and uses analytics cookies only after you allow it. You can change your choice here at any time.','是否允许 Google Analytics 4 统计页面访问和部分工具按钮点击？统计不包含工具输入或输出。仅在您允许后，Google 才会接收网站请求信息并使用统计 Cookie。您可以随时在此更改选择。')} <a href="${route('privacy')}">${text('Privacy details','隐私详情')}</a></p><div class="analytics-consent-actions"><button type="button" id="analytics-allow" class="btn">${text('Allow analytics','允许统计')}</button><button type="button" id="analytics-reject" class="btn">${text('Reject analytics','拒绝统计')}</button></div><div class="analytics-consent-secondary"><button type="button" id="analytics-withdraw" hidden>${text('Withdraw consent','撤回同意')}</button><button type="button" id="analytics-close">${text('Close','关闭')}</button></div></aside>`;
    html=html.replace('</body>',consent+'\n</body>');
   }
   return html;
  }
  let home=sections.get('home').replace('<div class="tool-grid" id="toolGrid"></div>','<div class="tool-grid" id="toolGrid">'+grid+'</div>').replace('</section>',footer+'</section>');
  write(output('home'),page('home',text('Free Developer Tools — DevKit','免费在线开发者工具箱 — DevKit'),text('14 free developer tools for formatting, encoding, dates and debugging. Tool inputs are processed in your browser. No account needed.','14 款免费程序员工具，涵盖 JSON 格式化、编码转换、时间处理与调试。输入在浏览器本地处理，无需注册。'),home));
  for(const t of tools){
   const c=(chinese?zh.content:content)[t.id];
   const guide=`<div class="tool-guide"><h2>${chinese?'使用方法':'How to use '+escape(t.name)}</h2><ol>${c.steps.map(s=>'<li>'+escape(s)+'</li>').join('')}</ol><h2>${text('Example','示例')}</h2><pre>${escape(c.example)}</pre><h2>${text('Details and limitations','说明与限制')}</h2><p>${escape(c.note)}</p></div>`;
   let section=sections.get(t.id).replace('class="view"','class="view active"').replace('</section>',guide+footer+'</section>');
   if(chinese)section=section.replace(/(<h1 class="tool-title">)[^]*?(<\/h1>)/,(_,a,b)=>a+escape(t.name)+b).replace(/(<p class="tool-desc">)[^]*?(<\/p>)/,(_,a,b)=>a+escape(t.desc)+b);
   if(chinese&&t.id==='json')section=section.replace(/(<pre class="pre empty" id="json-out">)([^<]*)(<\/pre>)/,(_,a,label,b)=>a+escape(zh.ui[label]||label)+b);
   if(t.id==='http-status'){
    const labels=chinese?['信息响应','成功响应','重定向','客户端错误','服务器错误']:['Informational','Successful','Redirection','Client Error','Server Error'];
    const list=labels.map((label,i)=>{
     const rows=statuses.filter(([c])=>Number(c[0])===i+1);
     return '<div class="status-group"><h3><span class="code-range">'+(i+1)+'xx · '+label+'</span> · '+rows.length+'</h3>'+rows.map(([code,name,desc])=>'<div class="status-item"><span class="status-code">'+escape(code)+'</span><span class="status-name">'+escape(name)+'</span><span class="status-desc">'+escape(chinese?zh.http[code]:desc)+'</span></div>').join('')+'</div>';
    }).join('');
    section=section.replace('<div id="http-list"></div>','<div id="http-list">'+list+'</div>');
   }
   write(output(t.id),page(t.id,t.name+text(' — Free Online Tool | DevKit',' — 免费在线工具 | DevKit'),t.desc+text(' Process inputs locally in your browser.',' 输入在浏览器本地处理。'),section,{tool:t}));
  }
  const article=(heading,body)=>`<section class="view active"><h1 class="tool-title">${heading}</h1><div class="tool-guide">${body}</div>${footer}</section>`;
  write(output('about'),page('about',text('About — DevKit','关于 — DevKit'),text('About DevKit, a free browser-based collection of developer tools.','了解 DevKit：免费、无需注册、在浏览器本地运行的开发者工具合集。'),article(text('About DevKit','关于 DevKit'),text('<p>DevKit is a collection of 14 focused tools for everyday programming tasks, from formatting JSON to checking CIDR ranges. No account is required.</p><p>Tool inputs are processed by JavaScript in your browser. Each tool documents examples and supported behavior. The aim is useful, understandable output with explicit errors when an input cannot be handled.</p><p>This is an early release. Check important results against your application requirements, especially when working across shell environments and timezones.</p>','<p>DevKit 提供 14 款常用开发工具，支持 JSON 格式化、编码转换、时间处理、网络地址计算等日常任务，无需注册。</p><p>工具通过浏览器中的 JavaScript 在本地处理输入，每个工具均提供使用方法、示例和支持范围。当输入无法处理时，会给出明确提示。</p><p>目前为早期版本。处理重要数据时，请根据实际应用要求核对结果，尤其注意不同终端环境和时区带来的差异。</p>'))));
  write(output('privacy'),page('privacy',text('Privacy — DevKit','隐私说明 — DevKit'),text('How DevKit handles tool inputs, language preference and website requests.','了解 DevKit 如何处理工具输入、语言偏好及网站访问请求。'),article(text('Privacy','隐私说明'),text('<h2>Tool inputs</h2><p>The tools process input locally in your browser. Application code does not upload tool inputs or store them in cookies or local storage. Navigating away or reloading clears the current tool state.</p><h2>Language preference</h2><p>Your manual language preference is saved in local storage as devkit-language. This stores only en or zh, never tool inputs. Clear website storage to remove it. If storage is disabled, language links still work. On the English homepage, your browser language provides the default when no preference is saved.</p><h2>Website delivery</h2><p>Cloudflare hosts the website. When you visit, your browser sends ordinary website requests to Cloudflare, including your IP address and browser request information. Hosting and security logs may contain this request information.</p>'+(analyticsEnabled?'<h2>Analytics and advertising</h2><p>Google Analytics 4 is optional and loads only after you explicitly allow analytics. Rejecting analytics sends no analytics requests to Google. There are no advertising tags, Google Signals or ad personalization.</p><p>After consent, analytics records page visits and selected tool button clicks, with fixed tool names, action names and interface language. Clicks indicate actions, not successful results. Tool inputs, outputs, search text and error messages are never included. Page addresses exclude query strings and fragments; referrers include only the origin. UTM campaign attribution is deliberately not retained because campaign query parameters are removed.</p><p>GA4 also records standard session and engagement information. Google receives ordinary connection and device information, including the IP address used to deliver requests, and uses analytics cookies to recognize visits. Consent is saved in local storage as devkit-analytics-consent (granted or denied). If storage is unavailable, the choice applies only to the current page.</p><p>Open Analytics preferences in the footer to change your choice or withdraw consent. Withdrawal stops future analytics events and removes cookies assigned to this analytics property; it does not erase previously collected reports. Clearing website storage also removes your saved choice. See <a href="https://policies.google.com/privacy" rel="noopener noreferrer">Google’s privacy policy</a> and <a href="https://policies.google.com/technologies/partner-sites" rel="noopener noreferrer">how Google uses information from sites that use its services</a>.</p>':'<h2>Analytics and advertising</h2><p>This version does not include advertising scripts or application analytics. If that changes, this page will be updated.</p>'),'<h2>工具输入</h2><p>工具在浏览器本地处理输入。应用代码不会上传工具输入，也不会将其保存在 Cookie 或本地存储中。离开页面或刷新后，当前工具状态会清空。</p><h2>语言偏好</h2><p>手动选择的语言偏好保存在本地存储 devkit-language 中，仅记录 en 或 zh，不含工具输入。清除网站存储即可删除。禁用存储时仍可通过语言链接切换。在英文首页尚未保存偏好时，会按浏览器首选语言设置默认语言。</p><h2>网站访问</h2><p>本网站由 Cloudflare 托管。访问时，浏览器会向 Cloudflare 发送正常的网站请求，包括 IP 地址及浏览器请求信息。托管和安全日志可能包含这些请求信息。</p>'+(analyticsEnabled?'<h2>统计与广告</h2><p>Google Analytics 4 为可选功能，仅在您明确允许统计后加载。拒绝统计时，不会向 Google 发送统计请求。本网站不使用广告标签、Google Signals 或广告个性化。</p><p>同意后，统计记录页面访问和部分工具按钮点击，仅使用预设的工具名称、操作名称与界面语言。点击代表操作，不代表处理成功。工具输入、输出、搜索文字和错误信息均不纳入统计。页面地址不含查询参数或片段；来源地址仅保留源站。由于移除了活动查询参数，本网站特意不保留 UTM 活动归因。</p><p>GA4 还会记录标准会话与互动信息。Google 会接收常规连接及设备信息，包括发送请求所使用的 IP 地址，并使用统计 Cookie 识别访问。统计选择保存在本地存储 devkit-analytics-consent 中，仅记录 granted 或 denied。存储不可用时，选择仅对当前页面有效。</p><p>可通过页脚的“统计偏好”更改选择或撤回同意。撤回后停止发送后续统计事件，并删除此统计属性的 Cookie；已收集的报告不会因此删除。清除网站存储也会移除已保存的选择。详情请参阅 <a href="https://policies.google.com/privacy" rel="noopener noreferrer">Google 隐私政策</a>及<a href="https://policies.google.com/technologies/partner-sites" rel="noopener noreferrer">Google 如何使用来自其合作网站的信息</a>。</p>':'<h2>统计与广告</h2><p>当前版本未加入广告脚本或应用访问统计。未来如有变化，将更新本页说明。</p>')))));
  if(!chinese)write('404.html',page('404','Page not found / 页面不存在 — DevKit','The requested page does not exist. 请求的页面不存在。',article('Page not found / 页面不存在','<p>This address does not point to a tool. Use the navigation or return to all tools.</p><p lang="zh-Hans">此网址没有对应页面。请使用导航，或前往<a href="/zh">中文工具首页</a>。</p>'),{noindex:true}));
  paths.push(route('home'),...tools.map(t=>route(t.id)),route('about'),route('privacy'));
 }
 write('robots.txt',base?`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n');
 write('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+(base?paths.map(p=>'<url><loc>'+escape(base+p)+'</loc></url>').join(''):'')+'</urlset>\n');
 write('_headers','/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n'+(!base?'  X-Robots-Tag: noindex\n':''));
 return {tools:TOOLS.length,pages:paths.length,siteUrl:base||null};
}
if(require.main===module){
 // Only the fixed generated output is cleared by the CLI; never remove a caller's arbitrary directory.
 fs.rmSync(path.join(root,'dist'),{recursive:true,force:true});
 console.log(buildSite());
}
module.exports={buildSite,localizeMarkup};
