const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE || undefined});
 const results=[];
 try{
 for(const [lang,width,height] of [['en',1280,900],['zh',390,844]]){
  const context=await browser.newContext({viewport:{width,height}}),errors=[];
  await context.route('**/*',async route=>{
   const u=new URL(route.request().url());assert.equal(u.origin,'https://tools.fategenie.com');
   const asset=u.pathname.startsWith('/assets/'),file=path.join(dist,asset?u.pathname.slice(1):u.pathname.slice(1)+'/index.html');
   await route.fulfill({contentType:asset?(file.endsWith('.js')?'text/javascript':'text/css'):'text/html',body:fs.readFileSync(file)});
  });
  await context.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copied=text}}}));
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('https://tools.fategenie.com/'+(lang==='zh'?'zh/':'')+'json');
  await page.locator('#json-in').fill('{"a   b":"x   y"}');await page.locator('#json-format').click();
  const literalWidths=await page.evaluate(()=>[...document.querySelectorAll('#json-tree .json-tree-key,#json-tree .json-tree-string')].map(el=>{
   const range=document.createRange();range.selectNodeContents(el);
   const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.font=getComputedStyle(el).font;
   return {text:el.textContent,actual:range.getBoundingClientRect().width,expected:ctx.measureText(el.textContent).width};
  }));
  for(const item of literalWidths)assert.ok(Math.abs(item.actual-item.expected)<2,JSON.stringify(item));
  const users=Array.from({length:20000},(_,i)=>({id:i,name:'developer '+i,config:{active:true,roles:['read','write']}}));
  const raw='{"total":20000,"big":9223372036854775807,"items":'+JSON.stringify(users)+',"meta":{"source":"api"},"same":1,"same":-0}';
  await page.locator('#json-in').fill(raw);const start=Date.now();await page.locator('#json-format').click();
  await page.waitForFunction(()=>document.querySelector('#json-tree details[open]'));
  const elapsed=Date.now()-start;
  assert.equal(await page.locator('#json-tree details[open]').count(),1);
  assert.ok(await page.locator('#json-tree *').count()<70);
  assert.equal(await page.locator('#json-out').isVisible(),false);
  const pane=await page.locator('#json-tree').boundingBox();assert.ok(pane.height<=height*.61);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.locator('#json-tree .json-tree-summary').filter({hasText:'"items"'}).click();
  await page.waitForFunction(()=>document.querySelectorAll('#json-tree details').length>50);
  assert.ok(await page.locator('#json-tree details').count()<110);
  await page.locator('.json-tree-more').click();
  assert.ok(await page.locator('#json-tree details').count()>190);
  await page.locator('#json-first-level').click();
  assert.equal(await page.locator('#json-tree details[open]').count(),1);
  assert.ok(await page.locator('#json-tree *').count()<70);
  await page.locator('#json-copy').click();const copied=await page.evaluate(()=>window.copied);
  assert.equal(JSON.parse(copied).items.length,20000);assert.match(copied,/9223372036854775807/);assert.match(copied,/"same": 1,\n  "same": -0/);
  await page.locator('#json-text-view').click();assert.equal(await page.locator('#json-out').textContent(),copied);
  await page.locator('#json-tree-view').click();
  // A compact real-world example is used for the visual screenshot.
  await page.locator('#json-in').fill('{"code":200,"message":"ok","data":{"users":[{"id":9007199254740993,"name":"Alice"}],"pagination":{"page":1,"total":20000}},"debug":false}');
  assert.equal(await page.locator('#json-copy').isDisabled(),true);
  await page.locator('#json-format').click();
  await page.locator('#json-tree .json-tree-summary').filter({hasText:'"data"'}).focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelectorAll('#json-tree details[open]').length===2);
  await page.locator('#json-tree').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('#json-copy').textContent.includes('JSON'));
  await page.screenshot({path:path.join(root,'docs/json-tree-'+lang+'.png')});
  await page.locator('#json-in').fill('{"bad":}');await page.locator('#json-format').click();
  assert.equal(await page.locator('#json-copy').isDisabled(),true);assert.equal(await page.locator('#json-tree').textContent(),'');
  await page.locator('#json-in').fill('{"x":"<img src=x onerror=alert(1)>","long":'+JSON.stringify('abcdef'.repeat(10000))+'}');await page.locator('#json-format').click();
  assert.equal(await page.locator('#json-tree img').count(),0);
  assert.ok((await page.locator('#json-tree').textContent()).length<600);
  await page.locator('#json-tree .json-tree-long-value summary').click();
  await page.waitForFunction(()=>document.querySelector('.json-tree-full-value')?.textContent.length>50000);
  await page.locator('#json-minify').click();await page.locator('#json-copy').click();
  assert.equal(await page.evaluate(()=>window.copied),'{"x":"<img src=x onerror=alert(1)>","long":'+JSON.stringify('abcdef'.repeat(10000))+'}');
  assert.deepEqual(errors,[]);
  results.push({lang,viewport:{width,height},rows:users.length,inputBytes:Buffer.byteLength(raw),formatAndFirstRenderMs:elapsed,checks:'significant literal whitespace, root overview, lazy expansion, batching, reset, full exact copy, text view, edited/invalid state, keyboard expansion, XSS, long string, minify, no JS errors'});
  await context.close();
 }
 fs.writeFileSync(path.join(root,'docs/json-tree-browser-checks.json'),JSON.stringify({date:new Date().toISOString(),environment:'isolated Chromium; local artifacts served through request interception; no external requests',results},null,2));
 console.log(JSON.stringify(results,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
