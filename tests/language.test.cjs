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
