const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const runtime=path.join(__dirname,'../assets/analytics.js');
// A small DOM harness keeps every Google request local and inspectable.
function browser({origin='https://tools.fategenie.com',pathname='/json',saved,blocked=false,referrer='https://example.org/private?secret=1#fragment'}={}){
 const listeners={},scripts=[],cookies=[],values=new Map(saved?[['devkit-analytics-consent',saved]]:[]),nodes=Object.create(null);
 function element(id){return {id,hidden:true,dataset:{},listeners:{},addEventListener(type,fn){this.listeners[type]=fn},focus(){doc.activeElement=this},closest(){return this},click(){this.listeners.click?.({target:this});listeners.click?.({target:this})}}}
 for(const id of ['analytics-consent','analytics-allow','analytics-reject','analytics-withdraw','analytics-close','analytics-preferences'])nodes[id]=element(id);
 const doc={referrer,body:{dataset:{page:pathname.replace(/^\/zh\//,'').replace(/^\//,'')||'home'}},documentElement:{lang:pathname.startsWith('/zh')?'zh-Hans':'en'},getElementById:id=>nodes[id],createElement:()=>element(''),head:{appendChild:s=>scripts.push(s)},addEventListener:(type,fn)=>{listeners[type]=fn}};
 Object.defineProperty(doc,'cookie',{get:()=>'',set:value=>cookies.push(value)});
 const env={document:doc,location:{origin,pathname,search:'?token=SECRET&utm_campaign=SECRET',hash:'#SECRET'},localStorage:{getItem:k=>{if(blocked)throw Error('blocked');return values.get(k)||null},setItem:(k,v)=>{if(blocked)throw Error('blocked');values.set(k,v)}},addEventListener:(type,fn)=>{listeners[type]=fn}};
 function init(config={measurementId:'G-TEST123'}){assert.ok(fs.existsSync(runtime),'analytics runtime exists');return require(runtime).initialize(env,config)}
 const commands=()=>Array.from(env.dataLayer||[],args=>Array.from(args));
 const events=()=>commands().filter(args=>args[0]==='event');
 const click=id=>{const target=nodes[id]||element(id);target.click();return target};
 return {env,nodes,listeners,scripts,cookies,values,init,commands,events,click,element};
}
test('unknown and rejected consent never inject Google or queue measurement',()=>{
 for(const saved of [undefined,'denied','anything']){const b=browser({saved});b.init();assert.equal(b.scripts.length,0);assert.equal(b.events().length,0);b.click('analytics-reject');assert.equal(b.scripts.length,0);assert.equal(b.values.get('devkit-analytics-consent'),'denied');assert.equal(b.nodes['analytics-consent'].hidden,true)}
});
test('invalid configuration, nonproduction origin and unknown path leave analytics disabled',()=>{
 for(const options of [{origin:'https://preview.pages.dev'},{origin:'http://tools.fategenie.com'},{pathname:'/404'},{pathname:'/json/SECRET'}]){const b=browser({...options,saved:'granted'});b.init();assert.equal(b.scripts.length,0);assert.equal(b.env.dataLayer,undefined)}
 for(const config of [{},{measurementId:''},{measurementId:'G-INVALID<script>'},{measurementId:'UA-123-1'},null]){const b=browser({saved:'granted'});b.init(config);assert.equal(b.scripts.length,0)}
});
test('grant loads once, denies all ads, and queues exactly one sanitized page view',()=>{
 const b=browser();b.init();assert.deepEqual(b.commands()[0],['consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'}]);
 b.click('analytics-allow');b.click('analytics-allow');b.init();
 assert.equal(b.scripts.length,1);assert.equal(b.scripts[0].src,'https://www.googletagmanager.com/gtag/js?id=G-TEST123');assert.equal(b.scripts[0].referrerPolicy,'origin');
 assert.equal(b.events().filter(e=>e[1]==='page_view').length,1);
 const config=b.commands().find(c=>c[0]==='config')[2];
 assert.equal(config.send_page_view,false);assert.equal(config.allow_google_signals,false);assert.equal(config.allow_ad_personalization_signals,false);assert.equal(config.page_location,'https://tools.fategenie.com/json');assert.equal(config.page_referrer,'https://example.org');
 assert.equal(config.cookie_domain,'tools.fategenie.com');assert.equal(config.cookie_prefix,'devkit_analytics_TEST123');
 assert.ok(!JSON.stringify(b.commands()).includes('SECRET'));assert.ok(!JSON.stringify(b.commands()).includes('private'));
 assert.deepEqual(b.commands().find(c=>c[0]==='consent'&&c[1]==='update')[2],{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
});
test('remembered grant and blocked storage both work; malformed referrer is omitted',()=>{
 for(const options of [{saved:'granted'},{blocked:true}]){const b=browser({...options,referrer:'javascript:SECRET'});b.init();if(options.blocked)b.click('analytics-allow');assert.equal(b.scripts.length,1);assert.equal(b.commands().find(c=>c[0]==='config')[2].page_referrer,'');assert.doesNotThrow(()=>b.click('analytics-withdraw'))}
});
test('reopen keeps current choice, withdrawal disables events and only clears property cookies',()=>{
 const b=browser({saved:'granted'});b.init();b.click('analytics-preferences');assert.equal(b.nodes['analytics-consent'].hidden,false);assert.equal(b.nodes['analytics-withdraw'].hidden,false);assert.equal(b.env.document.activeElement,b.nodes['analytics-allow']);
 b.click('analytics-close');assert.equal(b.nodes['analytics-consent'].hidden,true);
 b.click('json-format');const count=b.events().length;b.click('analytics-withdraw');b.click('json-format');assert.equal(b.events().length,count);assert.equal(b.env['ga-disable-G-TEST123'],true);assert.equal(b.values.get('devkit-analytics-consent'),'denied');
 assert.ok(b.cookies.length>0);for(const cookie of b.cookies)assert.match(cookie,/^devkit_analytics_TEST123_ga(?:_TEST123)?=;.*Max-Age=0/);
 b.click('analytics-allow');assert.equal(b.env['ga-disable-G-TEST123'],false);assert.equal(b.events().filter(e=>e[1]==='page_view').length,1);
});
test('tool actions use fixed button enum and never read field values, output, text or errors',()=>{
 const b=browser({pathname:'/zh/json',saved:'granted'});b.init();
 const malicious=b.element('json-format');for(const key of ['value','textContent','innerText','innerHTML'])Object.defineProperty(malicious,key,{get(){throw Error('private content accessed')}});
 malicious.dataset={tool:'SECRET',action:'SECRET'};b.listeners.click({target:malicious});
 assert.deepEqual(b.events().at(-1),['event','tool_action',{tool_id:'json',action:'format',interface_language:'zh'}]);
 for(const id of ['json-in','json-out','json-msg','toolSearch','http-search','SECRET','curl-convert','constructor','toString','__proto__'])b.click(id);
 assert.equal(b.events().filter(e=>e[1]==='tool_action').length,1);
});
test('cross-tab withdrawal stops events and storage exceptions never prevent tool use',()=>{
 const b=browser({saved:'granted'});b.init();b.listeners.storage({key:'devkit-analytics-consent',newValue:'denied'});b.click('json-format');assert.equal(b.events().filter(e=>e[1]==='tool_action').length,0);assert.equal(b.env['ga-disable-G-TEST123'],true);
 const disabled=browser({blocked:true});assert.doesNotThrow(()=>{disabled.init();disabled.click('analytics-reject');disabled.click('json-format')});assert.equal(disabled.scripts.length,0);
});
test('language redirects never count the outgoing English homepage with remembered analytics consent',()=>{
 const {initialize:initializeLanguage}=require('../assets/language.js');
 for(const {pathname='/',languages=['en-US'],languagePreference,search='',redirects=false} of [
  {languages:['zh-CN'],redirects:true},
  {languagePreference:'zh',redirects:true},
  {search:'?lang=zh',redirects:true},
  {},
  {languages:['zh-CN'],languagePreference:'en'},
  {languages:['zh-CN'],search:'?lang=en'},
  {pathname:'/zh',languages:['zh-CN']},
  {pathname:'/zh/json',languagePreference:'zh'},
  {pathname:'/json',languages:['zh-CN']}
 ]){
  const b=browser({pathname,saved:'granted'}),destinations=[];
  b.env.navigator={languages};b.env.document.querySelectorAll=()=>[];
  b.env.location.search=search;
  // Navigation is pending: location remains '/' while later defer scripts run.
  b.env.location.replace=url=>destinations.push(url);
  if(languagePreference)b.values.set('devkit-language',languagePreference);
  initializeLanguage(b.env);b.init();
  if(redirects){
   assert.deepEqual(destinations,['/zh'+search+'#SECRET']);
   assert.equal(b.scripts.length,0,'outgoing homepage must not load the Google tag');
   assert.deepEqual(b.events(),[],'outgoing homepage must not queue a page_view');
   assert.equal(b.env.dataLayer,undefined);
  }else{
   assert.deepEqual(destinations,[]);assert.equal(b.scripts.length,1);
   assert.equal(b.events().filter(e=>e[1]==='page_view').length,1);
   assert.equal(b.commands().find(c=>c[0]==='config')[2].page_location,'https://tools.fategenie.com'+pathname);
  }
 }
});
