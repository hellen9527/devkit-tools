const {test}=require('node:test');
const assert=require('node:assert/strict');
const loadApp=require('./load-app.cjs');
function app(){
 const a=loadApp();
 a.run(`window.DevKitJSONTree={parse:raw=>({raw}),mount:(el,model)=>{el.model=model;return {reset(){el.resets=(el.resets||0)+1}}}}; navigator.clipboard={writeText:text=>{window.copied=text;return Promise.resolve()}};`);
 return a;
}
test('format defaults to a tree while copying complete exact JSON; reset and text view preserve output',()=>{
 const a=app(),raw='{"big":9223372036854775807,"x":-0,"x":1e+30,"nested":{"s":"<script>"}}';
 a.get('#json-in').value=raw;a.run('jsonAction("format")');
 assert.equal(a.get('#json-tree').hidden,false);assert.equal(a.get('#json-out').hidden,true);
 assert.equal(a.get('#json-out').innerHTML,'');
 const full=a.run('formatJSON('+JSON.stringify(raw)+',true)');
 a.run('copyFrom("json-out")');assert.equal(a.run('window.copied'),full);
 a.get('#json-first-level').listeners.click();assert.equal(a.get('#json-tree').resets,1);
 a.run('jsonSetView("text")');assert.equal(a.get('#json-tree').hidden,true);assert.match(a.get('#json-out').innerHTML,/9223372036854775807/);
 a.run('jsonSetView("tree");copyFrom("json-out")');assert.equal(a.run('window.copied'),full);
});
test('editing or invalid input invalidates the copy source and both views',()=>{
 const a=app();a.get('#json-in').value='{"a":[1,2]}';a.run('jsonAction("format")');
 a.get('#json-in').value='changed';a.get('#json-in').listeners.input();
 assert.equal(a.get('#json-copy').disabled,true);assert.equal(a.get('#json-tree-view').disabled,true);
 assert.equal(a.run('jsonOutputText'),'');assert.equal(a.get('#json-tree').textContent,'');
 a.run('jsonAction("format")');assert.equal(a.run('jsonOutputText'),'');assert.match(a.get('#json-msg').innerHTML,/JSON|Unexpected/);
 a.run('copyFrom("json-out")');assert.equal(a.run('window.copied'),undefined);
});
test('minify and validate use bounded text view and keep full output available for tree inspection',()=>{
 const a=app();a.get('#json-in').value=' { "x": [true,null] } ';
 for(const mode of ['minify','validate']){
  a.run('jsonAction('+JSON.stringify(mode)+')');assert.equal(a.get('#json-out').hidden,false);
  a.run('copyFrom("json-out")');assert.equal(a.run('window.copied'),' { "x": [true,null] } '.replace(/\s/g,''));
  a.run('jsonSetView("tree")');assert.equal(a.get('#json-tree').hidden,false);
 }
});
