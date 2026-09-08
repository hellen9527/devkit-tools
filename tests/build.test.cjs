const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {buildSite}=require('../scripts/build.cjs');
const ids=['timestamp','cron','json','curl','url','base64','html-entity','color','regex','hash','jwt','cidr','http-status','uuid'];
const temp=()=>fs.mkdtempSync(path.join(os.tmpdir(),'devkit-build-'));
test('build emits independent crawlable tool pages and only public assets',()=>{
 const outDir=temp();try{
 buildSite({outDir,siteUrl:'https://tools.example.com'});
 const titles=new Set();
 for(const id of ids){
  const html=fs.readFileSync(path.join(outDir,id,'index.html'),'utf8');
  assert.match(html,new RegExp('id="view-'+id+'"'));
  assert.equal((html.match(/id="view-/g)||[]).length,1);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.ok(html.includes('rel="canonical" href="https://tools.example.com/'+id+'"'));
  assert.match(html,/<h2>How to use/); assert.match(html,/<h2>Example/);
  assert.match(html,/href="\/json"/);assert.doesNotMatch(html,/noindex|YOUR-DOMAIN/);
  titles.add(html.match(/<title>(.*?)<\/title>/)[1]);
  for(const m of html.matchAll(/(?:src|href)="(\/assets\/[^"?]+)"/g))assert.ok(fs.existsSync(path.join(outDir,m[1])));
 }
 assert.equal(titles.size,14);
 assert.match(fs.readFileSync(path.join(outDir,'http-status/index.html'),'utf8'),/class="status-code">429/);
 const home=fs.readFileSync(path.join(outDir,'index.html'),'utf8');
 for(const id of ids)assert.ok(home.includes('href="/'+id+'"'));
 const sitemap=fs.readFileSync(path.join(outDir,'sitemap.xml'),'utf8');
 for(const id of ids)assert.ok(sitemap.includes('<loc>https://tools.example.com/'+id+'</loc>'));
 assert.match(fs.readFileSync(path.join(outDir,'404.html'),'utf8'),/Page not found/);
 for(const f of ['docs','tests','_backup','.git','_redirects','index-v1.html'])assert.equal(fs.existsSync(path.join(outDir,f)),false);
 }finally{fs.rmSync(outDir,{recursive:true,force:true})}
});
test('preview cannot accidentally request indexing and invalid origins fail',()=>{
 const outDir=temp();try{
 buildSite({outDir,siteUrl:''});
 assert.match(fs.readFileSync(path.join(outDir,'json/index.html'),'utf8'),/noindex/);
 assert.doesNotMatch(fs.readFileSync(path.join(outDir,'json/index.html'),'utf8'),/rel="canonical"/);
 assert.match(fs.readFileSync(path.join(outDir,'robots.txt'),'utf8'),/Disallow: \//);
 for(const siteUrl of ['http://example.com','https://example.com/path','https://user:pass@example.com','garbage','https://example.com?x=1'])assert.throws(()=>buildSite({outDir,siteUrl}));
 }finally{fs.rmSync(outDir,{recursive:true,force:true})}
});
test('both language trees have self canonicals, reciprocal alternatives and translated tool content',()=>{
 const outDir=temp();try{
 const result=buildSite({outDir,siteUrl:'https://tools.example.com'});assert.equal(result.pages,34);
 const routes=['',...ids,'about','privacy'];const titles=new Set();
 for(const route of routes){
  const enPath=route?'/'+route:'/';const zhPath='/zh'+(route?'/'+route:'');
  for(const [locale,prefix,url] of [['en','',enPath],['zh-Hans','zh/',zhPath]]){
   const html=fs.readFileSync(path.join(outDir,prefix,route,'index.html'),'utf8');
   assert.match(html,new RegExp('<html lang="'+locale+'"'));
   assert.ok(html.includes('rel="canonical" href="https://tools.example.com'+url+'"'));
   for(const [lang,href] of [['en',enPath],['zh-Hans',zhPath],['x-default',enPath]])assert.ok(html.includes('hreflang="'+lang+'" href="https://tools.example.com'+href+'"'));
   assert.ok(html.includes('data-language="en" href="'+enPath+(route?'':'?lang=en')+'"'));
   assert.ok(html.includes('data-language="zh" href="'+zhPath+'"'));
   titles.add(html.match(/<title>(.*?)<\/title>/)[1]);
   assert.equal((html.match(/<h1\b/g)||[]).length,1);
   if(locale==='zh-Hans'){
    assert.match(html,/href="\/zh\/json"/);assert.doesNotMatch(html,/>Copy<|>Convert<|>Input<|>Output /);
    if(ids.includes(route)){assert.match(html,/<h2>使用方法<\/h2>/);assert.match(html,/<h2>示例<\/h2>/)}
   }
  }
 }
 assert.equal(titles.size,34);
 const sitemap=fs.readFileSync(path.join(outDir,'sitemap.xml'),'utf8');assert.equal((sitemap.match(/<loc>/g)||[]).length,34);
 assert.match(fs.readFileSync(path.join(outDir,'privacy/index.html'),'utf8'),/language preference/);
 assert.match(fs.readFileSync(path.join(outDir,'zh/privacy/index.html'),'utf8'),/语言偏好/);
 assert.match(fs.readFileSync(path.join(outDir,'zh/json/index.html'),'utf8'),/id="json-out">格式化或校验后/);
 }finally{fs.rmSync(outDir,{recursive:true,force:true})}
});
test('static localization changes authored labels without touching code, sample inputs or values',()=>{
 const {localizeMarkup}=require('../scripts/build.cjs');
 const source='<label> Input </label><input value="Input" placeholder="Input" aria-label="Input"><textarea placeholder="Input">Input <b>Input</b></textarea><pre>Input</pre><code>Input</code><script>const s="Input";</script><svg><title>Input</title></svg><p>Left &amp; Right</p>';
 const translated=localizeMarkup(source,{Input:'输入','Left & Right':'左右'});
 assert.equal(translated,'<label> 输入 </label><input value="Input" placeholder="输入" aria-label="输入"><textarea placeholder="输入">Input <b>Input</b></textarea><pre>Input</pre><code>Input</code><script>const s="Input";</script><svg><title>Input</title></svg><p>左右</p>');
 assert.equal(localizeMarkup("<textarea placeholder='Input' title='Input'>Input</textarea>",{Input:'输入'}),"<textarea placeholder='输入' title='输入'>Input</textarea>");
});

test('configured production builds include static bilingual consent and privacy, but never a Google script',()=>{
 const outDir=temp();try{
 buildSite({outDir,siteUrl:'https://tools.fategenie.com',analyticsConfig:{measurementId:'G-TEST123'}});
 for(const prefix of ['','zh/'])for(const route of ['',...ids,'about','privacy']){
  const html=fs.readFileSync(path.join(outDir,prefix,route,'index.html'),'utf8');
  assert.match(html,/data-measurement-id="G-TEST123"/);assert.match(html,/src="\/assets\/analytics\.[a-f0-9]+\.js"/);assert.doesNotMatch(html,/<script[^>]+src="https:\/\/[^\"]*google/);
  for(const id of ['analytics-consent','analytics-preferences','analytics-allow','analytics-reject','analytics-withdraw'])assert.ok(html.includes('id="'+id+'"'));
  assert.match(html,/id="analytics-allow" class="btn"/);assert.match(html,/id="analytics-reject" class="btn"/);
  assert.match(html,prefix?/允许统计/:/Allow analytics/);
 }
 for(const prefix of ['','zh/']){const html=fs.readFileSync(path.join(outDir,prefix,'privacy/index.html'),'utf8');assert.match(html,/Google Analytics 4/);assert.match(html,/devkit-analytics-consent/);assert.match(html,/https:\/\/policies.google.com\/technologies\/partner-sites/);assert.match(html,/UTM/);assert.match(html,prefix?/会话与互动信息/:/standard session and engagement information/);assert.doesNotMatch(html,/This version does not include|当前版本未加入/)}
 const missing=fs.readFileSync(path.join(outDir,'404.html'),'utf8');assert.doesNotMatch(missing,/analytics\.[a-f0-9]+\.js|id="analytics-/);
 }finally{fs.rmSync(outDir,{recursive:true,force:true})}
});
test('unconfigured, preview and other-origin builds retain truthful disabled analytics privacy',()=>{
 for(const [siteUrl,measurementId] of [['https://tools.fategenie.com',''],['','G-TEST123'],['https://preview.pages.dev','G-TEST123']]){
 const outDir=temp();try{
 buildSite({outDir,siteUrl,analyticsConfig:{measurementId}});
 for(const route of ['index.html','json/index.html','zh/json/index.html','404.html'])assert.doesNotMatch(fs.readFileSync(path.join(outDir,route),'utf8'),/analytics\.[a-f0-9]+\.js|id="analytics-/);
 assert.match(fs.readFileSync(path.join(outDir,'privacy/index.html'),'utf8'),/This version does not include advertising scripts or application analytics/);
 assert.match(fs.readFileSync(path.join(outDir,'zh/privacy/index.html'),'utf8'),/当前版本未加入广告脚本或应用访问统计/);
 }finally{fs.rmSync(outDir,{recursive:true,force:true})}}
 const outDir=temp();try{for(const measurementId of ['G-BAD<script>','UA-1-1',123])assert.throws(()=>buildSite({outDir,analyticsConfig:{measurementId}}),/measurementId/)}finally{fs.rmSync(outDir,{recursive:true,force:true})}
});
