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
