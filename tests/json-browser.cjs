const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const fixture='{"code":200,"message":"ok","data":{"users":[{"id":9007199254740993,"name":"Alice"}],"pagination":{"page":1,"total":20000}},"debug":false}';

async function textView(page){
 if(!await page.locator('#json-in').isVisible())await page.locator('#json-text-view').click();
 assert.equal(await page.locator('#json-in').isVisible(),true);
 assert.equal(await page.locator('#json-tree').isVisible(),false);
}
async function copy(page,expected){
 await page.locator('#json-copy').click();
 assert.equal(await page.evaluate(()=>window.copied),expected);
}
async function layout(page,width,height){
 const editor=await page.locator('#json-in').boundingBox();
 assert.ok(editor,'The single editable document must be visible');
 assert.ok(editor.height>=height*(height<500?.40:.60),`Editor should use most available height: ${JSON.stringify(editor)}`);
 assert.ok(editor.width>=width*(width>820?.80:.85),`Editor should use available width: ${JSON.stringify(editor)}`);
 assert.ok(editor.y+editor.height<=height+1,`Editor must fit the viewport: ${JSON.stringify(editor)}`);
 assert.equal(await page.locator('#view-json textarea').count(),1);
 assert.equal(await page.locator('#json-out').count(),0);
 assert.equal(await page.locator('#json-sample').count(),0);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No page horizontal overflow');
 const header=await page.locator('.topbar').boundingBox();
 assert.ok(header&&header.y>=0&&header.y+header.height<=height,'App header remains visible');
 const duplicateHeadings=await page.locator('#view-json .tool-head,#view-json .tool-desc,#view-json .tool-title').evaluateAll(elements=>elements.filter(el=>{
  const box=el.getBoundingClientRect(),style=getComputedStyle(el);
  return style.display!=='none'&&style.visibility!=='hidden'&&box.width>2&&box.height>2;
 }).length);
 assert.equal(duplicateHeadings,0,'No duplicate visible title, terminal heading or description');
 return editor;
}
async function sidebarChecks(page,width,height){
 const original=await page.locator('#json-in').inputValue();
 const before=await page.locator('#json-in').boundingBox();
 const sidebar=page.locator('#sidebar');
 if(width>820){
  await page.mouse.move(width-10,height-10);
  await page.locator('#json-in').focus();
  await page.waitForFunction(()=>Math.abs(document.querySelector('#sidebar').getBoundingClientRect().width-56)<1);
  await sidebar.hover({position:{x:20,y:150}});
  await page.waitForFunction(()=>Math.abs(document.querySelector('#sidebar').getBoundingClientRect().width-268)<1);
  const expanded=await page.locator('#json-in').boundingBox();
  assert.deepEqual(expanded,before,'Hover expansion overlays without shifting the editor');
  await page.mouse.move(width-10,height-10);
  await page.waitForFunction(()=>Math.abs(document.querySelector('#sidebar').getBoundingClientRect().width-56)<1);
  await sidebar.locator('a').first().focus();
  await page.waitForFunction(()=>Math.abs(document.querySelector('#sidebar').getBoundingClientRect().width-268)<1);
  await page.locator('#json-in').focus();
  await page.waitForFunction(()=>Math.abs(document.querySelector('#sidebar').getBoundingClientRect().width-56)<1);
 }
 await page.locator('#menuBtn').click();
 assert.equal(await page.locator('#menuBtn').getAttribute('aria-expanded'),'true');
 assert.equal(await sidebar.isVisible(),true);
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#menuBtn').getAttribute('aria-expanded'),'false');
 assert.equal(await page.locator('#json-in').inputValue(),original);
 assert.deepEqual(await page.locator('#json-in').boundingBox(),before,'Drawer must not shift the editor');
}

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE || undefined});
 const results=[];
 try{
 for(const [lang,width,height,full] of [['en',1280,900,true],['zh',390,844,true],['en',900,700,false],['zh',844,390,false]]){
  const context=await browser.newContext({viewport:{width,height}}),errors=[];
  await context.route('**/*',async route=>{
   const u=new URL(route.request().url());assert.equal(u.origin,'https://tools.fategenie.com');
   const asset=u.pathname.startsWith('/assets/'),file=path.join(dist,asset?u.pathname.slice(1):u.pathname.replace(/^\//,'').replace(/\/$/,'')+'/index.html');
   await route.fulfill({contentType:asset?(file.endsWith('.js')?'text/javascript':'text/css'):'text/html',body:fs.readFileSync(file)});
  });
  await context.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copied=text}}}));
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('https://tools.fategenie.com/'+(lang==='zh'?'zh/':'')+'json');
  const editorBounds=await layout(page,width,height);
  await page.locator('#json-in').fill(fixture);
  await sidebarChecks(page,width,height);
  if(!full){
   await page.screenshot({path:path.join(os.tmpdir(),`json-workspace-${width}x${height}.png`)});
   assert.deepEqual(errors,[]);
   results.push({lang,viewport:{width,height},editorBounds,checks:'single surface fills viewport, no duplicate visible headings, no horizontal overflow, sidebar hover/focus/menu/Escape without editor shift'});
   await context.close();continue;
  }
  // Tree is another presentation of the same editable document, including drafts.
  const draft=' { "a" : 1, "nested" : { "value" : "before" } } ';
  await page.locator('#json-in').fill(draft);
  await copy(page,draft);
  await page.locator('#json-validate').click();
  assert.equal(await page.locator('#json-in').inputValue(),draft,'Validation never rewrites text');
  await page.locator('#json-tree-view').click();
  assert.equal(await page.locator('#json-tree').isVisible(),true);
  await textView(page);
  assert.equal(await page.locator('#json-in').inputValue(),draft,'Tree view never reformats text');
  const edited=' {"a":2,"nested":{"value":"after"}} ';
  await page.locator('#json-in').fill(edited);await page.locator('#json-format').click();
  assert.equal(await page.locator('#json-in').isVisible(),false);
  assert.equal(await page.locator('#json-tree').isVisible(),true);
  assert.equal(await page.locator('#json-tree-view').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#json-text-view').getAttribute('aria-pressed'),'false');
  assert.equal(await page.locator('#json-first-level').isDisabled(),false);
  await textView(page);
  const formatted=await page.locator('#json-in').inputValue();
  assert.equal(formatted,JSON.stringify(JSON.parse(edited),null,2));
  await copy(page,formatted);
  await page.locator('#json-undo').click();assert.equal(await page.locator('#json-in').inputValue(),edited);
  assert.equal(await page.locator('#json-undo').isDisabled(),true);
  await page.locator('#json-minify').click();
  assert.equal(await page.locator('#json-in').inputValue(),JSON.stringify(JSON.parse(edited)));
  await page.locator('#json-undo').click();assert.equal(await page.locator('#json-in').inputValue(),edited);
  await page.locator('#json-format').click();await textView(page);
  await page.locator('#json-in').fill('{"user_edit":true}');
  assert.equal(await page.locator('#json-undo').isDisabled(),true,'An edit invalidates one-step undo');
  await page.locator('#json-in').fill('{"bad":}');
  for(const action of ['json-validate','json-format','json-tree-view','json-minify']){
   await page.locator('#'+action).click();
   assert.equal(await page.locator('#json-in').isVisible(),true);
   assert.equal(await page.locator('#json-in').inputValue(),'{"bad":}','Invalid input is retained');
   assert.ok((await page.locator('#json-msg').textContent()).trim(),'Invalid input has an error');
  }
  await copy(page,'{"bad":}');
  await page.locator('#json-in').fill('{"shortcut":true}');
  await page.locator('#json-in').press('Control+Enter');
  assert.equal(await page.locator('#json-tree').isVisible(),true);
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'json-tree','Formatting by shortcut preserves keyboard focus');
  await textView(page);await page.locator('#json-in').fill('{"shortcut":"mac"}');
  await page.locator('#json-in').press('Meta+Enter');
  assert.equal(await page.locator('#json-tree').isVisible(),true);
  await page.locator('#json-clear').click();
  assert.equal(await page.locator('#json-in').isVisible(),true);
  assert.equal(await page.locator('#json-in').inputValue(),'');
  assert.equal(await page.locator('#json-tree').isVisible(),false);

  await page.locator('#json-in').fill('{"a   b":"x   y"}');await page.locator('#json-format').click();
  const literalWidths=await page.evaluate(()=>[...document.querySelectorAll('#json-tree .json-tree-key,#json-tree .json-tree-string')].map(el=>{
   const range=document.createRange();range.selectNodeContents(el);
   const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.font=getComputedStyle(el).font;
   return {text:el.textContent,actual:range.getBoundingClientRect().width,expected:ctx.measureText(el.textContent).width};
  }));
  assert.ok(literalWidths.length>=2);
  for(const item of literalWidths)assert.ok(Math.abs(item.actual-item.expected)<2,JSON.stringify(item));
  const users=Array.from({length:20000},(_,i)=>({id:i,name:'developer '+i,config:{active:true,roles:['read','write']}}));
  const raw='{"total":20000,"big":9223372036854775807,"items":'+JSON.stringify(users)+',"meta":{"source":"api"},"same":1,"same":-0}';
  await textView(page);await page.locator('#json-in').fill(raw);
  const start=Date.now();await page.locator('#json-format').click();
  await page.waitForFunction(()=>document.querySelector('#json-tree details[open]'));
  const elapsed=Date.now()-start;
  assert.equal(await page.locator('#json-tree details[open]').count(),1);
  assert.ok(await page.locator('#json-tree *').count()<70);
  const treeBounds=await page.locator('#json-tree').boundingBox();
  assert.ok(Math.abs(treeBounds.height-editorBounds.height)<=2,`Text and tree use the same workspace height: ${JSON.stringify({editorBounds,treeBounds})}`);
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
  await textView(page);assert.equal(await page.locator('#json-in').inputValue(),copied);
  await page.locator('#json-in').fill(fixture);await page.locator('#json-format').click();
  await page.locator('#json-tree .json-tree-summary').filter({hasText:'"data"'}).focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelectorAll('#json-tree details[open]').length===2&&document.querySelector('#json-tree').textContent.includes('pagination'));
  assert.equal(await page.locator('#json-tree-view').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#json-first-level').isDisabled(),false);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.screenshot({path:path.join(os.tmpdir(),'json-workspace-'+lang+'.png')});
  await textView(page);
  const longRaw='{"x":"<img src=x onerror=alert(1)>","long":'+JSON.stringify('abcdef'.repeat(10000))+'}';
  await page.locator('#json-in').fill(longRaw);await page.locator('#json-format').click();
  assert.equal(await page.locator('#json-tree img').count(),0);
  assert.ok((await page.locator('#json-tree').textContent()).length<600);
  await page.locator('#json-tree .json-tree-long-value summary').click();
  await page.waitForFunction(()=>document.querySelector('.json-tree-full-value')?.textContent.length>50000);
  await page.locator('#json-minify').click();await copy(page,longRaw);
  assert.equal(await page.locator('#json-in').isVisible(),true);
  await page.locator('#menuBtn').click();
  await page.locator('#sidebar [data-tool="base64"]').click();
  await page.locator('#b64-in').fill('DevKit');await page.locator('#b64-enc').click();
  assert.equal(await page.locator('#b64-out').inputValue(),'RGV2S2l0');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);
  results.push({lang,viewport:{width,height},editorBounds,treeBounds,rows:users.length,inputBytes:Buffer.byteLength(raw),formatAndFirstRenderMs:elapsed,checks:'single viewport-filling editor, draft copy, nonmutating validation/tree, editable roundtrip, format/minify undo, undo invalidation, invalid input retained, Ctrl/Cmd+Enter, clear, sidebar hover/focus/menu/Escape without shift, whitespace, 20000 rows, root overview, lazy expansion, batching, reset, lossless full copy, keyboard expansion, XSS, long string, Base64 navigation, no JS errors'});
  await context.close();
 }
 fs.writeFileSync(path.join(root,'docs/json-workspace-browser-checks.json'),JSON.stringify({date:new Date().toISOString(),environment:'isolated Chromium; local artifacts served through request interception; no external requests',results},null,2));
 console.log(JSON.stringify(results,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
