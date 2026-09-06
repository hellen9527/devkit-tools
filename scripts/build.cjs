'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function buildSite({outDir=path.join(root,'dist'),siteUrl=process.env.SITE_URL||''}={}){
 let base='';
 if(siteUrl){
  const u=new URL(siteUrl);
  if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw new Error('SITE_URL must be an HTTPS origin without path, credentials, query or fragment.');
  base=u.origin;
 }
 const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const css=source.match(/<style>([\s\S]*?)<\/style>/)[1];
 const app=source.slice(source.indexOf('<script>\n"use strict";')+8,source.lastIndexOf('</script>'));
 const meta=app.slice(app.indexOf('const ICONS'),app.indexOf('/* ===================== Router'));
 const {TOOLS,GROUPS,ICONS}=vm.runInNewContext(meta+';({TOOLS,GROUPS,ICONS})');
 const statuses=vm.runInNewContext(app.match(/const HTTP_STATUS = \[[\s\S]*?\n\];/)[0]+';HTTP_STATUS');
 const content=JSON.parse(fs.readFileSync(path.join(root,'content/tools.json'),'utf8'));
 const sections=new Map([...source.matchAll(/<section class="view(?: active)?" id="view-([\w-]+)">[\s\S]*?<\/section>/g)].map(m=>[m[1],m[0]]));
 if(sections.size!==TOOLS.length+1)throw new Error('Tool sections could not be extracted.');
 for(const t of TOOLS)if(!content[t.id]||!sections.has(t.id))throw new Error('Missing tool content: '+t.id);
 fs.mkdirSync(path.join(outDir,'assets'),{recursive:true});
 const write=(file,data)=>{const dest=path.join(outDir,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,data);};
 const asset=(name,ext,data)=>{const file=`assets/${name}.${createHash('sha256').update(data).digest('hex').slice(0,12)}.${ext}`;write(file,data);return '/'+file;};
 const worker=asset('regex-worker','js',fs.readFileSync(path.join(root,'assets/regex-worker.js'),'utf8'));
 const appUrl=asset('app','js',app.replace("'/assets/regex-worker.js'",JSON.stringify(worker)));
 const cssUrl=asset('style','css',css+`\n.tool-guide{margin-top:36px;border-top:1px solid var(--border);padding-top:20px;max-width:900px;line-height:1.65}.tool-guide h2{font-size:20px;margin:24px 0 12px}.tool-guide li{margin:8px 0}.tool-guide p{color:var(--muted)}.tool-guide pre{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:18px;font-size:14px}.site-footer{display:flex;gap:24px;flex-wrap:wrap;margin-top:40px;padding:20px 0;border-top:1px solid var(--border)}.site-footer a{color:var(--muted)}.noscript{padding:12px;background:var(--panel2);color:var(--accent)}\n`);
 const footer='<footer class="site-footer"><a href="/">All tools</a><a href="/about">About</a><a href="/privacy">Privacy</a></footer>';
 const nav=selected=>GROUPS.map(g=>'<div class="nav-group-label">'+escape(g.name)+'</div>'+TOOLS.filter(t=>t.group===g.id).map(t=>`<a class="nav-item${t.id===selected?' active':''}" href="/${t.id}" data-tool="${t.id}"${t.id===selected?' aria-current="page"':''}>${ICONS[t.id]}<span>${escape(t.name)}</span></a>`).join('')).join('');
 const grid=TOOLS.map(t=>`<a class="tool-card" href="/${t.id}"><div class="tc-icon">${ICONS[t.id]}</div><div class="tc-name">${escape(t.name)}</div><div class="tc-desc">${escape(t.desc)}</div><div class="tc-run"><span>${t.id}</span></div></a>`).join('');
 const icon=source.match(/<link rel="icon"[^>]*>/)[0];
 function page(id,title,description,section,{noindex=false,tool=null}={}){
  const url=base+(id==='home'?'/':'/'+id);
  const graph=tool?{'@type':'WebApplication',name:tool.name,description:tool.desc,url,applicationCategory:'DeveloperApplication',operatingSystem:'Any',browserRequirements:'Requires JavaScript',offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}}:{'@type':'WebSite',name:'DevKit',url:base+'/'};
  const head=`<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escape(title)}</title><meta name="description" content="${escape(description)}"><meta name="theme-color" content="#0c0f14">${icon}\n${!base||noindex?'<meta name="robots" content="noindex, follow">':`<link rel="canonical" href="${escape(url)}">`}\n<meta property="og:type" content="website"><meta property="og:site_name" content="DevKit"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}">${base?`<meta property="og:url" content="${escape(url)}">`:''}<meta name="twitter:card" content="summary">\n${base&&!noindex?'<script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org',...graph}).replace(/</g,'\\u003c')+'</script>':''}\n<link rel="stylesheet" href="${cssUrl}"><script defer src="${appUrl}"></script>`;
  let html=source.replace(/<head>[\s\S]*?<\/head>/,'<head>\n'+head+'\n</head>').replace(/<script>\n"use strict";[\s\S]*?<\/script>/,'').replace('<body>',`<body data-page="${id}">`);
  html=html.replace(/<section class="view(?: active)?" id="view-[\w-]+">[\s\S]*?<\/section>/g,'');
  html=html.replace('<div class="content" id="content" tabindex="-1">','<div class="content" id="content" tabindex="-1"><noscript><p class="noscript">Enable JavaScript to run the tools. Instructions and navigation are available below.</p></noscript>'+section);
  html=html.replace('<nav class="nav" id="nav"></nav>','<nav class="nav" id="nav" aria-label="Tools">'+nav(id)+'</nav>');
  html=html.replace('id="topbarTitle">toolbox','id="topbarTitle">'+escape(tool?tool.name:id==='home'?'toolbox':title.split(' — ')[0]));
  html=html.replace(/<!--[^]*?-->/g,'');
  return html;
 }
 let home=sections.get('home').replace('<div class="tool-grid" id="toolGrid"></div>','<div class="tool-grid" id="toolGrid">'+grid+'</div>').replace('</section>',footer+'</section>');
 write('index.html',page('home','Free Developer Tools — DevKit','14 free developer tools for formatting, encoding, dates and debugging. Tool inputs are processed in your browser. No account needed.',home));
 for(const t of TOOLS){
  const c=content[t.id];
  const guide=`<div class="tool-guide"><h2>How to use ${escape(t.name)}</h2><ol>${c.steps.map(s=>'<li>'+escape(s)+'</li>').join('')}</ol><h2>Example</h2><pre>${escape(c.example)}</pre><h2>Details and limitations</h2><p>${escape(c.note)}</p></div>`;
  let section=sections.get(t.id).replace('class="view"','class="view active"').replace('</section>',guide+footer+'</section>');
  if(t.id==='http-status'){
   const labels=['Informational','Successful','Redirection','Client Error','Server Error'];
   const list=labels.map((label,i)=>{
    const rows=statuses.filter(([c])=>Number(c[0])===i+1);
    return '<div class="status-group"><h3><span class="code-range">'+(i+1)+'xx · '+label+'</span> · '+rows.length+'</h3>'+rows.map(([code,name,desc])=>'<div class="status-item"><span class="status-code">'+escape(code)+'</span><span class="status-name">'+escape(name)+'</span><span class="status-desc">'+escape(desc)+'</span></div>').join('')+'</div>';
   }).join('');
   section=section.replace('<div id="http-list"></div>','<div id="http-list">'+list+'</div>');
  }
  write(t.id+'/index.html',page(t.id,t.name+' — Free Online Tool | DevKit',t.desc+' Process inputs locally in your browser.',section,{tool:t}));
 }
 const article=(heading,text)=>`<section class="view active"><h1 class="tool-title">${heading}</h1><div class="tool-guide">${text}</div>${footer}</section>`;
 write('about/index.html',page('about','About — DevKit','About DevKit, a free browser-based collection of developer tools.',article('About DevKit','<p>DevKit is a collection of 14 focused tools for everyday programming tasks, from formatting JSON to checking CIDR ranges. No account is required.</p><p>Tool inputs are processed by JavaScript in your browser. Each tool documents examples and supported behavior. The aim is useful, understandable output with explicit errors when an input cannot be handled.</p><p>This is an early release. Check important results against your application requirements, especially when working across shell environments and timezones.</p>')));
 write('privacy/index.html',page('privacy','Privacy — DevKit','How DevKit handles tool inputs and website requests.',article('Privacy','<h2>Tool inputs</h2><p>The tools process input locally in your browser. Application code does not upload tool inputs or store them in cookies or local storage. Navigating away or reloading clears the current tool state.</p><h2>Website delivery</h2><p>Cloudflare hosts the website. When you visit, your browser sends ordinary website requests to Cloudflare, including your IP address and browser request information. Hosting and security logs may contain this request information.</p><h2>Analytics and advertising</h2><p>This version does not include advertising scripts or application analytics. If that changes, this page will be updated.</p>')));
 write('404.html',page('404','Page not found — DevKit','The requested page does not exist.',article('Page not found','<p>This address does not point to a tool. Use the navigation or return to all tools.</p>'),{noindex:true}));
 const paths=['/',...TOOLS.map(t=>'/'+t.id),'/about','/privacy'];
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
module.exports={buildSite};
