const {test}=require('node:test');
const assert=require('node:assert/strict');
const {preferredLanguage,equivalentPath}=require('../assets/language.js');
test('manual language wins, otherwise only a Chinese preferred browser language selects Chinese',()=>{
 assert.equal(preferredLanguage({saved:'en',languages:['zh-CN']}),'en');
 assert.equal(preferredLanguage({saved:'zh',languages:['en-US']}),'zh');
 for(const lang of ['zh','zh-CN','zh-TW','ZH-Hant'])assert.equal(preferredLanguage({languages:[lang]}),'zh');
 for(const lang of ['en-US','ja-JP','ko','hi-IN','zhong'])assert.equal(preferredLanguage({languages:[lang]}),'en');
 assert.equal(preferredLanguage({languages:['en-US','zh-CN']}),'en');
 assert.equal(preferredLanguage({saved:'invalid',languages:[]}),'en');
 assert.equal(preferredLanguage({languages:['','zh-CN']}),'zh');
 assert.equal(preferredLanguage({}),'en');
});
test('language links preserve the current tool and use canonical paths',()=>{
 assert.equal(equivalentPath('/json','zh'),'/zh/json');
 assert.equal(equivalentPath('/zh/json','en'),'/json');
 assert.equal(equivalentPath('/zh/json/','zh'),'/zh/json');
 assert.equal(equivalentPath('/','zh'),'/zh');
 assert.equal(equivalentPath('/zh/','en'),'/');
 assert.equal(equivalentPath('/zh/about','en'),'/about');
 assert.equal(equivalentPath('/zhang','en'),'/zhang');
 assert.throws(()=>equivalentPath('/json','fr'));
});

const {initialize}=require('../assets/language.js');
function browser({path='/',search='',hash='',languages=['en-US'],saved,blocked=false}={}){
 const calls=[], handlers=[]; const values=new Map(saved?[['devkit-language',saved]]:[]);
 const links=['en','zh'].map(lang=>({dataset:{language:lang},addEventListener:(name,fn)=>handlers.push([lang,fn])}));
 const env={location:{pathname:path,search,hash,replace:url=>calls.push(url)},navigator:{languages},document:{querySelectorAll:()=>links},localStorage:{getItem:k=>{if(blocked)throw Error('blocked');return values.get(k)},setItem:(k,v)=>{if(blocked)throw Error('blocked');values.set(k,v)}}};
 return {env,calls,handlers,values};
}
test('homepage selects browser language; explicit and stored English remain reachable',()=>{
 for(const [options,want] of [
  [{languages:['zh-CN']},'/zh'],
  [{languages:['zh-TW'],search:'?utm_source=test',hash:'#tools'},'/zh?utm_source=test#tools'],
  [{languages:['en-US'],saved:'zh'},'/zh'],
  [{languages:['zh-CN'],saved:'en'},undefined],
  [{languages:['zh-CN'],blocked:true,search:'?lang=en'},undefined],
  [{languages:['en-US'],search:'?lang=zh'},'/zh?lang=zh'],
  [{languages:['zh-CN'],search:'?lang=invalid'},'/zh?lang=invalid'],
  [{languages:['ja-JP']},undefined],
  [{languages:['zh-CN'],path:'/json'},undefined],
  [{languages:['en-US'],path:'/zh/json'},undefined],
  [{languages:['en-US'],path:'/zh'},undefined]
 ]){
  const b=browser(options); initialize(b.env); assert.equal(b.calls[0],want,JSON.stringify(options));
 }
});
test('manual language choice is remembered and blocked storage does not break links',()=>{
 const b=browser({path:'/json'});initialize(b.env);b.handlers.find(([lang])=>lang==='zh')[1]();assert.equal(b.values.get('devkit-language'),'zh');
 const blocked=browser({path:'/zh/json',blocked:true});assert.doesNotThrow(()=>{initialize(blocked.env);blocked.handlers[0][1]()});assert.deepEqual(blocked.calls,[]);
});
