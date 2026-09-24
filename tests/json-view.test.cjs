const {test}=require('node:test');
const assert=require('node:assert/strict');
const loadApp=require('./load-app.cjs');
function app(){const a=loadApp();a.run(`window.DevKitJSONTree={parse:raw=>{JSON.parse(raw);return {raw}},mount:(el,model)=>{el.model=model;return {reset(){el.resets=(el.resets||0)+1}}}}; navigator.clipboard={writeText:text=>{window.copied=text;return Promise.resolve()}};`);return a;}
test('one document roundtrips between editable text and tree without losing exact numbers or edits',()=>{
 const a=app(),raw='{"big":9223372036854775807,"x":-0,"x":1e+30}';a.get('#json-in').value=raw;a.run('jsonAction("format")');
 const full=a.run('formatJSON('+JSON.stringify(raw)+',true)');
 assert.equal(a.get('#json-in').value,full);assert.equal(a.get('#json-in').hidden,true);assert.equal(a.get('#json-tree').hidden,false);
 a.run('jsonSetView("text")');assert.equal(a.get('#json-in').hidden,false);assert.equal(a.get('#json-in').value,full);
 const edited=' {"edit": [true,null],"x":-0} ';a.get('#json-in').value=edited;a.get('#json-in').listeners.input();a.run('jsonSetView("tree")');
 assert.equal(a.get('#json-tree').model.raw,edited);a.run('jsonSetView("text");copyFrom("json-out")');assert.equal(a.run('window.copied'),edited);
});
test('invalid input remains editable and copy never returns an obsolete formatted result',()=>{
 const a=app();a.get('#json-in').value='{"a":[1,2]}';a.run('jsonAction("format");jsonSetView("text")');
 a.get('#json-in').value='{"bad":}';a.get('#json-in').listeners.input();a.run('jsonSetView("tree")');
 assert.equal(a.get('#json-in').hidden,false);assert.equal(a.get('#json-in').value,'{"bad":}');assert.equal(a.get('#json-tree').textContent,'');
 assert.match(a.get('#json-msg').innerHTML,/JSON|Unexpected/);a.run('copyFrom("json-out")');assert.equal(a.run('window.copied'),' {"bad":} '.trim());
});
test('validation is nondestructive, minify is undoable, clear resets document and controls',()=>{
 const a=app(),raw=' { "x": [true,null] } ';a.get('#json-in').value=raw;a.run('jsonAction("validate")');assert.equal(a.get('#json-in').value,raw);
 a.run('jsonAction("minify")');assert.equal(a.get('#json-in').value,'{"x":[true,null]}');assert.equal(a.get('#json-in').hidden,false);
 a.get('#json-undo').listeners.click();assert.equal(a.get('#json-in').value,raw);assert.equal(a.get('#json-undo').disabled,true);
 a.run('jsonAction("format")');a.get('#json-first-level').listeners.click();assert.equal(a.get('#json-tree').resets,1);
 a.get('#json-clear').listeners.click();assert.equal(a.get('#json-in').value,'');assert.equal(a.get('#json-in').hidden,false);assert.equal(a.get('#json-copy').disabled,true);assert.equal(a.get('#json-tree-view').disabled,true);
});
test('Ctrl or Cmd Enter formats the current editor without handling unrelated keys',()=>{
 const a=app();for(const metaKey of [false,true]){a.get('#json-in').value='{"x":1}';let prevented=false;a.get('#json-in').listeners.keydown({key:'Enter',ctrlKey:!metaKey,metaKey,preventDefault(){prevented=true}});assert.ok(prevented);assert.equal(a.get('#json-tree').hidden,false);}
});
